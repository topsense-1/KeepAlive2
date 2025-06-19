<!-- src/pages/SitesAdminPage.vue -->
<template>
  <q-page padding>
    <div class="row q-col-gutter-md">
      <div class="col-12">
        <div class="row items-center q-mb-md">
          <div class="text-h6">{{ $t('sitesAdministration') }}</div>
          <q-space />
          <q-btn color="primary" :label="$t('addSite')" icon="add" @click="showAddSiteForm" />
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
              <q-td key="companyName" :props="props">{{ props.row.company_name || '-' }}</q-td>
              <q-td key="totalHouses" :props="props">
                {{ props.row.total_houses || 0 }}
              </q-td>
              <q-td key="actions" :props="props">
                <q-btn icon="edit" flat round dense size="sm" @click="editSite(props.row)" />
                <q-btn
                  icon="delete"
                  flat
                  round
                  dense
                  size="sm"
                  color="negative"
                  @click="confirmDeleteSite(props.row)"
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
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import { useSitesStore } from '../stores/sites'
import { useCompaniesStore } from '../stores/companies'

const { t } = useI18n()
const $q = useQuasar()
const sitesStore = useSitesStore()
const companiesStore = useCompaniesStore()

// Get loading state from store
const loading = computed(() => sitesStore.loading)

// Get sites data from store
const sites = computed(() => sitesStore.sites)

// Get companies for dropdown
const companies = computed(() => companiesStore.companies)

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
  isEditing.value = true
  editedSite.value = {
    id: site.id,
    name: site.name,
    companyId: site.company_id,
  }
  showAddSiteDialog.value = true
}

const confirmDeleteSite = (site) => {
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
    // Load both sites and companies
    await Promise.all([sitesStore.fetchAllSites(), companiesStore.fetchAllCompanies()])
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
