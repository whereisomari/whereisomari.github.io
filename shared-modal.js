// Shared modal functionality between calendar.html and index.html

// Global variables for modal navigation
let currentModalView = 'duty';
let currentDutyContent = '';
let currentDutyData = null;
let currentDutyDate = null;
let timetablePaths = {};
let currentTimetableData = null;

// SVG Icons
const closeIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
const backIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>`;

// Ensure modal HTML exists in the page
function ensureModalHTML() {
    if (document.getElementById('dutyModal')) return;
    
    const modalHTML = `
        <div class="duty-modal" id="dutyModal">
            <div class="duty-modal-content">
                <div class="duty-modal-header">
                    <span id="modalTitle">Duty Details</span>
                    <button class="close-modal" onclick="closeDutyModal()"></button>
                </div>
                <div class="duty-modal-body" id="modalBody">
                    <!-- Slide panes will be populated here -->
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Ensure modal CSS exists
function ensureModalCSS() {
    if (document.getElementById('shared-modal-css')) return;
    
    const css = `
        <style id="shared-modal-css">
        /* Duty detail modal */
        .duty-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            backdrop-filter: blur(8px);
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
            visibility: hidden;
            opacity: 0;
            transition: opacity 0.5s ease, visibility 0s linear 0.5s;
        }
        
        .duty-modal.is-visible {
            visibility: visible;
            opacity: 1;
            transition: opacity 0.5s ease;
        }

        .duty-modal-content {
            background: #1a1a1a;
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 15px;
            max-width: 600px;
            width: 100%;
            max-height: 80vh;
            overflow: hidden;
            position: relative;
            min-width: 0;
        }

        .modal-opening .duty-modal-content {
            animation: zoomIn 0.4s cubic-bezier(0.165, 0.84, 0.44, 1) forwards;
        }
        .modal-closing .duty-modal-content {
            animation: zoomOut 0.2s cubic-bezier(0.55, 0.055, 0.675, 0.19) forwards;
        }

        @keyframes zoomIn {
            from {
                opacity: 0;
                transform: scale(0.9);
            }
            to {
                opacity: 1;
                transform: scale(1);
            }
        }
        @keyframes zoomOut {
            from {
                opacity: 1;
                transform: scale(1);
            }
            to {
                opacity: 0;
                transform: scale(0.95);
            }
        }
        
        .duty-modal-body {
            height: calc(80vh - 65px);
            overflow: hidden;
        }

        .slide-container {
            position: relative;
            width: 100%;
            height: 100%;
        }

        .slide-pane {
            position: absolute;
            width: 100%;
            height: 100%;
            top: 0;
            left: 0;
            transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            overflow-y: auto;
            padding: 1.5rem;
        }

        .slide-pane.timetable {
            padding: 0;
        }

        .slide-pane.is-center {
            transform: translateX(0);
            opacity: 1;
        }

        .slide-pane.is-left {
            transform: translateX(-100%);
            opacity: 0;
        }

        .slide-pane.is-right {
            transform: translateX(100%);
            opacity: 0;
        }

        .duty-modal-header {
            background: linear-gradient(90deg, #8A2BE2, #4B0082);
            color: white;
            padding: 0.8rem 1.2rem;
            font-size: 1.2rem;
            font-weight: bold;
            display: flex;
            justify-content: space-between;
            align-items: center;
            position: relative;
            z-index: 20;
            border-radius: 15px 15px 0 0;
            min-height: 65px;
            box-sizing: border-box;
        }

        .close-modal {
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            padding: 8px;
            border-radius: 4px;
            transition: background-color 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            min-width: 40px;
            min-height: 40px;
        }
        
        .close-modal svg {
            width: 24px;
            height: 24px;
        }

        .close-modal:hover {
            background: rgba(255, 255, 255, 0.1);
        }
        
        .section {
            margin-bottom: 1.5rem;
        }

        .section-header {
            font-size: 1rem;
            color: #667eea;
            margin-bottom: 0.5rem;
            padding-bottom: 0.25rem;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .section-item {
            margin-bottom: 0.5rem;
            display: flex;
            gap: 1rem;
        }

        .section-label {
            color: #888;
            min-width: 80px;
        }
        
        .timetable-sticky-header {
            position: sticky;
            top: 0;
            z-index: 15;
            background: #1a1a1a;
        }
        .timetable-sticky-header th {
             border: none;
        }

        @media (max-width: 768px) {
            .duty-modal {
                padding: 1rem;
            }
            
            .duty-modal-content {
                margin: 0 auto;
                max-width: calc(100vw - 2rem);
            }
            
            .duty-modal-header {
                padding: 0.5rem 1rem;
                font-size: 1.1rem;
                min-height: 50px;
            }
            .duty-modal-body {
                height: calc(80vh - 50px);
            }
            
            .close-modal {
                min-height: 40px;
                padding: 4px 8px;
            }
            
            .timetable-sticky-header {
                top: 0;
            }
            
            .slide-pane {
                 padding: 1rem;
            }
            
            .slide-pane.timetable {
                padding: 0;
            }

            .duty-modal-content table {
                font-size: 12px;
            }
            
            .duty-modal-content td {
                padding: 8px 6px !important;
                height: 48px !important;
                vertical-align: middle !important;
            }
        }
        </style>
    `;
    
    document.head.insertAdjacentHTML('beforeend', css);
}

// Initialize timetable paths
async function initializeTimetablePaths() {
    try {
        const response = await fetch('https://raw.githubusercontent.com/dlrttbl/dlrttbl.github.io/refs/heads/main/paths.txt', { cache: 'no-store' });
        const text = await response.text();
        
        const lines = text.split('\n').filter(line => line.trim() !== '');
        
        let currentEntry = {};
        const timetableEntries = [];
        
        for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine.startsWith('Name:')) {
                if (Object.keys(currentEntry).length > 0) {
                    timetableEntries.push({...currentEntry});
                }
                currentEntry = {
                    name: trimmedLine.substring(5).trim()
                };
            } else if (trimmedLine.startsWith('Applies:')) {
                currentEntry.applies = trimmedLine.substring(8).trim();
            } else if (trimmedLine.startsWith('URL:')) {
                currentEntry.url = trimmedLine.substring(4).trim();
                const fileName = currentEntry.url.substring(currentEntry.url.lastIndexOf('/') + 1, currentEntry.url.lastIndexOf('.'));
                currentEntry.fileName = fileName.toLowerCase();
            }
        }
        
        if (Object.keys(currentEntry).length > 0) {
            timetableEntries.push(currentEntry);
        }

        timetableEntries.forEach(entry => {
            timetablePaths[entry.fileName] = entry;
        });
        
    } catch (error) {
        console.error('Error fetching timetable paths:', error);
    }
}

// Get applicable timetable for a date
function getApplicableTimetable(date) {
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const dayName = date.toLocaleDateString('en-US', { 
        weekday: 'long',
        timeZone: 'Europe/London'
    });
    
    for (const [fileName, timetableInfo] of Object.entries(timetablePaths)) {
        const applies = timetableInfo.applies.split(',').map(s => s.trim().replace(/['"]/g, ''));
        
        for (const range of applies) {
            if (dayNames.includes(range) && range === dayName) {
                return timetableInfo;
            }
            
            if (range.includes('/')) {
                const [start, end] = range.split('/').map(d => {
                    const newDate = new Date(d.trim());
                    newDate.setHours(0, 0, 0, 0);
                    return newDate;
                });
                const compareDate = new Date(date);
                compareDate.setHours(0, 0, 0, 0);
                if (compareDate >= start && compareDate <= end) {
                    return timetableInfo;
                }
            } else if (!dayNames.includes(range)) {
                const rangeDate = new Date(range);
                rangeDate.setHours(0, 0, 0, 0);
                const compareDate = new Date(date);
                compareDate.setHours(0, 0, 0, 0);
                if (+compareDate === +rangeDate) {
                    return timetableInfo;
                }
            }
        }
    }
    
    return null;
}

// Show duty details modal
function showDutyDetails(versionInfo, dutyNumber, dutyDate = null) {
    ensureModalCSS();
    ensureModalHTML();
    
    const modal = document.getElementById('dutyModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    const closeBtn = document.querySelector('.close-modal');
    
    currentDutyData = versionInfo;
    currentTimetableData = null;
    currentDutyDate = dutyDate;
    
    const duty = versionInfo.duty;
    const dutyId = versionInfo.dutyId;
    const [number, location, endLocation, startTime, endTime] = dutyId.split('-');
    
    modalTitle.textContent = `Duty ${number}: ${location} ${startTime}-${endTime}`;
    closeBtn.innerHTML = closeIconSVG;
    
    const isBaseDuty = isDutyBaseType(versionInfo);
    
    let dutyContentHTML = `
        <div class="section">
            <div class="section-item">
                <span class="section-label">Type:</span>
                <span>${duty.TypeOfDuty}</span>
            </div>
            <div class="section-item">
                <span class="section-label">Spread:</span>
                <span>${duty.Spreadtime}</span>
            </div>
            <div class="section-item">
                <span class="section-label">Paid:</span>
                <span>${duty.PaidTime}</span>
            </div>
            <div class="section-item">
                <span class="section-label">Book on:</span>
                <span>${startTime}${location ? ` at ${location}` : ''}</span>
            </div>
        </div>
    `;

    if (duty.TypeOfDuty === "SPARE" || duty.TypeOfDuty === "TRAINING" || duty.TypeOfDuty === "PANEL") {
        dutyContentHTML += `<div class="section"><div class="section-header">Duty Details</div><div style="margin-left: 1rem; font-style: italic; color: #888;">${duty.TypeOfDuty}</div></div>`;
    } else {
        const canShowFirstHalf = isBaseDuty && duty.FirstHalfRunNumber && duty.FirstHalfRunNumber !== "" && duty.FirstHalfRunNumber !== "TR";
        const dutyDateString = dutyDate ? dutyDate.getFullYear() + ',' + (dutyDate.getMonth()) + ',' + dutyDate.getDate() : 'null';
        
        dutyContentHTML += `
            <div class="section">
                <div class="section-header">
                    <div style="display: flex; align-items: center; justify-content: space-between; width: 100%; ${canShowFirstHalf ? 'cursor: pointer;' : ''}" ${canShowFirstHalf ? `onclick="showTimetableView('First Half', '${duty.FirstHalfRunNumber}', '${duty.FirstHalfStartTime}', '${duty.FirstHalfEndTime}', '${duty.FirstHalfStartLocation}', '${duty.FirstHalfEndLocation}', new Date(${dutyDateString}))"` : ''}>
                        <span>First Half (${duty.FirstHalfLength})</span>
                        ${canShowFirstHalf ? '<div style="display: flex; align-items: center; gap: 8px; font-size: 12px; color: #888;">View Calling Points →</div>' : ''}
                    </div>
                </div>`;

        if (duty.FirstHalfRunNumber === "" || duty.FirstHalfRunNumber === "TR") {
            dutyContentHTML += `<div style="margin-left: 1rem; font-style: italic; color: #888;">${duty.TypeOfDuty}</div>`;
        } else {
            dutyContentHTML += `<div style="margin-left: 1rem;"><div class="section-item"><span class="section-label">Run:</span><span>${duty.FirstHalfRunNumber}</span></div><div class="section-item"><span class="section-label">Pick up:</span><span>${duty.FirstHalfStartLocation} at ${duty.FirstHalfStartTime}</span></div><div class="section-item"><span class="section-label">Relieved:</span><span>${duty.FirstHalfEndLocation} at ${duty.FirstHalfEndTime}</span></div></div>`;
        }
        dutyContentHTML += `</div>`;

        if (duty.FirstHalfEndTime && duty.SecondHalfStartTime) {
            dutyContentHTML += `<div class="section"><div class="section-header">Break Details</div><div class="section-item"><span class="section-label">Duration:</span><span>${calculateBreakDetails(duty)}</span></div></div>`;
        }

        const canShowSecondHalf = isBaseDuty && duty.SecondHalfRunNumber && duty.SecondHalfRunNumber !== "" && duty.SecondHalfRunNumber !== "TR";
        dutyContentHTML += `
            <div class="section">
                 <div class="section-header">
                    <div style="display: flex; align-items: center; justify-content: space-between; width: 100%; ${canShowSecondHalf ? 'cursor: pointer;' : ''}" ${canShowSecondHalf ? `onclick="showTimetableView('Second Half', '${duty.SecondHalfRunNumber}', '${duty.SecondHalfStartTime}', '${duty.SecondHalfEndTime}', '${duty.SecondHalfStartLocation}', '${duty.SecondHalfEndLocation}', new Date(${dutyDateString}))"` : ''}>
                        <span>Second Half (${duty.SecondHalfLength})</span>
                        ${canShowSecondHalf ? '<div style="display: flex; align-items: center; gap: 8px; font-size: 12px; color: #888;">View Calling Points →</div>' : ''}
                    </div>
                </div>`;

        if (duty.SecondHalfRunNumber === "" || duty.SecondHalfRunNumber === "TR") {
            dutyContentHTML += `<div style="margin-left: 1rem; font-style: italic; color: #888;">${duty.TypeOfDuty}</div>`;
        } else {
             dutyContentHTML += `<div style="margin-left: 1rem;"><div class="section-item"><span class="section-label">Run:</span><span>${duty.SecondHalfRunNumber}</span></div><div class="section-item"><span class="section-label">Pick up:</span><span>${duty.SecondHalfStartLocation} at ${duty.SecondHalfStartTime}</span></div><div class="section-item"><span class="section-label">Relieved:</span><span>${duty.SecondHalfEndLocation} at ${duty.SecondHalfEndTime}</span></div></div>`;
        }
        dutyContentHTML += `</div>`;
    }

    dutyContentHTML += `<div class="section"><div class="section-item"><span class="section-label">Book off:</span><span>${endTime}${endLocation ? ` at ${endLocation}` : ''}</span></div></div>`;

    modalBody.innerHTML = `
        <div class="slide-container">
            <div id="duty-pane" class="slide-pane is-center">${dutyContentHTML}</div>
        </div>
    `;
    
    modal.classList.add('is-visible');
    modal.classList.add('modal-opening');
    
    if (typeof history !== 'undefined' && history.pushState) {
        history.pushState({ modal: 'duty' }, '', '');
    }
}

// Close modal or navigate back
function closeDutyModal() {
    const modal = document.getElementById('dutyModal');
    const modalTitle = document.getElementById('modalTitle');
    const closeBtn = document.querySelector('.close-modal');

    if (currentModalView === 'timetable') {
        const dutyPane = document.getElementById('duty-pane');
        const timetablePane = document.getElementById('timetable-pane');
        
        // Animate timetable out to the LEFT
        timetablePane.classList.remove('is-center');
        timetablePane.classList.add('is-left');
        
        // Animate duty details back in from the RIGHT
        dutyPane.classList.remove('is-right');
        dutyPane.classList.add('is-center');

        // Restore header details
        const { dutyId } = currentDutyData;
        const [number, location, , startTime, endTime] = dutyId.split('-');
        modalTitle.textContent = `Duty ${number}: ${location} ${startTime}-${endTime}`;
        closeBtn.innerHTML = closeIconSVG;
        currentModalView = 'duty';
    } else {
        // Close the entire modal
        modal.classList.add('modal-closing');
        modal.classList.remove('modal-opening');
        modal.classList.remove('is-visible');
        
        setTimeout(() => {
            modal.classList.remove('modal-closing');
            currentModalView = 'duty';
            currentDutyData = null;
        }, 500);
    }
}

// Make run numbers clickable
function makeRunNumbersClickable(element, operatingDate) {
    if (!element) return;
    
    const runPattern = /\bRun (\d+)\b/g;
    const originalHTML = element.innerHTML;
    
    const newHTML = originalHTML.replace(runPattern, (match, runNumber) => {
        return `<span class="clickable-run" data-run="${runNumber}" data-date="${operatingDate}" style="color: #667eea; cursor: pointer; text-decoration: underline;">${match}</span>`;
    });
    
    if (newHTML !== originalHTML) {
        element.innerHTML = newHTML;
        
        // Add click handlers
        element.querySelectorAll('.clickable-run').forEach(runSpan => {
            runSpan.addEventListener('click', (e) => {
                e.preventDefault();
                const runNumber = e.target.dataset.run;
                const dateStr = e.target.dataset.date;
                
                // Get duty info for this run number and date
                const versions = getDutyForDate(runNumber, dateStr);
                if (versions.length > 0) {
                    const dateParts = dateStr.split('-');
                    const dutyDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
                    showDutyDetails(versions[0], runNumber, dutyDate);
                }
            });
        });
    }
}

// Fetch and parse timetable data
async function fetchTimetableData(timetableInfo) {
    try {
        const response = await fetch(timetableInfo.url);
        const csvText = await response.text();
        
        const lines = csvText.split('\n').filter(line => line.trim() !== '');
        const runData = {};

        const junctions = [
            'JRMS', 'JRMX', 'JCAW', 'JWEM', 'JCRO', 'JC2M', 'JC3M',
            'JC4M', 'JROM', 'JWEX', 'JCTM', 'JCTX', 'JWIQ', 'JNQX',
            'JNQM', 'JWSX', 'JWSM', 'ISP2', 'ISP3'
        ];

        lines.forEach((line, index) => {
            const parts = line.split(',');
            if (parts.length >= 7) {
                const runNumber = parts[1].trim();
                const locationCode = parts[4].trim();
                const arrivalTime = parts[5].trim();
                const departureTime = parts[6].trim();

                if (!junctions.includes(locationCode)) {
                    if (!runData[runNumber]) {
                        runData[runNumber] = [];
                    }

                    let location = '';
                    let platform = '';

                    if (locationCode === 'BANH') {
                        location = 'Bank Headshunt';
                    } else {
                        const codePrefix = locationCode.slice(0, 3);
                        platform = locationCode.slice(3);

                        if (locationMapping[codePrefix]) {
                            location = locationMapping[codePrefix];
                            if (['LEW', 'BEC', 'STI', 'WOA'].includes(codePrefix) || locationCode === 'STR4B') {
                                platform = '';
                            }
                        } else {
                            location = locationCode;
                            platform = '';
                        }
                    }

                    runData[runNumber].push({
                        location,
                        platform,
                        arrivalTime,
                        departureTime,
                        locationCode
                    });
                }
            }
        });

        return runData;
    } catch (error) {
        console.error('Error fetching timetable data:', error);
        return null;
    }
}

// Filter run data by time constraints
function filterRunByTime(runData, startTime, endTime) {
    if (!runData || !startTime || !endTime) return runData;
    
    const parseTime = (timeStr) => {
        const [hours, minutes, seconds] = timeStr.split(':').map(Number);
        return hours * 3600 + minutes * 60 + (seconds || 0);
    };
    
    const startSeconds = parseTime(startTime + ':00');
    const endSeconds = parseTime(endTime + ':00');
    
    // Find the last stop that would normally be included
    let lastIncludedIndex = -1;
    for (let i = 0; i < runData.length; i++) {
        const arrivalSeconds = parseTime(runData[i].arrivalTime);
        if (arrivalSeconds >= startSeconds && arrivalSeconds <= endSeconds) {
            lastIncludedIndex = i;
        }
    }
    
    // If we found stops within the time range, include one additional stop beyond the last one
    if (lastIncludedIndex >= 0) {
        const endIndex = Math.min(lastIncludedIndex + 2, runData.length);
        return runData.filter((stop, index) => {
            const arrivalSeconds = parseTime(stop.arrivalTime);
            return (arrivalSeconds >= startSeconds && index < endIndex);
        });
    }
    
    // Fallback to original filtering if no stops found in range
    return runData.filter(stop => {
        const arrivalSeconds = parseTime(stop.arrivalTime);
        return arrivalSeconds >= startSeconds && arrivalSeconds <= endSeconds;
    });
}

// Add depot stops to run data
function addDepotStops(runData, startLocation, endLocation, startTime, endTime) {
    if (!runData) return [];
    
    const result = [...runData];
    
    // Add start depot if needed
    if ((startLocation === 'POD' || startLocation === 'BED') && 
        !result.some(stop => stop.locationCode && stop.locationCode.startsWith(startLocation))) {
        result.unshift({
            location: locationMapping[startLocation],
            platform: '—',
            arrivalTime: '—',
            departureTime: startTime + ':00',
            locationCode: startLocation,
            isDepot: true
        });
    }
    
    // Add end depot if needed  
    if ((endLocation === 'POD' || endLocation === 'BED') && 
        !result.some(stop => stop.locationCode && stop.locationCode.startsWith(endLocation))) {
        result.push({
            location: locationMapping[endLocation],
            platform: '—',
            arrivalTime: endTime + ':00',
            departureTime: '—',
            locationCode: endLocation,
            isDepot: true
        });
    }
    
    return result;
}

// Show timetable view
async function showTimetableView(halfName, runNumber, startTime, endTime, startLocation, endLocation, dutyDate = currentDutyDate) {
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    const closeBtn = document.querySelector('.close-modal');
    const dutyPane = document.getElementById('duty-pane');
    let timetablePane = document.getElementById('timetable-pane');

    // --- Slide out the duty pane to the RIGHT ---
    dutyPane.classList.remove('is-center');
    dutyPane.classList.add('is-right');

    // --- Change header details ---
    modalTitle.textContent = `${halfName}: Run ${runNumber}`;
    closeBtn.innerHTML = backIconSVG;
    currentModalView = 'timetable';

    // --- Prepare the timetable pane (off-screen on the LEFT) ---
    if (!timetablePane) {
        timetablePane = document.createElement('div');
        timetablePane.id = 'timetable-pane';
        timetablePane.className = 'slide-pane timetable is-left';
        modalBody.querySelector('.slide-container').appendChild(timetablePane);
    } else {
         timetablePane.className = 'slide-pane timetable is-left';
    }
    
    timetablePane.innerHTML = `<div style="padding: 2rem; text-align: center; color: #888;">Loading timetable...</div>`;
    
    try {
        // Get applicable timetable for the duty date
        const applicableTimetable = getApplicableTimetable(dutyDate);
        if (!applicableTimetable) throw new Error('No applicable timetable found for this date');

        // Fetch timetable data if not already cached
        if (!currentTimetableData) currentTimetableData = await fetchTimetableData(applicableTimetable);

        if (!currentTimetableData || !currentTimetableData[runNumber]) throw new Error('Run not found in timetable');

        // Get and filter run data
        let runData = currentTimetableData[runNumber];
        runData = filterRunByTime(runData, startTime, endTime);
        runData = addDepotStops(runData, startLocation, endLocation, startTime, endTime);

        // Create timetable HTML
        let timetableHTML = `
            <table style="width: 100%; border-collapse: collapse; margin: 0; table-layout: fixed;">
                <thead class="timetable-sticky-header">
                    <tr>
                        <th style="width: 35%; font-weight: 600; font-size: 14px; color: #888; padding: 12px; text-align: left;">Location</th>
                        <th style="width: 15%; font-weight: 600; font-size: 14px; color: #888; padding: 12px; text-align: center;">Plat.</th>
                        <th style="width: 25%; font-weight: 600; font-size: 14px; color: #888; padding: 12px; text-align: center;">Arrival</th>
                        <th style="width: 25%; font-weight: 600; font-size: 14px; color: #888; padding: 12px; text-align: center;">Departure</th>
                    </tr>
                </thead>
                <tbody>
        `;

        runData.forEach(stop => {
            const isDepot = stop.isDepot || stop.locationCode === 'POD' || stop.locationCode === 'BED';
            const rowStyle = isDepot ? 'background: rgba(30, 136, 229, 0.1);' : '';
            const nameColor = isDepot ? 'color: #1e88e5;' : 'color: #ffffff;';
            
            timetableHTML += `
                <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.05); ${rowStyle}">
                    <td style="padding: 12px; font-weight: 500; font-size: 14px; ${nameColor} vertical-align: middle;">${stop.location}</td>
                    <td style="padding: 12px; color: #888; font-size: 14px; text-align: center; vertical-align: middle;">${stop.platform}</td>
                    <td style="padding: 12px; font-family: 'Courier New', monospace; font-weight: bold; color: #667eea; font-size: 14px; text-align: center; vertical-align: middle;">${stop.arrivalTime}</td>
                    <td style="padding: 12px; font-family: 'Courier New', monospace; font-weight: bold; color: #667eea; font-size: 14px; text-align: center; vertical-align: middle;">${stop.departureTime}</td>
                </tr>
            `;
        });

        timetableHTML += `</tbody></table>`;
        timetablePane.innerHTML = timetableHTML;
        
    } catch (error) {
        console.error('Error loading timetable:', error);
        timetablePane.innerHTML = `<div style="padding: 2rem; text-align: center; color: #e53935;">${error.message}</div>`;
    }

    // --- Slide in the new pane from the LEFT ---
    requestAnimationFrame(() => {
         timetablePane.classList.remove('is-left');
         timetablePane.classList.add('is-center');
    });
}

// Initialize modal functionality
function initializeModalFunctionality() {
    // Initialize timetable paths
    initializeTimetablePaths();
    
    // Handle browser back button
    if (typeof window !== 'undefined' && window.addEventListener) {
        window.addEventListener('popstate', (event) => {
            const modal = document.getElementById('dutyModal');
            if (modal && modal.classList.contains('is-visible')) {
                closeDutyModal();
            }
        });
    }
    
    // Close modal when clicking outside (on the backdrop)
    if (typeof document !== 'undefined' && document.addEventListener) {
        document.addEventListener('click', (e) => {
            const modal = document.getElementById('dutyModal');
            if (modal && e.target.id === 'dutyModal') {
                closeDutyModal();
            }
        });
    }
}