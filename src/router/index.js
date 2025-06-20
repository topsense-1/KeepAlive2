// תיקון לקובץ router/index.js

import {
  createRouter,
  createMemoryHistory,
  createWebHistory,
  createWebHashHistory,
} from 'vue-router'
import routes from './routes'
import { authApi } from '../services/db2rest'
import { useUserStore } from '../stores/user' // ← הוסף את זה
import { Notify } from 'quasar'
import { i18n } from 'src/boot/i18n'

export default function (/* { store, ssrContext } */) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : process.env.VUE_ROUTER_MODE === 'history'
      ? createWebHistory
      : createWebHashHistory

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,
    history: createHistory(process.env.VUE_ROUTER_BASE),
  })

  // הגנה גלובלית עבור נתיבים מוגנים וניהול הרשאות
  Router.beforeEach(async (to, from, next) => {
    console.log(`🚀 Navigating to: ${to.path}`)

    // עדכון כותרת העמוד
    document.title = to.meta.title ? `Smart Home - ${to.meta.title}` : 'Smart Home System'

    // בדיקה האם הנתיב דורש אימות
    const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)
    const requiresGuest = to.matched.some((record) => record.meta.guest)

    console.log(`Route requires auth: ${requiresAuth}, requires guest: ${requiresGuest}`)

    try {
      // בדיקת סטטוס אימות משתמש
      const isAuthenticated = await authApi.isAuthenticated()
      console.log(`User authenticated: ${isAuthenticated}`)

      // משתמש מחובר מנסה לגשת לעמוד אורח (כמו login)
      if (isAuthenticated && requiresGuest) {
        console.log('Authenticated user trying to access guest page, redirecting to dashboard')
        return next('/dashboard')
      }

      // משתמש לא מחובר מנסה לגשת לעמוד מוגן
      if (!isAuthenticated && requiresAuth) {
        console.log('Unauthenticated user trying to access protected page, redirecting to login')
        // שמירת הנתיב המקורי כדי לחזור אליו אחרי ההתחברות
        const targetPath = to.fullPath
        return next({ path: '/login', query: { redirect: targetPath } })
      }

      // בדיקת הרשאות ספציפיות (אם נדרש)
      const requiredPermission = to.meta.requiresPermission
      if (isAuthenticated && requiredPermission) {
        console.log(`🔐 Route ${to.path} requires permission: ${requiredPermission}`)

        // קבלת user store
        const userStore = useUserStore()

        // וודא שיש משתמש טעון
        if (!userStore.currentUser) {
          console.log('No current user, loading...')
          await userStore.loadCurrentUser()
        }

        // בדיקת הרשאה דרך user store
        const hasPermission = userStore.hasPermission(requiredPermission)
        console.log(
          `👤 User ${userStore.currentUser?.email} has permission ${requiredPermission}? ${hasPermission}`,
        )
        console.log(`👤 User permissions:`, userStore.permissions)

        if (!hasPermission) {
          console.log('❌ Access denied - insufficient permissions')

          // הודעה למשתמש שאין לו הרשאה
          Notify.create({
            color: 'negative',
            message:
              i18n.global.t('insufficientPermissions') || 'אין לך הרשאות מספיקות לגשת לדף זה',
            icon: 'error',
            position: 'top',
          })

          // הפניה לדשבורד במקום לחסום לגמרי
          return next('/dashboard')
        }

        console.log('✅ Permission granted')
      }

      // המשך רגיל
      console.log('✅ Navigation allowed')
      return next()
    } catch (error) {
      console.error('❌ Route navigation error:', error)

      // במקרה של שגיאה, מניחים שהמשתמש לא מחובר
      if (requiresAuth) {
        return next('/login')
      }
      return next()
    }
  })

  return Router
}
