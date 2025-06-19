<!-- src/pages/CompaniesAdminPage.vue -->
<template>
  <q-page padding>
    <div class="row q-col-gutter-md">
      <div class="col-12">
        <div class="row items-center q-mb-md">
          <div class="text-h6">{{ $t('companiesAdministration') }}</div>
          <q-space />
          <q-btn color="primary" :label="$t('addCompany')" icon="add" @click="showAddCompanyForm" />
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
                <!--
                <q-btn
                  icon="visibility"
                  flat
                  round
                  dense
                  size="sm"
                  @click="viewCompany(props.row)"
                />
                -->
                <q-btn icon="edit" flat round dense size="sm" @click="editCompany(props.row)" />
                <q-btn
                  icon="delete"
                  flat
                  round
                  dense
                  size="sm"
                  color="negative"
                  @click="confirmDeleteCompany(props.row)"
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
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
// import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useCompaniesStore } from '../stores/companies'

const { t } = useI18n()
// const router = useRouter()
const $q = useQuasar()
const companiesStore = useCompaniesStore()

// Get loading state from store
const loading = computed(() => companiesStore.loading)

// Get companies data from store
const companies = computed(() => companiesStore.companies)

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
// const viewCompany = (company) => {
//   router.push({ name: 'companyDetails', params: { id: company.id } })
// }

const editCompany = (company) => {
  isEditing.value = true
  editedCompany.value = {
    id: company.id,
    name: company.name,
    companyId: company.company_id,
  }
  showAddCompanyDialog.value = true
}

const confirmDeleteCompany = (company) => {
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
    await companiesStore.fetchAllCompanies()
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
