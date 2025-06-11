// Shared Utility Functions

// HTML escaping functions
function escapeHtml(text) {
    if (!text) return '';
    return text.toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function escapeJs(text) {
    if (!text) return '';
    return text.toString()
        .replace(/\\/g, "\\\\")
        .replace(/'/g, "\\'")
        .replace(/"/g, '\\"')
        .replace(/\n/g, "\\n")
        .replace(/\r/g, "\\r");
}

// Registration number formatting
function formatRegistrationNumber(input) {
    if (!input) return '';
    
    // Remove any non-digits and dashes
    let cleaned = input.replace(/[^0-9-]/g, '');
    
    // If input has dashes, work with parts
    if (cleaned.includes('-')) {
        let parts = cleaned.split('-');
        if (parts.length === 3) {
            // Format as XX-XXXX-XX with leading zeros
            let part1 = parts[0].padStart(2, '0').substring(0, 2);
            let part2 = parts[1].padStart(4, '0').substring(0, 4);
            let part3 = parts[2].padStart(2, '0').substring(0, 2);
            return `${part1}-${part2}-${part3}`;
        }
    }
    
    // If no dashes but enough digits, auto-format
    const digitsOnly = cleaned.replace(/-/g, '');
    if (digitsOnly.length >= 6) {
        const part1 = digitsOnly.substring(0, 2).padStart(2, '0');
        const part2 = digitsOnly.substring(2, 6).padStart(4, '0');
        const part3 = digitsOnly.substring(6, 8).padStart(2, '0');
        return `${part1}-${part2}-${part3}`;
    }
    
    // If partial entry, try to format what we have
    if (digitsOnly.length === 4) {
        // Assume this is the middle part (most common entry)
        return `XX-${digitsOnly}-XX`;
    }
    
    return cleaned; // Return what we have if can't format
}

// Level sorting utility
function getSortedLevels(levelSummary) {
    const availableLevels = Object.keys(levelSummary);
    const orderedLevels = levelOrder.filter(level => availableLevels.includes(level));
    const unorderedLevels = availableLevels.filter(level => !levelOrder.includes(level));
    return [...orderedLevels, ...unorderedLevels.sort()];
}

// Games validation utilities
function getUniqueGames(records) {
    const games = new Set();
    
    records.forEach(record => {
        if (record.results) {
            const results = record.results.toString().toUpperCase();
            gamesList.forEach(game => {
                if (results.includes(game)) {
                    games.add(game);
                }
            });
        }
    });
    
    return games;
}

// Level requirements checking
function checkLevelRequirements(levelData) {
    if (!levelData) return false;
    return levelData.totalPoints >= 4 && levelData.judges.size >= 2;
}

// Prerequisites text generation
function getPrerequisiteText(level) {
    if (!prerequisites[level]) return 'None';
    
    if (level === "Investigator 3") {
        return 'Either "Patrol 1" OR "Detective 2" (4+ points, 2+ judges each)';
    }
    
    return `"${prerequisites[level][0]}" (4+ points, 2+ judges)`;
}

// Certificate name helpers
function getCertificateName(level) {
    return titlePlacementData[level]?.certificateName || level;
}

function getAceCertificateName(level, aceCount) {
    const abbreviation = titleAbbreviations[level] || level;
    
    if (titlePlacementData[level]) {
        let aceName = titlePlacementData[level].aceCertificateName;
        
        // Format: "Scent Patrol Ace x 4 (CW-SPAx4)" for multiple, "Scent Patrol Ace (CW-SPA)" for single
        let aceDesignation;
        let displayText;
        
        if (aceCount === 1) {
            aceDesignation = `${abbreviation}A`;
            displayText = `${aceName} (${aceDesignation})`;
        } else {
            aceDesignation = `${abbreviation}Ax${aceCount}`;
            displayText = `${aceName} x ${aceCount} (${aceDesignation})`;
        }
        
        return displayText;
    }
    
    // Fallback to original system if not found
    return aceCount === 1 ? `${abbreviation}A` : `${abbreviation}Ax${aceCount}`;
}

// Dog info helpers (using global dogInfoData)
function getHandlerNameFromDogInfo(regNumber) {
    if (!regNumber || !dogInfoData[regNumber]) return '';
    return dogInfoData[regNumber].handlerName || '';
}

function getRegisteredNameFromDogInfo(regNumber) {
    if (!regNumber || !dogInfoData[regNumber]) return '';
    return dogInfoData[regNumber].registeredName || dogInfoData[regNumber].callName || '';
}

function getCallNameFromDogInfo(regNumber, fallbackCallName = '') {
    if (!regNumber || !dogInfoData[regNumber]) return fallbackCallName;
    return dogInfoData[regNumber].callName || fallbackCallName;
}

// Date formatting utilities
function formatDate(date) {
    if (!date || !(date instanceof Date) || isNaN(date)) return 'N/A';
    return date.toLocaleDateString();
}

function parseExcelDate(dateValue) {
    if (typeof dateValue === 'number') {
        // Excel date serial number - convert to proper date
        const parsed = XLSX.SSF.parse_date_code(dateValue);
        return new Date(parsed.y, parsed.m - 1, parsed.d);
    } else if (typeof dateValue === 'string') {
        // String date - parse it
        return new Date(dateValue);
    } else if (dateValue instanceof Date) {
        // Already a date object
        return dateValue;
    } else {
        // Invalid date
        return null;
    }
}

// PDF download utility
function downloadPDF(pdfBytes, filename) {
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}

// Keyboard event handlers
function handleKeyPress(event) {
    if (event.key === 'Enter') {
        searchDog();
    }
}

function handleOwnerKeyPress(event) {
    if (event.key === 'Enter') {
        loadOwnerView();
    }
}

// Modal management
function closeModal() {
    document.getElementById('detailsModal').style.display = 'none';
}

// Navigation helpers
function backToSearch() {
    document.getElementById('summaryContent').innerHTML = `
        <div class="validation-rules">
            <h4>Title Requirements</h4>
            <ul>
                <li>Minimum 4 points required for each level</li>
                <li>Points must come from at least 2 different judges</li>
                <li>Prerequisites must be met before advancing to higher levels</li>
                <li>Special case: "Investigator 3" requires either "Patrol 1" OR "Detective 2"</li>
                <li>Games levels require at least 2 different games (BJ, C, P, T, GB)</li>
                <li>Ace awards given every 10 points after title is earned</li>
            </ul>
        </div>
    `;
}

// Error handling utilities
function showError(message) {
    return `<div class="error-message">${message}</div>`;
}

function showLoading(message = 'Loading...') {
    return `<div class="loading-message">${message}</div>`;
}

// Validation utilities
function validateOwnerIdInput(ownerId) {
    if (!ownerId) {
        return { valid: false, message: 'Please enter the middle 4 digits' };
    }
    
    if (!/^\d{4}$/.test(ownerId)) {
        return { valid: false, message: 'Please enter exactly 4 digits' };
    }
    
    return { valid: true };
}

// File loading utilities
function createTimeoutPromise(ms, message) {
    return new Promise((_, reject) => 
        setTimeout(() => reject(new Error(message)), ms)
    );
}

async function fetchWithTimeout(url, timeout = 3000) {
    try {
        return await Promise.race([
            fetch(url, { method: 'GET', cache: 'no-cache' }),
            createTimeoutPromise(timeout, 'Request timeout')
        ]);
    } catch (error) {
        throw new Error(`Failed to fetch ${url}: ${error.message}`);
    }
}