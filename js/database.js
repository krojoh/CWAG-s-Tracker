// Database Operations and Data Loading - Fixed for Local Files

// Global data storage
let trialingData = [];
let currentDogRecords = [];
let dogInfoData = {}; // Store DogInfo.xlsx data for lookup
let titlePlacementData = {}; // Store Title Placement mapping data

// Application initialization
async function initializeApplication() {
    console.log('🚀 CWAGS Tracker initializing...');
    document.getElementById('lastUpdated').textContent = 'Loading data...';
    
    // Check fontkit after a delay
    setTimeout(() => {
        if (typeof fontkit !== 'undefined') {
            console.log('✅ Fontkit library loaded successfully');
        } else {
            console.warn('⚠️ Fontkit library failed to load - custom fonts will not work');
        }
    }, 1000);
    
    // Load files with proper sequencing and error handling
    setTimeout(async () => {
        try {
            console.log('📊 Step 1: Loading DogInfo data...');
            const dogInfoLoaded = await loadDogInfoData();
            
            if (dogInfoLoaded) {
                console.log('✅ Step 1 complete: DogInfo data ready');
            } else {
                console.log('⚠️ Step 1 skipped: DogInfo not available');
            }

            console.log('📊 Step 2: Loading Title Placement data...');
            const titlePlacementLoaded = await loadTitlePlacementData();
            
            if (titlePlacementLoaded) {
                console.log('✅ Step 2 complete: Title Placement data ready');
            } else {
                console.log('⚠️ Step 2 skipped: Title Placement not available');
            }
            
            console.log('📁 Step 3: Loading main trialing data...');
            loadDataFromFile();
            
        } catch (error) {
            console.error('❌ Initialization error:', error);
            document.getElementById('lastUpdated').textContent = 'Initialization failed';
            showFileUpload();
        }
    }, 200);
}

// Load DogInfo.xlsx data with timeout and error handling
async function loadDogInfoData() {
    return new Promise((resolve) => {
        const timeoutId = setTimeout(() => {
            console.warn('⏰ DogInfo loading timed out - continuing without it');
            resolve(false);
        }, 2000); // 2 second timeout

        fetch('DogInfo.xlsx', {
            method: 'GET',
            cache: 'no-cache'
        })
        .then(response => {
            clearTimeout(timeoutId);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.arrayBuffer();
        })
        .then(fileContent => {
            const workbook = XLSX.read(new Uint8Array(fileContent), { 
                cellStyles: true, 
                cellFormulas: true, 
                cellDates: true 
            });
            
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(sheet, {header: 1});
            
            let loadedCount = 0;
            // Process DogInfo data - skip header row
            jsonData.slice(1).forEach(row => {
                if (row && row[0]) { // Column A is Registration Number
                    const regNumber = row[0].toString().trim();
                    const callName = row[1] ? row[1].toString().trim() : '';
                    const handlerName = row[2] ? row[2].toString().trim() : '';
                    const registeredName = row[3] ? row[3].toString().trim() : '';
                    
                    dogInfoData[regNumber] = {
                        callName: callName,
                        handlerName: handlerName,
                        registeredName: registeredName
                    };
                    loadedCount++;
                }
            });
            
            console.log('✅ DogInfo data loaded:', loadedCount, 'dogs');
            resolve(true);
        })
        .catch(error => {
            clearTimeout(timeoutId);
            console.warn('⚠️ Could not load DogInfo data:', error.message);
            console.log('💡 Continuing without DogInfo lookup');
            resolve(false);
        });
    });
}

// Load Title Placement data with timeout and error handling
async function loadTitlePlacementData() {
    return new Promise((resolve) => {
        // Set a timeout to prevent hanging
        const timeoutId = setTimeout(() => {
            console.warn('⏰ Title Placement loading timed out - continuing without it');
            resolve(false);
        }, 2000);

        fetch('Title Placement.xlsx', {
            method: 'GET',
            cache: 'no-cache'
        })
        .then(response => {
            clearTimeout(timeoutId);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.arrayBuffer();
        })
        .then(fileContent => {
            const workbook = XLSX.read(new Uint8Array(fileContent), { 
                cellStyles: true, 
                cellFormulas: true, 
                cellDates: true 
            });
            
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(sheet, {header: 1});
            
            let loadedCount = 0;
            jsonData.slice(1).forEach(row => {
                if (row && row[1] && row[2] && row[3]) {
                    const className = row[1].toString().trim();
                    const certificateName = row[2].toString().trim();
                    const aceCertificateName = row[3].toString().trim();
                    
                    titlePlacementData[className] = {
                        certificateName: certificateName,
                        aceCertificateName: aceCertificateName
                    };
                    loadedCount++;
                }
            });
            
            console.log('✅ Title Placement data loaded:', loadedCount, 'classes');
            resolve(true);
        })
        .catch(error => {
            clearTimeout(timeoutId);
            console.warn('⚠️ Could not load Title Placement data:', error.message);
            console.log('💡 Continuing with original certificate names');
            resolve(false);
        });
    });
}

// Main data file loading
function loadDataFromFile() {
    console.log('Starting data load process...');
    
    // Set a timeout to show manual upload option if loading takes too long
    const timeoutId = setTimeout(() => {
        console.log('Load timeout - showing manual upload option');
        showFileUpload();
    }, 3000);

    // First try to load the expected file
    fetch('Data for Tracker web.xlsx')
        .then(response => {
            clearTimeout(timeoutId);
            console.log('Fetch response status:', response.status);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            console.log('File found, reading data...');
            return response.arrayBuffer();
        })
        .then(data => {
            console.log('Data received, size:', data.byteLength, 'bytes');
            processExcelData(new Uint8Array(data));
            updateLastUpdatedDate();
            resetToDefaultView();
            console.log('Data processing complete');
        })
        .catch(error => {
            clearTimeout(timeoutId);
            console.error('Error loading data:', error);
            document.getElementById('lastUpdated').textContent = 'File not found - Click to upload';
            showFileUpload();
        });
}

// Process Excel data from array buffer
function processExcelData(data) {
    const workbook = XLSX.read(data, {type: 'array', cellDates: true});
    
    // Look for Data sheet
    const dataSheet = workbook.Sheets['Data'] || workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(dataSheet, {header: 1, dateNF: 'yyyy-mm-dd'});
    
    // Process the data with proper date handling
    trialingData = jsonData.slice(1).map(row => {
        let processedDate = parseExcelDate(row[2]);
        
        return {
            registrationNumber: row[0],       // Column A
            callName: row[1],                 // Column B  
            date: processedDate,              // Column C
            level: row[3],                    // Column D
            results: row[4],                  // Column E
            judge: row[5],                    // Column F
            points: parseFloat(row[6]) || 0   // Column G
        };
    }).filter(record => record.registrationNumber && record.level);
    
    console.log('Data processed:', trialingData.length, 'records');
}

// Parse Excel date values
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

// Update last updated date based on data
function updateLastUpdatedDate() {
    if (trialingData.length === 0) {
        document.getElementById('lastUpdated').textContent = 'No data available';
        return;
    }

    // Find the most recent date in the data
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

// Reset to default view
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

// Show file upload interface
function showFileUpload() {
    document.getElementById('summaryContent').innerHTML = `
        <div style="text-align: center; padding: 40px;">
            <h3 style="color: #17a2b8; margin-bottom: 20px;">📁 Upload Data File</h3>
            <p style="margin-bottom: 20px;">The tracker couldn't find your Excel file automatically.<br>Please select your Excel file to load the trialing data:</p>
            
            <div style="background: #f8f9fa; padding: 30px; border-radius: 12px; border: 2px dashed #dee2e6; margin: 20px 0;">
                <input type="file" id="manualDataFile" accept=".xlsx,.xls,.csv" style="margin-bottom: 15px;">
                <br>
                <button onclick="loadManualFile()" style="background: #28a745; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 1rem;">
                    📤 Load File
                </button>
            </div>
            
            <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #ffeaa7;">
                <strong>Expected file name:</strong> "Data for Tracker web.xlsx"<br>
                <strong>Location:</strong> Same folder as index.html
            </div>
            
            <button onclick="loadDataFromFile()" style="background: #6c757d; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 0.9rem; margin-top: 15px;">
                ← Try Auto-Loading Again
            </button>
        </div>
    `;
}

// Load manually selected file
function loadManualFile() {
    const fileInput = document.getElementById('manualDataFile');
    const file = fileInput.files[0];
    
    if (!file) {
        alert('Please select a file first');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            processExcelData(data);
            updateLastUpdatedDate();
            resetToDefaultView();
            alert(`Successfully loaded ${trialingData.length} records!`);
        } catch (error) {
            console.error('Error loading manual file:', error);
            alert(`Error loading file: ${error.message}`);
        }
    };
    
    reader.onerror = function() {
        alert('Error reading file. Please try again.');
    };
    
    reader.readAsArrayBuffer(file);
}
