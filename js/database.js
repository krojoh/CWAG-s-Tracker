// Database Operations - Upload-First Version

// Global data storage
let trialingData = [];
let currentDogRecords = [];
let dogInfoData = {};
let titlePlacementData = {};

// Application initialization
async function initializeApplication() {
    console.log('🚀 CWAGS Tracker initializing...');
    document.getElementById('lastUpdated').textContent = 'Ready to load data';
    
    setTimeout(() => {
        if (typeof fontkit !== 'undefined') {
            console.log('✅ Fontkit library loaded successfully');
        } else {
            console.warn('⚠️ Fontkit library failed to load - custom fonts will not work');
        }
    }, 1000);
    
    // Show upload interface immediately since manual upload works
    setTimeout(() => {
        showFileUpload();
    }, 500);
}

// Process Excel data from array buffer
function processExcelData(data) {
    const workbook = XLSX.read(data, {type: 'array', cellDates: true});
    const dataSheet = workbook.Sheets['Data'] || workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(dataSheet, {header: 1, dateNF: 'yyyy-mm-dd'});
    
    trialingData = jsonData.slice(1).map(row => {
        let processedDate = parseExcelDate(row[2]);
        return {
            registrationNumber: row[0],
            callName: row[1],
            date: processedDate,
            level: row[3],
            results: row[4],
            judge: row[5],
            points: parseFloat(row[6]) || 0
        };
    }).filter(record => record.registrationNumber && record.level);
    
    console.log('Data processed:', trialingData.length, 'records');
}

function parseExcelDate(dateValue) {
    if (typeof dateValue === 'number') {
        const parsed = XLSX.SSF.parse_date_code(dateValue);
        return new Date(parsed.y, parsed.m - 1, parsed.d);
    } else if (typeof dateValue === 'string') {
        return new Date(dateValue);
    } else if (dateValue instanceof Date) {
        return dateValue;
    } else {
        return null;
    }
}

function updateLastUpdatedDate() {
    if (trialingData.length === 0) {
        document.getElementById('lastUpdated').textContent = 'No data available';
        return;
    }

    const validDates = trialingData
        .map(record => record.date)
        .filter(date => date instanceof Date && !isNaN(date))
        .sort((a, b) => b - a);

    if (validDates.length > 0) {
        const mostRecentDate = validDates[0];
        document.getElementById('lastUpdated').textContent = 
            `Last updated: ${mostRecentDate.toLocaleDateString()}`;
    } else {
        document.getElementById('lastUpdated').textContent = 'Last updated: Unknown';
    }
}

function resetToDefaultView() {
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

function showFileUpload() {
    document.getElementById('summaryContent').innerHTML = `
        <div style="text-align: center; padding: 40px;">
            <h3 style="color: #17a2b8; margin-bottom: 20px;">📁 Load Your Trialing Data</h3>
            <p style="margin-bottom: 30px; font-size: 1.1rem;">Select your Excel file to get started:</p>
            
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; border-radius: 15px; margin: 20px 0; color: white;">
                <div style="background: rgba(255,255,255,0.9); padding: 30px; border-radius: 12px; color: #333;">
                    <h4 style="margin-bottom: 20px; color: #2c3e50;">Choose Your Data File</h4>
                    <input type="file" id="manualDataFile" accept=".xlsx,.xls,.csv" 
                           style="padding: 10px; margin-bottom: 20px; border: 2px solid #ddd; border-radius: 8px; font-size: 1rem; width: 100%; max-width: 400px;">
                    <br>
                    <button onclick="loadManualFile()" 
                            style="background: #28a745; color: white; border: none; padding: 15px 30px; border-radius: 10px; cursor: pointer; font-size: 1.1rem; font-weight: bold;">
                        🚀 Load Trialing Data
                    </button>
                </div>
            </div>
            
            <div style="background: #e7f3ff; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #b8daff;">
                <strong style="color: #004085;">Expected file:</strong> "Data for Tracker web.xlsx"<br>
                <span style="color: #004085;">The file should contain trialing records with columns for registration, dog name, date, level, results, judge, and points.</span>
            </div>
        </div>
    `;
}

function loadManualFile() {
    const fileInput = document.getElementById('manualDataFile');
    const file = fileInput.files[0];
    
    if (!file) {
        alert('Please select a file first');
        return;
    }

    document.getElementById('summaryContent').innerHTML = `
        <div style="text-align: center; padding: 60px;">
            <h3 style="color: #17a2b8;">📊 Processing Your Data...</h3>
            <p>Loading ${file.name}...</p>
        </div>
    `;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            processExcelData(data);
            updateLastUpdatedDate();
            
            document.getElementById('summaryContent').innerHTML = `
                <div style="text-align: center; padding: 40px; background: #d4edda; border-radius: 8px; margin: 20px 0; border: 1px solid #c3e6cb;">
                    <h3 style="color: #155724;">✅ Data Loaded Successfully!</h3>
                    <p style="color: #155724; font-size: 1.1rem;">Loaded ${trialingData.length} trialing records</p>
                    <p style="color: #155724;">You can now search for dogs or view owner data using the buttons above.</p>
                </div>
            `;
            
            setTimeout(() => {
                resetToDefaultView();
            }, 3000);
            
        } catch (error) {
            console.error('Error loading manual file:', error);
            alert(`Error loading file: ${error.message}`);
            showFileUpload();
        }
    };
    
    reader.onerror = function() {
        alert('Error reading file. Please try again.');
        showFileUpload();
    };
    
    reader.readAsArrayBuffer(file);
}
