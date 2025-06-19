// src/composables/useStore.js
import { ref } from 'vue'

export function useStore() {
  // הגדר את המשתנים בתוך הפונקציה במקום בחוץ
  const isStoreReady = ref(false)
  const userStore = ref(null)

  const initStore = async () => {
    try {
      // הסר את הבדיקה המיותרת והתמקד בפשטות
      const module = await import('../stores/user')
      const store = module.useUserStore()

      // שמור רק אם הצליח
      if (store) {
        userStore.value = store
        isStoreReady.value = true
        console.log('Store initialized successfully')
      }

      return store
    } catch (error) {
      console.error('Failed to initialize store:', error)
      return null
    }
  }

  return {
    isStoreReady,
    userStore,
    initStore,
  }
}
