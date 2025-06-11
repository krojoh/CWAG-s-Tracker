// Search and Dog Lookup Functionality

// Main dog search function
function searchDog() {
    const searchInput = document.getElementById('searchInput').value.trim();
    if (!searchInput) {
        alert('Please enter a registration number');
        return;
    }

    if (trialingData.length === 0) {
        alert('Please wait for trialing data to load');
        return;
    }

    // Format the search input
    const formattedSearch = formatRegistrationNumber(searchInput);
    
    // Find exact matching records only
    const dogRecords = trialingData.filter(record => 
        record.registrationNumber && 
        record.registrationNumber.toLowerCase() === formattedSearch.toLowerCase()
    );

    if (dogRecords.length === 0) {
        showSearchSuggestions(formattedSearch);
        return;
    }

    // Store records globally for modal access
    currentDogRecords = dogRecords;
    displaySummary(dogRecords);
}

// Show search suggestions for partial matches
function showSearchSuggestions(formattedSearch) {
    // If no exact match, show suggestion with partial matches
    const partialMatches = trialingData.filter(record =>
        record.registrationNumber && 
        record.registrationNumber.toLowerCase().includes(formattedSearch.toLowerCase())
    ).slice(0, 5); // Limit to 5 suggestions

    let errorMessage = `No dog found with registration number: <strong>${formattedSearch}</strong>`;
    
    if (partialMatches.length > 0) {
        errorMessage += '<br><br><strong>Did you mean:</strong><ul style="text-align: left; margin: 10px 0;">';
        partialMatches.forEach(match => {
            const escapedRegNumber = escapeHtml(match.registrationNumber);
            const escapedCallName = escapeHtml(match.callName || 'Unknown');
            errorMessage += `<li><a href="#" onclick="searchSpecific('${escapeJs(match.registrationNumber)}')" style="color: #007bff; text-decoration: underline;">${escapedRegNumber} (${escapedCallName})</a></li>`;
        });
        errorMessage += '</ul>';
    }

    document.getElementById('summaryContent').innerHTML = showError(errorMessage);
}

// Search for a specific registration number (from suggestions)
function searchSpecific(regNumber) {
    document.getElementById('searchInput').value = regNumber;
    searchDog();
}

// Search for specific dog from owner view
function searchSpecificDog(regNumber) {
    document.getElementById('searchInput').value = regNumber;
    searchDog();
}

// Find all dogs matching owner ID
function findDogsByOwnerId(ownerId) {
    // Find all dogs with matching middle 4 digits
    const matchingDogs = trialingData.filter(record => {
        if (!record.registrationNumber) return false;
        const regParts = record.registrationNumber.split('-');
        return regParts.length >= 2 && regParts[1] === ownerId;
    });

    if (matchingDogs.length === 0) {
        return { success: false, dogs: [], message: `No dogs found with owner ID: <strong>${ownerId}</strong>` };
    }

    // Group by unique registration numbers
    const dogsByReg = {};
    matchingDogs.forEach(record => {
        if (!dogsByReg[record.registrationNumber]) {
            dogsByReg[record.registrationNumber] = [];
        }
        dogsByReg[record.registrationNumber].push(record);
    });

    const dogRegistrations = Object.keys(dogsByReg);
    const dogCount = dogRegistrations.length;

    return { 
        success: true, 
        dogs: dogsByReg, 
        registrations: dogRegistrations,
        count: dogCount 
    };
}

// Process dogs data for owner view
function processDogsForOwnerView(dogsByReg, dogRegistrations) {
    return dogRegistrations.map(regNumber => {
        const dogRecords = dogsByReg[regNumber];
        
        // Get names - prioritize DogInfo.xlsx, fallback to trialing data
        const callName = getCallNameFromDogInfo(regNumber, dogRecords[0].callName) || 'Unknown';
        const handlerName = getHandlerNameFromDogInfo(regNumber);

        // Calculate level summaries
        const levelSummary = processLevelSummary(dogRecords);

        return {
            regNumber,
            callName,
            handlerName,
            levelSummary
        };
    });
}

// Find dogs by partial registration number match
function findDogsByPartialMatch(searchTerm, limit = 10) {
    const matches = trialingData
        .filter(record => 
            record.registrationNumber && 
            record.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .reduce((unique, record) => {
            // Remove duplicates by registration number
            if (!unique.find(r => r.registrationNumber === record.registrationNumber)) {
                unique.push(record);
            }
            return unique;
        }, [])
        .slice(0, limit);

    return matches;
}

// Advanced search functionality (could be expanded)
function advancedSearch(criteria) {
    let results = trialingData;

    // Filter by registration number
    if (criteria.registrationNumber) {
        const regNumber = formatRegistrationNumber(criteria.registrationNumber);
        results = results.filter(record => 
            record.registrationNumber && 
            record.registrationNumber.toLowerCase().includes(regNumber.toLowerCase())
        );
    }

    // Filter by call name
    if (criteria.callName) {
        results = results.filter(record => 
            record.callName && 
            record.callName.toLowerCase().includes(criteria.callName.toLowerCase())
        );
    }

    // Filter by handler name (from DogInfo if available)
    if (criteria.handlerName) {
        results = results.filter(record => {
            const handlerName = getHandlerNameFromDogInfo(record.registrationNumber) || '';
            return handlerName.toLowerCase().includes(criteria.handlerName.toLowerCase());
        });
    }

    // Filter by level
    if (criteria.level) {
        results = results.filter(record => 
            record.level && 
            record.level.toLowerCase().includes(criteria.level.toLowerCase())
        );
    }

    // Filter by date range
    if (criteria.startDate) {
        const startDate = new Date(criteria.startDate);
        results = results.filter(record => 
            record.date && record.date >= startDate
        );
    }

    if (criteria.endDate) {
        const endDate = new Date(criteria.endDate);
        results = results.filter(record => 
            record.date && record.date <= endDate
        );
    }

    // Filter by judge
    if (criteria.judge) {
        results = results.filter(record => 
            record.judge && 
            record.judge.toLowerCase().includes(criteria.judge.toLowerCase())
        );
    }

    // Filter by minimum points
    if (criteria.minPoints !== undefined) {
        results = results.filter(record => 
            record.points >= criteria.minPoints
        );
    }

    return results;
}

// Get all unique values for search filters
function getSearchFilterOptions() {
    const levels = [...new Set(trialingData.map(r => r.level).filter(Boolean))].sort();
    const judges = [...new Set(trialingData.map(r => r.judge).filter(Boolean))].sort();
    const callNames = [...new Set(trialingData.map(r => r.callName).filter(Boolean))].sort();
    
    // Get handler names from DogInfo
    const handlerNames = [...new Set(
        Object.values(dogInfoData)
            .map(info => info.handlerName)
            .filter(Boolean)
    )].sort();

    return {
        levels,
        judges,
        callNames,
        handlerNames
    };
}
