<!-- src/pages/LoginPage.vue-->
<template>
  <div class="fullscreen flex flex-center bg-grey-2">
    <q-card class="login-card">
      <q-card-section class="text-center q-pt-lg">
        <div class="text-h5 q-mb-md">{{ $t('smartHomeSystem') }}</div>
        <q-avatar size="80px">
          <img src="https://cdn.quasar.dev/logo-v2/svg/logo.svg" />
        </q-avatar>
      </q-card-section>

      <q-card-section class="q-gutter-md">
        <q-select
          v-model="locale"
          :options="localeOptions"
          :label="$t('language')"
          outlined
          class="q-mb-md"
          emit-value
          map-options
        />

        <q-form @submit="onSubmit" class="q-gutter-md">
          <q-input
            v-model="email"
            :label="$t('email')"
            type="email"
            autocomplete="email"
            outlined
            :rules="[
              (val) => !!val || $t('emailRequired'),
              (val) => isValidEmail(val) || $t('invalidEmail'),
            ]"
          >
            <template v-slot:prepend>
              <q-icon name="email" />
            </template>
          </q-input>

          <q-input
            v-model="password"
            :label="$t('password')"
            outlined
            autocomplete="current-password"
            :type="isPwd ? 'password' : 'text'"
            :rules="[(val) => !!val || $t('passwordRequired')]"
          >
            <template v-slot:prepend>
              <q-icon name="lock" />
            </template>
            <template v-slot:append>
              <q-icon
                :name="isPwd ? 'visibility_off' : 'visibility'"
                class="cursor-pointer"
                @click="isPwd = !isPwd"
              />
            </template>
          </q-input>

          <div class="flex justify-between items-center">
            <q-checkbox v-model="rememberMe" :label="$t('rememberMe')" />
            <q-btn flat no-caps :label="$t('forgotPassword')" @click="forgotPassword" />
          </div>

          <q-btn
            :label="$t('login')"
            type="submit"
            color="primary"
            class="full-width"
            :loading="loading"
          />
        </q-form>
      </q-card-section>

      <q-card-section class="text-center q-pb-lg">
        <q-btn flat no-caps color="grey" :label="$t('needHelp')" icon="help" @click="showHelp" />
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter, useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import { authApi } from '../services/db2rest'
import { permissionsService } from '../services/permissionsService'
import { useUserStore } from '../stores/user'

const { t, locale } = useI18n()
const router = useRouter()
const route = useRoute()
const $q = useQuasar()
const userStore = useUserStore()

// שדות הטופס
const email = ref('')
const password = ref('')
const isPwd = ref(true)
const rememberMe = ref(false)
const loading = ref(false)

// בדיקה אם המשתמש כבר מחובר בעת טעינת הדף
onMounted(async () => {
  try {
    const isAuthenticated = await authApi.isAuthenticated()
    if (isAuthenticated) {
      // אם המשתמש כבר מחובר, נעביר אותו ישירות לדשבורד
      router.push('/dashboard')
    }
  } catch (error) {
    console.error('Authentication check error:', error)
  }
})

// אפשרויות שפה
const localeOptions = [
  { value: 'en-US', label: 'English' },
  { value: 'he', label: 'עברית' },
]

// בדיקת תקינות אימייל
const isValidEmail = (val) => {
  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  return emailPattern.test(val) || val === ''
}

// שליחת הטופס - עם תמיכה בניתוב מחדש
const onSubmit = async () => {
  loading.value = true

  try {
    console.log('Login attempt:', email.value)

    // התחברות דרך user store
    await userStore.login({
      email: email.value,
      password: password.value,
      rememberMe: rememberMe.value,
    })

    console.log('Login successful through user store')

    // אופציונלי: בדיקת הרשאות (אם באמת נחוץ)
    if (userStore.currentUser?.id) {
      try {
        // שימוש בפונקציה החדשה מה-permissionsService
        const userPermissions = await permissionsService.getUserEffectivePermissions(
          userStore.currentUser.id,
        )
        console.log('User permissions:', userPermissions)
      } catch (permError) {
        console.warn('Could not load permissions on login:', permError)
        // אל תבלוק את ההתחברות בגלל זה
      }
    }

    // בדיקה אם יש ניתוב מחדש מהפרמטרים
    const redirectPath = route.query.redirect || '/dashboard'

    // ניתוב לדף המבוקש
    router.push(redirectPath)

    $q.notify({
      color: 'positive',
      textColor: 'white',
      icon: 'check_circle',
      message: t('loginSuccessful'),
    })
  } catch (error) {
    console.error('Login error:', error)
    $q.notify({
      color: 'negative',
      textColor: 'white',
      icon: 'error',
      message: t('loginFailed'),
    })
  } finally {
    loading.value = false
  }
}

// פונקציית שכחת סיסמה
const forgotPassword = () => {
  $q.dialog({
    title: t('passwordRecovery'),
    message: t('enterEmailForReset'),
    prompt: {
      model: '',
      type: 'email',
    },
    cancel: true,
    persistent: true,
  }).onOk(async (email) => {
    try {
      await authApi.resetPassword(email)
      $q.notify({
        color: 'positive',
        textColor: 'white',
        message: t('passwordResetSent', { email }),
        icon: 'email',
      })
    } catch {
      $q.notify({
        color: 'negative',
        textColor: 'white',
        message: t('passwordResetFailed'),
        icon: 'error',
      })
    }
  })
}

// פונקציית עזרה
const showHelp = () => {
  $q.dialog({
    title: t('helpAndSupport'),
    message: t('helpMessage'),
    html: true,
    ok: {
      label: t('ok'),
      flat: true,
      color: 'primary',
    },
  })
}
</script>

<style scoped>
.login-card {
  width: 100%;
  max-width: 400px;
  border-radius: 12px;
}
.fullscreen {
  min-height: 100vh;
  min-width: 100vw;
}
</style>
