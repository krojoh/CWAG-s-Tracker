// Owner View Functionality

// Show owner view input form
function showOwnerView() {
    if (trialingData.length === 0) {
        alert('Please wait for trialing data to load');
        return;
    }

    document.getElementById('summaryContent').innerHTML = `
        <div class="owner-view-form">
            <h3>👤 Owner View</h3>
            <p>Enter the middle 4 digits from your registration number:</p>
            
            <div class="owner-id-input-area">
                <input type="text" id="ownerIdInput" placeholder="e.g., 1734" 
                       class="owner-id-input"
                       onkeypress="handleOwnerKeyPress(event)" maxlength="4">
                <br>
                <button onclick="loadOwnerView()" class="load-owner-btn">
                    📊 Load Owner View
                </button>
            </div>
            
            <button onclick="backToSearch()" class="back-btn">
                ← Back to Search
            </button>
        </div>
    `;
}

// Load and display owner view
function loadOwnerView() {
    const ownerIdInput = document.getElementById('ownerIdInput');
    if (!ownerIdInput) {
        console.error('Owner ID input not found');
        return;
    }
    
    const ownerId = ownerIdInput.value.trim();
    
    // Validate input
    const validation = validateOwnerIdInput(ownerId);
    if (!validation.valid) {
        alert(validation.message);
        return;
    }

    // Find dogs by owner ID
    const searchResult = findDogsByOwnerId(ownerId);
    
    if (!searchResult.success) {
        document.getElementById('summaryContent').innerHTML = `
            ${showError(searchResult.message)}
            <div style="text-align: center; margin-top: 20px;">
                <button onclick="showOwnerView()" class="back-btn">
                    ← Try Again
                </button>
            </div>
        `;
        return;
    }

    // Process dogs data for display
    const dogsData = processDogsForOwnerView(searchResult.dogs, searchResult.registrations);
    
    // Generate and display owner view table
    const ownerViewHTML = generateOwnerViewTable(dogsData, searchResult.count);
    document.getElementById('summaryContent').innerHTML = ownerViewHTML;
}

// Generate complete owner view table
function generateOwnerViewTable(dogsData, dogCount) {
    let html = generateOwnerViewHeader(dogCount);
    html += generateOwnerViewLegend();
    html += generateOwnerTableStructure(dogsData);
    html += generateBackToSearchButton();
    
    return html;
}

// Generate the main owner view table structure
function generateOwnerTableStructure(dogsData) {
    let html = `
        <div class="table-container">
            <table class="owner-view-table">
                <thead>
                    <tr style="background: #f8f9fa;">
                        <th style="padding: 12px 8px; text-align: left; border-bottom: 2px solid #dee2e6; font-weight: 600; position: sticky; left: 0; background: #f8f9fa; z-index: 10;">Level</th>
    `;

    // Add dog name headers
    dogsData.forEach(dog => {
        html += generateDogNameHeader(dog);
    });

    html += `
                    </tr>
                </thead>
                <tbody>
    `;

    // Add rows for each level
    levelOrder.forEach(level => {
        html += generateOwnerTableRow(level, dogsData);
    });

    html += `
                </tbody>
            </table>
        </div>
    `;

    return html;
}

// Generate a single row in the owner view table
function generateOwnerTableRow(level, dogsData) {
    let html = `
        <tr style="border-bottom: 1px solid #f0f0f0;">
            <td style="padding: 8px 4px; border-right: 1px solid #dee2e6; font-weight: 600; background: #f8f9fa; font-size: 0.8rem;">${escapeHtml(level)}</td>
    `;

    dogsData.forEach(dog => {
        const levelData = dog.levelSummary[level];
        const statusCell = generateStatusCell(levelData);
        html += `<td style="${statusCell.style}">${statusCell.content}</td>`;
    });

    html += '</tr>';
    return html;
}

// Generate back to search button
function generateBackToSearchButton() {
    return `
        <div style="text-align: center; margin-top: 30px;">
            <button onclick="backToSearch()" style="background: #17a2b8; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 1rem;">
                Back to Dog Search
            </button>
        </div>
    `;
}

// Calculate status for owner view cell (optimized version)
function calculateOwnerViewStatus(levelData) {
    if (!levelData) return null;
    
    const totalPoints = levelData.totalPoints;
    const judgeCount = levelData.judges.size;
    
    if (totalPoints < 4 || judgeCount < 2) {
        return {
            type: 'needs_requirements',
            totalPoints,
            judgeCount,
            needsTitle: true
        };
    }
    
    // Has title - calculate ace status
    const titleInfo = calculateTitlePoints(levelData.records);
    const acePoints = Math.max(0, totalPoints - titleInfo.titlePoints);
    
    if (acePoints >= 10) {
        const aceCount = Math.floor(acePoints / 10);
        const pointsToNextAce = 10 - (acePoints % 10);
        
        return {
            type: 'ace_progress',
            aceCount,
            pointsToNextAce: pointsToNextAce === 10 ? 0 : pointsToNextAce,
            hasTitle: true
        };
    } else {
        return {
            type: 'title_earned',
            acePoints,
            pointsToFirstAce: 10 - acePoints,
            hasTitle: true
        };
    }
}

// Generate owner view summary statistics
function generateOwnerViewStats(dogsData) {
    const stats = {
        totalDogs: dogsData.length,
        totalTitles: 0,
        totalAces: 0,
        levelsWithEntries: new Set(),
        mostActiveLevel: null
    };
    
    const levelCounts = {};
    
    dogsData.forEach(dog => {
        Object.keys(dog.levelSummary).forEach(level => {
            stats.levelsWithEntries.add(level);
            levelCounts[level] = (levelCounts[level] || 0) + 1;
            
            const summary = dog.levelSummary[level];
            if (summary.totalPoints >= 4 && summary.judges.size >= 2) {
                stats.totalTitles++;
                
                const titleInfo = calculateTitlePoints(summary.records);
                const acePoints = Math.max(0, summary.totalPoints - titleInfo.titlePoints);
                stats.totalAces += Math.floor(acePoints / 10);
            }
        });
    });
    
    // Find most active level
    let maxCount = 0;
    Object.entries(levelCounts).forEach(([level, count]) => {
        if (count > maxCount) {
            maxCount = count;
            stats.mostActiveLevel = level;
        }
    });
    
    return stats;
}

// Export owner view data (could be expanded for CSV/Excel export)
function exportOwnerViewData(dogsData) {
    const exportData = [];
    
    // Header row
    const headers = ['Level', ...dogsData.map(dog => `${dog.callName} (${dog.regNumber})`)];
    exportData.push(headers);
    
    // Data rows
    levelOrder.forEach(level => {
        const row = [level];
        dogsData.forEach(dog => {
            const levelData = dog.levelSummary[level];
            if (levelData) {
                const status = calculateOwnerViewStatus(levelData);
                if (status) {
                    switch (status.type) {
                        case 'title_earned':
                            row.push(status.acePoints === 0 ? 'Title' : `${status.pointsToFirstAce} → Ace`);
                            break;
                        case 'ace_progress':
                            if (status.pointsToNextAce === 0) {
                                row.push(`Ace${status.aceCount}`);
                            } else {
                                row.push(`${status.pointsToNextAce} → Ace${status.aceCount + 1}`);
                            }
                            break;
                        case 'needs_requirements':
                            const needs = [];
                            if (status.totalPoints < 4) needs.push(`${4 - status.totalPoints} Q's`);
                            if (status.judgeCount < 2) needs.push(`${2 - status.judgeCount} judge${status.judgeCount === 0 ? 's' : ''}`);
                            row.push(needs.join(', '));
                            break;
                    }
                } else {
                    row.push('No title');
                }
            } else {
                row.push('-');
            }
        });
        exportData.push(row);
    });
    
    return exportData;
}
