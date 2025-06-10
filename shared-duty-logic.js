// Shared duty logic between calendar.html and index.html

// Duty lookup data storage
let dutyLookupData = {
    base: {},
    singleTemp: {},
    rangeTemp: []
};

// Location mapping
const locationMapping = {
    'ABR': 'Abbey Road', 'ALS': 'All Saints', 'BAN': 'Bank', 'BEC': 'Beckton', 
    'BEP': 'Beckton Park', 'BLA': 'Blackwall', 'BOC': 'Bow Church', 'CAW': 'Canary Wharf',
    'CAT': 'Canning Town', 'CRO': 'Crossharbour', 'CUH': 'Custom House', 'CUS': 'Cutty Sark',
    'CYP': 'Cyprus', 'DEB': 'Deptford Bridge', 'DER': 'Devons Road', 'EAI': 'East India',
    'ELR': 'Elverson Road', 'GAR': 'Gallions Reach', 'GRE': 'Greenwich', 'HEQ': 'Heron Quays',
    'ISG': 'Island Gardens', 'KGV': 'King George V', 'LAP': 'Langdon Park', 'LEW': 'Lewisham',
    'LIM': 'Limehouse', 'LCA': 'London City Airport', 'MUD': 'Mudchute', 'PDK': 'Pontoon Dock',
    'POP': 'Poplar', 'PRR': 'Prince Regent', 'PML': 'Pudding Mill Lane', 'ROA': 'Royal Albert',
    'ROV': 'Royal Victoria', 'SHA': 'Shadwell', 'SOQ': 'South Quay', 'STL': 'Star Lane',
    'SHS': 'Stratford High Street', 'STI': 'Stratford International', 'STR': 'Stratford',
    'TOG': 'Tower Gateway', 'WEH': 'West Ham', 'WIQ': 'West India Quay', 'WST': 'West Silvertown',
    'WES': 'Westferry', 'WOA': 'Woolwich Arsenal',
    'POD': 'Poplar Depot', 'BED': 'Beckton Depot'
};

// Fetch duty lookup data
function fetchDutyLookupData() {
    return new Promise((resolve, reject) => {
        const storageRef = firebase.storage().ref('duty-files');
        
        storageRef.listAll()
            .then((result) => {
                const promises = result.items.map(fileRef => {
                    return fileRef.getDownloadURL()
                        .then(url => fetch(url))
                        .then(response => response.text())
                        .then(content => {
                            const jsonMatch = content.match(/var\s+ExtractedDuties\s*=\s*(\{.*\});/s);
                            if (jsonMatch) {
                                const duties = JSON.parse(jsonMatch[1]);
                                processDutyFile(fileRef.name, duties);
                            }
                        });
                });
                
                return Promise.all(promises);
            })
            .then(() => {
                console.log('Duty lookup data loaded');
                resolve();
            })
            .catch(error => {
                console.error('Error fetching duty lookup data:', error);
                reject(error);
            });
    });
}

// Process duty file
function processDutyFile(filename, duties) {
    const parts = filename.split('.')[0].split('-');
    
    if (filename.includes('-to-')) {
        const [startYear, startMonth, startDay, , endYear, endMonth, endDay] = parts;
        const startDate = new Date(startYear, startMonth - 1, startDay);
        const endDate = new Date(endYear, endMonth - 1, endDay);
        dutyLookupData.rangeTemp.push({
            startDate,
            endDate,
            duties,
            filename
        });
    } else if (filename.endsWith('-Base.json')) {
        const [year, month, day] = parts;
        const baseDate = new Date(year, month - 1, day);
        dutyLookupData.base[baseDate.getTime()] = {
            duties,
            filename
        };
    } else if (filename.endsWith('-Temp.json')) {
        const [year, month, day] = parts;
        const dateKey = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        dutyLookupData.singleTemp[dateKey] = {
            duties,
            filename
        };
    }
}

// Get duty info for lookup
function getDutyForDate(dutyNumber, dateStr) {
    const versions = [];
    const [year, month, day] = dateStr.split('-');
    const date = new Date(year, month - 1, day);

    // Check single day temp
    const dateKey = `${year}-${month}-${day}`;
    if (dutyLookupData.singleTemp[dateKey]) {
        const tempDuty = Object.entries(dutyLookupData.singleTemp[dateKey].duties)
            .find(([key]) => key.startsWith(dutyNumber + '-'));
        if (tempDuty) {
            versions.push({
                type: 'temp',
                date: dateStr,
                duty: tempDuty[1],
                dutyId: tempDuty[0],
                filename: dutyLookupData.singleTemp[dateKey].filename
            });
        }
    }

    // Check range temp
    const rangeTempMatch = dutyLookupData.rangeTemp.find(range => 
        date >= range.startDate && date <= range.endDate);
    if (rangeTempMatch) {
        const tempDuty = Object.entries(rangeTempMatch.duties)
            .find(([key]) => key.startsWith(dutyNumber + '-'));
        if (tempDuty) {
            versions.push({
                type: 'temp',
                dateRange: {
                    start: rangeTempMatch.startDate.toISOString().split('T')[0],
                    end: rangeTempMatch.endDate.toISOString().split('T')[0]
                },
                duty: tempDuty[1],
                dutyId: tempDuty[0],
                filename: rangeTempMatch.filename
            });
        }
    }

    // Check base duties
    const baseDate = Object.keys(dutyLookupData.base)
        .map(Number)
        .filter(time => new Date(time) <= date)
        .sort((a, b) => b - a)[0];

    if (baseDate) {
        const baseDutyId = Object.keys(dutyLookupData.base[baseDate].duties)
            .find(key => key.startsWith(dutyNumber + '-'));
        if (baseDutyId) {
            versions.push({
                type: 'base',
                date: new Date(baseDate).toISOString().split('T')[0],
                duty: dutyLookupData.base[baseDate].duties[baseDutyId],
                dutyId: baseDutyId,
                filename: dutyLookupData.base[baseDate].filename
            });
        }
    }

    return versions;
}

// Check if duty is base type
function isDutyBaseType(versionInfo) {
    return versionInfo.type === 'base';
}

// Get location name
function getLocationName(locationCode) {
    if (locationCode === 'POD') return 'Poplar Depot';
    if (locationCode === 'BED') return 'Beckton Depot';
    
    const stationCode = locationCode.substring(0, 3);
    return locationMapping[stationCode] || locationCode;
}

// Time formatting utilities
function calculateTimeDifference(time1, time2) {
    const [h1, m1] = time1.split(':').map(Number);
    const [h2, m2] = time2.split(':').map(Number);
    
    let diffMinutes = (h2 * 60 + m2) - (h1 * 60 + m1);
    if (diffMinutes < 0) diffMinutes += 24 * 60;
    
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    return formatTime(hours, minutes);
}

function formatTime(hours, minutes) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

function calculateBreakDetails(duty) {
    if (!duty.FirstHalfEndTime || !duty.SecondHalfStartTime) return "N/A";

    const [breakHours, breakMins] = calculateTimeDifference(
        duty.FirstHalfEndTime,
        duty.SecondHalfStartTime
    ).split(':').map(Number);

    const [mealHours, mealMins] = duty.MealBreakDuration.split(':').map(Number);
    
    const totalBreakMins = (breakHours * 60 + breakMins);
    const mealBreakMins = (mealHours * 60 + mealMins);
    const paidBreakMins = totalBreakMins - mealBreakMins;
    
    const paidHours = Math.floor(paidBreakMins / 60);
    const paidMins = paidBreakMins % 60;
    const paidBreak = `${paidHours.toString().padStart(2, '0')}:${paidMins.toString().padStart(2, '0')}`;

    return `${formatTime(breakHours, breakMins)} (${duty.MealBreakDuration} unpaid + ${paidBreak} paid)`;
}