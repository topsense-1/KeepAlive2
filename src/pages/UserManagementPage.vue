<!-- src/pages/UserManagementPage.vue -->
<template>
  <q-page padding>
    <div class="row q-col-gutter-md">
      <div class="col-12">
        <div class="row items-center q-mb-md">
          <div class="text-h6">{{ $t('userManagement') }}</div>
          <q-space />
          <q-btn
            color="primary"
            :label="$t('addUser')"
            icon="person_add"
            @click="addNewUser"
            v-if="canManageUsers"
            class="q-mr-sm"
          />
          <q-btn color="primary" :label="$t('refreshUsers')" icon="refresh" @click="loadUsers" />
        </div>

        <q-table
          :rows="filteredUsers"
          :columns="userColumns"
          row-key="id"
          :pagination="{ rowsPerPage: 10 }"
          :loading="loading"
          :filter="searchFilter"
        >
          <template v-slot:top-right>
            <q-input
              borderless
              dense
              debounce="300"
              v-model="searchFilter"
              :placeholder="$t('searchUsers')"
            >
              <template v-slot:append>
                <q-icon name="search" />
              </template>
            </q-input>
          </template>

          <template v-slot:body="props">
            <q-tr :props="props" :class="{ 'bg-red-1': props.row.deleted_at }">
              <q-td key="name" :props="props">
                <div class="row items-center">
                  <q-avatar size="32px">
                    <img :src="props.row.avatar || getDefaultAvatar(props.row.full_name)" />
                  </q-avatar>
                  <div class="q-ml-sm">
                    <div>{{ props.row.full_name || props.row.email?.split('@')[0] }}</div>
                    <div class="text-caption text-grey-6" v-if="props.row.deleted_at">
                      {{ $t('deletedUser') }}
                    </div>
                  </div>
                </div>
              </q-td>
              <q-td key="email" :props="props">{{ props.row.email }}</q-td>
              <q-td key="phone" :props="props">{{ props.row.phone || '-' }}</q-td>
              <q-td key="israeliId" :props="props">{{ props.row.israeli_id || '-' }}</q-td>
              <q-td key="city" :props="props">{{ props.row.city || '-' }}</q-td>
              <q-td key="role" :props="props">
                <q-badge :color="getRoleColor(props.row.role)">
                  {{ getRoleLabel(props.row.role) }}
                </q-badge>
              </q-td>
              <q-td key="assignedHouses" :props="props">
                <!-- Show "All houses" if user is System Admin or assigned to all houses -->
                <div v-if="isAssignedToAllHouses(props.row)">
                  <q-chip
                    icon="domain"
                    :color="props.row.role === 'System Admin' ? 'purple' : 'primary'"
                    text-color="white"
                    size="sm"
                  >
                    {{ $t('assignedToAllHouses') }}
                    <q-tooltip v-if="props.row.role === 'System Admin'">
                      {{ $t('systemAdminAllHousesInfo') }}
                    </q-tooltip>
                  </q-chip>
                </div>

                <!-- Show individual house chips if not assigned to all -->
                <div v-else-if="props.row.assignedHouses?.length">
                  <q-chip
                    v-for="house in props.row.assignedHouses"
                    :key="house.id"
                    size="sm"
                    class="q-mr-xs"
                  >
                    {{ house.name }}
                  </q-chip>
                </div>

                <!-- Show "no houses" if no assignments -->
                <span v-else class="text-grey">{{ $t('noAssignedHouses') }}</span>
              </q-td>
              <q-td key="status" :props="props">
                <q-badge
                  :color="getStatusColor(props.row.email_confirmed_at, props.row.deleted_at)"
                >
                  {{ getStatusLabel(props.row.email_confirmed_at, props.row.deleted_at) }}
                </q-badge>
              </q-td>
              <q-td key="lastLogin" :props="props">
                {{ formatDate(props.row.last_sign_in_at) }}
              </q-td>
              <q-td key="actions" :props="props">
                <!-- House Assignment -->
                <q-btn
                  icon="home"
                  flat
                  round
                  dense
                  size="sm"
                  :disable="props.row.role === 'System Admin' || props.row.deleted_at"
                  @click="editUserHouses(props.row)"
                >
                  <q-tooltip>
                    {{
                      props.row.role === 'System Admin'
                        ? $t('systemAdminAutoAssigned')
                        : $t('manageHouseAssignment')
                    }}
                  </q-tooltip>
                </q-btn>

                <!-- Permissions -->
                <q-btn
                  icon="vpn_key"
                  flat
                  round
                  dense
                  size="sm"
                  :disable="props.row.deleted_at"
                  @click="managePermissions(props.row)"
                >
                  <q-tooltip>{{ $t('managePermissions') }}</q-tooltip>
                </q-btn>

                <!-- Edit User -->
                <q-btn
                  icon="edit"
                  flat
                  round
                  dense
                  size="sm"
                  color="primary"
                  :disable="!canEditUser(props.row) || props.row.deleted_at"
                  @click="editUser(props.row)"
                  v-if="canManageUsers"
                >
                  <q-tooltip>{{ $t('editUser') }}</q-tooltip>
                </q-btn>

                <!-- Delete/Restore User -->
                <q-btn
                  :icon="props.row.deleted_at ? 'restore' : 'delete'"
                  flat
                  round
                  dense
                  size="sm"
                  :color="props.row.deleted_at ? 'positive' : 'negative'"
                  :disable="!canDeleteUser(props.row)"
                  @click="props.row.deleted_at ? restoreUser(props.row) : deleteUser(props.row)"
                  v-if="canManageUsers"
                >
                  <q-tooltip>
                    {{ props.row.deleted_at ? $t('restoreUser') : $t('deleteUser') }}
                  </q-tooltip>
                </q-btn>
              </q-td>
            </q-tr>
          </template>
        </q-table>
      </div>
    </div>

    <!-- Add/Edit User Dialog -->
    <q-dialog v-model="showUserDialog" persistent>
      <q-card style="min-width: 600px; max-width: 800px">
        <q-card-section class="row items-center">
          <div class="text-h6">
            {{ isEditMode ? $t('editUser') : $t('addUser') }}
            <span v-if="isEditMode && editedUser.full_name">- {{ editedUser.full_name }}</span>
          </div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-separator />

        <q-card-section class="q-pt-none" style="max-height: 70vh; overflow-y: auto">
          <q-form @submit="saveUser" ref="userForm" class="q-gutter-md">
            <div class="row q-gutter-md">
              <!-- Left Column -->
              <div class="col-12 col-md-5">
                <q-input
                  v-model="editedUser.full_name"
                  :label="$t('fullName') + ' *'"
                  filled
                  :rules="[(val) => !!val || $t('fieldRequired')]"
                />

                <q-input
                  v-model="editedUser.email"
                  :label="$t('email') + ' *'"
                  type="email"
                  filled
                  :rules="[
                    (val) => !!val || $t('fieldRequired'),
                    (val) => isValidEmail(val) || $t('invalidEmail'),
                  ]"
                />

                <q-input
                  v-model="editedUser.phone"
                  :label="$t('phone')"
                  filled
                  mask="###-###-####"
                />

                <q-input
                  v-model="editedUser.israeli_id"
                  :label="$t('israeliId')"
                  filled
                  mask="#########"
                  :rules="[(val) => !val || isValidIsraeliId(val) || $t('invalidIsraeliId')]"
                />

                <q-select
                  v-model="editedUser.role"
                  :options="availableRoleOptions"
                  :label="$t('role') + ' *'"
                  filled
                  emit-value
                  map-options
                  :rules="[(val) => !!val || $t('fieldRequired')]"
                />
              </div>

              <!-- Right Column -->
              <div class="col-12 col-md-6">
                <q-input
                  v-model="editedUser.address"
                  :label="$t('address')"
                  filled
                  type="textarea"
                  rows="2"
                />

                <q-input v-model="editedUser.city" :label="$t('city')" filled />

                <!-- House Assignment -->
                <q-select
                  v-model="editedUser.assignedHouses"
                  :options="availableHouses"
                  :label="$t('assignedHouses')"
                  :loading="loadingHouses"
                  :disable="editedUser.role === 'System Admin'"
                  option-label="name"
                  option-value="id"
                  filled
                  multiple
                  use-chips
                  emit-value
                  map-options
                />

                <!-- Password Section -->
                <div class="q-mt-md">
                  <div class="text-subtitle2 q-mb-sm">{{ $t('passwordSettings') }}</div>

                  <div v-if="!isEditMode">
                    <q-checkbox
                      v-model="sendEmailInvitation"
                      :label="$t('sendEmailInvitation')"
                      class="q-mb-md"
                    />

                    <q-input
                      v-if="!sendEmailInvitation"
                      v-model="editedUser.password"
                      :label="$t('temporaryPassword') + ' *'"
                      :type="showPassword ? 'text' : 'password'"
                      filled
                      :rules="[(val) => !!val || $t('fieldRequired')]"
                    >
                      <template v-slot:append>
                        <q-icon
                          :name="showPassword ? 'visibility_off' : 'visibility'"
                          class="cursor-pointer"
                          @click="showPassword = !showPassword"
                        />
                        <q-btn
                          flat
                          dense
                          icon="refresh"
                          @click="generateRandomPassword"
                          class="q-ml-xs"
                        >
                          <q-tooltip>{{ $t('generatePassword') }}</q-tooltip>
                        </q-btn>
                      </template>
                    </q-input>
                  </div>

                  <div v-if="isEditMode">
                    <q-checkbox
                      v-model="resetPassword"
                      :label="$t('resetPassword')"
                      class="q-mb-sm"
                    />
                    <div class="text-caption text-grey-6" v-if="resetPassword">
                      {{ $t('resetPasswordInfo') }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </q-form>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right">
          <q-btn flat :label="$t('cancel')" @click="closeUserDialog" />
          <q-btn :label="$t('save')" color="primary" @click="saveUser" :loading="saving" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- House Assignment Dialog (existing) -->
    <q-dialog v-model="showHouseAssignmentDialog" persistent>
      <q-card style="min-width: 400px">
        <q-card-section class="row items-center">
          <div class="text-h6">
            {{ $t('manageHouseAssignment') }} - {{ editedUserHouses.full_name }}
          </div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-separator />

        <q-card-section>
          <!-- System Admin Information -->
          <div v-if="editedUserHouses.role === 'System Admin'" class="text-center q-pa-md">
            <q-icon name="admin_panel_settings" size="64px" color="purple" class="q-mb-md" />
            <div class="text-h6 text-purple q-mb-sm">{{ $t('systemAdminUser') }}</div>
            <div class="text-body2 text-grey-7 q-mb-md">
              {{ $t('systemAdminAutoAccessInfo') }}
            </div>
            <q-chip icon="domain" color="purple" text-color="white" size="lg">
              {{ $t('assignedToAllHouses') }}
            </q-chip>

            <div class="row justify-center q-mt-lg">
              <q-btn :label="$t('understood')" color="purple" @click="closeHouseAssignmentDialog" />
            </div>
          </div>

          <!-- Regular User Form -->
          <q-form v-else @submit="saveHouseAssignment" ref="houseForm">
            <!-- All Houses Checkbox -->
            <div class="q-mb-md">
              <q-checkbox
                v-model="assignAllHouses"
                :label="$t('assignAllHouses')"
                @update:model-value="handleAllHousesToggle"
                color="primary"
              />
              <div class="text-caption text-grey-6 q-mt-xs">
                {{ $t('assignAllHousesDesc') }}
              </div>
            </div>

            <q-separator class="q-mb-md" />

            <!-- Individual House Selection -->
            <q-select
              v-model="editedUserHouses.assignedHouses"
              :options="availableHouses"
              :label="$t('specificHouses')"
              :loading="loadingHouses"
              :disable="assignAllHouses"
              option-label="name"
              option-value="id"
              filled
              multiple
              use-chips
              emit-value
              map-options
              class="q-mb-md"
              @update:model-value="handleSpecificHousesChange"
            />

            <!-- Info about current selection -->
            <div class="text-caption text-grey-6 q-mb-md" v-if="assignAllHouses">
              {{ $t('allHousesSelected', { count: availableHouses.length }) }}
            </div>
            <div
              class="text-caption text-grey-6 q-mb-md"
              v-else-if="editedUserHouses.assignedHouses.length > 0"
            >
              {{
                $t('housesSelected', {
                  count: editedUserHouses.assignedHouses.length,
                  total: availableHouses.length,
                })
              }}
            </div>

            <div class="row justify-end q-mt-md">
              <q-btn flat :label="$t('cancel')" @click="closeHouseAssignmentDialog" />
              <q-btn
                :label="$t('save')"
                type="submit"
                color="primary"
                class="q-ml-sm"
                :loading="saving"
              />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Permissions Dialog (existing but enhanced) -->
    <q-dialog v-model="showPermissionsDialog" persistent>
      <q-card style="min-width: 500px">
        <q-card-section class="row items-center">
          <div class="text-h6">{{ $t('managePermissions') }} - {{ selectedUser?.full_name }}</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-separator />

        <q-card-section>
          <div class="q-mb-md">
            <q-select
              v-model="selectedUser.role"
              :options="availableRoleOptions"
              :label="$t('role')"
              filled
              emit-value
              map-options
              @update:model-value="updatePermissionsForRole"
            />
          </div>

          <q-separator class="q-my-md" />

          <div class="text-subtitle2 q-mb-sm">{{ $t('specificPermissions') }}:</div>
          <q-list>
            <q-item tag="label" v-ripple v-for="perm in permissions" :key="perm.id">
              <q-item-section avatar>
                <q-checkbox v-model="perm.granted" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ perm.name }}</q-item-label>
                <q-item-label caption>{{ perm.description }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right">
          <q-btn flat :label="$t('cancel')" v-close-popup />
          <q-btn
            :label="$t('savePermissions')"
            color="primary"
            @click="savePermissions"
            :loading="saving"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted, computed, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import { useUserStore } from '../stores/user'
import { usersApi, housesApi, permissionsApi, emailApi } from '../services/db2rest'

const { t } = useI18n()
const $q = useQuasar()
const userStore = useUserStore()

// State
const loading = ref(false)
const saving = ref(false)
const users = ref([])
const availableHouses = ref([])
const loadingHouses = ref(false)
const searchFilter = ref('')

// User table columns
const userColumns = computed(() => [
  { name: 'name', label: t('name'), field: 'full_name', align: 'left', sortable: true },
  { name: 'email', label: t('email'), field: 'email', align: 'left', sortable: true },
  { name: 'phone', label: t('phone'), field: 'phone', align: 'left' },
  { name: 'israeliId', label: t('israeliId'), field: 'israeli_id', align: 'left' },
  { name: 'city', label: t('city'), field: 'city', align: 'left' },
  { name: 'role', label: t('role'), field: 'role', align: 'center', sortable: true },
  { name: 'assignedHouses', label: t('assignedHouses'), field: 'assignedHouses', align: 'left' },
  { name: 'status', label: t('status'), field: 'status', align: 'center', sortable: true },
  {
    name: 'lastLogin',
    label: t('lastLogin'),
    field: 'last_sign_in_at',
    align: 'center',
    sortable: true,
  },
  { name: 'actions', label: t('actions'), field: 'actions', align: 'center' },
])

// Filtered users (including soft deleted)
const filteredUsers = computed(() => {
  if (!searchFilter.value) return users.value

  const filter = searchFilter.value.toLowerCase()
  return users.value.filter(
    (user) =>
      user.full_name?.toLowerCase().includes(filter) ||
      user.email?.toLowerCase().includes(filter) ||
      user.phone?.includes(filter) ||
      user.city?.toLowerCase().includes(filter),
  )
})

// Permission checks
const canManageUsers = computed(() => {
  return userStore.hasPermission('manageUsers') || userStore.isAdmin
})

const canEditUser = (user) => {
  if (!canManageUsers.value) return false

  // System Admin can edit anyone except other System Admins
  if (userStore.isAdmin) {
    return user.role !== 'System Admin' || user.id === userStore.currentUser?.id
  }

  // User Manager cannot edit System Admin
  if (userStore.currentUser?.role === 'User Manager') {
    return user.role !== 'System Admin'
  }

  return false
}

const canDeleteUser = (user) => {
  if (!canManageUsers.value) return false

  // Cannot delete last System Admin
  if (user.role === 'System Admin') {
    const activeSystemAdmins = users.value.filter((u) => u.role === 'System Admin' && !u.deleted_at)
    return activeSystemAdmins.length > 1
  }

  return canEditUser(user)
}

watchEffect(() => {
  console.log('=== UserManagement Debug ===')
  console.log('userStore.currentUser:', userStore.currentUser)
  console.log('userStore.isAuthenticated:', userStore.isAuthenticated)
  console.log('userStore.isAdmin:', userStore.isAdmin)
  console.log('userStore.canManageUsers:', userStore.canManageUsers)
  console.log('userStore.permissions:', userStore.permissions)
  console.log('canManageUsers computed:', canManageUsers.value)
  console.log('===========================')
})

// User dialog state
const showUserDialog = ref(false)
const isEditMode = ref(false)
const userForm = ref(null)
const sendEmailInvitation = ref(true)
const resetPassword = ref(false)
const showPassword = ref(false)

const editedUser = ref({
  id: '',
  full_name: '',
  email: '',
  phone: '',
  israeli_id: '',
  address: '',
  city: '',
  role: '',
  assignedHouses: [],
  password: '',
})

// House assignment dialog state
const showHouseAssignmentDialog = ref(false)
const houseForm = ref(null)
const assignAllHouses = ref(false)
const editedUserHouses = ref({
  id: '',
  full_name: '',
  role: '',
  assignedHouses: [],
})

// Role options based on current user permissions
const availableRoleOptions = computed(() => {
  const allRoles = [
    { label: t('systemAdmin'), value: 'System Admin' },
    { label: t('houseManager'), value: 'House Manager' },
    { label: t('userManager'), value: 'User Manager' },
    { label: t('caregiver'), value: 'Caregiver' },
    { label: t('familyManager'), value: 'Family Manager' },
    { label: t('familyMember'), value: 'Family Member' },
  ]

  // System Admin can assign any role
  if (userStore.isAdmin) {
    return allRoles
  }

  // User Manager cannot assign System Admin
  if (userStore.currentUser?.role === 'User Manager') {
    return allRoles.filter((role) => role.value !== 'System Admin')
  }

  return allRoles
})

// Permissions dialog (existing)
const showPermissionsDialog = ref(false)
const selectedUser = ref(null)
const permissions = ref([])
const loadingPermissions = ref(false)

// Validation functions
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const isValidIsraeliId = (id) => {
  if (!id || id.length !== 9) return false

  // Israeli ID validation algorithm
  const digits = id.split('').map(Number)
  let sum = 0

  for (let i = 0; i < 8; i++) {
    let digit = digits[i] * ((i % 2) + 1)
    if (digit > 9) digit = Math.floor(digit / 10) + (digit % 10)
    sum += digit
  }

  const checkDigit = (10 - (sum % 10)) % 10
  return checkDigit === digits[8]
}

const generateRandomPassword = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
  let password = ''
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  editedUser.value.password = password
}

// Load data functions (existing + enhanced)
const loadUsers = async () => {
  loading.value = true
  try {
    const usersData = await usersApi.getAll()
    users.value = usersData

    if (usersData.length > 0 && usersData.every((user) => user.assignedHouses.length === 0)) {
      $q.notify({
        color: 'info',
        textColor: 'white',
        icon: 'info',
        message: t('noHouseAssignmentsInfo'),
        timeout: 3000,
      })
    }
  } catch (error) {
    console.error('Error loading users:', error)
    $q.notify({
      color: 'negative',
      textColor: 'white',
      icon: 'error',
      message: t('errorLoadingUsers'),
    })
  } finally {
    loading.value = false
  }
}

const loadAvailableHouses = async () => {
  loadingHouses.value = true
  try {
    const houses = await housesApi.getAll()
    availableHouses.value = houses.map((house) => ({
      id: house.id,
      name: house.number,
    }))

    if (showHouseAssignmentDialog.value) {
      checkIfAllHousesAssigned()
    }
  } catch (error) {
    console.error('Error loading houses:', error)
    $q.notify({
      color: 'negative',
      textColor: 'white',
      icon: 'error',
      message: t('errorLoadingHouses'),
    })
  } finally {
    loadingHouses.value = false
  }
}

// Helper functions (existing + enhanced)
const getRoleColor = (role) => {
  const colors = {
    'System Admin': 'purple',
    'House Manager': 'primary',
    'User Manager': 'teal',
    Caregiver: 'orange',
    'Family Manager': 'green',
    'Family Member': 'blue',
  }
  return colors[role] || 'grey'
}

const getRoleLabel = (role) => {
  const roleLabels = {
    'System Admin': t('systemAdmin'),
    'House Manager': t('houseManager'),
    'User Manager': t('userManager'),
    Caregiver: t('caregiver'),
    'Family Manager': t('familyManager'),
    'Family Member': t('familyMember'),
  }
  return roleLabels[role] || role
}

const getStatusColor = (emailConfirmed, deletedAt) => {
  if (deletedAt) return 'negative'
  return emailConfirmed ? 'positive' : 'warning'
}

const getStatusLabel = (emailConfirmed, deletedAt) => {
  if (deletedAt) return t('deleted')
  return emailConfirmed ? t('active') : t('pending')
}

const getDefaultAvatar = (name) => {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=random`
}

const formatDate = (date) => {
  if (!date) return t('never')
  return new Date(date).toLocaleString()
}

const isAssignedToAllHouses = (user) => {
  if (user.role === 'System Admin') {
    return true
  }

  if (!user.assignedHouses || !availableHouses.value.length) {
    return false
  }

  const allHouseIds = availableHouses.value.map((house) => house.id)
  const userHouseIds = user.assignedHouses.map((house) => house.id)

  return (
    allHouseIds.length > 0 &&
    allHouseIds.every((id) => userHouseIds.includes(id)) &&
    userHouseIds.length === allHouseIds.length
  )
}

// User CRUD operations (NEW)
const addNewUser = () => {
  isEditMode.value = false
  editedUser.value = {
    id: '',
    full_name: '',
    email: '',
    phone: '',
    israeli_id: '',
    address: '',
    city: '',
    role: 'Family Member',
    assignedHouses: [],
    password: '',
  }
  sendEmailInvitation.value = true
  resetPassword.value = false
  showPassword.value = false
  showUserDialog.value = true
}

const editUser = (user) => {
  isEditMode.value = true
  editedUser.value = {
    id: user.id,
    full_name: user.full_name || '',
    email: user.email || '',
    phone: user.phone || '',
    israeli_id: user.israeli_id || '',
    address: user.address || '',
    city: user.city || '',
    role: user.role || '',
    assignedHouses: user.assignedHouses?.map((house) => house.id) || [],
    password: '',
  }
  sendEmailInvitation.value = false
  resetPassword.value = false
  showPassword.value = false
  showUserDialog.value = true
}

const saveUser = async () => {
  // Validate form
  if (userForm.value && !(await userForm.value.validate())) {
    return
  }

  saving.value = true
  try {
    const now = new Date().toISOString()

    // נתוני משתמש בסיסיים - רק שדות שקיימים בטבלת users
    const userData = {
      full_name: editedUser.value.full_name?.trim() || '',
      email: editedUser.value.email?.trim()?.toLowerCase() || '',
      phone: editedUser.value.phone?.trim() || null,
      israeli_id: editedUser.value.israeli_id?.trim() || null,
      address: editedUser.value.address?.trim() || null,
      city: editedUser.value.city?.trim() || null,
      role: editedUser.value.role || 'Family Member',
    }

    // שמור את מערך הבתים בנפרד (לא חלק מ-userData)
    const housesToAssign = editedUser.value.assignedHouses || []

    console.log('Preparing user data:', userData)
    console.log('Houses to assign:', housesToAssign)

    if (isEditMode.value) {
      // Update existing user
      const updateData = {
        full_name: userData.full_name,
        email: userData.email,
        phone: userData.phone,
        israeli_id: userData.israeli_id,
        address: userData.address,
        city: userData.city,
        role: userData.role,
        updated_at: now,
        // ★ הסרנו את assignedHouses מכאן!
      }

      if (resetPassword.value) {
        // Generate temporary password
        const tempPassword = generateTemporaryPassword()
        updateData.password = tempPassword
        updateData.password_expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

        console.log('Adding password reset to update:', {
          password: '[HIDDEN]',
          password_expires_at: updateData.password_expires_at,
        })

        // Send email with temporary password
        try {
          await emailApi.sendTemporaryPassword(editedUser.value.email, tempPassword)
          $q.notify({
            color: 'positive',
            textColor: 'white',
            icon: 'email',
            message: t('temporaryPasswordSent'),
          })
        } catch (emailError) {
          console.warn('Failed to send password email:', emailError)
        }
      }

      console.log('Updating user with data:', updateData)

      // שלב 1: עדכן את נתוני המשתמש בטבלת users
      await usersApi.update(editedUser.value.id, updateData)

      // עדכן את שיוך הבתים בנפרד (רק אם לא System Admin)
      if (userData.role !== 'System Admin') {
        console.log('Updating house assignments for user:', editedUser.value.id, housesToAssign)
        try {
          await usersApi.assignHouses(editedUser.value.id, housesToAssign)
          console.log('House assignments updated successfully')
        } catch (houseError) {
          console.error('Error updating house assignments:', houseError)
          // לא נזרוק שגיאה כי עדכון המשתמש עצמו הצליח
          $q.notify({
            color: 'warning',
            textColor: 'white',
            icon: 'warning',
            message: t('userUpdatedButHouseAssignmentFailed'),
          })
        }
      } else {
        console.log('Skipping house assignment for System Admin')
      }

      $q.notify({
        color: 'positive',
        textColor: 'white',
        icon: 'check_circle',
        message: t('userUpdated'),
      })
    } else {
      // Create new user
      const createData = {
        ...userData,
        created_at: now,
        updated_at: now,
        deleted_at: null,
        last_sign_in_at: null,
      }

      if (sendEmailInvitation.value) {
        // Send invitation email - user will set their own password
        createData.email_confirmed_at = null
        createData.invitation_sent_at = now
        createData.password = null
        createData.password_expires_at = null

        console.log('Creating user with invitation:', createData)
        const newUser = await usersApi.create(createData)

        // שייך בתים אחרי יצירת המשתמש (רק אם לא System Admin)
        if (userData.role !== 'System Admin' && housesToAssign.length > 0) {
          console.log('Assigning houses to new user:', newUser.id)
          await usersApi.assignHouses(newUser.id, housesToAssign)
        }

        try {
          await emailApi.sendInvitation(userData.email, newUser.id)
          $q.notify({
            color: 'positive',
            textColor: 'white',
            icon: 'email',
            message: t('invitationSent'),
          })
        } catch (emailError) {
          console.warn('Failed to send invitation:', emailError)
          $q.notify({
            color: 'warning',
            textColor: 'white',
            icon: 'warning',
            message: t('userCreatedButEmailFailed'),
          })
        }
      } else {
        // Create with temporary password
        if (!editedUser.value.password?.trim()) {
          throw new Error('Password is required when not sending invitation')
        }

        createData.password = editedUser.value.password.trim()
        createData.password_expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        createData.email_confirmed_at = now

        console.log('Creating user with password:', {
          ...createData,
          password: '[HIDDEN]',
        })

        const newUser = await usersApi.create(createData)

        // שייך בתים אחרי יצירת המשתמש (רק אם לא System Admin)
        if (userData.role !== 'System Admin' && housesToAssign.length > 0) {
          console.log('Assigning houses to new user:', newUser.id)
          await usersApi.assignHouses(newUser.id, housesToAssign)
        }

        $q.notify({
          color: 'positive',
          textColor: 'white',
          icon: 'check_circle',
          message: t('userCreated'),
        })
      }
    }

    await loadUsers()
    closeUserDialog()
  } catch (error) {
    console.error('Error saving user:', error)

    // הצג הודעת שגיאה מפורטת יותר
    let errorMessage = t('errorSavingUser')
    if (error.message) {
      errorMessage += ': ' + error.message
    }
    if (error.detail) {
      errorMessage += ' (' + error.detail + ')'
    }

    $q.notify({
      color: 'negative',
      textColor: 'white',
      icon: 'error',
      message: errorMessage,
      timeout: 5000,
    })
  } finally {
    saving.value = false
  }
}

const deleteUser = (user) => {
  $q.dialog({
    title: t('confirmDelete'),
    message: t('confirmDeleteUser', { name: user.full_name || user.email }),
    cancel: true,
    persistent: true,
    color: 'negative',
  }).onOk(async () => {
    try {
      await usersApi.softDelete(user.id)
      $q.notify({
        color: 'positive',
        textColor: 'white',
        icon: 'check_circle',
        message: t('userDeleted'),
      })
      await loadUsers()
    } catch (error) {
      console.error('Error deleting user:', error)
      $q.notify({
        color: 'negative',
        textColor: 'white',
        icon: 'error',
        message: t('errorDeletingUser'),
      })
    }
  })
}

const restoreUser = (user) => {
  $q.dialog({
    title: t('confirmRestore'),
    message: t('confirmRestoreUser', { name: user.full_name || user.email }),
    cancel: true,
    persistent: true,
    color: 'positive',
  }).onOk(async () => {
    try {
      await usersApi.restore(user.id)
      $q.notify({
        color: 'positive',
        textColor: 'white',
        icon: 'check_circle',
        message: t('userRestored'),
      })
      await loadUsers()
    } catch (error) {
      console.error('Error restoring user:', error)
      $q.notify({
        color: 'negative',
        textColor: 'white',
        icon: 'error',
        message: t('errorRestoringUser'),
      })
    }
  })
}

const generateTemporaryPassword = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let password = ''
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

const closeUserDialog = () => {
  showUserDialog.value = false
  resetUserForm()
}

const resetUserForm = () => {
  editedUser.value = {
    id: '',
    full_name: '',
    email: '',
    phone: '',
    israeli_id: '',
    address: '',
    city: '',
    role: '',
    assignedHouses: [],
    password: '',
  }
  sendEmailInvitation.value = true
  resetPassword.value = false
  showPassword.value = false
  isEditMode.value = false
}

// House assignment functions (existing but separated from user dialog)
const editUserHouses = (user) => {
  editedUserHouses.value = {
    id: user.id,
    full_name: user.full_name,
    role: user.role,
    assignedHouses: user.assignedHouses?.map((house) => house.id) || [],
  }

  if (user.role !== 'System Admin') {
    checkIfAllHousesAssigned()
  } else {
    assignAllHouses.value = false
  }

  showHouseAssignmentDialog.value = true
}

const checkIfAllHousesAssigned = () => {
  if (availableHouses.value.length === 0) {
    assignAllHouses.value = false
    return
  }

  const allHouseIds = availableHouses.value.map((house) => house.id)
  const userHouseIds = editedUserHouses.value.assignedHouses || []

  assignAllHouses.value =
    allHouseIds.length > 0 &&
    allHouseIds.every((id) => userHouseIds.includes(id)) &&
    userHouseIds.length === allHouseIds.length
}

const handleAllHousesToggle = (value) => {
  if (value) {
    editedUserHouses.value.assignedHouses = availableHouses.value.map((house) => house.id)
  } else {
    editedUserHouses.value.assignedHouses = []
  }
}

const handleSpecificHousesChange = (selectedHouses) => {
  editedUserHouses.value.assignedHouses = selectedHouses || []
  checkIfAllHousesAssigned()
}

const saveHouseAssignment = async () => {
  if (editedUserHouses.value.role === 'System Admin') {
    $q.notify({
      color: 'info',
      textColor: 'white',
      icon: 'info',
      message: t('systemAdminCannotChangeHouses'),
    })
    closeHouseAssignmentDialog()
    return
  }

  saving.value = true
  try {
    await usersApi.assignHouses(editedUserHouses.value.id, editedUserHouses.value.assignedHouses)

    $q.notify({
      color: 'positive',
      textColor: 'white',
      icon: 'check_circle',
      message: assignAllHouses.value ? t('allHousesAssignedSuccess') : t('houseAssignmentUpdated'),
    })

    await loadUsers()
    closeHouseAssignmentDialog()
  } catch (error) {
    console.error('Error updating house assignment:', error)
    $q.notify({
      color: 'negative',
      textColor: 'white',
      icon: 'error',
      message: t('errorUpdatingHouseAssignment'),
    })
  } finally {
    saving.value = false
  }
}

const closeHouseAssignmentDialog = () => {
  showHouseAssignmentDialog.value = false
  resetHouseAssignmentForm()
}

const resetHouseAssignmentForm = () => {
  editedUserHouses.value = {
    id: '',
    full_name: '',
    role: '',
    assignedHouses: [],
  }
  assignAllHouses.value = false
}

// Load permissions from database (existing)
const loadPermissions = async () => {
  loadingPermissions.value = true
  try {
    const permissionsData = await permissionsApi.getAll()

    permissions.value = permissionsData.map((perm) => ({
      id: perm.id,
      name: perm.name,
      description: perm.description,
      granted: false,
    }))
  } catch (error) {
    console.error('Error loading permissions:', error)
    $q.notify({
      color: 'warning',
      textColor: 'white',
      icon: 'warning',
      message: t('errorLoadingPermissions'),
    })

    permissions.value = [
      {
        id: 'viewDashboard',
        name: 'viewDashboard',
        description: t('viewDashboardDesc'),
        granted: true,
      },
      {
        id: 'manageHouses',
        name: 'manageHouses',
        description: t('manageHousesDesc'),
        granted: false,
      },
      {
        id: 'manageSensors',
        name: 'manageSensors',
        description: t('manageSensorsDesc'),
        granted: false,
      },
      { id: 'manageUsers', name: 'manageUsers', description: t('manageUsersDesc'), granted: false },
      { id: 'viewReports', name: 'viewReports', description: t('viewReportsDesc'), granted: true },
      {
        id: 'receiveAlerts',
        name: 'receiveAlerts',
        description: t('receiveAlertsDesc'),
        granted: true,
      },
      {
        id: 'accessSupport',
        name: 'accessSupport',
        description: t('accessSupportDesc'),
        granted: true,
      },
      {
        id: 'systemConfig',
        name: 'systemConfig',
        description: t('systemConfigDesc'),
        granted: false,
      },
    ]
  } finally {
    loadingPermissions.value = false
  }
}

const managePermissions = async (user) => {
  selectedUser.value = { ...user }

  if (permissions.value.length === 0) {
    await loadPermissions()
  }

  try {
    const userPermissions = await permissionsApi.getUserPermissions(user.id)

    permissions.value.forEach((perm) => {
      const userPerm = userPermissions?.find((up) => up.permission_id === perm.id)
      perm.granted = userPerm ? userPerm.granted : false
    })

    if (!userPermissions || userPermissions.length === 0) {
      updatePermissionsForRole(user.role)
    }
  } catch (error) {
    console.error('Error loading user permissions:', error)
    $q.notify({
      color: 'warning',
      textColor: 'white',
      icon: 'warning',
      message: t('errorLoadingUserPermissions'),
    })
    updatePermissionsForRole(user.role)
  }

  showPermissionsDialog.value = true
}

const updatePermissionsForRole = (role) => {
  permissions.value.forEach((p) => {
    if (role === 'System Admin') {
      p.granted = true
    } else if (role === 'House Manager') {
      p.granted = [
        'viewDashboard',
        'manageSensors',
        'viewReports',
        'receiveAlerts',
        'accessSupport',
      ].includes(p.name)
    } else if (role === 'Caregiver') {
      p.granted = ['viewDashboard', 'viewReports', 'receiveAlerts', 'accessSupport'].includes(
        p.name,
      )
    } else {
      p.granted = ['viewDashboard', 'receiveAlerts', 'accessSupport'].includes(p.name)
    }
  })
}

const savePermissions = async () => {
  saving.value = true
  try {
    await usersApi.update(selectedUser.value.id, {
      role: selectedUser.value.role,
    })

    await usersApi.updatePermissions(selectedUser.value.id, permissions.value)

    $q.notify({
      color: 'positive',
      textColor: 'white',
      icon: 'check_circle',
      message: t('permissionsUpdated'),
    })

    await loadUsers()
    showPermissionsDialog.value = false
  } catch (error) {
    console.error('Error updating permissions:', error)
    $q.notify({
      color: 'negative',
      textColor: 'white',
      icon: 'error',
      message: t('errorUpdatingPermissions') + ': ' + (error.message || 'Unknown error'),
    })
  } finally {
    saving.value = false
  }
}

// Initialize data on mount
onMounted(async () => {
  if (!userStore.currentUser) {
    console.log('Loading current user...')
    await userStore.loadCurrentUser()
  }
  await loadAvailableHouses()
  await loadUsers()
  await loadPermissions()
})
</script>
