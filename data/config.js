// Configuration and Data Mappings

// Level prerequisites mapping
const prerequisites = {
    "Investigator 3": ["Patrol 1", "Detective 2"],  // Special case - either/or
    "Super Sleuth 4": ["Investigator 3"],
    "Private Inv": ["Super Sleuth 4"],
    "Det Diversions": ["Super Sleuth 4"],
    "Ranger 2": ["Ranger 1"],
    "Ranger 3": ["Ranger 2"],
    "Ranger 4": ["Ranger 3"],
    "Ranger 5": ["Ranger 4"],
    "Dasher 4": ["Dasher 3"],
    "Dasher 5": ["Dasher 4"],
    "Dasher 6": ["Dasher 5"],
    "Obedience 4": ["Obedience 3"],
    "Obedience 5": ["Obedience 4"]
};

// Official title abbreviations
const titleAbbreviations = {
    "Patrol 1": "CW-SP",
    "Detective 2": "CW-SD",
    "Investigator 3": "CW-SI",
    "Super Sleuth 4": "CW-SS",
    "Private Inv": "CW-SPI",
    "Det Diversions": "CW-SDD",
    "Ranger 1": "CW-ScR1",
    "Ranger 2": "CW-ScR2",
    "Ranger 3": "CW-ScR3",
    "Ranger 4": "CW-ScR4",
    "Ranger 5": "CW-ScR5",
    "Dasher 3": "CW-SD3",
    "Dasher 4": "CW-SD4",
    "Dasher 5": "CW-SD5",
    "Dasher 6": "CW-SD6",
    "Obedience 1": "CW-Ob1",
    "Obedience 2": "CW-Ob2",
    "Obedience 3": "CW-Ob3",
    "Obedience 4": "CW-Ob4",
    "Obedience 5": "CW-Ob5",
    "Starter": "CW-SR",
    "Advanced": "CW-AR",
    "Pro": "CW-PR",
    "ARF": "CW-ARF",
    "Zoom 1": "CW-ZR1",
    "Zoom 1.5": "CW-ZR1.5",
    "Zoom 2": "CW-ZR2",
    "Games 1": "CW-G1",
    "Games 2": "CW-G2",
    "Games 3": "CW-G3",
    "Games 4": "CW-G4"
};

// Certificate template mapping
const certificateTemplateMapping = {
    'Patrol 1': { template: 'Scent.pdf', category: 'scent' },
    'Detective 2': { template: 'Scent.pdf', category: 'scent' },
    'Investigator 3': { template: 'Scent.pdf', category: 'scent' },
    'Super Sleuth 4': { template: 'Scent.pdf', category: 'scent' },
    'Private Inv': { template: 'Scent.pdf', category: 'scent' },
    'Det Diversions': { template: 'Scent.pdf', category: 'scent' },
    'Ranger 1': { template: 'Scent.pdf', category: 'scent' },
    'Ranger 2': { template: 'Scent.pdf', category: 'scent' },
    'Ranger 3': { template: 'Scent.pdf', category: 'scent' },
    'Ranger 4': { template: 'Scent.pdf', category: 'scent' },
    'Ranger 5': { template: 'Scent.pdf', category: 'scent' },
    'Dasher 3': { template: 'Scent.pdf', category: 'scent' },
    'Dasher 4': { template: 'Scent.pdf', category: 'scent' },
    'Dasher 5': { template: 'Scent.pdf', category: 'scent' },
    'Dasher 6': { template: 'Scent.pdf', category: 'scent' },
    'Obedience 1': { template: 'Obedience.pdf', category: 'obedience' },
    'Obedience 2': { template: 'Obedience.pdf', category: 'obedience' },
    'Obedience 3': { template: 'Obedience.pdf', category: 'obedience' },
    'Obedience 4': { template: 'Obedience.pdf', category: 'obedience' },
    'Obedience 5': { template: 'Obedience.pdf', category: 'obedience' },
    'Starter': { template: 'Rally.pdf', category: 'rally' },
    'Advanced': { template: 'Rally.pdf', category: 'rally' },
    'Pro': { template: 'Rally.pdf', category: 'rally' },
    'ARF': { template: 'Rally.pdf', category: 'rally' },
    'Zoom 1': { template: 'Rally.pdf', category: 'rally' },
    'Zoom 1.5': { template: 'Rally.pdf', category: 'rally' },
    'Zoom 2': { template: 'Rally.pdf', category: 'rally' },
    'Games 1': { template: 'Games.pdf', category: 'games' },
    'Games 2': { template: 'Games.pdf', category: 'games' },
    'Games 3': { template: 'Games.pdf', category: 'games' },
    'Games 4': { template: 'Games.pdf', category: 'games' }
};

// Title certificate positioning
const titleCertificateConfig = {
    registrationNumber: { x: 120, y: 400, size: 12, color: [0, 0, 0] },
    handlerName: { x: 414, y: 370, size: 30, color: [0, 0, 0], align: 'center' },
    dogName: { x: 414, y: 280, size: 30, color: [0, 0, 0], align: 'center' },
    dateEarned: { x: 82, y: 235, size: 12, color: [0, 0, 0] },
    titleAbbreviation: { x: 700, y: 175, size: 30, color: [0, 0, 0.8], align: 'right' }
};

// ACE certificate positioning
const aceCertificateConfig = {
    dateLine: { x: 448, y: 425, size: 12, color: [0, 0, 0], align: 'center' },
    levelAbbreviation: { x: 398, y: 355, size: 31, color: [0.85, 0.65, 0.13], align: 'center' },
    callName: { x: 398, y: 270, size: 28, color: [0, 0, 0], align: 'center' },
    handlerName: { x: 398, y: 180, size: 28, color: [0, 0, 0], align: 'left' },
    registrationNumber: { x: 540, y: 150, size: 12, color: [0, 0, 0], align: 'left' }
};

// Proper level ordering
const levelOrder = [
    "Patrol 1", "Detective 2", "Investigator 3", "Super Sleuth 4", "Private Inv", "Det Diversions",
    "Ranger 1", "Ranger 2", "Ranger 3", "Ranger 4", "Ranger 5",
    "Dasher 3", "Dasher 4", "Dasher 5", "Dasher 6",
    "Obedience 1", "Obedience 2", "Obedience 3", "Obedience 4", "Obedience 5",
    "Starter", "Advanced", "Pro", "ARF",
    "Zoom 1", "Zoom 1.5", "Zoom 2",
    "Games 1", "Games 2", "Games 3", "Games 4"
];

// Games list for validation
const gamesList = ['BJ', 'C', 'P', 'T', 'GB'];

// Application configuration
const appConfig = {
    dataFile: 'Data for Tracker web.xlsx',
    dogInfoFile: 'DogInfo.xlsx',
    titlePlacementFile: 'Title Placement.xlsx',
    templateBaseUrl: 'https://raw.githubusercontent.com/cwagtracker/Tracker/main/templates/',
    logoUrl: 'https://raw.githubusercontent.com/cwagtracker/Tracker/main/cwags-logo.png',
    fontUrls: [
        'https://cdn.jsdelivr.net/gh/cwagtracker/Tracker@main/fonts/Maiandra%20GD.TTF',
        'https://raw.githubusercontent.com/cwagtracker/Tracker/main/fonts/Maiandra%20GD.TTF'
    ],
    loadTimeout: 3000, // 3 seconds
    dogInfoTimeout: 2000, // 2 seconds
    titlePlacementTimeout: 2000 // 2 seconds
};
