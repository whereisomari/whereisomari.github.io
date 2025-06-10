// Shared utility functions

// **FIXED DATE LOGIC** - Get operating date, robustly handling timezones
function getOperatingDate() {
    const now = new Date();
    
    try {
        // Use Intl.DateTimeFormat to reliably get date/time parts for the London timezone.
        const options = {
            timeZone: 'Europe/London',
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            hour: 'numeric',
            hour12: false
        };
        
        // Use a locale that gives predictable part names (e.g., 'en-US')
        const formatter = new Intl.DateTimeFormat('en-US', options);
        const parts = formatter.formatToParts(now);
        
        let year, month, day, hour;
        
        // Extract parts by their type name for reliability.
        parts.forEach(part => {
            switch (part.type) {
                case 'year':
                    year = parseInt(part.value, 10);
                    break;
                case 'month':
                    month = parseInt(part.value, 10);
                    break;
                case 'day':
                    day = parseInt(part.value, 10);
                    break;
                case 'hour':
                    // In some environments, hour for midnight is 24.
                    hour = parseInt(part.value, 10) % 24;
                    break;
            }
        });

        // Create a UTC date object to avoid local timezone interference.
        // Note: month is 1-based from formatter, but 0-based for Date.UTC.
        const londonDate = new Date(Date.UTC(year, month - 1, day));
        
        // The cutoff is 3 AM London time.
        if (hour < 3) {
            // If it's before 3 AM, the operating date is the previous day.
            londonDate.setUTCDate(londonDate.getUTCDate() - 1);
        }
        
        // Return the date in YYYY-MM-DD format.
        return londonDate.toISOString().split('T')[0];

    } catch (error) {
        console.error("Failed to determine operating date. Falling back to simple calculation.", error);
        // Fallback for older browsers that might not support Intl.DateTimeFormat fully.
        const fallbackDate = new Date();
        if (fallbackDate.getUTCHours() < 2) { // Approximate fallback, assumes BST/GMT difference
            fallbackDate.setUTCDate(fallbackDate.getUTCDate() - 1);
        }
        return fallbackDate.toISOString().split('T')[0];
    }
}

// Show error message
function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    } else {
        console.error('Error:', message);
    }
}

// Parse time string to seconds
function parseTime(timeStr) {
    // Handle both HH:MM and HH:MM:SS formats
    const parts = timeStr.split(':');
    const hours = parseInt(parts[0]);
    const minutes = parseInt(parts[1]);
    const seconds = parts[2] ? parseInt(parts[2]) : 0;
    return hours * 3600 + minutes * 60 + seconds; // Return total seconds for precision
}

// Convert duty time to actual datetime (handles 25:55 = 01:55 next day)
function convertDutyTimeToDateTime(dutyDate, dutyTime) {
    const [hours, minutes] = dutyTime.split(':').map(Number);
    const actualHours = hours >= 24 ? hours - 24 : hours;
    const isNextDay = hours >= 24;
    
    // Create the datetime in local timezone, not UTC
    const dutyDateTime = new Date(dutyDate + 'T' + actualHours.toString().padStart(2, '0') + ':' + minutes.toString().padStart(2, '0') + ':00');
    
    if (isNextDay) {
        dutyDateTime.setDate(dutyDateTime.getDate() + 1);
    }
    
    return dutyDateTime;
}

// Depot name helper
function getDepotName(locationCode) {
    if (locationCode === 'POD') return 'Poplar Depot';
    if (locationCode === 'BED') return 'Beckton Depot';
    return locationCode;
}

// Format date for duty lookup
function formatDateForDuty(date) {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
}

// Parse run info string
function parseRunInfo(runString) {
    // Parse format like "R453 CAT2 17:52 20:37 CAT1" or "R425>354 CAT1 13:47 17:36 POP4"
    const parts = runString.split(' ');
    
    if (parts.length >= 5) {
        const runPart = parts[0].substring(1); // Remove 'R'
        
        // Handle run transitions like "425>354"
        let firstRun = runPart;
        let secondRun = null;
        let transitionTime = null;
        
        if (runPart.includes('>')) {
            [firstRun, secondRun] = runPart.split('>');
            
            // Find the transition time by looking at when the first run ends
            if (typeof parsedCsvData !== 'undefined' && parsedCsvData[firstRun]) {
                const firstRunStops = parsedCsvData[firstRun];
                const lastStop = firstRunStops[firstRunStops.length - 1];
                transitionTime = parseTime(lastStop.departureTime);
            }
        }
        
        const result = {
            runNumber: runPart,
            firstRun: firstRun,
            secondRun: secondRun,
            transitionTime: transitionTime,
            startLocation: parts[1],
            startTime: parts[2],
            endTime: parts[3],
            endLocation: parts[4]
        };
        
        return result;
    }
    return null;
}

// Check if value is only a countdown change
function isOnlyCountdownChange(oldStatus, newStatus) {
    if (!oldStatus.details || !newStatus.details) return false;
    if (oldStatus.main !== newStatus.main) return false;
    
    // Check if only the minute number changed in departure countdown
    const oldMinutes = oldStatus.details.match(/departing in (\d+) minute/);
    const newMinutes = newStatus.details.match(/departing in (\d+) minute/);
    
    if (oldMinutes && newMinutes) {
        // Same pattern, just different numbers - this is a countdown update
        const oldRest = oldStatus.details.replace(/departing in \d+ minute[s]?/, 'departing in X minute');
        const newRest = newStatus.details.replace(/departing in \d+ minute[s]?/, 'departing in X minute');
        return oldRest === newRest;
    }
    
    return false;
}