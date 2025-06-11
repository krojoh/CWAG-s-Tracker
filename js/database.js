// Database Operations - Upload-First Version

// Global data storage
let trialingData = [];
let currentDogRecords = [];
let dogInfoData = {}; // Store DogInfo.xlsx data for lookup
let titlePlacementData = {}; // Store Title Placement mapping data

// Application initialization
async function initializeApplication() {
    console.log('🚀 CWAGS Tracker initializing...');
    document.getElementById('lastUpdated').textContent = 'Ready to load data';
    
    // Check fontkit after a delay
    setTimeout(() => {
        if (typeof fontkit !== 'undefined') {
            console.log('✅ Fontkit library loaded successfully');
        } else {
            console.warn('⚠️ Fontkit library failed to load - custom fonts will not work');
        }
    }, 1000);
    
    // Load optional files first, then show upload interface
    setTimeout(async () => {
        try {
            console.log('📊 Loading optional files...');
            
            // Try to load DogInfo and Title Placement (these often work even when main file doesn't)
            const dogInfoLoaded = await loadDogInfoData();
            const titlePlacementLoaded = await loadTitlePlacementData();
            
            console.log('📁 Attempting to load main data file...');
            
            // Try auto-loading, but don't wait long
            const autoLoadSuccess = await attemptAutoLoad();
            
            if (!autoLoadSuccess) {
                console.log('💡 Auto-load failed - showing upload interface');
                showFileUpload();
            }
            
        } catch (error) {
            console.error('❌ Initialization error:', error);
            document.getElementById('lastUpdated').textContent = 'Ready - Please upload data';
            showFileUpload();
        }
    }, 200);
}

// Attempt auto-loading with short timeout
async function attemptAutoLoad() {
    return new Promise((resolve) => {
        const timeoutId = setTimeout(() => {
            console.log('Auto-load timeout - switching to manual upload');
            resolve(false);
        }, 1000); // Only wait 1 second

        fetch('Data for Tracker web.xlsx')
            .then(response => {
                clearTimeout(timeoutId);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                console.log('✅ Auto-load successful!');
                return response.arrayBuffer();
            })
            .then(data => {
                processExcelData(new Uint8Array(data));
                updateLastUpdatedDate();
                resetToDefaultView();
                resolve(true);
            })
            .catch(error => {
                clearTimeout(timeoutId);
                console.log('Auto-load failed:', error.message);
                resolve(false);
            });
    });
}

// Load DogInfo.xlsx data (keep trying this since it's helpful)
async function loadDogInfoData() {
    return new Promise((resolve) => {
        const timeoutId = setTimeout(() => {
            resolve(false);
        }, 1000);

        fetch('DogInfo.xlsx', { method: 'GET', cache: 'no-cache' })
        .then(response => {
            clearTimeout(timeoutId);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response.arrayBuffer();
        })
        .then(fileContent => {
            const workbook = XLSX.read(new Uint8Array(fileContent), { 
                cellStyles: true, cellFormulas: true, cellDates: true 
            });
            
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(sheet, {header: 1});
            
            let loadedCount = 0;
            jsonData.slice(1).forEach(row => {
                if (row && row[0]) {
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
            console.log('DogInfo not available:', error.message);
            resolve(false);
        });
    });
}

// Load Title Placement data
async function loadTitlePlacementData() {
    return new Promise((resolve) => {
        const timeoutId = setTimeout(() => resolve(false), 1000);

        fetch('Title Placement.xlsx', { method: 'GET', cache: 'no-cache' })
        .then(response => {
            clearTimeout(timeoutId);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response.arrayBuffer();
        })
        .then(fileContent => {
            const workbook = XLSX.read(new Uint8Array(fileContent), { 
                cellStyles: true, cellFormulas: true, cellDates: true 
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
            console.log('Title Placement not available:', error.message);
            resolve(false);
        });
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

// Update last updated date based on data
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

// Show file upload interface - make it prominent and user-friendly
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
                            style="background: #28a745; color: white; border: none; padding: 15px 30px; border-radius: 10px; cursor: pointer; font-size: 1.1rem; font-weight: bold; transition: all 0.3s ease;"
                            onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 16px rgba(40,167,69,0.3)'"
                            onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
                        🚀 Load Trialing Data
                    </button>
                </div>
            </div>
            
            <div style="background: #e7f3ff; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #b8daff;">
                <strong style="color: #004085;">Expected file:</strong> "Data for Tracker web.xlsx"<br>
                <span style="color: #004085;">The file should contain trialing records with columns for registration, dog name, date, level, results, judge, and points.</span>
            </div>
            
            <button onclick="attemptAutoLoad().then(success => { if (!success) showFileUpload(); })" 
                    style="background: #6c757d; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-size: 0.9rem; margin-top: 15px;">
                🔄 Try Auto-Loading Again
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

    // Show loading state
    document.getElementById('summaryContent').innerHTML = `
        <div style="text-align: center; padding: 60px;">
            <h3 style="color: #17a2b8;">📊 Processing Your Data...</h3>
            <div style="margin: 20px 0;">
                <div style="display: inline-block; width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #17a2b8; border-radius: 50%; animation: spin 1s linear infinite;"></div>
            </div>
            <p>Loading ${file.name}...</p>
        </div>
        <style>
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
    `;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            processExcelData(data);
            updateLastUpdatedDate();
            resetToDefaultView();
            
            // Show success message briefly
            document.getElementById('summaryContent').innerHTML = `
                <div style="text-align: center; padding: 40px; background: #d4edda; border-radius: 8px; margin: 20px 0; border: 1px solid #c3e6cb;">
                    <h3 style="color: #155724;">✅ Data Loaded Successfully!</h3>
                    <p style="color: #155724; font-size: 1.1rem;">Loaded ${trialingData.length} trialing records</p>
                    <p style="color: #155724;">You can now search for dogs or view owner data using the buttons above.</p>
                </div>
            `;
            
            // Switch to default view after 3 seconds
            setTimeout(() => {
                resetToDefaultView();
            }, 3000);
            
        } catch (error) {
            console.error('Error loading manual file:', error);
            document.getElementById('summaryContent').innerHTML = `
                <div style="text-align: center; padding: 40px; background: #f8d7da; border-radius: 8px; margin: 20px 0; border: 1px solid #f5c6cb;">
                    <h3 style="color: #721c24;">❌ Error Loading File</h3>
                    <p style="color: #721c24;">${error.message}</p>
                    <button onclick="showFileUpload()" style="background: #dc3545; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; margin-top: 15px;">
                        Try Again
                    </button>
                </div>
            `;
        }
    };
    
    reader.onerror = function() {
        document.getElementById('summaryContent').innerHTML = `
            <div style="text-align: center; padding: 40px; background: #f8d7da; border-radius: 8px; margin: 20px 0; border: 1px solid #f5c6cb;">
                <h3 style="color: #721c24;">❌ File Read Error</h3>
                <p style="color: #721c24;">Unable to read the selected file. Please try again.</p>
                <button onclick="showFileUpload()" style="background: #dc3545; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; margin-top: 15px;">
                    Try Again
                </button>
            </div>
        `;
    };
    
    reader.readAsArrayBuffer(file);
}
