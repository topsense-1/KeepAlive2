<!-- src/components/AuthGuard.vue -->
<template>
  <slot v-if="hasAccess"></slot>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { permissionsService } from '../services/permissionsService'
import { authApi } from '../services/db2rest'

const props = defineProps({
  // ניתן להגדיר הרשאה ספציפית נדרשת
  permission: {
    type: String,
    default: null,
  },
  // או מערך של הרשאות - אם אחת מהן קיימת, הרכיב יוצג
  permissions: {
    type: Array,
    default: () => [],
  },
  // אפשרות להגדיר תפקידים ספציפיים שיכולים לצפות בתוכן
  role: {
    type: String,
    default: null,
  },
  roles: {
    type: Array,
    default: () => [],
  },
  // האם דרוש אימות בלבד (ללא בדיקת הרשאות)
  requiresAuth: {
    type: Boolean,
    default: true,
  },
})

// האם יש למשתמש גישה
const hasAccess = ref(false)

// פונקציה לבדיקת גישה
const checkAccess = async () => {
  try {
    // אם המשתמש לא מחובר
    const isAuthenticated = await authApi.isAuthenticated()
    if (!isAuthenticated) {
      hasAccess.value = false
      return
    }

    // אם רק צריך אימות, ללא בדיקת הרשאות נוספות
    if (
      props.requiresAuth &&
      !props.permission &&
      !props.permissions.length &&
      !props.role &&
      !props.roles.length
    ) {
      hasAccess.value = true
      return
    }

    // בדיקת תפקיד
    if (props.role || props.roles.length) {
      const userRole = await authApi.getUserRole()

      if (props.role && userRole === props.role) {
        hasAccess.value = true
        return
      }

      if (props.roles.length && props.roles.includes(userRole)) {
        hasAccess.value = true
        return
      }
    }

    // בדיקת הרשאה ספציפית
    if (props.permission) {
      hasAccess.value = await permissionsService.hasPermission(props.permission)
      return
    }

    // בדיקת מערך הרשאות
    if (props.permissions.length) {
      hasAccess.value = await permissionsService.hasAnyPermission(props.permissions)
      return
    }

    // ברירת מחדל - אין גישה
    hasAccess.value = false
  } catch (error) {
    console.error('Auth guard error:', error)
    hasAccess.value = false
  }
}

// בדיקת גישה בטעינה ראשונית
onMounted(checkAccess)

// מעקב אחרי שינויים בפרופס
watch(
  () => [props.permission, props.permissions, props.role, props.roles, props.requiresAuth],
  checkAccess,
  { deep: true },
)
</script>
