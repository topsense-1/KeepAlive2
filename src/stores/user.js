// src/stores/user.js - Enhanced with user management capabilities
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi, usersApi, sessionSecurityApi, permissionsApi } from '../services/db2rest'

export const useUserStore = defineStore('user', () => {
  const currentUser = ref(null)
  const token = ref(null)
  const loading = ref(false)
  const error = ref(null)
  const permissions = ref([])
  const sessionInfo = ref(null)

  const isAuthenticated = computed(() => !!currentUser.value)
  const isAdmin = computed(() => currentUser.value?.role === 'System Admin')
  const isUserManager = computed(() => currentUser.value?.role === 'User Manager')
  const canManageUsers = computed(() => isAdmin.value || isUserManager.value)

  // Enhanced login with session management and password expiry check
  async function login(credentials) {
    loading.value = true
    error.value = null

    try {
      // Use real authentication
      const authData = await authApi.login(credentials.email, credentials.password)
      token.value = authData.access_token || authData.session?.access_token

      // Get user data
      const userData = await authApi.getCurrentUser()
      console.log(userData)
      currentUser.value = userData

      // Check password expiry
      if (userData?.id) {
        const passwordCheck = await sessionSecurityApi.checkPasswordExpiry(userData.id)
        if (passwordCheck.expired) {
          error.value = 'Password has expired. Please contact administrator.'
          throw new Error('Password expired')
        }

        // Store session info for password expiry tracking
        sessionInfo.value = {
          passwordExpiry: passwordCheck,
          loginTime: new Date(),
        }
      }

      // Load permissions
      await loadPermissions()

      return currentUser.value
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    loading.value = true

    try {
      // Use real logout
      await authApi.logout()
      currentUser.value = null
      token.value = null
      permissions.value = []
      sessionInfo.value = null
      return true
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function loadCurrentUser() {
    loading.value = true

    try {
      // Use real authentication
      const userData = await authApi.getCurrentUser()
      currentUser.value = userData

      if (userData) {
        await loadPermissions()

        // Check password expiry on load
        const passwordCheck = await sessionSecurityApi.checkPasswordExpiry(userData.id)
        sessionInfo.value = {
          passwordExpiry: passwordCheck,
          loginTime: new Date(),
        }
      }

      return currentUser.value
    } catch (err) {
      error.value = err.message
      return null
    } finally {
      loading.value = false
    }
  }

  async function updateUserProfile(userId, userData) {
    try {
      const updatedUser = await usersApi.update(userId, userData)

      // Update current user if it's the same user
      if (userId === currentUser.value?.id) {
        currentUser.value = { ...currentUser.value, ...updatedUser }
      }

      return updatedUser
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  async function loadPermissions() {
    try {
      if (!currentUser.value?.id) {
        permissions.value = []
        return
      }

      // נסה לטעון הרשאות מה-database
      let userPermissions = []
      try {
        userPermissions = await permissionsApi.getUserPermissions(currentUser.value.id)
      } catch (error) {
        console.warn('Could not load permissions from database:', error)
      }

      if (userPermissions && userPermissions.length > 0) {
        permissions.value = userPermissions.map((up) => up.permission.name)
      } else {
        // Fallback: הגדר הרשאות על בסיס התפקיד
        console.log('Setting fallback permissions for role:', currentUser.value?.role)

        if (currentUser.value?.role === 'System Admin') {
          permissions.value = [
            'viewDashboard',
            'manageHouses',
            'manageSensors',
            'manageUsers', // ← חשוב!
            'viewReports',
            'receiveAlerts',
            'accessSupport',
            'systemConfig',
          ]
        } else if (currentUser.value?.role === 'User Manager') {
          permissions.value = [
            'viewDashboard',
            'manageUsers', // ← חשוב!
            'viewReports',
            'receiveAlerts',
            'accessSupport',
          ]
        } else if (currentUser.value?.role === 'House Manager') {
          permissions.value = [
            'viewDashboard',
            'manageSensors',
            'viewReports',
            'receiveAlerts',
            'accessSupport',
          ]
        } else {
          permissions.value = ['viewDashboard', 'receiveAlerts', 'accessSupport']
        }
      }

      console.log('Final permissions loaded:', permissions.value) // דיבוג
    } catch (err) {
      console.error('Error loading permissions:', err)
      permissions.value = ['viewDashboard'] // Fallback minimal permissions
    }
  }

  function hasPermission(permission) {
    return permissions.value.includes(permission)
  }

  // Enhanced permission checks for user management
  function canCreateUser() {
    return hasPermission('manageUsers') || isAdmin.value
  }

  function canEditUser(targetUser) {
    if (!canManageUsers.value) return false

    // System Admin can edit anyone except other System Admins
    if (isAdmin.value) {
      return targetUser.role !== 'System Admin' || targetUser.id === currentUser.value?.id
    }

    // User Manager cannot edit System Admin
    if (isUserManager.value) {
      return targetUser.role !== 'System Admin'
    }

    return false
  }

  function canDeleteUser(targetUser) {
    if (!canManageUsers.value) return false

    // Cannot delete self
    if (targetUser.id === currentUser.value?.id) return false

    // Cannot delete if it's the last System Admin
    if (targetUser.role === 'System Admin') {
      // This would need to be checked against actual data
      return false // For safety, assume we can't delete System Admins
    }

    return canEditUser(targetUser)
  }

  function canAssignRole(targetRole) {
    // System Admin can assign any role
    if (isAdmin.value) return true

    // User Manager cannot assign System Admin role
    if (isUserManager.value) {
      return targetRole !== 'System Admin'
    }

    return false
  }

  function canManageHouseAssignments(targetUser) {
    if (!canManageUsers.value) return false

    // System Admin house assignments cannot be changed
    if (targetUser.role === 'System Admin') return false

    return canEditUser(targetUser)
  }

  function canManagePermissions(targetUser) {
    return canEditUser(targetUser)
  }

  // Password and session management
  async function checkPasswordExpiry() {
    if (!currentUser.value?.id) return null

    try {
      const check = await sessionSecurityApi.checkPasswordExpiry(currentUser.value.id)

      if (sessionInfo.value) {
        sessionInfo.value.passwordExpiry = check
      }

      return check
    } catch (error) {
      console.error('Error checking password expiry:', error)
      return null
    }
  }

  async function extendPasswordExpiry(hours = 24) {
    if (!currentUser.value?.id) return false

    try {
      const result = await sessionSecurityApi.extendPasswordExpiry(currentUser.value.id, hours)

      if (result.success && sessionInfo.value) {
        sessionInfo.value.passwordExpiry = {
          expired: false,
          expiresAt: result.newExpiry,
          hoursLeft: hours,
        }
      }

      return result.success
    } catch (error) {
      console.error('Error extending password expiry:', error)
      return false
    }
  }

  function isPasswordExpiringSoon() {
    if (!sessionInfo.value?.passwordExpiry) return false

    const expiry = sessionInfo.value.passwordExpiry
    return expiry.hoursLeft !== undefined && expiry.hoursLeft <= 2 && expiry.hoursLeft > 0
  }

  function isPasswordExpired() {
    return sessionInfo.value?.passwordExpiry?.expired || false
  }

  // User statistics helpers
  function getUserDisplayName(user = null) {
    const targetUser = user || currentUser.value
    if (!targetUser) return 'Unknown User'

    return targetUser.full_name || targetUser.name || targetUser.email?.split('@')[0] || 'User'
  }

  function getUserInitials(user = null) {
    const displayName = getUserDisplayName(user)
    return displayName
      .split(' ')
      .map((name) => name[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

  // Session validation
  function validateSession() {
    if (!currentUser.value || !token.value) {
      return false
    }

    // Check if password has expired
    if (isPasswordExpired()) {
      logout()
      return false
    }

    return true
  }

  // Clear any stored errors
  function clearError() {
    error.value = null
  }

  // Get user avatar URL
  function getUserAvatarUrl(user = null) {
    const targetUser = user || currentUser.value
    if (!targetUser) return null

    // If user has a custom avatar
    if (targetUser.avatar) {
      return targetUser.avatar
    }

    // Generate default avatar
    const name = getUserDisplayName(targetUser)
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
  }

  return {
    // State
    currentUser,
    token,
    loading,
    error,
    permissions,
    sessionInfo,

    // Computed
    isAuthenticated,
    isAdmin,
    isUserManager,
    canManageUsers,

    // Core methods
    login,
    logout,
    loadCurrentUser,
    hasPermission,
    updateUserProfile,
    clearError,

    // User management permissions
    canCreateUser,
    canEditUser,
    canDeleteUser,
    canAssignRole,
    canManageHouseAssignments,
    canManagePermissions,

    // Password and session management
    checkPasswordExpiry,
    extendPasswordExpiry,
    isPasswordExpiringSoon,
    isPasswordExpired,
    validateSession,

    // Utility methods
    getUserDisplayName,
    getUserInitials,
    getUserAvatarUrl,
  }
})
