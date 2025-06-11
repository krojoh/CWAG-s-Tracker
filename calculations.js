// Title Calculations and Validation Logic

// Calculate title points and determine when title was earned
function calculateTitlePoints(records) {
    // Sort records chronologically
    const sortedRecords = records
        .filter(r => r.points > 0 && r.date instanceof Date && !isNaN(r.date))
        .sort((a, b) => a.date - b.date);
    
    let cumulativePoints = 0;
    let judges = new Set();
    
    for (const record of sortedRecords) {
        const prevPoints = cumulativePoints;
        const prevJudgeCount = judges.size;
        
        cumulativePoints += record.points;
        if (record.judge) judges.add(record.judge);
        
        // Check if title requirements are NOW met (but weren't before)
        const nowHasTitle = cumulativePoints >= 4 && judges.size >= 2;
        const previouslyHadTitle = prevPoints >= 4 && prevJudgeCount >= 2;
        
        if (nowHasTitle && !previouslyHadTitle) {
            // Title was just earned with this record
            // Calculate how many points from this record went to earning the title
            let pointsTowardTitle = record.points;
            
            // If we already had 4+ points but needed another judge
            if (prevPoints >= 4 && prevJudgeCount < 2) {
                // Only 1 point goes to title (to satisfy the minimum), rest goes to ace
                pointsTowardTitle = 1;
            }
            // If we had 2+ judges but needed more points
            else if (prevJudgeCount >= 2 && prevPoints < 4) {
                // Only enough points to reach 4 go to title
                pointsTowardTitle = 4 - prevPoints;
            }
            // If we needed both conditions
            else if (prevPoints < 4 && prevJudgeCount < 2) {
                // Enough points to reach 4, or all the points if less than needed
                pointsTowardTitle = Math.min(record.points, 4 - prevPoints);
            }
            
            return {
                titlePoints: prevPoints + pointsTowardTitle,
                titleDate: record.date
            };
        }
    }
    
    // If we get here, either no title was earned, or all points go to title
    return {
        titlePoints: cumulativePoints,
        titleDate: sortedRecords[sortedRecords.length - 1]?.date
    };
}

// Find when ACE awards were earned
function findAceEarnedDates(records, titlePoints) {
    const sortedRecords = records
        .filter(r => r.points > 0 && r.date instanceof Date && !isNaN(r.date))
        .sort((a, b) => a.date - b.date);
    
    let cumulativePoints = 0;
    const aceEarnedDates = [];
    
    for (const record of sortedRecords) {
        const prevPoints = cumulativePoints;
        cumulativePoints += record.points;
        
        // Check for ace milestones after title was earned
        if (prevPoints >= titlePoints && cumulativePoints > titlePoints) {
            const prevAcePoints = prevPoints - titlePoints;
            const newAcePoints = cumulativePoints - titlePoints;
            
            const prevAceCount = Math.floor(prevAcePoints / 10);
            const newAceCount = Math.floor(newAcePoints / 10);
            
            // If ace count increased, record when each ace was earned
            for (let i = prevAceCount + 1; i <= newAceCount; i++) {
                aceEarnedDates.push({
                    aceNumber: i,
                    date: record.date
                });
            }
        }
    }
    
    return aceEarnedDates;
}

// Apply validation rules for prerequisites and games
function applyValidationRules(levelSummary) {
    const validatedLevels = {};
    
    // First, mark all levels without prerequisites as valid (but check Games separately)
    Object.keys(levelSummary).forEach(level => {
        if (!prerequisites[level] && !level.startsWith('Games ')) {
            validatedLevels[level] = true;
        }
    });

    // Handle Games levels specially - they need 2+ different games
    Object.keys(levelSummary).forEach(level => {
        if (level.startsWith('Games ')) {
            const summary = levelSummary[level];
            const uniqueGames = getUniqueGames(summary.records);
            const hasEnoughGames = uniqueGames.size >= 2;
            const hasBasicRequirements = summary.totalPoints >= 4 && summary.judges.size >= 2;
            validatedLevels[level] = hasEnoughGames && hasBasicRequirements;
        }
    });

    // Then validate levels with prerequisites
    Object.keys(prerequisites).forEach(level => {
        if (!levelSummary[level]) {
            validatedLevels[level] = false;
            return;
        }

        let meetsPrereqCriteria = false;

        if (level === "Investigator 3") {
            // Special case: requires either Patrol 1 OR Detective 2
            const patrol1Valid = checkLevelRequirements(levelSummary["Patrol 1"]);
            const detective2Valid = checkLevelRequirements(levelSummary["Detective 2"]);
            meetsPrereqCriteria = patrol1Valid || detective2Valid;
        } else {
            // Standard case: check direct prerequisite
            const prereqLevel = prerequisites[level][0];
            meetsPrereqCriteria = checkLevelRequirements(levelSummary[prereqLevel]);
        }

        validatedLevels[level] = meetsPrereqCriteria;
    });

    return validatedLevels;
}

// Process and summarize dog records
function processLevelSummary(records) {
    const levelSummary = {};
    
    // Group records by level
    records.forEach(record => {
        if (!record.level) return;
        
        if (!levelSummary[record.level]) {
            levelSummary[record.level] = {
                totalPoints: 0,
                judges: new Set(),
                records: []
            };
        }
        
        if (record.points > 0) {
            levelSummary[record.level].totalPoints += record.points;
            if (record.judge) {
                levelSummary[record.level].judges.add(record.judge);
            }
        }
        levelSummary[record.level].records.push(record);
    });

    return levelSummary;
}

// Calculate title status for a level
function calculateTitleStatus(summary, level, isValidated) {
    const judgeCount = summary.judges.size;
    const hasTitleRequirements = summary.totalPoints >= 4 && judgeCount >= 2 && isValidated;
    
    // For Games levels, also check if they have enough different games
    if (level.startsWith('Games ')) {
        const uniqueGames = getUniqueGames(summary.records);
        if (uniqueGames.size < 2) {
            return {
                hasTitleRequirements: false,
                titleStatus: 'No Title Yet',
                titleClass: 'no-title',
                titlePoints: 0,
                acePoints: 0,
                titleInfo: null
            };
        }
    }
    
    if (hasTitleRequirements) {
        // Find the point at which title was earned
        const titleInfo = calculateTitlePoints(summary.records);
        const titlePoints = titleInfo.titlePoints;
        const acePoints = Math.max(0, summary.totalPoints - titlePoints);
        
        const officialTitle = titleAbbreviations[level] || level;
        
        let titleStatus, titleClass;
        
        if (acePoints >= 10) {
            const aceCount = Math.floor(acePoints / 10);
            if (aceCount === 1) {
                titleStatus = `${officialTitle}A`;
            } else {
                titleStatus = `${officialTitle}Ax${aceCount}`;
            }
            titleClass = 'title-earned';
        } else {
            titleStatus = `${officialTitle} Title Earned`;
            titleClass = 'title-earned';
        }
        
        return {
            hasTitleRequirements: true,
            titleStatus,
            titleClass,
            titlePoints,
            acePoints,
            titleInfo
        };
    } else {
        return {
            hasTitleRequirements: false,
            titleStatus: 'No Title Yet',
            titleClass: 'no-title',
            titlePoints: 0,
            acePoints: 0,
            titleInfo: null
        };
    }
}

// Generate requirements text for levels that don't meet criteria
function generateRequirementsText(summary, level, isValidated) {
    const needMore = [];
    const judgeCount = summary.judges.size;
    
    if (summary.totalPoints < 4) {
        needMore.push(`${4 - summary.totalPoints} more points`);
    }
    
    if (judgeCount < 2) {
        needMore.push(`${2 - judgeCount} more judge${judgeCount === 0 ? 's' : ''}`);
    }
    
    if (level.startsWith('Games ')) {
        const uniqueGames = getUniqueGames(summary.records);
        if (uniqueGames.size < 2) {
            needMore.push(`${2 - uniqueGames.size} more different game${uniqueGames.size === 0 ? 's' : ''}`);
        }
    }
    
    let requirementsText = `<div><span>Need:</span> ${needMore.join(', ')}</div>`;
    
    if (!isValidated && !level.startsWith('Games ')) {
        requirementsText += `<div><span>Prerequisites:</span> ${getPrerequisiteText(level)}</div>`;
    }
    
    return requirementsText;
}

// Calculate ACE progression information
function calculateAceProgression(acePoints) {
    if (acePoints < 10 && acePoints >= 0) {
        return `<div class="ace-info"><span>Points until next Ace:</span> <strong>${10 - (acePoints % 10)}</strong></div>`;
    } else if (acePoints >= 10) {
        return `<div class="ace-info"><span>Points until next Ace:</span> <strong>${10 - (acePoints % 10)}</strong></div>`;
    }
    return '';
}