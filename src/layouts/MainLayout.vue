<!-- src/layouts/MainLayout.vue -->
<template>
  <q-layout view="hHh lpR fFf">
    <q-header elevated class="bg-white text-primary">
      <q-toolbar>
        <q-btn dense flat round icon="menu" @click="toggleLeftDrawer" />
        <q-toolbar-title class="text-primary">
          <q-avatar>
            <img src="https://cdn.quasar.dev/logo-v2/svg/logo.svg" />
          </q-avatar>
          {{ $t('appName') }}
        </q-toolbar-title>

        <!-- החלפתי את ה-q-select המקורי בזה שעובד באפליקציה השנייה -->
        <q-select
          side
          v-model="lang"
          :options="langOptions"
          dense
          borderless
          emit-value
          map-options
          options-dense
          style="min-width: 100px"
        />

        <q-btn dense flat round icon="search" />
        <q-btn dense flat round icon="notifications">
          <q-badge color="negative" floating v-if="isReady && notificationCount > 0">
            {{ notificationCount }}
          </q-badge>
        </q-btn>
        <q-btn dense flat round>
          <q-avatar size="26px">
            <img src="https://cdn.quasar.dev/img/boy-avatar.png" />
          </q-avatar>
          <q-menu>
            <q-list style="min-width: 150px">
              <q-item-label header>{{ $t('user') }}</q-item-label>
              <q-separator />
              <q-item clickable v-close-popup @click="handleLogout">
                <q-item-section>{{ $t('logout') }}</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </q-toolbar>
      <q-tabs align="left" class="bg-blue-1">
        <q-route-tab to="/" :label="$t('dashboard')" />
        <q-route-tab to="/companies" :label="$t('companies')" />
        <q-route-tab to="/sites" :label="$t('sites')" />
        <q-route-tab to="/houses" :label="$t('houses')" />
        <q-route-tab to="/users" :label="$t('users')" />
        <q-route-tab to="/administration" :label="$t('administration')" />
        <q-route-tab to="/support" :label="$t('support')" />
      </q-tabs>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" bordered>
      <q-list>
        <q-item-label header>{{ $t('navigation') }}</q-item-label>
        <q-item clickable to="/">
          <q-item-section avatar>
            <q-icon name="dashboard" />
          </q-item-section>
          <q-item-section>{{ $t('dashboard') }}</q-item-section>
        </q-item>

        <q-item clickable to="/companies">
          <q-item-section avatar>
            <q-icon name="domain" />
          </q-item-section>
          <q-item-section>{{ $t('companies') }}</q-item-section>
        </q-item>

        <q-item clickable to="/sites">
          <q-item-section avatar>
            <q-icon name="data_table" />
          </q-item-section>
          <q-item-section>{{ $t('sites') }}</q-item-section>
        </q-item>

        <q-item clickable to="/houses">
          <q-item-section avatar>
            <q-icon name="home" />
          </q-item-section>
          <q-item-section>{{ $t('houses') }}</q-item-section>
        </q-item>

        <q-item clickable to="/users">
          <q-item-section avatar>
            <q-icon name="people" />
          </q-item-section>
          <q-item-section>{{ $t('users') }}</q-item-section>
        </q-item>

        <q-item clickable to="/administration">
          <q-item-section avatar>
            <q-icon name="admin_panel_settings" />
          </q-item-section>
          <q-item-section>{{ $t('administration') }}</q-item-section>
        </q-item>

        <q-item clickable to="/support">
          <q-item-section avatar>
            <q-icon name="help" />
          </q-item-section>
          <q-item-section>{{ $t('support') }}</q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useStore } from '../composables/useStore'
import { i18n } from 'src/boot/i18n'
import languages from 'quasar/lang/index.json'
import { authApi } from '../services/db2rest' // ✅ שינוי: מ-supabase ל-db2rest

const $q = useQuasar()
const router = useRouter()

// משתנים בסיסיים
const leftDrawerOpen = ref(false)
const notificationCount = ref(0)
const isReady = ref(false)

// חשוב לחלץ את initStore מהאובייקט שחוזר מ-useStore
const { initStore, userStore } = useStore()

// ----------------------------------------
// קוד בדיוק כפי שמופיע באפליקציה השנייה שעובדת
// ----------------------------------------

// קוד בדיוק כמו בדוגמה שעובדת
const modules = import.meta.glob('../../node_modules/quasar/lang/(en-US|he).js')

const appLanguages = languages.filter((lang) => ['en-US', 'he'].includes(lang.isoName))

const langOptions = appLanguages.map((lang) => ({
  label: lang.nativeName,
  value: lang.isoName,
}))

const lang = ref($q.lang.isoName)

watch(lang, (val, oldVal) => {
  if (val === oldVal) return // מניעת בעיית focus בדיאלוג

  modules[`../../node_modules/quasar/lang/${val}.js`]().then((langModule) => {
    i18n.global.locale.value = langModule.default.isoName
    $q.lang.set(langModule.default)

    // הדפסת לוג לצורך דיבוג
    console.log(`השפה הוחלפה: ${val}`)
    console.log(`סטטוס RTL: ${$q.lang.rtl}`)
    console.log(`כיווניות: ${document.dir}`)
  })
})

// ----------------------------------------
// הפונקציות של האפליקציה הנוכחית - מתוקנות
// ----------------------------------------

const toggleLeftDrawer = () => {
  leftDrawerOpen.value = !leftDrawerOpen.value
}

const handleLogout = async () => {
  console.log('handleLogout called') // ✅ דיבוג: וודא שהפונקציה נקראת

  try {
    console.log('Starting logout process...') // ✅ דיבוג

    // ✅ שינוי: משתמש ב-authApi מ-db2rest במקום מ-supabase
    const success = await authApi.logout()

    console.log('Logout result:', success) // ✅ דיבוג

    if (success) {
      $q.notify({
        color: 'positive',
        message: i18n.global.t('loggedOutSuccessfully'),
        icon: 'logout',
      })

      console.log('Navigating to login...') // ✅ דיבוג
      await router.push('/login')
    } else {
      throw new Error('Logout failed')
    }
  } catch (error) {
    console.error('Logout error:', error) // ✅ שינוי: הוספתי את השגיאה ללוג

    $q.notify({
      color: 'negative',
      message: i18n.global.t('logoutError') || 'Logout failed',
      icon: 'error',
    })
  }
}

onMounted(async () => {
  try {
    // טוען את השפה הנוכחית בפורמט שעובד בוודאות
    // אם השפה היא עברית, נוודא שהיא נטענת נכון
    if (lang.value === 'he') {
      modules[`../../node_modules/quasar/lang/he.js`]()
        .then((langModule) => {
          i18n.global.locale.value = langModule.default.isoName
          $q.lang.set(langModule.default)
        })
        .catch((error) => {
          console.error('שגיאה בטעינת עברית:', error)
        })
    }

    await initStore()

    if (userStore && userStore.isAuthenticated) {
      notificationCount.value = userStore.notifications?.length || 0
    } else {
      notificationCount.value = 3 // ערך דוגמה
    }

    isReady.value = true
  } catch (error) {
    console.error('Error initializing store:', error)
    isReady.value = true
  }
})
</script>

<style>
/* סגנונות שהיו בקוד המקורי השני */
.language-select .q-field__native,
.language-select .q-item__label,
.language-select .q-select__dropdown-icon,
.language-select .q-field__control {
  color: black !important;
}

/* סגנונות אפשריים שיכולים לעזור ב-RTL */
[dir='rtl'] .q-item__section--side {
  padding-right: 0;
  padding-left: 16px;
}

[dir='rtl'] .q-item__section--avatar {
  padding-right: 0;
  padding-left: 16px;
}
</style>
