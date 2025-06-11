// Display Functions and Modal Management

// Display dog summary with all levels and title information
function displaySummary(records) {
    const regNumber = records[0].registrationNumber;
    
    // Get names - prioritize DogInfo.xlsx, fallback to trialing data
    const callName = getCallNameFromDogInfo(regNumber, records[0].callName) || 'Unknown';
    const handlerName = getHandlerNameFromDogInfo(regNumber);
    
    // Process level summary
    const levelSummary = processLevelSummary(records);

    // Apply validation rules
    const validatedLevels = applyValidationRules(levelSummary);

    // Generate dog info header
    let html = generateDogInfoHeader(callName, handlerName, regNumber, records.length);
    
    // Generate level summaries
    html += generateLevelSummaries(levelSummary, validatedLevels, regNumber);

    document.getElementById('summaryContent').innerHTML = html || showError('No level data to display');
}

// Generate dog information header
function generateDogInfoHeader(callName, handlerName, regNumber, recordCount) {
    return `
        <div class="dog-info">
            ${handlerName ? `<p class="handler-name"><strong>Handler:</strong> ${escapeHtml(handlerName)}</p>` : ''}
            <h3>${escapeHtml(callName)}</h3>
            <p><strong>Registration:</strong> ${escapeHtml(regNumber)}</p>
            <p><strong>Total Trialing Records:</strong> ${recordCount}</p>
        </div>
    `;
}

// Generate level summaries for all levels
function generateLevelSummaries(levelSummary, validatedLevels, regNumber) {
    let html = '';
    
    getSortedLevels(levelSummary).forEach(level => {
        const summary = levelSummary[level];
        const isValidated = validatedLevels[level];
        const judgeCount = summary.judges.size;
        
        // Calculate title status and information
        const titleData = calculateTitleStatus(summary, level, isValidated);
        
        // For Games levels, show games information
        let gamesInfo = '';
        if (level.startsWith('Games ')) {
            const uniqueGames = getUniqueGames(summary.records);
            gamesInfo = `<div><span>Different Games:</span> <strong>${uniqueGames.size}/2</strong> (${Array.from(uniqueGames).join(', ') || 'None'})</div>`;
        }
        
        // Generate certificate buttons
        const certificateButtons = generateCertificateButtons(titleData, level, regNumber);
        
        // Generate points breakdown
        const pointsBreakdown = generatePointsBreakdown(summary, titleData, judgeCount, gamesInfo, level, isValidated);
        
        html += `
            <div class="level-summary">
                <div class="level-info">
                    <h4>${escapeHtml(level)}</h4>
                    <div class="title-status ${titleData.titleClass}">${escapeHtml(titleData.titleStatus)}</div>
                    ${pointsBreakdown}
                </div>
                <div class="certificate-controls">
                    <button class="details-btn" onclick="showLevelDetails('${escapeJs(level)}', '${escapeJs(callName)}')">Details</button>
                    ${certificateButtons}
                </div>
            </div>
        `;
    });
    
    return html;
}

// Generate points breakdown section
function generatePointsBreakdown(summary, titleData, judgeCount, gamesInfo, level, isValidated) {
    let pointsBreakdown = `
        <div class="points-breakdown">
            <div><span>Total Points:</span> <strong>${summary.totalPoints}</strong></div>
            <div><span>Judges:</span> <strong>${judgeCount}/2</strong></div>
            ${gamesInfo}
    `;
    
    if (titleData.hasTitleRequirements) {
        pointsBreakdown += generateTitleAchievedInfo(titleData, summary.records);
    } else {
        pointsBreakdown += `<div style="color: #dc3545;">${generateRequirementsText(summary, level, isValidated)}</div>`;
    }
    
    pointsBreakdown += '</div>';
    return pointsBreakdown;
}

// Generate title achieved information
function generateTitleAchievedInfo(titleData, records) {
    const aceEarnedDates = findAceEarnedDates(records, titleData.titlePoints);
    
    let info = `
        <div><span>Points Towards Title:</span> <strong>${titleData.titlePoints}</strong></div>
        <div><span>Points Towards Ace:</span> <strong class="ace-info">${titleData.acePoints}</strong></div>
    `;
    
    if (titleData.titleInfo && titleData.titleInfo.titleDate) {
        const titleDate = formatDate(titleData.titleInfo.titleDate);
        info += `<div style="color: #28a745; font-size: 0.85rem;"><span>Title Earned:</span> <strong>${titleDate}</strong></div>`;
    }
    
    if (aceEarnedDates.length > 0) {
        const latestAce = aceEarnedDates[aceEarnedDates.length - 1];
        const aceDate = formatDate(latestAce.date);
        info += `<div style="color: #6f42c1; font-size: 0.85rem;"><span>Latest Ace Earned:</span> <strong>${aceDate}</strong></div>`;
    }
    
    info += calculateAceProgression(titleData.acePoints);
    
    return info;
}

// Generate certificate buttons
function generateCertificateButtons(titleData, level, regNumber) {
    if (!titleData.hasTitleRequirements) return '';
    
    const officialTitle = titleAbbreviations[level] || level;
    const escapedLevel = escapeJs(level);
    const escapedRegNumber = escapeJs(regNumber);
    const escapedOfficialTitle = escapeJs(officialTitle);
    
    let buttons = `
        <button class="certificate-btn" onclick="generateTitleCertificate('${escapedLevel}', '${escapedRegNumber}', '${escapedOfficialTitle}')">
            📜 Title Certificate
        </button>
    `;
    
    // Ace certificate button (if applicable)
    if (titleData.acePoints >= 10) {
        const aceCount = Math.floor(titleData.acePoints / 10);
        buttons += `
            <button class="certificate-btn" onclick="generateAceCertificate('${escapedLevel}', '${escapedRegNumber}', ${aceCount})">
                🏆 Ace Certificate
            </button>
        `;
    }
    
    return buttons;
}

// Show detailed records for a specific level
function showLevelDetails(level, dogName) {
    const records = currentDogRecords.filter(r => r.level === level);
    
    document.getElementById('modalTitle').textContent = `${dogName} - ${level} Details`;
    
    let html = `
        <table class="records-table">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Judge</th>
                    <th>Results</th>
                    <th>Points</th>
                </tr>
            </thead>
            <tbody>
    `;

    // Sort records by date
    records.sort((a, b) => {
        if (!a.date || !b.date) return 0;
        return new Date(a.date) - new Date(b.date);
    });

    records.forEach(record => {
        const date = formatDate(record.date);
        const pointsClass = record.points > 0 ? 'points-badge' : 'points-badge zero';
        
        html += `
            <tr>
                <td>${escapeHtml(date)}</td>
                <td>${escapeHtml(record.judge || 'N/A')}</td>
                <td>${escapeHtml(record.results || 'N/A')}</td>
                <td><span class="${pointsClass}">${record.points}</span></td>
            </tr>
        `;
    });

    html += '</tbody></table>';
    
    document.getElementById('modalBody').innerHTML = html;
    document.getElementById('detailsModal').style.display = 'block';
}

// Generate owner view header
function generateOwnerViewHeader(dogCount) {
    return `
        <div class="owner-header">
            <h3>${dogCount} dog(s) found</h3>
        </div>

        <div class="owner-controls">
            <button onclick="showOwnerView()" class="change-owner-btn">
                ← Change Owner ID
            </button>
            <button onclick="printOwnerView()" class="print-btn">
                🖨️ Print View
            </button>
        </div>
    `;
}

// Generate owner view legend
function generateOwnerViewLegend() {
    return `
        <div class="legend-print">
            <h4>Legend:</h4>
            <div>
                <div class="legend-item">
                    <span class="legend-badge legend-title"><strong>Title!</strong></span> - Title earned
                </div>
                <div class="legend-item">
                    <span class="legend-badge legend-ace"><strong>Ace2</strong></span> - Has earned Ace2
                </div>
                <div class="legend-item">
                    <span class="legend-badge legend-progress"><strong>3 → Ace</strong></span> - Needs 3 Q's for first Ace
                </div>
                <div class="legend-item">
                    <span class="legend-badge legend-progress"><strong>7 → Ace3</strong></span> - Needs 7 Q's for next Ace level
                </div>
                <div class="legend-item">
                    <span class="legend-badge legend-needs"><strong>3 Q's, 1 judge needed for title</strong></span> - Requirements to achieve Title
                </div>
                <div class="legend-item">
                    <span style="color: #666;"><strong>-</strong></span> - No entries at this level
                </div>
            </div>
        </div>
    `;
}

// Generate dog name header for owner view table
function generateDogNameHeader(dog) {
    const displayName = dog.callName.length > 6 ? dog.callName.substring(0, 6) : dog.callName;
    const escapedRegNumber = escapeJs(dog.regNumber);
    const handlerInfo = dog.handlerName ? `<br><small class="dog-handler-info">${escapeHtml(dog.handlerName)}</small>` : '';
    
    return `
        <th style="padding: 8px 4px; text-align: center; border-bottom: 2px solid #dee2e6; font-weight: 600; width: ${75/dogsData.length}%;">
            <a href="javascript:void(0)" onclick="searchSpecificDog('${escapedRegNumber}')" 
               class="dog-name-link">
                ${escapeHtml(displayName)}
            </a>
            ${handlerInfo}
            <br>
            <small class="dog-reg-info">${escapeHtml(dog.regNumber)}</small>
        </th>
    `;
}

// Generate status cell for owner view table
function generateStatusCell(levelData) {
    if (!levelData) {
        return {
            content: '-',
            style: 'padding: 10px 8px; text-align: center; border-right: 1px solid #f0f0f0; font-size: 0.75rem;'
        };
    }

    const totalPoints = levelData.totalPoints;
    const judgeCount = levelData.judges.size;
    const hasTitle = totalPoints >= 4 && judgeCount >= 2;

    let cellContent, cellStyle = 'padding: 10px 8px; text-align: center; border-right: 1px solid #f0f0f0; font-size: 0.75rem;';

    if (hasTitle) {
        const titleInfo = calculateTitlePoints(levelData.records);
        const titlePoints = titleInfo.titlePoints;
        const acePoints = Math.max(0, totalPoints - titlePoints);
        
        if (acePoints >= 10) {
            const aceCount = Math.floor(acePoints / 10);
            const pointsToNextAce = 10 - (acePoints % 10);
            const nextAceNumber = aceCount + 1;
            
            if (pointsToNextAce === 10) {
                // Exactly on an ACE milestone
                cellContent = `<strong style="color: #6f42c1;">Ace${aceCount}</strong>`;
            } else {
                // Show Q's needed to next ACE
                cellContent = `<strong style="color: #6f42c1;">${pointsToNextAce} → Ace${nextAceNumber}</strong>`;
            }
            cellStyle += ' background: linear-gradient(135deg, #e8f5e8, #d4edda);';
        } else {
            // Has title but less than 10 ace points
            const pointsToFirstAce = 10 - acePoints;
            if (acePoints === 0) {
                cellContent = `<strong style="color: #155724;">Title!</strong>`;
            } else {
                cellContent = `<strong style="color: #155724;">${pointsToFirstAce} → Ace</strong>`;
            }
            cellStyle += ' background: #d4edda;';
        }
    } else if (totalPoints > 0) {
        const needMore = [];
        if (totalPoints < 4) needMore.push(`${4 - totalPoints} Q's`);
        if (judgeCount < 2) needMore.push(`${2 - judgeCount} judge${judgeCount === 0 ? 's' : ''} needed for title`);
        
        cellContent = `<span style="color: #856404;">${needMore.join(', ')}</span>`;
        cellStyle += ' background: #fff3cd;';
    } else {
        cellContent = '-';
    }

    return { content: cellContent, style: cellStyle };
}

// Print owner view
function printOwnerView() {
    window.print();
}