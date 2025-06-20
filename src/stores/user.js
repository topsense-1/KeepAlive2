// src/stores/user.js - עדכון למנגנון ההרשאות החדש
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi, usersApi, sessionSecurityApi, permissionsApi } from '../services/db2rest'
import { permissionsService } from '../services/permissionsService'

export const useUserStore = defineStore('user', () => {
  // State
  const currentUser = ref(null)
  const token = ref(localStorage.getItem('session_token'))
  const loading = ref(false)
  const error = ref(null)
  const permissions = ref([])
  const sessionInfo = ref(null)
  const hierarchyMappings = ref([]) // מיפויים הירכיים של המשתמש

  // Computed Properties
  const isAuthenticated = computed(() => !!currentUser.value && !!token.value)
  const isAdmin = computed(() => currentUser.value?.role === 'System Admin')
  const isUserManager = computed(() => currentUser.value?.role === 'User Manager')
  const isCompaniesManager = computed(() => currentUser.value?.role === 'Companies Manager')
  const isSitesManager = computed(() => currentUser.value?.role === 'Sites Manager')
  const isHouseManager = computed(() => currentUser.value?.role === 'House Manager')
  const isFamilyManager = computed(() => currentUser.value?.role === 'Family Manager')

  // הרשאות ניהול
  const canManageUsers = computed(() => isAdmin.value || isUserManager.value)
  const canManageCompanies = computed(() => isAdmin.value)
  const canManageSites = computed(() => isAdmin.value || isCompaniesManager.value)
  const canManageHouses = computed(
    () => isAdmin.value || isCompaniesManager.value || isSitesManager.value,
  )
  const canManageSensors = computed(
    () => canManageHouses.value || isHouseManager.value || isFamilyManager.value,
  )

  // רמת הירכיה של המשתמש
  const userHierarchyLevel = computed(() => {
    const roleToLevel = {
      'System Admin': 0,
      'User Manager': 1,
      'Companies Manager': 1,
      'Sites Manager': 2,
      'House Manager': 3,
      'Family Manager': 3,
      Caregiver: 4,
      'Family Member': 4,
    }
    return roleToLevel[currentUser.value?.role] || 99
  })

  // Actions

  /**
   * התחברות עם בדיקת תפוגת סיסמה ותמיכה ב"זכור אותי"
   */
  async function login(credentials) {
    loading.value = true
    error.value = null

    try {
      console.log('Attempting login with:', credentials.email)

      // התחברות בסיסית - שימוש בפרמטרים נפרדים
      // הטוקן כבר נשמר ב-localStorage על ידי authApi.login
      const authData = await authApi.login(credentials.email, credentials.password)
      console.log('Login successful, session:', authData)

      // קבלת הטוקן
      token.value = authData.session.access_token

      // 🎯 הסרה: לא צריך לשמור שוב ב-localStorage כי authApi כבר עשה זאת
      // אם המשתמש לא בחר "זכור אותי", נקה את הטוקן בסגירת הדפדפן
      if (!credentials.rememberMe) {
        // הטוקן יישאר ב-memory אבל יימחק בסגירת הדפדפן
        // (localStorage נשמר גם ללא rememberMe לצורך getCurrentUser,
        // אבל יימחק על ידי beforeunload אם לא rememberMe)
        window.addEventListener('beforeunload', () => {
          localStorage.removeItem('session_token')
        })
      }

      // שמירת נתוני המשתמש
      currentUser.value = authData.user
      console.log('Current user set:', currentUser.value)

      // המשך הקוד הקיים...
      // (בדיקת תפוגת סיסמה, טעינת הרשאות, וכו')

      return currentUser.value
    } catch (err) {
      console.error('Login failed:', err)
      error.value = err.message

      // ניקוי נתונים במקרה של שגיאה
      currentUser.value = null
      token.value = null
      localStorage.removeItem('session_token')

      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * התנתקות
   */
  async function logout() {
    loading.value = true

    try {
      await authApi.logout()

      // ניקוי כל הנתונים
      currentUser.value = null
      token.value = null
      permissions.value = []
      hierarchyMappings.value = []
      sessionInfo.value = null

      localStorage.removeItem('session_token')

      return true
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * טעינת משתמש נוכחי (לרענון הדף)
   */
  async function loadCurrentUser() {
    const storedToken = localStorage.getItem('session_token')
    if (!storedToken) return null

    loading.value = true

    try {
      // פענוח הטוקן לקבלת נתוני המשתמש
      const tokenData = JSON.parse(atob(storedToken))
      console.log('Decoded token data:', tokenData)

      // וולידציה שהטוקן לא פג
      const now = Date.now()
      const tokenAge = now - tokenData.timestamp
      const maxAge = 8 * 60 * 60 * 1000 // 8 שעות

      if (tokenAge > maxAge) {
        console.log('Token expired, clearing session')
        localStorage.removeItem('session_token')
        return null
      }

      // קבלת נתוני המשתמש מהמסד
      const userData = await usersApi.getById(tokenData.userId)
      if (!userData || userData.status !== 1 || userData.deleted_at) {
        console.log('User not found or inactive')
        localStorage.removeItem('session_token')
        return null
      }

      // הגדרת המשתמש והטוקן
      token.value = storedToken
      currentUser.value = {
        id: userData.id || userData.user_id,
        username: userData.username,
        email: userData.email,
        full_name: userData.full_name,
        role: userData.role || userData.role_name,
        role_id: userData.role_id,
      }

      console.log('Current user loaded:', currentUser.value)

      // טעינת הרשאות ומיפויים
      try {
        await loadPermissions()
        await loadHierarchyMappings()
      } catch (permError) {
        console.warn('Could not load permissions:', permError)
        permissions.value = getMinimalPermissionsByRole(currentUser.value.role)
      }

      // בדיקת תפוגת סיסמה
      try {
        const passwordCheck = await sessionSecurityApi.checkPasswordExpiry(currentUser.value.id)
        sessionInfo.value = {
          passwordExpiry: passwordCheck,
          loginTime: new Date(tokenData.timestamp),
        }
      } catch (passwordError) {
        console.warn('Could not check password expiry:', passwordError)
      }

      return currentUser.value
    } catch (err) {
      console.error('Error loading current user:', err)
      error.value = err.message

      // אם יש שגיאה בטעינת המשתמש, נקה הכל
      currentUser.value = null
      token.value = null
      localStorage.removeItem('session_token')

      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * עדכון פרופיל משתמש
   */
  async function updateUserProfile(userId, userData) {
    try {
      const updatedUser = await usersApi.update(userId, userData)

      // עדכון המשתמש הנוכחי אם זה אותו משתמש
      if (userId === currentUser.value?.id) {
        currentUser.value = { ...currentUser.value, ...updatedUser }
      }

      return updatedUser
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  /**
   * טעינת הרשאות המשתמש (משולב מתפקיד + הרשאות ספציפיות)
   */
  async function loadPermissions() {
    try {
      console.log('🔄 Loading permissions for user:', currentUser.value?.id)

      if (!currentUser.value?.id) {
        console.log('❌ No current user ID, setting empty permissions')
        permissions.value = []
        return
      }

      // נסה להשתמש ב-API החדש
      try {
        console.log('🔄 Trying to load permissions from API...')
        const userPermissions = await permissionsApi.getUserPermissions(currentUser.value.id)

        if (userPermissions && userPermissions.length > 0) {
          console.log('✅ Loaded permissions from API:', userPermissions)
          permissions.value = userPermissions.map((up) => up.permission_name)
          console.log('📋 Final permissions array:', permissions.value)
          return
        } else {
          console.log('⚠️ No permissions returned from API, using fallback')
        }
      } catch (apiError) {
        console.warn('⚠️ API permissions failed:', apiError)
      }

      // Fallback - הגדרת הרשאות מינימליות לפי תפקיד
      console.log('🔄 Setting fallback permissions for role:', currentUser.value?.role)
      permissions.value = getMinimalPermissionsByRole(currentUser.value.role)
      console.log('📋 Fallback permissions set:', permissions.value)
    } catch (err) {
      console.error('❌ Error loading permissions:', err)
      // הגדרת הרשאות מינימליות במקרה של שגיאה
      permissions.value = ['viewDashboard']
      console.log('📋 Emergency fallback permissions:', permissions.value)
    }
  }

  /**
   * טעינת מיפויים הירכיים של המשתמש
   */
  async function loadHierarchyMappings() {
    try {
      if (!currentUser.value?.id) {
        hierarchyMappings.value = []
        return
      }

      // אם זה System Admin, יש לו גישה לכל
      if (isAdmin.value) {
        hierarchyMappings.value = [
          {
            permission_scope: 'all',
            access_level: 'admin',
            company_name: 'All Companies',
            site_name: 'All Sites',
            house_number: 'All Houses',
          },
        ]
        return
      }

      // קבלת מיפויים מטבלת sys_map
      const mappings = await permissionsService.getUserAccessibleCompanies(currentUser.value.id)
      hierarchyMappings.value = mappings || []
    } catch (err) {
      console.error('Error loading hierarchy mappings:', err)
      hierarchyMappings.value = []
    }
  }

  /**
   * בדיקת הרשאה ספציפית
   */
  function hasPermission(permission) {
    const result = permissions.value.includes(permission)
    console.log(`🔍 Checking permission "${permission}": ${result}`)
    console.log(`📋 Available permissions:`, permissions.value)
    console.log(`👤 Current user:`, currentUser.value?.email, currentUser.value?.role)
    return result
  }

  /**
   * בדיקת הרשאה מתקדמת עם משאב
   */
  async function hasPermissionAdvanced(permission, resourceId = null, resourceType = null) {
    if (!currentUser.value?.id) return false

    return await permissionsService.hasPermission(
      currentUser.value.id,
      permission,
      resourceId,
      resourceType,
    )
  }

  /**
   * בדיקת יכולת יצירת משתמש
   */
  function canCreateUser() {
    return hasPermission('manageUsers') || isAdmin.value
  }

  /**
   * בדיקת יכולת עריכת משתמש
   */
  function canEditUser(targetUser) {
    if (!canManageUsers.value) return false

    // System Admin יכול לערוך את כולם חוץ מ-System Admin אחרים
    if (isAdmin.value) {
      return targetUser.role !== 'System Admin' || targetUser.id === currentUser.value?.id
    }

    // User Manager לא יכול לערוך System Admin
    if (isUserManager.value) {
      return targetUser.role !== 'System Admin'
    }

    // בדיקת רמת הירכיה
    const targetLevel = getRoleLevel(targetUser.role)
    return userHierarchyLevel.value <= targetLevel
  }

  /**
   * בדיקת יכולת מחיקת משתמש
   */
  function canDeleteUser(targetUser) {
    if (!canManageUsers.value) return false

    // לא ניתן למחוק את עצמך
    if (targetUser.id === currentUser.value?.id) return false

    // לא ניתן למחוק System Admin (כדי לא למחוק את האחרון)
    if (targetUser.role === 'System Admin') {
      return false
    }

    return canEditUser(targetUser)
  }

  /**
   * בדיקת יכולת הקצאת תפקיד
   */
  function canAssignRole(targetRole) {
    // System Admin יכול להקצות כל תפקיד
    if (isAdmin.value) return true

    // בדיקת רמת הירכיה
    const targetLevel = getRoleLevel(targetRole)
    return userHierarchyLevel.value < targetLevel
  }

  /**
   * קבלת חברות נגישות למשתמש
   */
  async function getAccessibleCompanies() {
    try {
      if (!currentUser.value?.id) return []

      return await permissionsService.getUserAccessibleCompanies(currentUser.value.id)
    } catch (err) {
      console.error('Error getting accessible companies:', err)
      return []
    }
  }

  /**
   * קבלת בתים נגישים למשתמש
   */
  async function getAccessibleHouses() {
    try {
      if (!currentUser.value?.id) return []

      return await permissionsService.getUserAccessibleHouses(currentUser.value.id)
    } catch (err) {
      console.error('Error getting accessible houses:', err)
      return []
    }
  }

  /**
   * בדיקת גישה למשאב ספציפי
   */
  async function hasResourceAccess(resourceId, resourceType) {
    try {
      if (!currentUser.value?.id) return false

      return await permissionsService.hasResourceAccess(
        currentUser.value.id,
        resourceId,
        resourceType,
      )
    } catch (err) {
      console.error('Error checking resource access:', err)
      return false
    }
  }

  /**
   * וולידציה ליצירת משתמש חדש
   */
  async function validateUserCreation(targetRole, companyId = null, siteId = null, houseId = null) {
    try {
      if (!currentUser.value?.id) return { valid: false, error: 'Not authenticated' }

      return await permissionsService.validateUserCreation(
        currentUser.value.id,
        targetRole,
        companyId,
        siteId,
        houseId,
      )
    } catch (err) {
      console.error('Error validating user creation:', err)
      return { valid: false, error: err.message }
    }
  }

  /**
   * בדיקת פיגת סיסמה
   */
  async function checkPasswordExpiry() {
    if (!currentUser.value?.id) return { expired: false }

    try {
      const result = await sessionSecurityApi.checkPasswordExpiry(currentUser.value.id)

      // עדכון sessionInfo
      if (sessionInfo.value) {
        sessionInfo.value.passwordExpiry = result
      }

      return result
    } catch (err) {
      console.error('Error checking password expiry:', err)
      return { expired: false, error: err.message }
    }
  }

  /**
   * הארכת תוקף סיסמה
   */
  async function extendPasswordExpiry(hours = 24) {
    if (!currentUser.value?.id) return false

    try {
      const result = await sessionSecurityApi.extendPasswordExpiry(currentUser.value.id, hours)

      // עדכון sessionInfo
      if (sessionInfo.value && result.success) {
        sessionInfo.value.passwordExpiry = {
          expired: false,
          expiresAt: result.newExpiry,
          hoursLeft: hours,
        }
      }

      return result.success
    } catch (err) {
      console.error('Error extending password expiry:', err)
      throw err
    }
  }

  // Helper Functions

  /**
   * קבלת רמת תפקיד
   */
  function getRoleLevel(roleName) {
    const roleToLevel = {
      'System Admin': 0,
      'User Manager': 1,
      'Companies Manager': 1,
      'Sites Manager': 2,
      'House Manager': 3,
      'Family Manager': 3,
      Caregiver: 4,
      'Family Member': 4,
    }
    return roleToLevel[roleName] || 99
  }

  /**
   * קבלת הרשאות מינימליות לפי תפקיד
   */
  function getMinimalPermissionsByRole(role) {
    const rolePermissions = {
      'System Admin': [
        'viewDashboard',
        'manageCompanies',
        'manageSites',
        'manageHouses',
        'manageSensors',
        'manageEvents',
        'manageReports',
        'receiveAlerts',
        'manageUsers',
        'manageSettings',
        'viewSupport',
      ],
      'User Manager': ['manageUsers', 'viewReports', 'viewSupport'],
      'Companies Manager': [
        'viewDashboard',
        'viewCompanies',
        'updateCompanies',
        'manageSites',
        'manageHouses',
        'manageSensors',
        'manageUsers',
        'viewEvents',
        'viewReports',
        'receiveAlerts',
        'viewSupport',
      ],
      'Sites Manager': [
        'viewDashboard',
        'viewSites',
        'manageHouses',
        'manageSensors',
        'manageUsers',
        'viewEvents',
        'viewReports',
        'receiveAlerts',
        'viewSupport',
      ],
      'House Manager': [
        'viewDashboard',
        'viewHouses',
        'updateHouses',
        'manageSensors',
        'manageUsers',
        'viewEvents',
        'viewReports',
        'receiveAlerts',
        'viewSupport',
      ],
      Caregiver: ['viewDashboard', 'viewHouses', 'viewEvents', 'receiveAlerts'],
      'Family Manager': [
        'viewDashboard',
        'viewHouses',
        'updateHouses',
        'manageSensors',
        'viewReports',
        'viewEvents',
        'receiveAlerts',
      ],
      'Family Member': [
        'viewDashboard',
        'viewHouses',
        'viewSensors',
        'viewReports',
        'viewEvents',
        'receiveAlerts',
      ],
    }

    return rolePermissions[role] || ['viewDashboard']
  }

  /**
   * איפוס שגיאות
   */
  function clearError() {
    error.value = null
  }

  /**
   * בדיקת תוקף הפעלה
   */
  function isSessionValid() {
    if (!sessionInfo.value) return false

    const now = new Date()
    const expiresAt = sessionInfo.value.expiresAt ? new Date(sessionInfo.value.expiresAt) : null

    return !expiresAt || now < expiresAt
  }

  /**
   * רענון הפעלה
   */
  async function refreshSession() {
    if (!isAuthenticated.value) return false

    try {
      // בדיקת תוקף טוקן והחלפתו אם נדרש
      const userData = await authApi.getCurrentUser()
      if (!userData) {
        await logout()
        return false
      }

      currentUser.value = userData
      await loadPermissions()
      await loadHierarchyMappings()

      return true
    } catch (err) {
      console.error('Error refreshing session:', err)
      await logout()
      return false
    }
  }

  // Initialize - try to load user from stored token
  if (token.value) {
    loadCurrentUser().catch(() => {
      // אם טעינת המשתמש נכשלת, נקה הכל
      token.value = null
      localStorage.removeItem('session_token')
    })
  }

  // Return store interface
  return {
    // State
    currentUser,
    token,
    loading,
    error,
    permissions,
    sessionInfo,
    hierarchyMappings,

    // Computed
    isAuthenticated,
    isAdmin,
    isUserManager,
    isCompaniesManager,
    isSitesManager,
    isHouseManager,
    isFamilyManager,
    canManageUsers,
    canManageCompanies,
    canManageSites,
    canManageHouses,
    canManageSensors,
    userHierarchyLevel,

    // Actions
    login,
    logout,
    loadCurrentUser,
    updateUserProfile,
    loadPermissions,
    loadHierarchyMappings,
    hasPermission,
    hasPermissionAdvanced,
    canCreateUser,
    canEditUser,
    canDeleteUser,
    canAssignRole,
    getAccessibleCompanies,
    getAccessibleHouses,
    hasResourceAccess,
    validateUserCreation,
    checkPasswordExpiry,
    extendPasswordExpiry,
    clearError,
    isSessionValid,
    refreshSession,
  }
})
