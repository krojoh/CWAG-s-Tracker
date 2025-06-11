// Certificate Generation Functions

// Generate title certificate
async function generateTitleCertificate(level, regNumber, abbreviation) {
    try {
        const btn = event.target;
        btn.textContent = 'Generating...';
        btn.disabled = true;

        const templateInfo = certificateTemplateMapping[level];
        if (!templateInfo) throw new Error(`No template mapped for level: ${level}`);

        const levelRecords = trialingData.filter(r => r.registrationNumber === regNumber && r.level === level);
        if (levelRecords.length === 0) throw new Error('No records found for this level');

        const titleInfo = calculateTitlePoints(levelRecords);
        const dateEarned = titleInfo.titleDate ? titleInfo.titleDate.toLocaleDateString() : new Date().toLocaleDateString();
        const certificateName = getCertificateName(level);

        // Get names from DogInfo.xlsx
        const handlerName = getHandlerNameFromDogInfo(regNumber) || 'Handler Name';
        const registeredName = getRegisteredNameFromDogInfo(regNumber) || 'Dog Name';

        const templateUrl = `${appConfig.templateBaseUrl}${templateInfo.template}`;
        const response = await fetchWithTimeout(templateUrl, 10000);
        if (!response.ok) throw new Error(`Template not found: ${templateUrl}`);
        
        const templateBytes = await response.arrayBuffer();
        const pdfDoc = await PDFLib.PDFDocument.load(templateBytes);
        const firstPage = pdfDoc.getPages()[0];
        
        const font = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
        const timesBold = await pdfDoc.embedFont(PDFLib.StandardFonts.TimesRomanBold);
        let maiandraFont = timesBold;

        // Try to load custom font
        maiandraFont = await loadCustomFont(pdfDoc, maiandraFont);

        // Add text to certificate
        addTitleCertificateText(firstPage, {
            regNumber,
            handlerName,
            registeredName,
            dateEarned,
            certificateName,
            abbreviation
        }, { font, timesBold, maiandraFont });

        const pdfBytes = await pdfDoc.save();
        
        downloadPDF(pdfBytes, `${registeredName}-${level.replace(/\s+/g, '-')}-Title-Certificate.pdf`);
        btn.textContent = '📜 Title Certificate';
        btn.disabled = false;

    } catch (error) {
        console.error('Certificate generation error:', error);
        alert(`Unable to generate certificate: ${error.message}`);
        
        const btn = event.target;
        btn.textContent = '📜 Title Certificate';
        btn.disabled = false;
    }
}

// Generate ACE certificate
async function generateAceCertificate(level, regNumber, aceCount) {
    try {
        const btn = event.target;
        btn.textContent = 'Generating...';
        btn.disabled = true;

        const levelRecords = trialingData.filter(r => r.registrationNumber === regNumber && r.level === level);
        if (levelRecords.length === 0) throw new Error('No records found for this level');

        const titleInfo = calculateTitlePoints(levelRecords);
        const dateEarned = titleInfo.titleDate ? titleInfo.titleDate.toLocaleDateString() : new Date().toLocaleDateString();
        const aceCertificateName = getAceCertificateName(level, aceCount);

        // Get names from DogInfo.xlsx
        const handlerName = getHandlerNameFromDogInfo(regNumber) || 'Handler Name';
        const registeredName = getRegisteredNameFromDogInfo(regNumber) || 'Dog Name';

        // ACE certificates use dedicated Ace.pdf template
        const templateUrl = `${appConfig.templateBaseUrl}Ace.pdf`;
        const response = await fetchWithTimeout(templateUrl, 10000);
        if (!response.ok) throw new Error(`ACE template not found: ${templateUrl}`);
        
        const templateBytes = await response.arrayBuffer();
        const pdfDoc = await PDFLib.PDFDocument.load(templateBytes);
        const firstPage = pdfDoc.getPages()[0];
        
        const helvetica = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
        const timesBold = await pdfDoc.embedFont(PDFLib.StandardFonts.TimesRomanBold);
        let maiandraFont = timesBold;

        // Try to load custom font
        maiandraFont = await loadCustomFont(pdfDoc, maiandraFont);

        // Add text to ACE certificate
        addAceCertificateText(firstPage, {
            dateEarned,
            registeredName,
            handlerName,
            regNumber,
            aceCertificateName
        }, { helvetica, maiandraFont });

        const pdfBytes = await pdfDoc.save();
        downloadPDF(pdfBytes, `${registeredName}-${level.replace(/\s+/g, '-')}-ACE-Certificate.pdf`);

        btn.textContent = '🏆 Ace Certificate';
        btn.disabled = false;

    } catch (error) {
        console.error('ACE certificate generation error:', error);
        alert(`Unable to generate ACE certificate: ${error.message}`);
        
        const btn = event.target;
        btn.textContent = '🏆 Ace Certificate';
        btn.disabled = false;
    }
}

// Load custom font with fallback
async function loadCustomFont(pdfDoc, fallbackFont) {
    if (typeof fontkit === 'undefined') return fallbackFont;
    
    try {
        pdfDoc.registerFontkit(fontkit);
        
        for (const fontUrl of appConfig.fontUrls) {
            try {
                const fontResponse = await fetch(fontUrl, { mode: 'cors' });
                if (fontResponse.ok) {
                    const fontBytes = await fontResponse.arrayBuffer();
                    return await pdfDoc.embedFont(fontBytes);
                }
            } catch (e) {
                console.warn(`Failed to load font from ${fontUrl}:`, e.message);
            }
        }
    } catch (e) {
        console.warn('Font loading failed, using fallback:', e.message);
    }
    
    return fallbackFont;
}

// Add text to title certificate
function addTitleCertificateText(page, data, fonts) {
    const { regNumber, handlerName, registeredName, dateEarned, certificateName, abbreviation } = data;
    const { font, timesBold, maiandraFont } = fonts;

    // Registration number
    const regConfig = titleCertificateConfig.registrationNumber;
    page.drawText(regNumber, {
        x: regConfig.x, y: regConfig.y, size: regConfig.size, font: font,
        color: PDFLib.rgb(regConfig.color[0], regConfig.color[1], regConfig.color[2])
    });

    // Handler name (centered)
    const handlerConfig = titleCertificateConfig.handlerName;
    const handlerTextWidth = maiandraFont.widthOfTextAtSize(handlerName, handlerConfig.size);
    const handlerX = handlerConfig.x - (handlerTextWidth / 2);
    page.drawText(handlerName, {
        x: handlerX, y: handlerConfig.y, size: handlerConfig.size, font: maiandraFont,
        color: PDFLib.rgb(0, 0, 0)
    });

    // Dog name (centered)
    const dogConfig = titleCertificateConfig.dogName;
    const dogTextWidth = maiandraFont.widthOfTextAtSize(registeredName, dogConfig.size);
    const dogX = dogConfig.x - (dogTextWidth / 2);
    page.drawText(registeredName, {
        x: dogX, y: dogConfig.y, size: dogConfig.size, font: maiandraFont,
        color: PDFLib.rgb(0, 0, 0)
    });

    // Date earned with text
    const dateConfig = titleCertificateConfig.dateEarned;
    page.drawText('On ', {
        x: dateConfig.x - 20, y: dateConfig.y, size: dateConfig.size, font: font,
        color: PDFLib.rgb(0, 0, 0)
    });
    page.drawText(dateEarned, {
        x: dateConfig.x, y: dateConfig.y, size: dateConfig.size, font: font,
        color: PDFLib.rgb(0, 0, 0)
    });
    const dateWidth = font.widthOfTextAtSize(dateEarned, dateConfig.size);
    page.drawText(', has completed the requirements for the title of', {
        x: dateConfig.x + dateWidth, y: dateConfig.y, size: dateConfig.size, font: font,
        color: PDFLib.rgb(0, 0, 0)
    });

    // Title abbreviation (right aligned)
    const titleConfig = titleCertificateConfig.titleAbbreviation;
    const titleText = `${certificateName} (${abbreviation})`;
    const titleTextWidth = timesBold.widthOfTextAtSize(titleText, titleConfig.size);
    page.drawText(titleText, {
        x: titleConfig.x - titleTextWidth, y: titleConfig.y, size: titleConfig.size, font: maiandraFont,
        color: PDFLib.rgb(titleConfig.color[0], titleConfig.color[1], titleConfig.color[2])
    });
}

// Add text to ACE certificate
function addAceCertificateText(page, data, fonts) {
    const { dateEarned, registeredName, handlerName, regNumber, aceCertificateName } = data;
    const { helvetica, maiandraFont } = fonts;

    // Helper function for text alignment
    function drawTextWithAlignment(page, text, config, font) {
        let x = config.x;
        if (config.align === 'center') {
            const textWidth = font.widthOfTextAtSize(text, config.size);
            x = config.x - (textWidth / 2);
        } else if (config.align === 'right') {
            const textWidth = font.widthOfTextAtSize(text, config.size);
            x = config.x - textWidth;
        }
        page.drawText(text, {
            x: x, y: config.y, size: config.size, font: font,
            color: PDFLib.rgb(config.color[0], config.color[1], config.color[2])
        });
    }

    // Add text to ACE certificate
    const dateLineText = `This certifies that on ${dateEarned} the requirements have been met for the title of:`;
    drawTextWithAlignment(page, dateLineText, aceCertificateConfig.dateLine, helvetica);

    drawTextWithAlignment(page, aceCertificateName, aceCertificateConfig.levelAbbreviation, maiandraFont);
    drawTextWithAlignment(page, registeredName, aceCertificateConfig.callName, maiandraFont);
    drawTextWithAlignment(page, handlerName, aceCertificateConfig.handlerName, maiandraFont);
    drawTextWithAlignment(page, regNumber, aceCertificateConfig.registrationNumber, helvetica);
}

// Batch certificate generation for multiple dogs/levels
async function generateBatchCertificates(certificateRequests) {
    const results = [];
    
    for (const request of certificateRequests) {
        try {
            if (request.type === 'title') {
                await generateTitleCertificate(request.level, request.regNumber, request.abbreviation);
            } else if (request.type === 'ace') {
                await generateAceCertificate(request.level, request.regNumber, request.aceCount);
            }
            results.push({ ...request, status: 'success' });
        } catch (error) {
            results.push({ ...request, status: 'error', error: error.message });
        }
        
        // Add a small delay between generations to prevent overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    return results;
}

// Generate all available certificates for a dog
async function generateAllCertificatesForDog(regNumber) {
    if (!currentDogRecords || currentDogRecords.length === 0) {
        alert('No dog records available. Please search for a dog first.');
        return;
    }

    const levelSummary = processLevelSummary(currentDogRecords);
    const validatedLevels = applyValidationRules(levelSummary);
    const certificateRequests = [];

    // Find all levels eligible for certificates
    Object.keys(levelSummary).forEach(level => {
        const summary = levelSummary[level];
        const isValidated = validatedLevels[level];
        const hasTitleRequirements = summary.totalPoints >= 4 && summary.judges.size >= 2 && isValidated;

        if (hasTitleRequirements) {
            const officialTitle = titleAbbreviations[level] || level;
            
            // Add title certificate request
            certificateRequests.push({
                type: 'title',
                level: level,
                regNumber: regNumber,
                abbreviation: officialTitle
            });

            // Check for ACE certificates
            const titleInfo = calculateTitlePoints(summary.records);
            const acePoints = Math.max(0, summary.totalPoints - titleInfo.titlePoints);
            
            if (acePoints >= 10) {
                const aceCount = Math.floor(acePoints / 10);
                certificateRequests.push({
                    type: 'ace',
                    level: level,
                    regNumber: regNumber,
                    aceCount: aceCount
                });
            }
        }
    });

    if (certificateRequests.length === 0) {
        alert('No certificates available for this dog.');
        return;
    }

    const confirmMessage = `Generate ${certificateRequests.length} certificate(s) for this dog?`;
    if (!confirm(confirmMessage)) return;

    try {
        const results = await generateBatchCertificates(certificateRequests);
        const successCount = results.filter(r => r.status === 'success').length;
        const errorCount = results.filter(r => r.status === 'error').length;
        
        let message = `Generated ${successCount} certificate(s) successfully.`;
        if (errorCount > 0) {
            message += ` ${errorCount} certificate(s) failed to generate.`;
        }
        
        alert(message);
    } catch (error) {
        console.error('Batch certificate generation error:', error);
        alert('Error generating certificates. Please try again.');
    }
}

// Validate certificate data before generation
function validateCertificateData(level, regNumber) {
    const errors = [];

    if (!level) errors.push('Level is required');
    if (!regNumber) errors.push('Registration number is required');
    
    const levelRecords = trialingData.filter(r => r.registrationNumber === regNumber && r.level === level);
    if (levelRecords.length === 0) errors.push('No records found for this level');

    const templateInfo = certificateTemplateMapping[level];
    if (!templateInfo) errors.push(`No template mapped for level: ${level}`);

    const handlerName = getHandlerNameFromDogInfo(regNumber);
    if (!handlerName) errors.push('Handler name not found in dog info data');

    const registeredName = getRegisteredNameFromDogInfo(regNumber);
    if (!registeredName) errors.push('Dog name not found in dog info data');

    return errors;
}

// Preview certificate data (for debugging/validation)
function previewCertificateData(level, regNumber, type = 'title') {
    const errors = validateCertificateData(level, regNumber);
    if (errors.length > 0) {
        console.error('Certificate validation errors:', errors);
        return null;
    }

    const levelRecords = trialingData.filter(r => r.registrationNumber === regNumber && r.level === level);
    const titleInfo = calculateTitlePoints(levelRecords);
    const handlerName = getHandlerNameFromDogInfo(regNumber) || 'Handler Name';
    const registeredName = getRegisteredNameFromDogInfo(regNumber) || 'Dog Name';
    const dateEarned = titleInfo.titleDate ? titleInfo.titleDate.toLocaleDateString() : new Date().toLocaleDateString();

    const preview = {
        level,
        regNumber,
        handlerName,
        registeredName,
        dateEarned,
        titleInfo
    };

    if (type === 'title') {
        preview.certificateName = getCertificateName(level);
        preview.abbreviation = titleAbbreviations[level] || level;
    } else if (type === 'ace') {
        const acePoints = Math.max(0, levelRecords.reduce((sum, r) => sum + r.points, 0) - titleInfo.titlePoints);
        const aceCount = Math.floor(acePoints / 10);
        preview.aceCount = aceCount;
        preview.aceCertificateName = getAceCertificateName(level, aceCount);
    }

    return preview;
}