// src/services/permissionsService.js - תיקון מיפוי הרשאות
import { authApi } from './db2rest'

// מיפוי הרשאות לפי תפקידים - עדכון כולל הרשאות חסרות
const rolePermissions = {
  'System Admin': [
    'viewDashboard',
    'viewHouses',
    'editHouses',
    'manageHouses',
    'viewSensors',
    'editSensors',
    'manageSensors',
    'viewUsers',
    'editUsers',
    'manageUsers', // ← הוסף זה!
    'viewEvents',
    'viewReports',
    'receiveAlerts',
    'accessSupport',
    'systemConfig',
    'systemSettings',
  ],
  'User Manager': [
    'viewDashboard',
    'viewUsers',
    'editUsers',
    'manageUsers', // ← הוסף זה גם!
    'viewReports',
    'receiveAlerts',
    'accessSupport',
  ],
  'House Manager': [
    'viewDashboard',
    'viewHouses',
    'editHouses',
    'manageHouses',
    'viewSensors',
    'editSensors',
    'manageSensors',
    'viewEvents',
    'viewReports',
    'receiveAlerts',
    'accessSupport',
  ],
  Caregiver: [
    'viewDashboard',
    'viewHouses',
    'viewSensors',
    'editSensors',
    'viewEvents',
    'viewReports',
    'receiveAlerts',
    'accessSupport',
  ],
  'Family Manager': [
    'viewDashboard',
    'viewHouses',
    'viewSensors',
    'viewEvents',
    'viewReports',
    'receiveAlerts',
    'accessSupport',
  ],
  'Family Member': [
    'viewDashboard',
    'viewHouses',
    'viewSensors',
    'viewEvents',
    'receiveAlerts',
    'accessSupport',
  ],
}

// שירות הרשאות
export const permissionsService = {
  /**
   * בדיקה אם למשתמש הנוכחי יש הרשאה מסוימת
   * @param {string} permission - שם ההרשאה לבדיקה
   * @returns {Promise<boolean>} - האם למשתמש יש את ההרשאה
   */
  async hasPermission(permission) {
    try {
      // קבלת תפקיד המשתמש הנוכחי
      const role = await authApi.getUserRole()

      console.log(`Checking permission: ${permission} for role: ${role}`) // דיבוג

      if (!role) return false

      // בדיקה אם התפקיד מכיל את ההרשאה
      const hasPermission = rolePermissions[role]?.includes(permission) || false
      console.log(`Result: ${hasPermission}`) // דיבוג

      return hasPermission
    } catch (error) {
      console.error('Permission check error:', error)
      return false
    }
  },

  /**
   * קבלת כל ההרשאות עבור תפקיד מסוים
   * @param {string} role - שם התפקיד
   * @returns {string[]} - מערך ההרשאות
   */
  getPermissionsForRole(role) {
    return rolePermissions[role] || []
  },

  /**
   * קבלת כל ההרשאות עבור המשתמש הנוכחי
   * @returns {Promise<string[]>} - מערך ההרשאות
   */
  async getCurrentUserPermissions() {
    try {
      const role = await authApi.getUserRole()
      return this.getPermissionsForRole(role)
    } catch {
      return []
    }
  },

  /**
   * בדיקה אם למשתמש הנוכחי יש אחת מההרשאות ברשימה
   * @param {string[]} permissions - מערך הרשאות לבדיקה
   * @returns {Promise<boolean>} - האם למשתמש יש לפחות אחת מההרשאות
   */
  async hasAnyPermission(permissions) {
    try {
      const userPermissions = await this.getCurrentUserPermissions()
      return permissions.some((p) => userPermissions.includes(p))
    } catch {
      return false
    }
  },
}
