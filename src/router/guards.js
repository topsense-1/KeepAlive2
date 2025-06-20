// src/router/routes.js
import {
  requireAuth,
  requirePermission,
  requireAnyPermission,
  requireRole,
  //requireAnyRole,
  requireResourceAccess,
  advancedGuard,
  redirectByRole,
  checkPasswordExpiry,
} from './guards.js'

const routes = [
  // דף הבית - הפניה לפי תפקיד
  {
    path: '/',
    beforeEnter: redirectByRole,
  },

  // דף התחברות
  {
    path: '/login',
    component: () => import('layouts/AuthLayout.vue'),
    children: [
      {
        path: '',
        name: 'Login',
        component: () => import('pages/LoginPage.vue'),
        meta: {
          guest: true, // רק למשתמשים לא מחוברים
        },
      },
    ],
  },

  // שינוי סיסמה
  {
    path: '/change-password',
    component: () => import('layouts/AuthLayout.vue'),
    beforeEnter: requireAuth,
    children: [
      {
        path: '',
        name: 'ChangePassword',
        component: () => import('pages/ChangePasswordPage.vue'),
        meta: {
          requiresAuth: true,
        },
      },
    ],
  },

  // Layout ראשי
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    beforeEnter: [requireAuth, checkPasswordExpiry],
    children: [
      // Dashboard - לכל המשתמשים המחוברים
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('pages/DashboardPage.vue'),
        meta: {
          requiresAuth: true,
          permissions: ['viewDashboard'],
        },
      },

      // ניהול חברות - רק למנהלי מערכת
      {
        path: 'companies',
        name: 'Companies',
        component: () => import('pages/CompaniesPage.vue'),
        beforeEnter: requirePermission('manageCompanies'),
        meta: {
          requiresAuth: true,
          permissions: ['manageCompanies'],
        },
      },

      // יצירת חברה עם מנהל
      {
        path: 'companies/create',
        name: 'CreateCompany',
        component: () => import('pages/CreateCompanyPage.vue'),
        beforeEnter: requirePermission('manageCompanies'),
        meta: {
          requiresAuth: true,
          permissions: ['manageCompanies'],
        },
      },

      // ניהול אתרים - למנהלי חברות ומעלה
      {
        path: 'sites',
        name: 'Sites',
        component: () => import('pages/SitesPage.vue'),
        beforeEnter: requireAnyPermission(['manageSites', 'manageCompanies']),
        meta: {
          requiresAuth: true,
          permissions: ['manageSites', 'manageCompanies'],
        },
      },

      // יצירת אתר עם מנהל
      {
        path: 'sites/create',
        name: 'CreateSite',
        component: () => import('pages/CreateSitePage.vue'),
        beforeEnter: requireAnyPermission(['manageSites', 'manageCompanies']),
        meta: {
          requiresAuth: true,
          permissions: ['manageSites', 'manageCompanies'],
        },
      },

      // ניהול בתים - רוב המשתמשים
      {
        path: 'houses',
        name: 'Houses',
        component: () => import('pages/HousesPage.vue'),
        beforeEnter: requireAnyPermission(['manageHouses', 'viewHouses']),
        meta: {
          requiresAuth: true,
          permissions: ['manageHouses', 'viewHouses'],
        },
      },

      // יצירת בית עם מנהל
      {
        path: 'houses/create',
        name: 'CreateHouse',
        component: () => import('pages/CreateHousePage.vue'),
        beforeEnter: requirePermission('manageHouses'),
        meta: {
          requiresAuth: true,
          permissions: ['manageHouses'],
        },
      },

      // צפייה בבית ספציפי - עם בדיקת גישה למשאב
      {
        path: 'houses/:id',
        name: 'HouseDetails',
        component: () => import('pages/HouseDetailsPage.vue'),
        beforeEnter: requireResourceAccess('house', 'view'),
        meta: {
          requiresAuth: true,
          permissions: ['viewHouses'],
          resourceType: 'house',
        },
      },

      // עריכת בית - עם בדיקת גישה למשאב
      {
        path: 'houses/:id/edit',
        name: 'EditHouse',
        component: () => import('pages/EditHousePage.vue'),
        beforeEnter: requireResourceAccess('house', 'update'),
        meta: {
          requiresAuth: true,
          permissions: ['updateHouses', 'manageHouses'],
          resourceType: 'house',
        },
      },

      // ניהול חיישנים בבית
      {
        path: 'houses/:id/sensors',
        name: 'HouseSensors',
        component: () => import('pages/HouseSensorsPage.vue'),
        beforeEnter: requireResourceAccess('house', 'view'),
        meta: {
          requiresAuth: true,
          permissions: ['viewSensors', 'manageSensors'],
          resourceType: 'house',
        },
      },

      // ניהול משתמשים - למנהלי משתמשים ומעלה
      {
        path: 'users',
        name: 'Users',
        component: () => import('pages/UsersPage.vue'),
        beforeEnter: requirePermission('manageUsers'),
        meta: {
          requiresAuth: true,
          permissions: ['manageUsers'],
        },
      },

      // יצירת משתמש
      {
        path: 'users/create',
        name: 'CreateUser',
        component: () => import('pages/CreateUserPage.vue'),
        beforeEnter: requirePermission('manageUsers'),
        meta: {
          requiresAuth: true,
          permissions: ['manageUsers'],
        },
      },

      // עריכת משתמש - עם בדיקה מתקדמת
      {
        path: 'users/:id/edit',
        name: 'EditUser',
        component: () => import('pages/EditUserPage.vue'),
        beforeEnter: advancedGuard({
          permissions: ['manageUsers'],
          resourceType: 'user',
          resourceAction: 'update',
          customCheck: async (to, from, authService) => {
            // בדיקה נוספת - האם המשתמש יכול לערוך את המשתמש הספציפי
            //const userId = to.params.id
            const currentUser = authService.getCurrentUser()

            // System Admin יכול לערוך כל אחד חוץ מ-System Admins אחרים
            if (currentUser.role === 'System Admin') {
              // TODO: בדוק אם המשתמש המטרה הוא System Admin
              return true
            }

            // User Manager לא יכול לערוך System Admin
            if (currentUser.role === 'User Manager') {
              // TODO: בדוק אם המשתמש המטרה לא System Admin
              return true
            }

            return true
          },
        }),
        meta: {
          requiresAuth: true,
          permissions: ['manageUsers'],
          resourceType: 'user',
        },
      },

      // ניהול הרשאות משתמש
      {
        path: 'users/:id/permissions',
        name: 'UserPermissions',
        component: () => import('pages/UserPermissionsPage.vue'),
        beforeEnter: requirePermission('manageUsers'),
        meta: {
          requiresAuth: true,
          permissions: ['manageUsers'],
          resourceType: 'user',
        },
      },

      // אירועים - לפי גישה למשאבים
      {
        path: 'events',
        name: 'Events',
        component: () => import('pages/EventsPage.vue'),
        beforeEnter: requireAnyPermission(['viewEvents', 'manageEvents']),
        meta: {
          requiresAuth: true,
          permissions: ['viewEvents', 'manageEvents'],
        },
      },

      // דוחות - לפי הרשאות דוחות
      {
        path: 'reports',
        name: 'Reports',
        component: () => import('pages/ReportsPage.vue'),
        beforeEnter: requireAnyPermission(['viewReports', 'manageReports']),
        meta: {
          requiresAuth: true,
          permissions: ['viewReports', 'manageReports'],
        },
      },

      // הגדרות מערכת - רק למנהלי מערכת
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('pages/SettingsPage.vue'),
        beforeEnter: requirePermission('manageSettings'),
        meta: {
          requiresAuth: true,
          permissions: ['manageSettings'],
        },
      },

      // ניהול תפקידים והרשאות - רק למנהלי מערכת
      {
        path: 'roles',
        name: 'Roles',
        component: () => import('pages/RolesPage.vue'),
        beforeEnter: requireRole('System Admin'),
        meta: {
          requiresAuth: true,
          roles: ['System Admin'],
        },
      },

      // בריאות המערכת - רק למנהלי מערכת
      {
        path: 'system-health',
        name: 'SystemHealth',
        component: () => import('pages/SystemHealthPage.vue'),
        beforeEnter: requireRole('System Admin'),
        meta: {
          requiresAuth: true,
          roles: ['System Admin'],
        },
      },

      // תמיכה - לכל המשתמשים
      {
        path: 'support',
        name: 'Support',
        component: () => import('pages/SupportPage.vue'),
        beforeEnter: requirePermission('viewSupport'),
        meta: {
          requiresAuth: true,
          permissions: ['viewSupport'],
        },
      },

      // פרופיל אישי - לכל המשתמשים המחוברים
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('pages/ProfilePage.vue'),
        meta: {
          requiresAuth: true,
        },
      },

      // Admin Dashboard - רק למנהלי מערכת
      {
        path: 'admin',
        beforeEnter: requireRole('System Admin'),
        children: [
          {
            path: 'dashboard',
            name: 'AdminDashboard',
            component: () => import('pages/admin/AdminDashboardPage.vue'),
            meta: {
              requiresAuth: true,
              roles: ['System Admin'],
            },
          },
          {
            path: 'users',
            name: 'AdminUsers',
            component: () => import('pages/admin/AdminUsersPage.vue'),
            meta: {
              requiresAuth: true,
              roles: ['System Admin'],
            },
          },
          {
            path: 'system',
            name: 'AdminSystem',
            component: () => import('pages/admin/AdminSystemPage.vue'),
            meta: {
              requiresAuth: true,
              roles: ['System Admin'],
            },
          },
        ],
      },
    ],
  },

  // דף שגיאה 404
  {
    path: '/:catchAll(.*)*',
    name: 'NotFound',
    component: () => import('pages/ErrorNotFound.vue'),
  },
]

export default routes
