<!-- src/pages/ResetPasswordPage.vue -->
<template>
  <div class="fullscreen flex flex-center bg-grey-2">
    <q-card class="reset-card">
      <q-card-section class="text-center q-pt-lg">
        <div class="text-h5 q-mb-md">{{ $t('resetPassword') }}</div>
        <q-avatar size="80px">
          <img src="https://cdn.quasar.dev/logo-v2/svg/logo.svg" />
        </q-avatar>
      </q-card-section>

      <q-card-section>
        <p class="text-body1 q-mb-md">{{ $t('enterNewPassword') }}</p>

        <q-form @submit="onSubmit" class="q-gutter-md">
          <q-input
            v-model="password"
            :label="$t('newPassword')"
            outlined
            :type="isPwd ? 'password' : 'text'"
            :rules="[
              (val) => !!val || $t('passwordRequired'),
              (val) => val.length >= 8 || $t('passwordTooShort'),
            ]"
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

          <q-input
            v-model="confirmPassword"
            :label="$t('confirmPassword')"
            outlined
            :type="isConfirmPwd ? 'password' : 'text'"
            :rules="[
              (val) => !!val || $t('confirmPasswordRequired'),
              (val) => val === password || $t('passwordsDoNotMatch'),
            ]"
          >
            <template v-slot:prepend>
              <q-icon name="lock" />
            </template>
            <template v-slot:append>
              <q-icon
                :name="isConfirmPwd ? 'visibility_off' : 'visibility'"
                class="cursor-pointer"
                @click="isConfirmPwd = !isConfirmPwd"
              />
            </template>
          </q-input>

          <q-btn
            :label="$t('resetPassword')"
            type="submit"
            color="primary"
            class="full-width"
            :loading="loading"
          />
        </q-form>
      </q-card-section>

      <q-card-section class="text-center q-pb-lg">
        <q-btn flat no-caps :label="$t('backToLogin')" to="/login" />
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { authApi } from '../services/db2rest'

const { t } = useI18n()
const router = useRouter()
const $q = useQuasar()

// שדות טופס
const password = ref('')
const confirmPassword = ref('')
const isPwd = ref(true)
const isConfirmPwd = ref(true)
const loading = ref(false)
const hasValidToken = ref(false)

// בדיקת תוקן איפוס סיסמה בעת טעינת הדף
onMounted(async () => {
  try {
    // בדיקה אם יש מושב עם תוקן איפוס סיסמה תקף
    const {
      data: { session },
    } = await authApi.auth.getSession()

    // אם אין מושב עם תוקן תקף, נעביר למסך ההתחברות
    if (!session) {
      $q.notify({
        color: 'negative',
        message: t('invalidOrExpiredResetLink'),
        icon: 'error',
      })

      router.push('/login')
    } else {
      hasValidToken.value = true
    }
  } catch (error) {
    console.error('Error checking reset token:', error)
    $q.notify({
      color: 'negative',
      message: t('errorCheckingResetToken'),
      icon: 'error',
    })
    router.push('/login')
  }
})

// שליחת טופס איפוס סיסמה
const onSubmit = async () => {
  if (!hasValidToken.value) {
    $q.notify({
      color: 'negative',
      message: t('resetTokenInvalid'),
      icon: 'error',
    })
    return
  }

  if (password.value !== confirmPassword.value) {
    $q.notify({
      color: 'negative',
      message: t('passwordsDoNotMatch'),
      icon: 'error',
    })
    return
  }

  loading.value = true

  try {
    await authApi.updatePassword(password.value)

    $q.notify({
      color: 'positive',
      message: t('passwordResetSuccess'),
      icon: 'check_circle',
    })

    // מעבר לדף ההתחברות לאחר הצלחה
    router.push('/login')
  } catch (error) {
    console.error('Password reset error:', error)
    $q.notify({
      color: 'negative',
      message: t('passwordResetFailed'),
      icon: 'error',
    })
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.reset-card {
  width: 100%;
  max-width: 400px;
  border-radius: 12px;
}
.fullscreen {
  min-height: 100vh;
  min-width: 100vw;
}
</style>
