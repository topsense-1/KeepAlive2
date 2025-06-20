<!-- src/pages/SitesPage.vue -->
<template>
  <q-page padding>
    <!-- בדיקת הרשאות - הצגת הודעה אם אין הרשאה לניהול אתרים -->
    <div v-if="!canManageSites" class="text-center q-pa-xl">
      <q-icon name="lock" size="4rem" color="grey" />
      <div class="text-h6 q-mt-md text-grey">{{ $t('insufficientPermissions') }}</div>
      <div class="text-body2 text-grey q-mt-sm">רק מנהלי מערכת יכולים לנהל אתרים</div>
      <q-btn
        :label="$t('goHome')"
        color="primary"
        @click="$router.push('/dashboard')"
        class="q-mt-lg"
      />
    </div>

    <!-- תוכן הדף - רק אם יש הרשאה -->
    <div v-else class="row q-col-gutter-md">
      <div class="col-12">
        <div class="row items-center q-mb-md">
          <div class="text-h6">{{ $t('sitesAdministration') }}</div>
          <q-space />
          <q-btn
            color="primary"
            :label="$t('addSite')"
            icon="add"
            @click="showAddSiteForm"
            v-if="canManageSites"
          />
        </div>

        <q-table
          :rows="sites"
          :columns="siteColumns"
          row-key="id"
          :pagination="{ rowsPerPage: 10 }"
          :loading="loading"
        >
          <template v-slot:body="props">
            <q-tr :props="props">
              <q-td key="name" :props="props">{{ props.row.name }}</q-td>
              <q-td key="companyName" :props="props">{{ props.row.company_name }}</q-td>
              <q-td key="totalHouses" :props="props">
                {{ props.row.total_houses || 0 }}
              </q-td>
              <q-td key="actions" :props="props">
                <q-btn
                  icon="edit"
                  flat
                  round
                  dense
                  size="sm"
                  @click="editSite(props.row)"
                  v-if="canManageSites"
                />
                <q-btn
                  icon="delete"
                  flat
                  round
                  dense
                  size="sm"
                  color="negative"
                  @click="confirmDeleteSite(props.row)"
                  v-if="canManageSites"
                />
              </q-td>
            </q-tr>
          </template>
        </q-table>
      </div>
    </div>

    <!-- Add/Edit Site Dialog -->
    <q-dialog v-model="showAddSiteDialog" persistent>
      <q-card style="min-width: 350px">
        <q-card-section class="row items-center">
          <div class="text-h6">{{ isEditing ? $t('editSite') : $t('addSite') }}</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-separator />

        <q-card-section>
          <q-form @submit="saveSite">
            <q-input
              v-model="editedSite.name"
              :label="$t('siteName')"
              filled
              :rules="[(val) => !!val || $t('fieldRequired')]"
              class="q-mb-md"
            />

            <q-select
              v-model="editedSite.companyId"
              :options="companyOptions"
              :label="$t('company')"
              filled
              :rules="[(val) => !!val || $t('fieldRequired')]"
              class="q-mb-md"
              option-value="value"
              option-label="label"
              emit-value
              map-options
            />

            <div class="row justify-end q-mt-md">
              <q-btn flat :label="$t('cancel')" v-close-popup />
              <q-btn :label="$t('save')" type="submit" color="primary" class="q-ml-sm" />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Confirmation Dialog -->
    <q-dialog v-model="confirmDeleteDialog">
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="warning" color="negative" text-color="white" />
          <span class="q-ml-sm">{{ confirmDeleteText }}</span>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat :label="$t('cancel')" v-close-popup />
          <q-btn
            flat
            :label="$t('delete')"
            color="negative"
            @click="deleteConfirmed"
            v-close-popup
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import { useSitesStore } from '../stores/sites'
import { useCompaniesStore } from '../stores/companies'
import { useUserStore } from '../stores/user'

const { t } = useI18n()
const $q = useQuasar()
const sitesStore = useSitesStore()
const companiesStore = useCompaniesStore()
const userStore = useUserStore()

// Get loading state from store
const loading = computed(() => sitesStore.loading)

// Get sites data from store
const sites = computed(() => sitesStore.sites)

// Get companies for dropdown
const companies = computed(() => companiesStore.companies)

// ========== בדיקת הרשאות ==========
// בדיקה שרק מנהל מערכת יכול לנהל אתרים
const canManageSites = computed(() => {
  return userStore.isAdmin && userStore.currentUser?.role === 'System Admin'
})

// דיבוג הרשאות
watchEffect(() => {
  console.log('=== Sites Permission Debug ===')
  console.log('userStore.currentUser:', userStore.currentUser)
  console.log('userStore.isAuthenticated:', userStore.isAuthenticated)
  console.log('userStore.isAdmin:', userStore.isAdmin)
  console.log('currentUser.role:', userStore.currentUser?.role)
  console.log('canManageSites:', canManageSites.value)
  console.log('==================================')
})

// Company options for dropdown
const companyOptions = computed(() =>
  companies.value.map((company) => ({
    label: company.name,
    value: company.id,
  })),
)

// Site table columns
const siteColumns = ref([
  { name: 'name', label: t('siteName'), field: 'name', align: 'left', sortable: true },
  {
    name: 'companyName',
    label: t('company'),
    field: 'company_name',
    align: 'left',
    sortable: true,
  },
  {
    name: 'totalHouses',
    label: t('totalHouses'),
    field: 'total_houses',
    align: 'center',
    sortable: true,
  },
  { name: 'actions', label: t('actions'), field: 'actions', align: 'center' },
])

// Site dialog
const showAddSiteDialog = ref(false)
const isEditing = ref(false)
const editedSite = ref({
  name: '',
  companyId: '',
})

// Confirmation dialog
const confirmDeleteDialog = ref(false)
const confirmDeleteText = ref('')
const deleteCallback = ref(null)

// CRUD operations
const editSite = (site) => {
  // בדיקת הרשאה נוספת לפני עריכה
  if (!canManageSites.value) {
    $q.notify({
      color: 'negative',
      textColor: 'white',
      icon: 'lock',
      message: t('insufficientPermissions'),
    })
    return
  }

  isEditing.value = true
  editedSite.value = {
    id: site.id,
    name: site.name,
    companyId: site.company_id,
  }
  showAddSiteDialog.value = true
}

const confirmDeleteSite = (site) => {
  // בדיקת הרשאה נוספת לפני מחיקה
  if (!canManageSites.value) {
    $q.notify({
      color: 'negative',
      textColor: 'white',
      icon: 'lock',
      message: t('insufficientPermissions'),
    })
    return
  }

  confirmDeleteText.value = t('confirmDeleteSite', { site: site.name })
  deleteCallback.value = async () => {
    try {
      await sitesStore.deleteSite(site.id)
      $q.notify({
        color: 'positive',
        textColor: 'white',
        icon: 'check_circle',
        message: t('siteDeleted'),
      })
    } catch (error) {
      $q.notify({
        color: 'negative',
        textColor: 'white',
        icon: 'error',
        message: t('errorDeletingSite'),
      })
      console.error('Error deleting site:', error)
    }
  }
  confirmDeleteDialog.value = true
}

const deleteConfirmed = () => {
  if (deleteCallback.value) {
    deleteCallback.value()
    deleteCallback.value = null
  }
}

const saveSite = async () => {
  // בדיקת הרשאה נוספת לפני שמירה
  if (!canManageSites.value) {
    $q.notify({
      color: 'negative',
      textColor: 'white',
      icon: 'lock',
      message: t('insufficientPermissions'),
    })
    return
  }

  try {
    if (isEditing.value) {
      // Update existing site
      await sitesStore.updateSite(editedSite.value.id, {
        name: editedSite.value.name,
        company_id: editedSite.value.companyId,
      })

      $q.notify({
        color: 'positive',
        textColor: 'white',
        icon: 'check_circle',
        message: t('siteUpdated'),
      })
    } else {
      // Add new site
      await sitesStore.createSite({
        name: editedSite.value.name,
        company_id: editedSite.value.companyId,
      })

      $q.notify({
        color: 'positive',
        textColor: 'white',
        icon: 'check_circle',
        message: t('siteAdded'),
      })
    }

    showAddSiteDialog.value = false
    resetSiteForm()
    await sitesStore.fetchAllSites()
  } catch (error) {
    $q.notify({
      color: 'negative',
      textColor: 'white',
      icon: 'error',
      message: isEditing.value ? t('errorUpdatingSite') : t('errorAddingSite'),
    })
    console.error('Error saving site:', error)
  }
}

const showAddSiteForm = () => {
  // בדיקת הרשאה נוספת לפני הוספה
  if (!canManageSites.value) {
    $q.notify({
      color: 'negative',
      textColor: 'white',
      icon: 'lock',
      message: t('insufficientPermissions'),
    })
    return
  }

  resetSiteForm()
  showAddSiteDialog.value = true
}

const resetSiteForm = () => {
  editedSite.value = {
    name: '',
    companyId: '',
  }
  isEditing.value = false
}

// Add onMounted hook to load initial data
onMounted(async () => {
  try {
    // ודא שנתוני המשתמש נטענו
    if (!userStore.currentUser) {
      console.log('Loading current user for sites page...')
      await userStore.loadCurrentUser()
    }

    // טען נתונים רק אם יש הרשאה
    if (canManageSites.value) {
      // Load both sites and companies
      await Promise.all([sitesStore.fetchAllSites(), companiesStore.fetchAllCompanies()])
    } else {
      console.log('User does not have permission to manage sites')
    }
  } catch (error) {
    console.error('Error loading initial data:', error)
    $q.notify({
      color: 'negative',
      textColor: 'white',
      icon: 'error',
      message: t('errorLoadingData'),
      timeout: 5000,
    })
  }
})
</script>
