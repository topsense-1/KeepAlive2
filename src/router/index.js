// src/router/index.js
import {
  createRouter,
  createMemoryHistory,
  createWebHistory,
  createWebHashHistory,
} from 'vue-router'
import routes from './routes'
import { authApi } from '../services/db2rest'
import { permissionsService } from '../services/permissionsService'
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
    // עדכון כותרת העמוד
    document.title = to.meta.title ? `Smart Home - ${to.meta.title}` : 'Smart Home System'

    // בדיקה האם הנתיב דורש אימות
    const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)
    const requiresGuest = to.matched.some((record) => record.meta.guest)

    try {
      // בדיקת סטטוס אימות משתמש
      const isAuthenticated = await authApi.isAuthenticated()

      // משתמש מחובר מנסה לגשת לעמוד אורח (כמו login)
      if (isAuthenticated && requiresGuest) {
        return next('/dashboard')
      }

      // משתמש לא מחובר מנסה לגשת לעמוד מוגן
      if (!isAuthenticated && requiresAuth) {
        // שמירת הנתיב המקורי כדי לחזור אליו אחרי ההתחברות
        const targetPath = to.fullPath
        return next({ path: '/login', query: { redirect: targetPath } })
      }

      // בדיקת הרשאות ספציפיות (אם נדרש)
      const requiredPermission = to.meta.requiresPermission
      if (isAuthenticated && requiredPermission) {
        // console.log(`Route ${to.path} requires permission: ${requiredPermission}`)

        // בדיקת הרשאה
        const hasPermission = await permissionsService.hasPermission(requiredPermission)
        // console.log(`User has permission? ${hasPermission}`)

        if (!hasPermission) {
          // הודעה למשתמש שאין לו הרשאה
          Notify.create({
            color: 'negative',
            message: i18n.global.t('insufficientPermissions') || 'אין לך הרשאות מספיקות',
            icon: 'error',
            position: 'top',
          })
          return next('/dashboard')
        }
      }

      // המשך רגיל
      return next()
    } catch (error) {
      console.error('Route navigation error:', error)
      // במקרה של שגיאה, מניחים שהמשתמש לא מחובר
      if (requiresAuth) {
        return next('/login')
      }
      return next()
    }
  })

  return Router
}
