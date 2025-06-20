// src/router/routes.js

/**
 * קובץ זה מכיל רק את הגדרות הנתיבים (routes) של המערכת
 * ללא לוגיקת ניווט או guards - אלה יוגדרו ב-router/index.js
 */

const routes = [
  // הפניה מהשורש ל-login
  {
    path: '/',
    redirect: '/login',
  },

  // עמוד התחברות
  {
    path: '/login',
    name: 'login',
    component: () => import('../pages/LoginPage.vue'),
    meta: {
      guest: true,
      title: 'Login',
    },
  },

  // עמוד איפוס סיסמה
  {
    path: '/reset-password',
    name: 'resetPassword',
    component: () => import('../pages/ResetPasswordPage.vue'),
    meta: {
      guest: true,
      title: 'Reset Password',
    },
  },

  // כל שאר הדפים תחת MainLayout
  {
    path: '/',
    component: () => import('../layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      // דשבורד - עמוד ראשי (כל המשתמשים)
      {
        path: 'dashboard',
        name: 'dashboard',
        component: () => import('../pages/DashboardPage.vue'),
        meta: {
          title: 'Dashboard',
          requiresPermission: 'viewDashboard',
        },
      },

      // ניהול חברות - רק מנהלי מערכת
      {
        path: 'companies',
        name: 'companies',
        component: () => import('../pages/CompaniesPage.vue'),
        meta: {
          title: 'Companies',
          requiresPermission: 'manageCompanies', // הרשאה חדשה
        },
      },

      // ניהול אתרים - רק מנהלי מערכת
      {
        path: 'sites',
        name: 'sites',
        component: () => import('../pages/SitesPage.vue'),
        meta: {
          title: 'Sites',
          requiresPermission: 'manageSites', // הרשאה חדשה
        },
      },

      // ניהול בתים - מנהלי מערכת ומנהלי בתים
      {
        path: 'houses',
        name: 'houses',
        component: () => import('../pages/HousesAdminPage.vue'),
        meta: {
          title: 'Houses',
          requiresPermission: 'manageHouses',
        },
      },

      // צפייה בפרטי בית ספציפי - משתמשים עם גישה לבית
      {
        path: 'house/:id',
        name: 'houseDetails',
        component: () => import('../pages/HouseDetailsPage.vue'),
        props: true,
        meta: {
          title: 'House Details',
          requiresPermission: 'viewHouses',
        },
      },

      // ניהול מערכת - מנהלי מערכת ומנהלי בתים
      {
        path: 'administration',
        name: 'administration',
        component: () => import('../pages/AdministrationPage.vue'),
        meta: {
          title: 'Administration',
          requiresPermission: 'manageHouses',
        },
      },

      // ניהול משתמשים - מנהלי מערכת ומנהלי משתמשים
      {
        path: 'users',
        name: 'users',
        component: () => import('../pages/UserManagementPage.vue'),
        meta: {
          title: 'User Management',
          requiresPermission: 'manageUsers',
        },
      },

      // הגדרות פרופיל משתמש - כל המשתמשים
      {
        path: 'profile',
        name: 'profile',
        component: () => import('../pages/UserProfilePage.vue'),
        meta: {
          title: 'User Profile',
          requiresPermission: 'viewDashboard', // בסיסי לכל המשתמשים
        },
      },

      // עמוד תמיכה - כל המשתמשים
      {
        path: 'support',
        name: 'support',
        component: () => import('../pages/SupportPage.vue'),
        meta: {
          title: 'Support',
          requiresPermission: 'accessSupport',
        },
      },
    ],
  },

  // טיפול בנתיבים לא קיימים - דף שגיאה 404
  {
    path: '/:catchAll(.*)*',
    name: 'notFound',
    component: () => import('../pages/ErrorNotFound.vue'),
    meta: { title: 'Page Not Found' },
  },
]

export default routes
