export default {
  appName: 'ניהול בית חכם',
  dashboard: 'לוח בקרה',
  companies: 'ניהול חברות',
  sites: 'ניהול אתרים',
  houses: 'ניהול בתים',
  administration: 'ניהול',
  users: 'משתמשים',
  support: 'תמיכה',
  navigation: 'ניווט',
  logout: 'התנתק',

  // Dashboard
  total: 'סה"כ בתים',
  needAttention: 'דורשים טיפול',
  actives: 'פעילים',
  recentEvents: 'אירועים אחרונים',
  eventsOverTime: 'אירועים לאורך זמן',
  eventTypes: 'סוגי אירועים',

  // House Details
  floorplan: 'תוכנית קומה',
  sensors: 'חיישנים',
  residents: 'דיירים',
  events: 'אירועים',

  // Common Labels
  house: 'בית',
  dateTime: 'תאריך ושעה',
  description: 'תיאור',
  priority: 'עדיפות',
  location: 'מיקום',
  status: 'סטטוס',
  signalStrength: 'עוצמת אות',
  battery: 'סוללה',
  type: 'סוג',
  actions: 'פעולות',
  sensor: 'חיישן',

  // Sensor Types
  motionSensor: 'חיישן תנועה',
  doorSensor: 'חיישן דלת',
  environmentalSensor: 'חיישן סביבתי',
  panicButton: 'כפתור מצוקה',

  // Companies
  companiesAdministration: 'ניהול חברות',
  addCompany: 'הוסף חברה',
  editCompany: 'ערוך חברה',
  companyName: 'שם החברה',
  companyId: 'מספר מזהה',
  totalSites: 'סה"כ אתרים',
  totalHouses: 'סה"כ בתים',
  companyAdded: 'החברה נוספה בהצלחה',
  companyUpdated: 'החברה עודכנה בהצלחה',
  companyDeleted: 'החברה נמחקה בהצלחה',
  errorAddingCompany: 'שגיאה בהוספת החברה',
  errorUpdatingCompany: 'שגיאה בעדכון החברה',
  errorDeletingCompany: 'שגיאה במחיקת החברה',
  confirmDeleteCompany: 'האם אתה בטוח שברצונך למחוק את החברה "{company}"?',

  // House Administration
  housesAdministration: 'ניהול בתים',
  addHouse: 'הוסף בית',
  editHouse: 'ערוך בית',
  houseNumber: 'מספר בית',
  residentName: 'שם דייר',
  installationDate: 'תאריך התקנה',
  lastUpdate: 'עדכון אחרון',
  sensorCount: 'חיישנים',
  clientId: 'מזהה לקוח',
  allOperational: 'הכל תקין',
  mostlyOperational: 'רוב המערכת תקינה',
  needsAttention: 'דורש טיפול',
  confirmDeleteHouse: 'האם אתה בטוח שברצונך למחוק את {house}?',
  houseDeleted: 'הבית נמחק בהצלחה',
  houseUpdated: 'הבית עודכן בהצלחה',
  houseAdded: 'הבית נוסף בהצלחה',

  // Sensor Management
  manageSensors: 'ניהול חיישנים',
  addSensor: 'הוסף חיישן',
  editingSensor: 'עריכת חיישן: {sensor}',
  addingSensor: 'הוספת חיישן חדש',
  confirmDeleteSensor: 'האם אתה בטוח שברצונך למחוק את {sensor}?',
  sensorDeleted: 'החיישן נמחק בהצלחה',
  errorAddingSensor: 'שגיאה בהוספת חיישן: {error}',
  selectHouseFirst: 'אנא בחר בית תחילה',
  errorLoadingSensorTypes: 'שגיאה בטעינת סוגי חיישנים',
  errorLoadingSensorLocations: 'שגיאה בטעינת מיקומי חיישנים',

  // Add Sensor Wizard
  addNewSensor: 'הוסף חיישן חדש',
  selectSensorLocation: 'בחר מיקום חיישן',
  pairingInstructions: 'הוראות צימוד',
  pairingInstructionsText:
    'לחץ והחזק את כפתור החיישן למשך 5 שניות עד שנורית ה־LED תתחיל להבהב במהירות',
  complete: 'הושלם',
  next: 'הבא',
  back: 'חזור',
  cancel: 'בטל',
  finish: 'סיים',
  addAnotherSensor: 'הוסף חיישן נוסף',
  waitForConnection: 'אנא המתן דקה אחת להשלמת החיבור...',
  timeRemaining: 'זמן נותר: {seconds} שניות',
  sensorAddedSuccessfully: 'החיישן נוסף בהצלחה!',

  // User Management
  userManagement: 'ניהול משתמשים',
  addUser: 'הוסף משתמש',
  editUser: 'ערוך משתמש',
  name: 'שם',
  email: 'דוא"ל',
  phone: 'טלפון',
  role: 'תפקיד',
  assignedHouses: 'בתים משויכים',
  confirmDeleteUser: 'האם אתה בטוח שברצונך למחוק את המשתמש {user}?',
  userDeleted: 'המשתמש נמחק בהצלחה',
  userUpdated: 'המשתמש עודכן בהצלחה',
  userAdded: 'המשתמש נוסף בהצלחה',
  errorLoadingHouses: 'שגיאה בטעינת רשימת הבתים',

  // Permissions
  managePermissions: 'ניהול הרשאות',
  savePermissions: 'שמור הרשאות',
  permissionsUpdated: 'ההרשאות עודכנו בהצלחה',

  // Permission Names
  viewDashboard: 'צפייה בלוח בקרה',
  manageHouses: 'ניהול בתים',
  manageUsers: 'ניהול משתמשים',
  viewReports: 'צפייה בדוחות',
  receiveAlerts: 'קבלת התראות',
  accessSupport: 'גישה לתמיכה',
  systemConfig: 'הגדרות מערכת',

  // Permission Descriptions
  viewDashboardDesc: 'גישה לצפייה בלוח הבקרה ומידע בסיסי על הבתים',
  manageHousesDesc: 'יכולת להוסיף, לערוך ולמחוק בתים',
  manageSensorsDesc: 'יכולת לנהל חיישנים עבור בתים משויכים',
  manageUsersDesc: 'יכולת להוסיף, לערוך ולמחוק משתמשים',
  viewReportsDesc: 'גישה לצפייה וייצוא דוחות',
  receiveAlertsDesc: 'קבלת התראות על אירועים',
  accessSupportDesc: 'גישה למשאבי תמיכה ועזרה',
  systemConfigDesc: 'הגדרת הגדרות מערכת כלליות',

  // Form Validation
  fieldRequired: 'שדה זה הוא חובה',
  invalidEmail: 'אנא הכנס כתובת דוא"ל תקינה',

  // Login Page
  smartHomeSystem: 'מערכת ניהול בית חכם',
  username: 'שם משתמש',
  password: 'סיסמה',
  rememberMe: 'זכור אותי',
  forgotPassword: 'שכחת סיסמה?',
  login: 'התחבר',
  needHelp: 'צריך עזרה?',
  loginSuccessful: 'התחברת בהצלחה',
  loginFailed: 'ההתחברות נכשלה. אנא בדוק את פרטי ההתחברות שלך.',
  language: 'שפה',
  usernameRequired: 'שם משתמש הוא שדה חובה',
  passwordRequired: 'סיסמה היא שדה חובה',
  clientIdRequired: 'מזהה לקוח הוא שדה חובה',

  // Password Recovery
  passwordRecovery: 'שחזור סיסמה',
  enterEmailForReset: 'אנא הכנס את כתובת הדוא"ל שלך לקבלת הוראות לאיפוס סיסמה',
  passwordResetSent: 'הוראות לאיפוס סיסמה נשלחו אל {email}',

  // Help & Support
  helpAndSupport: 'עזרה ותמיכה',
  helpMessage: `
    <p>לעזרה עם מערכת ניהול הבית החכם, אנא צור קשר:</p>
    <ul>
      <li>תמיכה טכנית: <strong>support@smarthomsystem.com</strong></li>
      <li>טלפון: <strong>+1-800-123-4567</strong></li>
    </ul>
    <p>שעות תמיכה: ימים א'-ה', 8:00-20:00</p>
  `,
  ok: 'אישור',

  // Support Page
  faq: 'שאלות נפוצות',
  tutorials: 'מדריכי וידאו',
  contactSupport: 'צור קשר עם התמיכה',
  documentation: 'תיעוד',

  // FAQ Questions and Answers
  howToAddSensor: 'כיצד להוסיף חיישן חדש לבית שלי?',
  howToAddSensorAnswer:
    'כדי להוסיף חיישן חדש, נווט אל דף פרטי הבית, בחר בלשונית חיישנים, ולחץ על כפתור "הוסף חיישן". בצע את ההוראות בהנחיית האשף כדי לבחור את מיקום החיישן ולהשלים את תהליך הצימוד.',
  batteryLow: 'מה עליי לעשות כאשר חיישן מציג התראת סוללה חלשה?',
  batteryLowAnswer:
    'כאשר חיישן מציג התראת סוללה חלשה, עליך להחליף את הסוללות בהקדם האפשרי. רוב החיישנים משתמשים בסוללות מטבע CR2032 סטנדרטיות או בסוללות AA/AAA. עיין במדריך החיישן להוראות ספציפיות להחלפת סוללה.',
  sensorNotResponding: 'החיישן שלי אינו מגיב, מה עליי לעשות?',
  sensorNotRespondingAnswer:
    'אם חיישן אינו מגיב, נסה את הצעדים הבאים: <br>1. בדוק אם הסוללות מותקנות כראוי ואינן מרוקנות<br>2. ודא שהחיישן נמצא בטווח של הרכזת הביתית שלך<br>3. אפס את החיישן על ידי הוצאת הסוללות והכנסתן מחדש<br>4. אם הבעיה נמשכת, נסה להסיר את החיישן מהמערכת ולהוסיף אותו שוב',
  temperatureReadings: 'מדוע קריאות הטמפרטורה שלי אינן מדויקות?',
  temperatureReadingsAnswer:
    'קריאות טמפרטורה עלולות להיות לא מדויקות אם החיישן ממוקם ליד מקורות חום, באור שמש ישיר, או באזורים עם זרימת אוויר לקויה. נסה להעביר את החיישן למיקום מרכזי יותר הרחק מחלונות, פתחי חימום, ומכשירים אלקטרוניים.',
  loginIssues: 'אני לא מצליח להתחבר לחשבון שלי, מה עליי לעשות?',
  loginIssuesAnswer:
    'אם אתה נתקל בבעיות בהתחברות, נסה את הצעדים הבאים:<br>1. ודא שאתה משתמש בשם המשתמש והסיסמה הנכונים<br>2. בדוק אם מקש Caps Lock מופעל<br>3. נקה את מטמון הדפדפן ועוגיות<br>4. נסה להשתמש בדפדפן אחר<br>5. השתמש באפשרות "שכחתי סיסמה" כדי לאפס את הסיסמה שלך<br>6. צור קשר עם תמיכה אם הבעיה נמשכת',

  // Support Page - Video Tutorials
  settingUpNewHome: 'הגדרת בית חדש',
  pairingSensors: 'צימוד חיישנים ומכשירים',
  usingDashboard: 'שימוש יעיל בלוח הבקרה',
  managingUsers: 'ניהול משתמשים והרשאות',

  // Support Page - Documentation
  userGuide: 'מדריך למשתמש',
  userGuideDesc: 'מדריך מלא למשתמשי קצה',
  sensorManual: 'מדריך חיישנים',
  sensorManualDesc: 'מפרטים טכניים והוראות',
  adminReference: 'מדריך למנהל מערכת',
  adminReferenceDesc: 'ניהול ותצורת מערכת',
  apiDocs: 'תיעוד API',
  apiDocsDesc: 'למפתחים המשלבים עם המערכת שלנו',

  // Support Request
  subject: 'נושא',
  category: 'קטגוריה',
  message: 'הודעה',
  submitRequest: 'שלח בקשה',
  supportRequestSubmitted: 'בקשת התמיכה שלך נשלחה. ניצור איתך קשר בהקדם.',
  technicalIssue: 'בעיה טכנית',
  accountHelp: 'עזרה בחשבון',
  billingQuestion: 'שאלת חיוב',
  featureRequest: 'בקשת תכונה',
  other: 'אחר',
  videoPlaceholder: 'הוידאו יופעל כאן באפליקציה האמיתית',
  openingDocument: 'פותח מסמך: {title}',

  // Temperature & Humidity
  temperature: 'טמפרטורה',
  humidity: 'לחות',

  // Layout
  notifications: 'התראות',
  noNotifications: 'אין התראות',
  profile: 'פרופיל',
  profileNotImplemented: 'ניהול פרופיל אינו מיושם בדוגמה זו',
  loggedOutSuccessfully: 'התנתקת בהצלחה',
  logoutError: 'הייתה שגיאה בהתנתקות',
  user: 'משתמש',
  recentHouses: 'בתים אחרונים',

  // Error Page
  pageNotFound: 'אופס. אין כאן כלום...',
  goHome: 'חזור לדף הבית',

  // Other
  delete: 'מחק',
  edit: 'ערוך',
  save: 'שמור',
  lightLevel: 'רמת תאורה',

  // דף הגדרת אדמין
  setupSystem: 'הגדרת המערכת',
  createFirstAdmin: 'יצירת חשבון מנהל מערכת ראשון',
  adminSetupDescription: 'זו הפעם הראשונה שאתה מגדיר את המערכת, עליך ליצור חשבון מנהל מערכת.',
  firstName: 'שם פרטי',
  firstNameRequired: 'יש להזין שם פרטי',
  lastName: 'שם משפחה',
  lastNameRequired: 'יש להזין שם משפחה',
  // email: 'דואר אלקטרוני',
  emailRequired: 'יש להזין דואר אלקטרוני',
  // invalidEmail: 'יש להזין כתובת דואר אלקטרוני תקינה',
  phoneNumber: 'מספר טלפון',
  phoneRequired: 'יש להזין מספר טלפון',
  invalidPhone: 'יש להזין מספר טלפון תקין',
  // password: 'סיסמה',
  // passwordRequired: 'יש להזין סיסמה',
  invalidPassword:
    'הסיסמה חייבת להיות באורך 10 תווים לפחות ולכלול אות גדולה, אות קטנה, מספר ותו מיוחד',
  passwordRequirements: 'מינימום 10 תווים עם אות גדולה, אות קטנה, מספר ותו מיוחד',
  confirmPassword: 'אימות סיסמה',
  confirmPasswordRequired: 'יש לאמת את הסיסמה',
  passwordsDoNotMatch: 'הסיסמאות אינן תואמות',
  createAdminAccount: 'צור חשבון מנהל',
  adminCreatedSuccessfully: 'חשבון מנהל נוצר בהצלחה',
  adminCreatedCheckEmail: 'החשבון נוצר. אנא בדוק את הדואר האלקטרוני שלך לאימות החשבון',
  errorCreatingAdmin: 'שגיאה ביצירת חשבון מנהל: {error}',
  backToLogin: 'חזרה להתחברות',
  invalidActivationCode: 'קוד הפעלה לא תקין',
  contactAdminForValidCode: 'אנא צור קשר עם ספק המערכת שלך לקבלת קוד הפעלה תקין',
  adminAlreadyExists: 'מנהל מערכת כבר קיים',
  systemAlreadySetup: 'המערכת כבר הוגדרה עם חשבון מנהל',
  returnToLogin: 'חזרה לדף ההתחברות',
  errorCheckingAdminExists: 'שגיאה בבדיקה האם קיים מנהל מערכת',

  insufficientPermissions: 'אין לך הרשאות מספיקות לגשת לדף זה',

  loading: 'טוען...',

  // Error messages
  errorFetchingHouses: 'שגיאה בטעינת בתים',
  errorFetchingSensors: 'שגיאה בטעינת חיישנים',
  errorDeletingHouse: 'שגיאה במחיקת בית',
  errorDeletingSensor: 'שגיאה במחיקת חיישן',
  errorAddingHouse: 'שגיאה בהוספת בית',
  errorUpdatingHouse: 'שגיאה בעדכון בית',

  // Status
  unknown: 'לא ידוע',
  active: 'פעיל',
  inactive: 'לא פעיל',
  offline: 'כבוי',
  error: 'שגיאה',
  lowBattery: 'סוללה חלשה',
  lowSignal: 'עוצמת קליטה חלשה',
  warning: 'אזהרה',
  critical: 'קריטי',
  maintenance: 'תחזוקה',
  disconnected: 'מנותק',
  pending: 'בהמתנה',
  archived: 'בארכיון',
  errorLoadingData: 'שגיאה בטעינת נתונים',

  // User Management
  fullName: 'שם מלא',
  lastLogin: 'התחברות אחרונה',
  never: 'אף פעם',
  noAssignedHouses: 'לא משויך לבתים',

  // Role labels
  systemAdmin: 'מנהל מערכת',
  houseManager: 'מנהל בית',
  userManager: 'מנהל משתמשים',
  caregiver: 'מטפל',
  familyManager: 'מנהל משפחה',
  familyMember: 'בן משפחה',

  // Form validations
  passwordMinLength: 'הסיסמה חייבת להכיל לפחות 6 תווים',

  // Error messages
  errorLoadingUsers: 'שגיאה בטעינת משתמשים',
  errorAddingUser: 'שגיאה בהוספת משתמש',
  errorUpdatingUser: 'שגיאה בעדכון משתמש',
  errorDeletingUser: 'שגיאה במחיקת משתמש',
  errorUpdatingPermissions: 'שגיאה בעדכון הרשאות',

  // User Management
  refreshUsers: 'רענן משתמשים',
  manageHouseAssignment: 'ניהול שיוך בתים',
  specificPermissions: 'הרשאות ספציפיות',

  // Success messages
  houseAssignmentUpdated: 'שיוך הבתים עודכן בהצלחה',

  noHouseAssignmentsInfo: 'שיוך בתים לא מוגדר',

  assignAllHouses: 'שיוך לכל הבתים',
  assignAllHousesDesc: 'מתן גישה לכל הבתים במערכת',
  specificHouses: 'בתים ספציפיים',
  allHousesSelected: 'כל {count} הבתים נבחרו',
  housesSelected: '{count} מתוך {total} בתים נבחרו',

  errorUpdatingHouseAssignment: 'שגיאה בעדכון שיוך הבתים',
  allHousesAssignedSuccess: 'המשתמש קיבל גישה לכל הבתים',

  assignedToAllHouses: 'משויך לכל הבתים',

  // System Admin specific
  systemAdminUser: 'מנהל מערכת',
  systemAdminAutoAssigned: 'מנהל מערכת משויך אוטומטית לכל הבתים',
  systemAdminAllHousesInfo: 'מנהלי מערכת יש להם גישה אוטומטית לכל הבתים',
  systemAdminAutoAccessInfo:
    'כמנהל מערכת, למשתמש זה יש אוטומטית גישה לכל הבתים במערכת. לא ניתן לשנות זאת.',
  systemAdminCannotChangeHouses: 'מנהלי מערכת יש להם אוטומטית גישה לכל הבתים',
  understood: 'הבנתי',

  // Location names
  livingRoom: 'סלון',
  bedroom: 'חדר שינה',
  bathroom: 'שירותים/אמבטיה',
  mainDoor: 'דלת כניסה',
  refrigeratorDoor: 'דלת מקרר',
  temperatureHumidity: 'טמפרטורה ולחות',
  emergencyButton: 'כפתור חירום',
  kitchen: 'מטבח',
  bathroomDoor: 'דלת שירותים',
  bedroomDoor: 'דלת חדר שינה',
  mobile: 'נייד',

  // Success messages
  sensorUpdated: 'החיישן עודכן בהצלחה',

  // Error messages
  errorUpdatingSensor: 'שגיאה בעדכון החיישן',
  floodSensor: 'חיישן הצפה',
  sensorType: 'סוג חיישן',

  connectingToMQTT: 'מתחבר למערכת החיישנים...',
  mqttConnected: 'חיבור למערכת החיישנים פעיל',
  mqttDisconnected: 'אין חיבור למערכת החיישנים',
  searchingForSensors: 'מחפש חיישנים זמינים...',
  pairingModeActivated: 'מצב זיווג חיישנים הופעל',
  startSensorPairing: 'התחל חיפוש חיישנים',
  sensorsFound: '{count} חיישנים נמצאו',
  newSensorDetected: 'חיישן חדש זוהה!',
  noSensorsFound: 'לא נמצאו חיישנים זמינים',
  noSensorsFoundYet: 'עדיין לא נמצאו חיישנים, ממשיך לחפש...',
  sensorPairingCancelled: 'חיפוש החיישנים בוטל',
  errorStartingPairing: 'שגיאה בהתחלת חיפוש חיישנים: {error}',
  continueWithSelectedSensor: 'המשך עם החיישן שנבחר',
  selectedSensor: 'החיישן שנבחר',
  sensorReadyToAdd: 'החיישן מוכן להוספה למערכת',
  newlyDetected: 'זוהה כעת',
  available: 'זמין',
  unavailable: 'לא זמין',
  sensorSelected: 'החיישן נבחר בהצלחה',
  configuringSensor: 'מגדיר את החיישן...',

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

  // Additional permission messages - הודעות הרשאות נוספות
  accessDenied: 'הגישה נדחתה',
  permissionDenied: 'ההרשאה נדחתה',
  contactAdministrator: 'אנא צור קשר עם מנהל המערכת',
}
