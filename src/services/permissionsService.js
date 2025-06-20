// src/services/permissionsService.js - עדכון למנגנון ההרשאות החדש
import { sendCommand } from './db2rest'

/**
 * שירות מתקדם לניהול הרשאות עם המנגנון החדש
 * תומך בהרשאות מתפקיד + הרשאות ספציפיות
 * תומך במיפוי הירכי עם sys_map
 */
export const permissionsService = {
  /**
   * בדיקת הרשאה מתקדמת עם בדיקת בעלות
   * @param {string} userId - ID המשתמש
   * @param {string} permission - שם ההרשאה
   * @param {string} resourceId - ID המשאב (אופציונלי)
   * @param {string} resourceType - סוג המשאב (company/site/house)
   * @returns {Promise<boolean>}
   */
  async hasPermission(userId, permission, resourceId = null, resourceType = null) {
    try {
      // 1. קבלת תפקיד המשתמש
      const userResult = await sendCommand('users', `filter=id=="${userId}"&fields=role_id,role`)
      if (!Array.isArray(userResult) || userResult.length === 0) {
        return false
      }

      const user = userResult[0]

      // 2. בדיקת הרשאה מתפקיד
      const rolePermissions = await this.getRolePermissions(user.role_id)
      let hasRolePermission = rolePermissions.some((rp) => rp.permission.name === permission)

      // 3. בדיקת הרשאות ספציפיות (override לתפקיד)
      const specificPermissions = await this.getUserSpecificPermissions(
        userId,
        permission,
        resourceId,
        resourceType,
      )
      let hasSpecificPermission = specificPermissions.length > 0

      // 4. אם אין הרשאה בסיסית, אין צורך לבדוק בעלות
      if (!hasRolePermission && !hasSpecificPermission) {
        return false
      }

      // 5. בדיקת צורך בבעלות על המשאב
      if (resourceId && resourceType) {
        const permissionDetails = await this.getPermissionDetails(permission)
        if (permissionDetails?.requires_ownership) {
          return await this.hasResourceAccess(userId, resourceId, resourceType)
        }
      }

      return hasRolePermission || hasSpecificPermission
    } catch (error) {
      console.error('Error checking permission:', error)
      return false
    }
  },

  /**
   * קבלת הרשאות תפקיד
   * @param {string} roleId - ID התפקיד
   * @returns {Promise<Array>}
   */
  async getRolePermissions(roleId) {
    try {
      const result = await sendCommand(
        'role_permissions',
        `filter=role_id=="${roleId}"&fields=permission_id,permission.name,permission.description,permission.requires_ownership`,
      )
      return Array.isArray(result) ? result : []
    } catch (error) {
      console.error('Error getting role permissions:', error)
      return []
    }
  },

  /**
   * קבלת הרשאות ספציפיות למשתמש
   * @param {string} userId - ID המשתמש
   * @param {string} permission - שם ההרשאה
   * @param {string} resourceId - ID המשאב (אופציונלי)
   * @param {string} resourceType - סוג המשאב (אופציונלי)
   * @returns {Promise<Array>}
   */
  async getUserSpecificPermissions(userId, permission, resourceId = null, resourceType = null) {
    try {
      let filter = `user_id=="${userId}" and permission.name=="${permission}" and granted==true`

      // הוספת פילטר למשאב ספציפי אם סופק
      if (resourceId && resourceType) {
        filter += ` and (resource_id=="${resourceId}" or resource_id==null)`
        filter += ` and (resource_type=="${resourceType}" or resource_type==null)`
      }

      // פילטר תוקף
      filter += ` and (expires_at==null or expires_at>>"${new Date().toISOString()}")`

      const result = await sendCommand(
        'user_permissions',
        `filter=${filter}&fields=permission.name,resource_id,resource_type,expires_at`,
      )
      return Array.isArray(result) ? result : []
    } catch (error) {
      console.error('Error getting user specific permissions:', error)
      return []
    }
  },

  /**
   * בדיקת גישה למשאב (בעלות)
   * @param {string} userId - ID המשתמש
   * @param {string} resourceId - ID המשאב
   * @param {string} resourceType - סוג המשאב
   * @returns {Promise<boolean>}
   */
  async hasResourceAccess(userId, resourceId, resourceType) {
    try {
      let filter = `user_id=="${userId}" and is_active==true`

      switch (resourceType) {
        case 'house':
          filter += ` and house_id=="${resourceId}"`
          break
        case 'site':
          filter += ` and (site_id=="${resourceId}" or house.site_id=="${resourceId}")`
          break
        case 'company':
          filter += ` and company_id=="${resourceId}"`
          break
        default:
          return true // אם אין סוג משאב מוגדר, אל תחסום
      }

      const result = await sendCommand('sys_map', `filter=${filter}&limit=1`)
      return Array.isArray(result) && result.length > 0
    } catch (error) {
      console.error('Error checking resource access:', error)
      return false
    }
  },

  /**
   * קבלת פרטי הרשאה
   * @param {string} permissionName - שם ההרשאה
   * @returns {Promise<Object|null>}
   */
  async getPermissionDetails(permissionName) {
    try {
      const result = await sendCommand(
        'permissions',
        `filter=name=="${permissionName}"&fields=name,description,requires_ownership,resource_type,action_type`,
      )
      return Array.isArray(result) && result.length > 0 ? result[0] : null
    } catch (error) {
      console.error('Error getting permission details:', error)
      return null
    }
  },

  /**
   * קבלת כל ההרשאות האפקטיביות למשתמש
   * @param {string} userId - ID המשתמש
   * @returns {Promise<Array>}
   */
  async getUserEffectivePermissions(userId) {
    try {
      // שימוש ב-view שיצרנו במסד הנתונים
      const result = await sendCommand(
        'user_effective_permissions_view',
        `filter=user_id=="${userId}"&fields=permission_name,permission_description,permission_source,resource_id,expires_at`,
      )
      return Array.isArray(result) ? result : []
    } catch (error) {
      console.error('Error getting user effective permissions:', error)
      return []
    }
  },

  /**
   * קבלת חברות שהמשתמש יכול לגשת אליהן
   * @param {string} userId - ID המשתמש
   * @returns {Promise<Array>}
   */
  async getUserAccessibleCompanies(userId) {
    try {
      // בדיקה אם המשתמש הוא System Admin
      const isSystemAdmin = await this.isSystemAdmin(userId)

      if (isSystemAdmin) {
        // System Admin רואה את כל החברות
        const result = await sendCommand(
          'companies',
          `filter=deleted_at==null&fields=id,name,company_id`,
        )
        return Array.isArray(result) ? result.map((c) => ({ ...c, access_level: 'admin' })) : []
      } else {
        // משתמשים רגילים רואים לפי sys_map
        const result = await sendCommand(
          'sys_map',
          `filter=user_id=="${userId}" and is_active==true and company_id!=null&fields=company.id,company.name,company.company_id,access_level,permission_scope`,
        )
        return Array.isArray(result)
          ? result.map((sm) => ({
              id: sm.company.id,
              name: sm.company.name,
              company_id: sm.company.company_id,
              access_level: sm.access_level,
              permission_scope: sm.permission_scope,
            }))
          : []
      }
    } catch (error) {
      console.error('Error getting accessible companies:', error)
      return []
    }
  },

  /**
   * קבלת בתים שהמשתמש יכול לגשת אליהם
   * @param {string} userId - ID המשתמש
   * @returns {Promise<Array>}
   */
  async getUserAccessibleHouses(userId) {
    try {
      // בדיקה אם המשתמש הוא System Admin
      const isSystemAdmin = await this.isSystemAdmin(userId)

      if (isSystemAdmin) {
        // System Admin רואה את כל הבתים
        const result = await sendCommand(
          'houses_full_view',
          `fields=house_id,number,resident,client_id,site_name,company_name`,
        )
        return Array.isArray(result) ? result.map((h) => ({ ...h, access_level: 'admin' })) : []
      } else {
        // משתמשים רגילים רואים לפי sys_map
        const result = await sendCommand(
          'user_hierarchy_view',
          `filter=user_id=="${userId}" and mapping_active==true&fields=house_id,house_number,house_resident,site_name,company_name,role_level`,
        )
        return Array.isArray(result) ? result : []
      }
    } catch (error) {
      console.error('Error getting accessible houses:', error)
      return []
    }
  },

  /**
   * בדיקה אם המשתמש הוא System Admin
   * @param {string} userId - ID המשתמש
   * @returns {Promise<boolean>}
   */
  async isSystemAdmin(userId) {
    try {
      const result = await sendCommand('users', `filter=id=="${userId}"&fields=role.name`)
      return Array.isArray(result) && result.length > 0 && result[0].role?.name === 'System Admin'
    } catch (error) {
      console.error('Error checking System Admin status:', error)
      return false
    }
  },

  /**
   * וולידציה ליצירת משתמש חדש
   * @param {string} creatorId - ID יוצר המשתמש
   * @param {string} targetRole - תפקיד המטרה
   * @param {string} companyId - ID החברה (אופציונלי)
   * @param {string} siteId - ID האתר (אופציונלי)
   * @param {string} houseId - ID הבית (אופציונלי)
   * @returns {Promise<Object>}
   */
  async validateUserCreation(
    creatorId,
    targetRole,
    companyId = null,
    siteId = null,
    houseId = null,
  ) {
    try {
      // קבלת פרטי היוצר
      const creatorResult = await sendCommand(
        'users',
        `filter=id=="${creatorId}"&fields=role_id,role.name,role.can_assign_roles,role.level`,
      )

      if (!Array.isArray(creatorResult) || creatorResult.length === 0) {
        return { valid: false, error: 'Creator not found' }
      }

      const creator = creatorResult[0]

      // קבלת פרטי התפקיד המטרה
      const targetRoleResult = await sendCommand(
        'roles',
        `filter=name=="${targetRole}"&fields=id,name,level`,
      )

      if (!Array.isArray(targetRoleResult) || targetRoleResult.length === 0) {
        return { valid: false, error: 'Target role not found' }
      }

      const targetRoleData = targetRoleResult[0]

      // בדיקה אם היוצר יכול להקצות את התפקיד
      const canAssignRoles = creator.role?.can_assign_roles || []
      if (!canAssignRoles.includes(targetRole)) {
        return { valid: false, error: `Cannot assign role: ${targetRole}` }
      }

      // בדיקת גישה למשאב (אם סופק)
      if (companyId && !(await this.hasResourceAccess(creatorId, companyId, 'company'))) {
        return { valid: false, error: 'No access to specified company' }
      }

      if (siteId && !(await this.hasResourceAccess(creatorId, siteId, 'site'))) {
        return { valid: false, error: 'No access to specified site' }
      }

      if (houseId && !(await this.hasResourceAccess(creatorId, houseId, 'house'))) {
        return { valid: false, error: 'No access to specified house' }
      }

      return {
        valid: true,
        targetRoleId: targetRoleData.id,
        targetRoleLevel: targetRoleData.level,
      }
    } catch (error) {
      console.error('Error validating user creation:', error)
      return { valid: false, error: error.message }
    }
  },

  /**
   * עדכון הרשאות ספציפיות למשתמש
   * @param {string} userId - ID המשתמש
   * @param {Array} permissions - מערך הרשאות
   * @param {string} grantedBy - ID המעניק
   * @returns {Promise<boolean>}
   */
  async updateUserPermissions(userId, permissions, grantedBy) {
    try {
      // מחיקת הרשאות קיימות שלא פגו
      await sendCommand('user_permissions', '', 'DELETE', {
        filter: `user_id=="${userId}" and (expires_at==null or expires_at>>"${new Date().toISOString()}")`,
      })

      // הוספת הרשאות חדשות
      const validPermissions = []

      for (const perm of permissions) {
        if (perm.granted) {
          // קבלת permission_id
          const permResult = await sendCommand(
            'permissions',
            `filter=name=="${perm.name}"&fields=id`,
          )

          if (Array.isArray(permResult) && permResult.length > 0) {
            validPermissions.push({
              user_id: userId,
              permission_id: permResult[0].id,
              granted: true,
              resource_id: perm.resource_id || null,
              resource_type: perm.resource_type || null,
              expires_at: perm.expires_at || null,
              granted_by: grantedBy,
            })
          }
        }
      }

      if (validPermissions.length > 0) {
        await sendCommand('user_permissions', '', 'POST', validPermissions)
      }

      return true
    } catch (error) {
      console.error('Error updating user permissions:', error)
      throw error
    }
  },
}

// Export נוסף לתאימות לאחור
export default permissionsService
