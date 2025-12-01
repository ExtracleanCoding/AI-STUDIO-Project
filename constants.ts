
export const APP_NAME = "Ray Ryan Management System";
export const LOCAL_STORAGE_KEY = "rayRyanManagementSystemState";

export const DRIVING_SKILL_CATEGORIES: Record<string, string[]> = {
  'Standard Skills (Foundational)': [
    'Cockpit Drill & Controls',
    'Moving Off & Stopping Safely',
    'Steering Control',
    'Clutch Control & Gear Changing',
    'Basic Junctions (Turning Left & Right)',
    'Use of Mirrors',
    'Signalling',
    'Awareness & Hazard Perception',
    'Emergency Stop'
  ],
  'Intermediate Skills (Maneuvers)': [
    'Pedestrian Crossings',
    'Meeting & Overtaking',
    'Turn in the Road',
    'Parallel Parking',
    'Reversing in a Straight Line',
    'Reversing Around a Corner',
    'Bay Parking (Forward & Reverse)'
  ],
  'Advanced Skills (Test Readiness)': [
    'Adverse Weather Driving',
    'Dual Carriageways',
    'Eco-Safe Driving',
    'Following Sat Nav',
    "'Show Me, Tell Me' Questions",
    'Complex/Spiral Roundabouts',
    'Night Driving'
  ],
  'Mock Test Assessment': [
    'Observation',
    'Anticipation & Awareness',
    'Vehicle Control',
    'Maneuvers (Turn, Reverse, Park)',
    'Serious/Grade 3 Faults',
    'Dangerous/Grade 2 Faults',
    'Driving Faults/Grade 1 Faults'
  ]
};

export const ALL_DRIVING_SKILLS = Object.values(DRIVING_SKILL_CATEGORIES).flat();

export const SKILL_STATUS = {
  MASTERED: 5,
  IN_PROGRESS_MIN: 1,
  NOT_STARTED: 0,
};


export const EXPENSE_CATEGORIES = [
  "Fuel",
  "Insurance",
  "Vehicle Maintenance",
  "Office Supplies",
  "Marketing",
  "Other"
];