<!-- src/components/AuthGuard.vue -->
<template>
  <div v-if="hasAccess">
    <slot />
  </div>
  <div v-else-if="showNoAccess" class="no-access-message">
    <q-banner class="bg-warning text-white">
      <template v-slot:avatar>
        <q-icon name="warning" />
      </template>
      {{ noAccessMessage }}
    </q-banner>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useUserStore } from '../stores/user.js'
import { storeToRefs } from 'pinia'

const props = defineProps({
  // הרשאה ספציפית נדרשת
  permission: {
    type: String,
    default: null,
  },
  // מערך של הרשאות - אם אחת מהן קיימת, הרכיב יוצג
  permissions: {
    type: Array,
    default: () => [],
  },
  // בדיקה שכל ההרשאות קיימות (AND במקום OR)
  requireAllPermissions: {
    type: Boolean,
    default: false,
  },
  // תפקיד ספציפי נדרש
  role: {
    type: String,
    default: null,
  },
  // מערך של תפקידים מורשים
  roles: {
    type: Array,
    default: () => [],
  },
  // בדיקת גישה למשאב ספציפי
  resourceType: {
    type: String,
    default: null,
  },
  resourceId: {
    type: String,
    default: null,
  },
  resourceAction: {
    type: String,
    default: 'view',
  },
  // האם דרוש אימות בלבד (ללא בדיקת הרשאות)
  requiresAuth: {
    type: Boolean,
    default: true,
  },
  // האם להציג הודעת "אין גישה"
  showNoAccess: {
    type: Boolean,
    default: false,
  },
  // הודעה מותאמת אישית לחוסר גישה
  noAccessMessage: {
    type: String,
    default: 'אין לך הרשאה לצפות בתוכן זה',
  },
  // בדיקה אסינכרונית של משאב
  asyncCheck: {
    type: Boolean,
    default: false,
  },
})

const userStore = useUserStore()
const { isAuthenticated, currentUser, loading } = storeToRefs(userStore)

const hasAccess = ref(false)
const checking = ref(false)

// פונקציה לבדיקת גישה
const checkAccess = async () => {
  checking.value = true
  hasAccess.value = false

  try {
    // אם המשתמש לא מחובר
    if (!isAuthenticated.value) {
      hasAccess.value = false
      return
    }

    // אם רק צריך אימות, ללא בדיקת הרשאות נוספות
    if (
      props.requiresAuth &&
      !props.permission &&
      !props.permissions.length &&
      !props.role &&
      !props.roles.length &&
      !props.resourceType
    ) {
      hasAccess.value = true
      return
    }

    // בדיקת תפקיד ספציפי
    if (props.role) {
      if (userStore.hasRole(props.role)) {
        hasAccess.value = true
        return
      }
    }

    // בדיקת מערך תפקידים
    if (props.roles.length) {
      if (userStore.hasAnyRole(props.roles)) {
        hasAccess.value = true
        return
      }
    }

    // בדיקת הרשאה ספציפית
    if (props.permission) {
      hasAccess.value = userStore.hasPermission(props.permission)
      if (hasAccess.value && props.resourceType && props.resourceId) {
        // בדיקה נוספת למשאב ספציפי
        hasAccess.value = await userStore.canAccessResource(
          props.resourceType,
          props.resourceId,
          props.resourceAction,
        )
      }
      return
    }

    // בדיקת מערך הרשאות
    if (props.permissions.length) {
      if (props.requireAllPermissions) {
        hasAccess.value = userStore.hasAllPermissions(props.permissions)
      } else {
        hasAccess.value = userStore.hasAnyPermission(props.permissions)
      }

      if (hasAccess.value && props.resourceType && props.resourceId) {
        // בדיקה נוספת למשאב ספציפי
        hasAccess.value = await userStore.canAccessResource(
          props.resourceType,
          props.resourceId,
          props.resourceAction,
        )
      }
      return
    }

    // בדיקת משאב בלבד
    if (props.resourceType && props.resourceId) {
      hasAccess.value = await userStore.canAccessResource(
        props.resourceType,
        props.resourceId,
        props.resourceAction,
      )
      return
    }

    // ברירת מחדל - אין גישה אם לא מוגדר כלום
    hasAccess.value = false
  } catch (error) {
    console.error('Auth guard error:', error)
    hasAccess.value = false
  } finally {
    checking.value = false
  }
}

// מחושב שמראה אם אנחנו במצב טעינה
const isLoading = computed(() => {
  return loading.value || checking.value
})

// בדיקת גישה בטעינה ראשונית
onMounted(() => {
  // אם המשתמש כבר טעון, בדוק גישה מיד
  if (isAuthenticated.value && currentUser.value) {
    checkAccess()
  }
})

// מעקב אחרי שינויים במשתמש הנוכחי
watch(
  () => [isAuthenticated.value, currentUser.value],
  () => {
    if (isAuthenticated.value && currentUser.value) {
      checkAccess()
    } else {
      hasAccess.value = false
    }
  },
  { immediate: true },
)

// מעקב אחרי שינויים בפרופס
watch(
  () => [
    props.permission,
    props.permissions,
    props.role,
    props.roles,
    props.resourceType,
    props.resourceId,
    props.resourceAction,
    props.requiresAuth,
    props.requireAllPermissions,
  ],
  () => {
    if (isAuthenticated.value && currentUser.value) {
      checkAccess()
    }
  },
  { deep: true },
)

// חשיפת פונקציות לשימוש חיצוני
defineExpose({
  hasAccess,
  checkAccess,
  isLoading,
})
</script>

<style scoped>
.no-access-message {
  margin: 1rem 0;
}
</style>
