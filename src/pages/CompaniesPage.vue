<!-- src/pages/CompaniesPage.vue -->
<template>
  <q-page padding>
    <!-- בדיקת הרשאות - הצגת הודעה אם אין הרשאה לניהול חברות -->
    <div v-if="!canManageCompanies" class="text-center q-pa-xl">
      <q-icon name="lock" size="4rem" color="grey" />
      <div class="text-h6 q-mt-md text-grey">{{ $t('insufficientPermissions') }}</div>
      <div class="text-body2 text-grey q-mt-sm">רק מנהלי מערכת יכולים לנהל חברות</div>
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
          <div class="text-h6">{{ $t('companiesAdministration') }}</div>
          <q-space />
          <q-btn
            color="primary"
            :label="$t('addCompany')"
            icon="add"
            @click="showAddCompanyForm"
            v-if="canManageCompanies"
          />
        </div>

        <q-table
          :rows="companies"
          :columns="companyColumns"
          row-key="id"
          :pagination="{ rowsPerPage: 10 }"
          :loading="loading"
        >
          <template v-slot:body="props">
            <q-tr :props="props">
              <q-td key="name" :props="props">{{ props.row.name }}</q-td>
              <q-td key="companyId" :props="props">{{ props.row.company_id }}</q-td>
              <q-td key="totalSites" :props="props">
                {{ props.row.total_sites || 0 }}
              </q-td>
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
                  @click="editCompany(props.row)"
                  v-if="canManageCompanies"
                />
                <q-btn
                  icon="delete"
                  flat
                  round
                  dense
                  size="sm"
                  color="negative"
                  @click="confirmDeleteCompany(props.row)"
                  v-if="canManageCompanies"
                />
              </q-td>
            </q-tr>
          </template>
        </q-table>
      </div>
    </div>

    <!-- Add/Edit Company Dialog -->
    <q-dialog v-model="showAddCompanyDialog" persistent>
      <q-card style="min-width: 350px">
        <q-card-section class="row items-center">
          <div class="text-h6">{{ isEditing ? $t('editCompany') : $t('addCompany') }}</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-separator />

        <q-card-section>
          <q-form @submit="saveCompany">
            <q-input
              v-model="editedCompany.name"
              :label="$t('companyName')"
              filled
              :rules="[(val) => !!val || $t('fieldRequired')]"
              class="q-mb-md"
            />

            <q-input
              v-model="editedCompany.companyId"
              :label="$t('companyId')"
              filled
              :rules="[(val) => !!val || $t('fieldRequired')]"
              class="q-mb-md"
              type="text"
              hint="מספר מזהה של החברה"
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
import { useCompaniesStore } from '../stores/companies'
import { useUserStore } from '../stores/user'

const { t } = useI18n()
const $q = useQuasar()
const companiesStore = useCompaniesStore()
const userStore = useUserStore()

// Get loading state from store
const loading = computed(() => companiesStore.loading)

// Get companies data from store
const companies = computed(() => companiesStore.companies)

// ========== בדיקת הרשאות ==========
// בדיקה שרק מנהל מערכת יכול לנהל חברות
const canManageCompanies = computed(() => {
  return userStore.isAdmin && userStore.currentUser?.role === 'System Admin'
})

// דיבוג הרשאות
watchEffect(() => {
  console.log('=== Companies Permission Debug ===')
  console.log('userStore.currentUser:', userStore.currentUser)
  console.log('userStore.isAuthenticated:', userStore.isAuthenticated)
  console.log('userStore.isAdmin:', userStore.isAdmin)
  console.log('currentUser.role:', userStore.currentUser?.role)
  console.log('canManageCompanies:', canManageCompanies.value)
  console.log('===================================')
})

// Company table columns
const companyColumns = ref([
  { name: 'name', label: t('companyName'), field: 'name', align: 'left', sortable: true },
  { name: 'companyId', label: t('companyId'), field: 'company_id', align: 'left', sortable: true },
  {
    name: 'totalSites',
    label: t('totalSites'),
    field: 'total_sites',
    align: 'center',
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

// Company dialog
const showAddCompanyDialog = ref(false)
const isEditing = ref(false)
const editedCompany = ref({
  name: '',
  companyId: '',
})

// Confirmation dialog
const confirmDeleteDialog = ref(false)
const confirmDeleteText = ref('')
const deleteCallback = ref(null)

// CRUD operations
const editCompany = (company) => {
  // בדיקת הרשאה נוספת לפני עריכה
  if (!canManageCompanies.value) {
    $q.notify({
      color: 'negative',
      textColor: 'white',
      icon: 'lock',
      message: t('insufficientPermissions'),
    })
    return
  }

  isEditing.value = true
  editedCompany.value = {
    id: company.id,
    name: company.name,
    companyId: company.company_id,
  }
  showAddCompanyDialog.value = true
}

const confirmDeleteCompany = (company) => {
  // בדיקת הרשאה נוספת לפני מחיקה
  if (!canManageCompanies.value) {
    $q.notify({
      color: 'negative',
      textColor: 'white',
      icon: 'lock',
      message: t('insufficientPermissions'),
    })
    return
  }

  confirmDeleteText.value = t('confirmDeleteCompany', { company: company.name })
  deleteCallback.value = async () => {
    try {
      await companiesStore.deleteCompany(company.id)
      $q.notify({
        color: 'positive',
        textColor: 'white',
        icon: 'check_circle',
        message: t('companyDeleted'),
      })
    } catch (error) {
      $q.notify({
        color: 'negative',
        textColor: 'white',
        icon: 'error',
        message: t('errorDeletingCompany'),
      })
      console.error('Error deleting company:', error)
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

const saveCompany = async () => {
  // בדיקת הרשאה נוספת לפני שמירה
  if (!canManageCompanies.value) {
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
      // Update existing company
      await companiesStore.updateCompany(editedCompany.value.id, {
        name: editedCompany.value.name,
        company_id: editedCompany.value.companyId,
      })

      $q.notify({
        color: 'positive',
        textColor: 'white',
        icon: 'check_circle',
        message: t('companyUpdated'),
      })
    } else {
      // Add new company
      await companiesStore.createCompany({
        name: editedCompany.value.name,
        company_id: editedCompany.value.companyId,
      })

      $q.notify({
        color: 'positive',
        textColor: 'white',
        icon: 'check_circle',
        message: t('companyAdded'),
      })
    }

    showAddCompanyDialog.value = false
    resetCompanyForm()
    await companiesStore.fetchAllCompanies()
  } catch (error) {
    $q.notify({
      color: 'negative',
      textColor: 'white',
      icon: 'error',
      message: isEditing.value ? t('errorUpdatingCompany') : t('errorAddingCompany'),
    })
    console.error('Error saving company:', error)
  }
}

const showAddCompanyForm = () => {
  // בדיקת הרשאה נוספת לפני הוספה
  if (!canManageCompanies.value) {
    $q.notify({
      color: 'negative',
      textColor: 'white',
      icon: 'lock',
      message: t('insufficientPermissions'),
    })
    return
  }

  resetCompanyForm()
  showAddCompanyDialog.value = true
}

const resetCompanyForm = () => {
  editedCompany.value = {
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
      console.log('Loading current user for companies page...')
      await userStore.loadCurrentUser()
    }

    // טען חברות רק אם יש הרשאה
    if (canManageCompanies.value) {
      await companiesStore.fetchAllCompanies()
    } else {
      console.log('User does not have permission to manage companies')
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
