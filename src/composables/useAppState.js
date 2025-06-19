import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { i18n } from 'src/boot/i18n'

/**
 * קומפוזבל לניהול מצב האפליקציה
 */
export function useAppState() {
  const $q = useQuasar()
  const router = useRouter()

  // האם האפליקציה מוכנה
  const isReady = ref(false)

  // האם תפריט הצד פתוח
  const leftDrawerOpen = ref(false)

  /**
   * מחליף את מצב תפריט הצד (פתוח/סגור)
   */
  const toggleLeftDrawer = () => {
    leftDrawerOpen.value = !leftDrawerOpen.value
  }

  /**
   * מנתק את המשתמש ומעביר אותו לדף ההתחברות
   */
  const handleLogout = () => {
    router.push('/login')

    // הודעה למשתמש
    $q.notify({
      color: 'positive',
      message: i18n.global.t('loggedOutSuccessfully'),
      icon: 'logout',
    })
  }

  /**
   * מסמן שהאפליקציה מוכנה
   */
  const setReady = (value = true) => {
    isReady.value = value
  }

  return {
    isReady,
    leftDrawerOpen,
    toggleLeftDrawer,
    handleLogout,
    setReady,
  }
}
