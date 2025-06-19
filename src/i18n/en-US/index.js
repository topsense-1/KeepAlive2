export default {
  appName: 'Smart Home Management',
  dashboard: 'Dashboard',
  companies: 'Companies',
  sites: 'Sites',
  houses: 'Houses',
  administration: 'Administration',
  users: 'Users',
  support: 'Support',
  navigation: 'Navigation',
  logout: 'Logout',

  // Dashboard
  total: 'Total Houses',
  needAttention: 'Need Attention',
  actives: 'Active',
  recentEvents: 'Recent Events',
  eventsOverTime: 'Events Over Time',
  eventTypes: 'Event Types',

  // House Details
  floorplan: 'Floorplan',
  sensors: 'Sensors',
  residents: 'Residents',
  events: 'Events',

  // Common Labels
  house: 'House',
  dateTime: 'Date & Time',
  description: 'Description',
  priority: 'Priority',
  location: 'Location',
  status: 'Status',
  signalStrength: 'Signal Strength',
  battery: 'Battery',
  type: 'Type',
  actions: 'Actions',
  sensor: 'Sensor',

  // Sensor Types
  motionSensor: 'Motion Sensor',
  doorSensor: 'Door Sensor',
  environmentalSensor: 'Environmental Sensor',
  panicButton: 'Panic Button',

  // Companies
  companiesAdministration: 'Companies Administration',
  addCompany: 'Add Company',
  editCompany: 'Edit Company',
  companyName: 'Company Name',
  companyId: 'Company ID',
  totalSites: 'Total Sites',
  totalHouses: 'Total Houses',
  companyAdded: 'Company added successfully',
  companyUpdated: 'Company updated successfully',
  companyDeleted: 'Company deleted successfully',
  errorAddingCompany: 'Error adding company',
  errorUpdatingCompany: 'Error updating company',
  errorDeletingCompany: 'Error deleting company',
  confirmDeleteCompany: 'Are you sure you want to delete the company "{company}"?',

  // Sites translations
  sitesAdministration: 'ניהול אתרים',
  addSite: 'הוסף אתר',
  editSite: 'ערוך אתר',
  siteName: 'שם האתר',
  company: 'חברה',
  siteAdded: 'האתר נוסף בהצלחה',
  siteUpdated: 'האתר עודכן בהצלחה',
  siteDeleted: 'האתר נמחק בהצלחה',
  errorAddingSite: 'שגיאה בהוספת האתר',
  errorUpdatingSite: 'שגיאה בעדכון האתר',
  errorDeletingSite: 'שגיאה במחיקת האתר',
  confirmDeleteSite: 'האם אתה בטוח שברצונך למחוק את האתר "{site}"?',

  // House Administration
  housesAdministration: 'Houses Administration',
  addHouse: 'Add House',
  editHouse: 'Edit House',
  houseNumber: 'House Number',
  residentName: 'Resident Name',
  installationDate: 'Installation Date',
  lastUpdate: 'Last Update',
  sensorCount: 'Sensors',
  clientId: 'Client ID',
  allOperational: 'All Operational',
  mostlyOperational: 'Mostly Operational',
  needsAttention: 'Needs Attention',
  confirmDeleteHouse: 'Are you sure you want to delete {house}?',
  houseDeleted: 'House deleted successfully',
  houseUpdated: 'House updated successfully',
  houseAdded: 'House added successfully',

  // Sensor Management
  manageSensors: 'Manage Sensors',
  addSensor: 'Add Sensor',
  editingSensor: 'Editing sensor: {sensor}',
  addingSensor: 'Adding new sensor',
  confirmDeleteSensor: 'Are you sure you want to delete {sensor} sensor?',
  sensorDeleted: 'Sensor deleted successfully',
  errorAddingSensor: 'Error adding sensor: {error}',
  selectHouseFirst: 'Please select a house first',
  errorLoadingSensorTypes: 'Error loading sensor types',
  errorLoadingSensorLocations: 'Error loading sensor locations',

  // Add Sensor Wizard
  addNewSensor: 'Add New Sensor',
  selectSensorLocation: 'Select Sensor Location',
  pairingInstructions: 'Pairing Instructions',
  pairingInstructionsText:
    'Press and hold the sensor button for 5 seconds until the LED light starts blinking rapidly',
  complete: 'Complete',
  next: 'Next',
  back: 'Back',
  cancel: 'Cancel',
  finish: 'Finish',
  addAnotherSensor: 'Add Another Sensor',
  waitForConnection: 'Please wait one minute for connection to complete...',
  timeRemaining: 'Time remaining: {seconds} seconds',
  sensorAddedSuccessfully: 'Sensor added successfully!',

  // User Management
  userManagement: 'User Management',
  addUser: 'Add User',
  editUser: 'Edit User',
  name: 'Name',
  email: 'Email',
  phone: 'Phone',
  role: 'Role',
  assignedHouses: 'Assigned Houses',
  confirmDeleteUser: 'Are you sure you want to delete user {user}?',
  userDeleted: 'User deleted successfully',
  userUpdated: 'User updated successfully',
  userAdded: 'User added successfully',
  errorLoadingHouses: 'Error loading houses list',

  // Permissions
  managePermissions: 'Manage Permissions',
  savePermissions: 'Save Permissions',
  permissionsUpdated: 'Permissions updated successfully',

  // Permission Names
  viewDashboard: 'View Dashboard',
  manageHouses: 'Manage Houses',
  manageUsers: 'Manage Users',
  viewReports: 'View Reports',
  receiveAlerts: 'Receive Alerts',
  accessSupport: 'Access Support',
  systemConfig: 'System Configuration',

  // Permission Descriptions
  viewDashboardDesc: 'Access to view dashboard and basic house information',
  manageHousesDesc: 'Ability to add, edit, and delete houses',
  manageSensorsDesc: 'Ability to manage sensors for assigned houses',
  manageUsersDesc: 'Ability to add, edit, and delete users',
  viewReportsDesc: 'Access to view and export reports',
  receiveAlertsDesc: 'Receive notifications for events and alerts',
  accessSupportDesc: 'Access to support resources and help',
  systemConfigDesc: 'Configure system-wide settings and preferences',

  // Form Validation
  fieldRequired: 'This field is required',
  invalidEmail: 'Please enter a valid email address',

  // Login Page
  smartHomeSystem: 'Smart Home Management System',
  username: 'Username',
  password: 'Password',
  rememberMe: 'Remember Me',
  forgotPassword: 'Forgot Password?',
  login: 'Login',
  needHelp: 'Need Help?',
  loginSuccessful: 'Login successful',
  loginFailed: 'Login failed. Please check your credentials.',
  language: 'Language',
  usernameRequired: 'Username is required',
  passwordRequired: 'Password is required',
  clientIdRequired: 'Client ID is required',

  // Password Recovery
  passwordRecovery: 'Password Recovery',
  enterEmailForReset: 'Please enter your email address to receive password reset instructions',
  passwordResetSent: 'Password reset instructions have been sent to {email}',

  // Help & Support
  helpAndSupport: 'Help & Support',
  helpMessage: `
    <p>For assistance with the Smart Home Management System, please contact:</p>
    <ul>
      <li>Technical Support: <strong>support@smarthomsystem.com</strong></li>
      <li>Phone: <strong>+1-800-123-4567</strong></li>
    </ul>
    <p>Support hours: Monday - Friday, 8:00 AM - 8:00 PM EST</p>
  `,
  ok: 'OK',

  // Support Page
  faq: 'Frequently Asked Questions',
  tutorials: 'Video Tutorials',
  contactSupport: 'Contact Support',
  documentation: 'Documentation',

  // FAQ Questions and Answers
  howToAddSensor: 'How do I add a new sensor to my home?',
  howToAddSensorAnswer:
    'To add a new sensor, navigate to the House Details page, select the Sensors tab, and click the "Add Sensor" button. Follow the on-screen wizard to select the sensor location and complete the pairing process.',
  batteryLow: 'What should I do when a sensor shows low battery?',
  batteryLowAnswer:
    'When a sensor shows a low battery warning, you should replace the batteries as soon as possible. Most sensors use standard CR2032 coin batteries or AA/AAA batteries. Refer to the sensor manual for specific instructions on battery replacement.',
  sensorNotRespondingQuestion: 'My sensor is not responding, what should I do?',
  sensorNotResponding: {
    intro: 'If a sensor is not responding, try the following steps:',
    step1: 'Check if the batteries are properly installed and not depleted',
    step2: 'Ensure the sensor is within range of your home hub',
    step3: 'Reset the sensor by removing and reinserting the batteries',
    step4: 'If the problem persists, try removing the sensor from your system and adding it again',
  },
  temperatureReadings: 'Why are my temperature readings inaccurate?',
  temperatureReadingsAnswer:
    'Temperature readings may be inaccurate if the sensor is placed near heat sources, in direct sunlight, or in areas with poor air circulation. Try relocating the sensor to a more central location away from windows, heating vents, and electronic devices.',
  loginIssuesQuestion: "If you're having trouble logging in, try these steps:",
  loginIssues: {
    intro: "If you're having trouble logging in, try these steps:",
    step1: "Make sure you're using the correct username and password",
    step2: 'Check if Caps Lock is enabled',
    step3: 'Clear your browser cache and cookies',
    step4: 'Try using a different browser',
    step5: 'Use the "Forgot Password" option to reset your password',
    step6: 'Contact support if the issue persists',
  },
  // Support Page - Video Tutorials
  settingUpNewHome: 'Setting Up a New Home',
  pairingSensors: 'Pairing Sensors and Devices',
  usingDashboard: 'Using the Dashboard Effectively',
  managingUsers: 'Managing Users and Permissions',

  // Support Page - Documentation
  userGuide: 'User Guide',
  userGuideDesc: 'Complete guide for end users',
  sensorManual: 'Sensor Manual',
  sensorManualDesc: 'Technical specifications and instructions',
  adminReference: 'Administrator Reference',
  adminReferenceDesc: 'System management and configuration',
  apiDocs: 'API Documentation',
  apiDocsDesc: 'For developers integrating with our system',

  // Support Request
  subject: 'Subject',
  category: 'Category',
  message: 'Message',
  submitRequest: 'Submit Request',
  supportRequestSubmitted: 'Your support request has been submitted. We will contact you shortly.',
  technicalIssue: 'Technical Issue',
  accountHelp: 'Account Help',
  billingQuestion: 'Billing Question',
  featureRequest: 'Feature Request',
  other: 'Other',
  videoPlaceholder: 'Video would play here in the actual app',
  openingDocument: 'Opening document: {title}',

  // Temperature & Humidity
  temperature: 'Temperature',
  humidity: 'Humidity',

  // Layout
  notifications: 'Notifications',
  noNotifications: 'No notifications',
  profile: 'Profile',
  profileNotImplemented: 'Profile management is not implemented in this demo',
  loggedOutSuccessfully: 'Logged out successfully',
  logoutError: 'There was an error logging out',
  user: 'User',
  recentHouses: 'Recent Houses',

  // Error Page
  pageNotFound: 'Oops. Nothing here...',
  goHome: 'Go Home',

  // Other
  delete: 'Delete',
  edit: 'Edit',
  save: 'Save',
  lightLevel: 'Light Level',

  // Administration
  setupSystem: 'System Setup',
  createFirstAdmin: 'Create First Administrator Account',
  adminSetupDescription:
    'Since this is the first time you are setting up the system, you need to create an administrator account.',
  firstName: 'First Name',
  firstNameRequired: 'First name is required',
  lastName: 'Last Name',
  lastNameRequired: 'Last name is required',
  // email: 'Email',
  emailRequired: 'Email is required',
  // invalidEmail: 'Please enter a valid email',
  phoneNumber: 'Phone Number',
  phoneRequired: 'Phone number is required',
  invalidPhone: 'Please enter a valid phone number',
  // password: 'Password',
  // passwordRequired: 'Password is required',
  invalidPassword:
    'Password must be at least 10 characters and include uppercase, lowercase, number, and special character',
  passwordRequirements:
    'Min. 10 characters with uppercase, lowercase, number, and special character',
  confirmPassword: 'Confirm Password',
  confirmPasswordRequired: 'Please confirm your password',
  passwordsDoNotMatch: 'Passwords do not match',
  createAdminAccount: 'Create Administrator Account',
  adminCreatedSuccessfully: 'Administrator account created successfully',
  adminCreatedCheckEmail: 'Account created. Please check your email to verify your account',
  errorCreatingAdmin: 'Error creating administrator account: {error}',
  backToLogin: 'Back to Login',
  invalidActivationCode: 'Invalid Activation Code',
  contactAdminForValidCode: 'Please contact your system provider for a valid activation code',
  adminAlreadyExists: 'Administrator Already Exists',
  systemAlreadySetup: 'The system has already been configured with an administrator account',
  returnToLogin: 'Return to Login Page',
  errorCheckingAdminExists: 'Error checking if admin exists',

  insufficientPermissions: 'You do not have sufficient permissions to access this page',

  loading: 'Loading...',

  // Error messages
  errorFetchingHouses: 'Error fetching houses',
  errorFetchingSensors: 'Error fetching sensors',
  errorDeletingHouse: 'Error deleting house',
  errorDeletingSensor: 'Error deleting sensor',
  errorAddingHouse: 'Error adding house',
  errorUpdatingHouse: 'Error updating house',

  // Status
  unknown: 'Unknown',
  active: 'Active',
  inactive: 'Inactive',
  offline: 'Offline', // Capitalized to match Hebrew file
  lowSignal: 'Weak Signal', // Changed from "Low Signal" to match Hebrew translation "עוצמת קליטה חלשה"
  error: 'Error',
  lowBattery: 'Low Battery',
  warning: 'Warning',
  critical: 'Critical',
  maintenance: 'Maintenance',
  disconnected: 'Disconnected',
  pending: 'Pending',
  archived: 'Archived',
  errorLoadingData: 'Error Loading Data',

  // User Management
  fullName: 'Full Name',
  lastLogin: 'Last Login',
  never: 'Never',
  noAssignedHouses: 'No assigned houses',
  refreshUsers: 'Refresh Users',
  manageHouseAssignment: 'Manage House Assignment',
  specificPermissions: 'Specific Permissions',

  // Role labels
  systemAdmin: 'System Admin',
  houseManager: 'House Manager',
  userManager: 'User Manager',
  caregiver: 'Caregiver',
  familyManager: 'Family Manager',
  familyMember: 'Family Member',

  // Error messages
  errorLoadingUsers: 'Error loading users',
  errorUpdatingHouseAssignment: 'Error updating house assignment',
  errorUpdatingPermissions: 'Error updating permissions',

  // Success messages
  houseAssignmentUpdated: 'House assignment updated successfully',

  noHouseAssignmentsInfo: 'House assignments are not configured',

  assignAllHouses: 'Assign All Houses',
  assignAllHousesDesc: 'Grant access to all houses in the system',
  specificHouses: 'Specific Houses',
  allHousesSelected: 'All {count} houses are selected',
  housesSelected: '{count} of {total} houses selected',

  allHousesAssignedSuccess: 'User has been granted access to all houses',
  assignedToAllHouses: 'Assigned to all houses',

  // System Admin specific
  systemAdminUser: 'System Administrator',
  systemAdminAutoAssigned: 'System Admin is automatically assigned to all houses',
  systemAdminAllHousesInfo: 'System administrators have automatic access to all houses',
  systemAdminAutoAccessInfo:
    'As a system administrator, this user automatically has access to all houses in the system. This cannot be changed.',
  systemAdminCannotChangeHouses: 'System administrators automatically have access to all houses',
  understood: 'Understood',

  livingRoom: 'Living Room',
  bedroom: 'Bedroom',
  bathroom: 'Bathroom/Toilet',
  mainDoor: 'Front Door',
  refrigeratorDoor: 'Refrigerator Door',
  temperatureHumidity: 'Temperature & Humidity',
  emergencyButton: 'Emergency Button',
  kitchen: 'Kitchen',
  bathroomDoor: 'Bathroom Door',
  bedroomDoor: 'Bedroom Door',
  mobile: 'Mobile',
  errorUpdatingSensor: 'Error updating sensor',

  floodSensor: 'Flood Sensor',

  sensorType: 'Sensor Type',
  sensorUpdated: 'Sensor updated successfully',

  connectingToMQTT: 'Connecting to sensor system...',
  mqttConnected: 'Connected to sensor system',
  mqttDisconnected: 'Not connected to sensor system',
  searchingForSensors: 'Searching for available sensors...',
  pairingModeActivated: 'Sensor pairing mode activated',
  startSensorPairing: 'Start Sensor Search',
  sensorsFound: '{count} sensors found',
  newSensorDetected: 'New sensor detected!',
  noSensorsFound: 'No sensors found',
  noSensorsFoundYet: 'No sensors found yet, continuing search...',
  sensorPairingCancelled: 'Sensor search cancelled',
  errorStartingPairing: 'Error starting sensor pairing: {error}',
  continueWithSelectedSensor: 'Continue with Selected Sensor',
  selectedSensor: 'Selected Sensor',
  sensorReadyToAdd: 'Sensor ready to be added to system',
  newlyDetected: 'Newly Detected',
  available: 'Available',
  unavailable: 'Unavailable',
  sensorSelected: 'Sensor selected successfully',
  configuringSensor: 'Configuring sensor...',
}
