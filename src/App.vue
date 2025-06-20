<!-- App.vue -->
<template>
  <router-view />
</template>

<script setup>
import { onMounted } from 'vue'
import { useUserStore } from './stores/user'

const userStore = useUserStore()

// טעינת המשתמש הנוכחי בעת הפעלת האפליקציה
onMounted(async () => {
  console.log('🚀 App mounted, checking for existing session...')
  try {
    const user = await userStore.loadCurrentUser()
    if (user) {
      console.log('✅ User session loaded successfully:', user.email)
    } else {
      console.log('ℹ️ No existing session found')
    }
  } catch (error) {
    console.log('ℹ️ No existing session:', error.message)
  }
})
</script>
