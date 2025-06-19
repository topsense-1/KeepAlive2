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
      // דשבורד - עמוד ראשי
      {
        path: 'dashboard',
        name: 'dashboard',
        component: () => import('../pages/DashboardPage.vue'),
        meta: { title: 'Dashboard' },
      },

      // ניהול חברות
      {
        path: 'companies',
        name: 'companies',
        component: () => import('../pages/CompaniesPage.vue'),
        meta: { title: 'Companies' },
      },

      // ניהול אתרים
      {
        path: 'sites',
        name: 'sites',
        component: () => import('../pages/SitesPage.vue'),
        meta: { title: 'Sites' },
      },

      // ניהול בתים
      {
        path: 'houses',
        name: 'houses',
        component: () => import('../pages/HousesAdminPage.vue'),
        meta: { title: 'Houses' },
      },

      // צפייה בפרטי בית ספציפי
      {
        path: 'house/:id',
        name: 'houseDetails',
        component: () => import('../pages/HouseDetailsPage.vue'),
        props: true,
        meta: { title: 'House Details' },
      },

      // ניהול מערכת
      {
        path: 'administration',
        name: 'administration',
        component: () => import('../pages/AdministrationPage.vue'),
        meta: {
          title: 'Administration',
          requiresPermission: 'manageHouses',
        },
      },

      // ניהול משתמשים
      {
        path: 'users',
        name: 'users',
        component: () => import('../pages/UserManagementPage.vue'),
        meta: {
          title: 'User Management',
          requiresPermission: 'manageUsers',
        },
      },

      // הגדרות פרופיל משתמש
      {
        path: 'profile',
        name: 'profile',
        component: () => import('../pages/UserProfilePage.vue'),
        meta: { title: 'User Profile' },
      },

      // עמוד תמיכה
      {
        path: 'support',
        name: 'support',
        component: () => import('../pages/SupportPage.vue'),
        meta: { title: 'Support' },
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
