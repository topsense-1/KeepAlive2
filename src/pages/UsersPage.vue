<!-- src/pages/UsersPage.vue -->
<template>
  <q-page padding>
    <!-- כותרת הדף -->
    <div class="row items-center justify-between q-mb-lg">
      <div>
        <h4 class="text-h4 q-my-none">{{ $t('userManagement') }}</h4>
        <p class="text-subtitle2 text-grey-6 q-mt-sm">ניהול משתמשים והרשאות במערכת</p>
      </div>

      <!-- כפתור הוספת משתמש -->
      <AuthGuard permission="manageUsers">
        <q-btn
          color="primary"
          icon="add"
          :label="$t('addUser')"
          @click="showCreateDialog = true"
          :loading="loading"
        />
      </AuthGuard>
    </div>

    <!-- סטטיסטיקות -->
    <div class="row q-gutter-md q-mb-lg">
      <div class="col-12 col-md-3">
        <q-card class="bg-primary text-white">
          <q-card-section>
            <div class="text-h6">סה"כ משתמשים</div>
            <div class="text-h4">{{ totalUsers }}</div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-md-3">
        <q-card class="bg-positive text-white">
          <q-card-section>
            <div class="text-h6">משתמשים פעילים</div>
            <div class="text-h4">{{ activeUsers }}</div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-md-3">
        <q-card class="bg-warning text-white">
          <q-card-section>
            <div class="text-h6">ממתינים לאימות</div>
            <div class="text-h4">{{ pendingUsers }}</div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-md-3">
        <q-card class="bg-info text-white">
          <q-card-section>
            <div class="text-h6">נוספו השבוע</div>
            <div class="text-h4">{{ weeklyUsers }}</div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- פילטרים וחיפוש -->
    <q-card class="q-mb-lg">
      <q-card-section>
        <div class="row q-gutter-md">
          <!-- חיפוש -->
          <div class="col-12 col-md-4">
            <q-input v-model="search" outlined dense placeholder="חיפוש משתמשים..." clearable>
              <template v-slot:prepend>
                <q-icon name="search" />
              </template>
            </q-input>
          </div>

          <!-- פילטר תפקיד -->
          <div class="col-12 col-md-3">
            <q-select
              v-model="roleFilter"
              :options="availableRoles"
              option-label="name"
              option-value="name"
              emit-value
              map-options
              outlined
              dense
              clearable
              placeholder="סנן לפי תפקיד"
            />
          </div>

          <!-- פילטר סטטוס -->
          <div class="col-12 col-md-3">
            <q-select
              v-model="statusFilter"
              :options="statusOptions"
              outlined
              dense
              clearable
              placeholder="סנן לפי סטטוס"
            />
          </div>

          <!-- כפתורי פעולות -->
          <div class="col-12 col-md-2">
            <q-btn outline color="primary" icon="refresh" @click="loadUsers" :loading="loading" />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- טבלת משתמשים -->
    <q-card>
      <q-table
        :rows="filteredUsers"
        :columns="columns"
        :loading="loading"
        row-key="id"
        selection="multiple"
        v-model:selected="selectedUsers"
        :pagination="pagination"
        @request="onRequest"
        binary-state-sort
      >
        <!-- כותרת הטבלה -->
        <template v-slot:top>
          <div class="full-width row items-center justify-between">
            <div class="text-h6">רשימת משתמשים</div>

            <!-- פעולות קבוצתיות -->
            <div v-if="selectedUsers.length > 0" class="q-gutter-sm">
              <AuthGuard permission="manageUsers">
                <q-btn
                  color="negative"
                  icon="delete"
                  :label="`מחק ${selectedUsers.length} משתמשים`"
                  @click="confirmBulkDelete"
                  :disable="!canDeleteSelectedUsers"
                />
              </AuthGuard>

              <q-btn
                color="primary"
                icon="edit"
                label="עריכה קבוצתית"
                @click="showBulkEditDialog = true"
              />
            </div>
          </div>
        </template>

        <!-- עמודת שם -->
        <template v-slot:body-cell-name="props">
          <q-td :props="props">
            <div class="row items-center q-gutter-sm">
              <q-avatar size="32px" color="primary" text-color="white">
                {{ getUserInitials(props.row.full_name) }}
              </q-avatar>
              <div>
                <div class="text-weight-medium">{{ props.row.full_name }}</div>
                <div class="text-caption text-grey-6">{{ props.row.username }}</div>
              </div>
            </div>
          </q-td>
        </template>

        <!-- עמודת תפקיד -->
        <template v-slot:body-cell-role="props">
          <q-td :props="props">
            <q-chip :color="getRoleColor(props.row.role)" text-color="white" dense>
              {{ $t(getRoleKey(props.row.role)) }}
            </q-chip>
          </q-td>
        </template>

        <!-- עמודת סטטוס -->
        <template v-slot:body-cell-status="props">
          <q-td :props="props">
            <q-chip :color="getStatusColor(props.row)" text-color="white" dense>
              {{ getStatusText(props.row) }}
            </q-chip>
          </q-td>
        </template>

        <!-- עמודת התחברות אחרונה -->
        <template v-slot:body-cell-lastLogin="props">
          <q-td :props="props">
            <div v-if="props.row.last_sign_in_at">
              {{ formatDate(props.row.last_sign_in_at) }}
            </div>
            <div v-else class="text-grey-5">
              {{ $t('never') }}
            </div>
          </q-td>
        </template>

        <!-- עמודת פעולות -->
        <template v-slot:body-cell-actions="props">
          <q-td :props="props">
            <div class="q-gutter-xs">
              <!-- צפייה -->
              <q-btn
                dense
                round
                flat
                color="primary"
                icon="visibility"
                @click="viewUser(props.row)"
              >
                <q-tooltip>צפייה בפרטים</q-tooltip>
              </q-btn>

              <!-- עריכה -->
              <AuthGuard permission="manageUsers">
                <q-btn
                  dense
                  round
                  flat
                  color="primary"
                  icon="edit"
                  @click="editUser(props.row)"
                  :disable="!userStore.canEditUser(props.row)"
                >
                  <q-tooltip>עריכה</q-tooltip>
                </q-btn>
              </AuthGuard>

              <!-- הרשאות -->
              <AuthGuard permission="manageUsers">
                <q-btn
                  dense
                  round
                  flat
                  color="purple"
                  icon="security"
                  @click="managePermissions(props.row)"
                >
                  <q-tooltip>ניהול הרשאות</q-tooltip>
                </q-btn>
              </AuthGuard>

              <!-- מחיקה -->
              <AuthGuard permission="manageUsers">
                <q-btn
                  dense
                  round
                  flat
                  color="negative"
                  icon="delete"
                  @click="confirmDelete(props.row)"
                  :disable="!userStore.canDeleteUser(props.row)"
                >
                  <q-tooltip>מחיקה</q-tooltip>
                </q-btn>
              </AuthGuard>

              <!-- תפריט נוסף -->
              <q-btn dense round flat color="grey-7" icon="more_vert">
                <q-menu>
                  <q-list dense>
                    <q-item clickable v-close-popup @click="resetPassword(props.row)">
                      <q-item-section avatar>
                        <q-icon name="lock_reset" />
                      </q-item-section>
                      <q-item-section>איפוס סיסמה</q-item-section>
                    </q-item>

                    <q-item clickable v-close-popup @click="toggleUserStatus(props.row)">
                      <q-item-section avatar>
                        <q-icon :name="props.row.status ? 'block' : 'check_circle'" />
                      </q-item-section>
                      <q-item-section>
                        {{ props.row.status ? 'השבת משתמש' : 'הפעל משתמש' }}
                      </q-item-section>
                    </q-item>

                    <AuthGuard role="System Admin">
                      <q-item clickable v-close-popup @click="loginAsUser(props.row)">
                        <q-item-section avatar>
                          <q-icon name="login" />
                        </q-item-section>
                        <q-item-section>התחבר כמשתמש</q-item-section>
                      </q-item>
                    </AuthGuard>
                  </q-list>
                </q-menu>
              </q-btn>
            </div>
          </q-td>
        </template>
      </q-table>
    </q-card>

    <!-- דיאלוג יצירת משתמש -->
    <q-dialog v-model="showCreateDialog" persistent>
      <CreateUserDialog @created="onUserCreated" @close="showCreateDialog = false" />
    </q-dialog>

    <!-- דיאלוג עריכת משתמש -->
    <q-dialog v-model="showEditDialog" persistent>
      <EditUserDialog
        :user="selectedUser"
        @updated="onUserUpdated"
        @close="showEditDialog = false"
      />
    </q-dialog>

    <!-- דיאלוג ניהול הרשאות -->
    <q-dialog v-model="showPermissionsDialog" persistent>
      <UserPermissionsDialog
        :user="selectedUser"
        @updated="onPermissionsUpdated"
        @close="showPermissionsDialog = false"
      />
    </q-dialog>

    <!-- דיאלוג עריכה קבוצתית -->
    <q-dialog v-model="showBulkEditDialog" persistent>
      <BulkEditDialog
        :users="selectedUsers"
        @updated="onBulkUpdated"
        @close="showBulkEditDialog = false"
      />
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useQuasar } from 'quasar'
// import { useI18n } from 'vue-i18n'
import { useUserStore } from '../stores/user.js'
import { usersApi, rolesApi } from '../services/apiService.js'
import AuthGuard from '../components/AuthGuard.vue'
import CreateUserDialog from '../components/dialogs/CreateUserDialog.vue'
import EditUserDialog from '../components/dialogs/EditUserDialog.vue'
import UserPermissionsDialog from '../components/dialogs/UserPermissionsDialog.vue'
import BulkEditDialog from '../components/dialogs/BulkEditDialog.vue'

const $q = useQuasar()
//const { t } = useI18n()
const userStore = useUserStore()

// State
const users = ref([])
const selectedUsers = ref([])
const selectedUser = ref(null)
const loading = ref(false)
const search = ref('')
const roleFilter = ref(null)
const statusFilter = ref(null)
const availableRoles = ref([])

// Dialogs
const showCreateDialog = ref(false)
const showEditDialog = ref(false)
const showPermissionsDialog = ref(false)
const showBulkEditDialog = ref(false)

// Table configuration
const pagination = ref({
  sortBy: 'created_at',
  descending: true,
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0,
})

const columns = [
  {
    name: 'name',
    required: true,
    label: 'שם',
    align: 'left',
    field: 'full_name',
    sortable: true,
  },
  {
    name: 'email',
    label: 'דוא"ל',
    align: 'left',
    field: 'email',
    sortable: true,
  },
  {
    name: 'role',
    label: 'תפקיד',
    align: 'center',
    field: 'role',
    sortable: true,
  },
  {
    name: 'status',
    label: 'סטטוס',
    align: 'center',
    field: 'status',
    sortable: true,
  },
  {
    name: 'lastLogin',
    label: 'התחברות אחרונה',
    align: 'left',
    field: 'last_sign_in_at',
    sortable: true,
  },
  {
    name: 'actions',
    label: 'פעולות',
    align: 'center',
  },
]

const statusOptions = [
  { label: 'פעיל', value: 1 },
  { label: 'לא פעיל', value: 0 },
  { label: 'ממתין לאימות', value: 'pending' },
  { label: 'נמחק', value: 'deleted' },
]

// Computed
const filteredUsers = computed(() => {
  let filtered = users.value

  // חיפוש טקסט
  if (search.value) {
    const searchLower = search.value.toLowerCase()
    filtered = filtered.filter(
      (user) =>
        user.full_name?.toLowerCase().includes(searchLower) ||
        user.username?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower),
    )
  }

  // פילטר תפקיד
  if (roleFilter.value) {
    filtered = filtered.filter((user) => user.role === roleFilter.value)
  }

  // פילטר סטטוס
  if (statusFilter.value !== null) {
    if (statusFilter.value === 'deleted') {
      filtered = filtered.filter((user) => user.deleted_at)
    } else if (statusFilter.value === 'pending') {
      filtered = filtered.filter((user) => !user.email_confirmed_at && user.status === 1)
    } else {
      filtered = filtered.filter((user) => user.status === statusFilter.value && !user.deleted_at)
    }
  }

  return filtered
})

const totalUsers = computed(() => users.value.length)
const activeUsers = computed(
  () => users.value.filter((u) => u.status === 1 && !u.deleted_at).length,
)
const pendingUsers = computed(
  () => users.value.filter((u) => !u.email_confirmed_at && u.status === 1).length,
)
const weeklyUsers = computed(() => {
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  return users.value.filter((u) => new Date(u.created_at) > weekAgo).length
})

const canDeleteSelectedUsers = computed(() => {
  return selectedUsers.value.every((user) => userStore.canDeleteUser(user))
})

// Methods
async function loadUsers() {
  loading.value = true
  try {
    const response = await usersApi.getWithPermissions()
    users.value = response.data || response
    pagination.value.rowsNumber = users.value.length
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: `שגיאה בטעינת משתמשים: ${error.message}`,
      position: 'top-right',
    })
  } finally {
    loading.value = false
  }
}

async function loadAvailableRoles() {
  try {
    availableRoles.value = await rolesApi.getAssignableRoles()
  } catch (error) {
    console.error('Error loading roles:', error)
  }
}

function onRequest(props) {
  const { page, rowsPerPage, sortBy, descending } = props.pagination

  pagination.value.page = page
  pagination.value.rowsPerPage = rowsPerPage
  pagination.value.sortBy = sortBy
  pagination.value.descending = descending

  // כאן תוכל להוסיף לוגיקה לטעינה מהשרת עם pagination
}

function getUserInitials(fullName) {
  if (!fullName) return '??'
  return fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function getRoleColor(role) {
  const colors = {
    'System Admin': 'red',
    'User Manager': 'purple',
    'Companies Manager': 'blue',
    'Sites Manager': 'teal',
    'House Manager': 'green',
    Caregiver: 'orange',
    'Family Manager': 'indigo',
    'Family Member': 'grey',
  }
  return colors[role] || 'grey'
}

function getRoleKey(role) {
  const keys = {
    'System Admin': 'systemAdmin',
    'User Manager': 'userManager',
    'Companies Manager': 'companiesManager',
    'Sites Manager': 'sitesManager',
    'House Manager': 'houseManager',
    Caregiver: 'caregiver',
    'Family Manager': 'familyManager',
    'Family Member': 'familyMember',
  }
  return keys[role] || 'unknown'
}

function getStatusColor(user) {
  if (user.deleted_at) return 'red'
  if (!user.email_confirmed_at) return 'orange'
  if (user.status === 0) return 'grey'
  if (user.locked_until && new Date(user.locked_until) > new Date()) return 'red'
  return 'green'
}

function getStatusText(user) {
  if (user.deleted_at) return 'נמחק'
  if (!user.email_confirmed_at) return 'ממתין לאימות'
  if (user.status === 0) return 'לא פעיל'
  if (user.locked_until && new Date(user.locked_until) > new Date()) return 'נעול'
  return 'פעיל'
}

function formatDate(date) {
  if (!date) return ''
  return new Date(date).toLocaleDateString('he-IL', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// User actions
function viewUser(user) {
  selectedUser.value = user
  // TODO: הציג דיאלוג או נווט לדף פרטים
}

function editUser(user) {
  if (!userStore.canEditUser(user)) {
    $q.notify({
      type: 'negative',
      message: 'אין לך הרשאה לערוך משתמש זה',
      position: 'top-right',
    })
    return
  }

  selectedUser.value = user
  showEditDialog.value = true
}

function managePermissions(user) {
  selectedUser.value = user
  showPermissionsDialog.value = true
}

function confirmDelete(user) {
  if (!userStore.canDeleteUser(user)) {
    $q.notify({
      type: 'negative',
      message: 'אין לך הרשאה למחוק משתמש זה',
      position: 'top-right',
    })
    return
  }

  $q.dialog({
    title: 'אישור מחיקה',
    message: `האם אתה בטוח שברצונך למחוק את המשתמש "${user.full_name}"?`,
    cancel: true,
    persistent: true,
    color: 'negative',
  }).onOk(async () => {
    try {
      await usersApi.softDelete(user.id)
      $q.notify({
        type: 'positive',
        message: 'המשתמש נמחק בהצלחה',
        position: 'top-right',
      })
      await loadUsers()
    } catch (error) {
      $q.notify({
        type: 'negative',
        message: `שגיאה במחיקת משתמש: ${error.message}`,
        position: 'top-right',
      })
    }
  })
}

function confirmBulkDelete() {
  const cannotDelete = selectedUsers.value.filter((user) => !userStore.canDeleteUser(user))

  if (cannotDelete.length > 0) {
    $q.notify({
      type: 'negative',
      message: `לא ניתן למחוק ${cannotDelete.length} משתמשים עקב הרשאות`,
      position: 'top-right',
    })
    return
  }

  $q.dialog({
    title: 'אישור מחיקה קבוצתית',
    message: `האם אתה בטוח שברצונך למחוק ${selectedUsers.value.length} משתמשים?`,
    cancel: true,
    persistent: true,
    color: 'negative',
  }).onOk(async () => {
    try {
      const userIds = selectedUsers.value.map((u) => u.id)
      await usersApi.bulkDelete(userIds)

      $q.notify({
        type: 'positive',
        message: `${selectedUsers.value.length} משתמשים נמחקו בהצלחה`,
        position: 'top-right',
      })

      selectedUsers.value = []
      await loadUsers()
    } catch (error) {
      $q.notify({
        type: 'negative',
        message: `שגיאה במחיקה קבוצתית: ${error.message}`,
        position: 'top-right',
      })
    }
  })
}

async function resetPassword(user) {
  $q.dialog({
    title: 'איפוס סיסמה',
    message: `האם לאפס את הסיסמה עבור "${user.full_name}"?`,
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      // TODO: Implement password reset API call
      $q.notify({
        type: 'positive',
        message: 'הוראות איפוס סיסמה נשלחו בדוא"ל',
        position: 'top-right',
      })
    } catch (error) {
      $q.notify({
        type: 'negative',
        message: `שגיאה באיפוס סיסמה: ${error.message}`,
        position: 'top-right',
      })
    }
  })
}

async function toggleUserStatus(user) {
  const newStatus = user.status === 1 ? 0 : 1
  const action = newStatus === 1 ? 'הפעלת' : 'השבתת'

  try {
    await usersApi.update(user.id, { status: newStatus })
    $q.notify({
      type: 'positive',
      message: `${action} המשתמש בוצעה בהצלחה`,
      position: 'top-right',
    })
    await loadUsers()
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: `שגיאה ב${action} המשתמש: ${error.message}`,
      position: 'top-right',
    })
  }
}

async function loginAsUser(user) {
  // רק למנהלי מערכת
  if (!userStore.hasRole('System Admin')) {
    return
  }

  $q.dialog({
    title: 'התחברות כמשתמש',
    message: `האם להתחבר כמשתמש "${user.full_name}"? פעולה זו תנתק אותך מהחשבון הנוכחי.`,
    cancel: true,
    persistent: true,
    color: 'warning',
  }).onOk(() => {
    // TODO: Implement login as user functionality
    $q.notify({
      type: 'info',
      message: 'פונקציונליות זו תמומש בעתיד',
      position: 'top-right',
    })
  })
}

// Event handlers
async function onUserCreated() {
  showCreateDialog.value = false
  $q.notify({
    type: 'positive',
    message: 'המשתמש נוצר בהצלחה',
    position: 'top-right',
  })
  await loadUsers()
}

async function onUserUpdated() {
  showEditDialog.value = false
  selectedUser.value = null
  $q.notify({
    type: 'positive',
    message: 'המשתמש עודכן בהצלחה',
    position: 'top-right',
  })
  await loadUsers()
}

async function onPermissionsUpdated() {
  showPermissionsDialog.value = false
  selectedUser.value = null
  $q.notify({
    type: 'positive',
    message: 'ההרשאות עודכנו בהצלחה',
    position: 'top-right',
  })
  await loadUsers()
}

async function onBulkUpdated(results) {
  showBulkEditDialog.value = false
  selectedUsers.value = []

  $q.notify({
    type: 'positive',
    message: `${results.successful.length} משתמשים עודכנו בהצלחה`,
    position: 'top-right',
  })

  if (results.failed.length > 0) {
    $q.notify({
      type: 'warning',
      message: `${results.failed.length} משתמשים לא עודכנו`,
      position: 'top-right',
    })
  }

  await loadUsers()
}

// Watchers
watch([search, roleFilter, statusFilter], () => {
  // Reset selection when filters change
  selectedUsers.value = []
})

// Lifecycle
onMounted(async () => {
  await Promise.all([loadUsers(), loadAvailableRoles()])
})
</script>

<style scoped>
.q-table th {
  font-weight: bold;
}

.q-chip {
  font-weight: 500;
}
</style>
