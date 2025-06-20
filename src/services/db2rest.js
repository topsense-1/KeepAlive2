// src/services/db2rest.js - עדכון למבנה החדש עם מנגנון הרשאות מתקדם

// Base URL for db2rest API
const API_BASE_URL = import.meta.env.VITE_DB2REST_URL || 'http://localhost:8080/v1/rdbms/db'

/**
 * Generic function to send commands to db2rest
 * @param {string} tableName - שם הטבלה או ה-view
 * @param {string} queryParams - פרמטרי שאילתה
 * @param {string} method - HTTP method (GET, POST, PATCH, DELETE)
 * @param {Object} body - גוף הבקשה (עבור POST/PATCH)
 * @returns {Promise<any>}
 */
export async function sendCommand(tableName, queryParams = '', method = 'GET', body = null) {
  try {
    const url = `${API_BASE_URL}/${tableName}${queryParams ? `?${queryParams}` : ''}`

    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'keepalive-frontend/1.0',
      },
    }

    if (body && (method === 'POST' || method === 'PATCH')) {
      options.body = JSON.stringify(body)
    }

    const response = await fetch(url, options)

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error(`Error in sendCommand(${tableName}):`, error)
    throw error
  }
}

// =============================================================
// Authentication API
// =============================================================
export const authApi = {
  async login(email, password) {
    try {
      // קבלת משתמש לפי אימייל
      const userResult = await sendCommand('users', `filter=email=="${email}" and status==true`)

      if (!Array.isArray(userResult) || userResult.length === 0) {
        throw new Error('Invalid credentials')
      }

      const user = userResult[0]

      // בדיקת נעילת משתמש
      if (user.locked_until && new Date(user.locked_until) > new Date()) {
        throw new Error('Account is locked. Please try again later.')
      }

      // בדיקת סיסמה (בפועל זה יהיה hash comparison)
      if (user.password !== password) {
        // עדכון ניסיונות כושלים
        await sendCommand('users', `filter=id=="${user.id}"`, 'PATCH', {
          failed_login_attempts: (user.failed_login_attempts || 0) + 1,
          locked_until:
            (user.failed_login_attempts || 0) >= 4
              ? new Date(Date.now() + 15 * 60 * 1000).toISOString()
              : null, // נעילה ל-15 דקות
        })
        throw new Error('Invalid credentials')
      }

      // איפוס ניסיונות כושלים
      await sendCommand('users', `filter=id=="${user.id}"`, 'PATCH', {
        failed_login_attempts: 0,
        last_sign_in_at: new Date().toISOString(),
      })

      // יצירת session token (בסיסי לדמו)
      const sessionToken = btoa(
        JSON.stringify({
          userId: user.id,
          email: user.email,
          role: user.role,
          timestamp: Date.now(),
        }),
      )

      // 🎯 הוספה חשובה: שמירת הטוקן ב-localStorage
      localStorage.setItem('session_token', sessionToken)
      console.log('Token saved to localStorage:', sessionToken)

      return {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          role_id: user.role_id,
        },
        session: {
          access_token: sessionToken,
          expires_at: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8 שעות
        },
      }
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  },

  async getCurrentUser() {
    try {
      // בדיקת קיום טוקן
      const token = localStorage.getItem('session_token')
      if (!token) {
        console.log('No session token found')
        return null
      }

      // פענוח הטוקן
      const session = JSON.parse(atob(token))
      console.log('Decoded session from token:', session)

      // וולידציה שהטוקן לא פג (8 שעות)
      const now = Date.now()
      const tokenAge = now - session.timestamp
      const maxAge = 8 * 60 * 60 * 1000 // 8 שעות

      if (tokenAge > maxAge) {
        console.log('Token expired, clearing session')
        localStorage.removeItem('session_token')
        return null
      }

      // קבלת נתוני המשתמש מהמסד
      const userResult = await sendCommand(
        'users',
        `filter=id=="${session.userId}" and status==true&fields=id,username,email,full_name,role,role_id,status`,
      )

      if (!Array.isArray(userResult) || userResult.length === 0) {
        console.log('User not found or inactive:', session.userId)
        localStorage.removeItem('session_token')
        return null
      }

      const user = userResult[0]
      console.log('User data loaded from database:', user)

      return {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        role_id: user.role_id,
      }
    } catch (error) {
      console.error('Error getting current user:', error)
      localStorage.removeItem('session_token')
      return null
    }
  },

  async logout() {
    try {
      // ניקוי הטוקן מ-localStorage
      localStorage.removeItem('session_token')
      console.log('Session token removed from localStorage')

      return { success: true }
    } catch (error) {
      console.error('Logout error:', error)
      // גם אם יש שגיאה, נקה את הטוקן
      localStorage.removeItem('session_token')
      return { success: false, error: error.message }
    }
  },

  async isAuthenticated() {
    try {
      const user = await this.getCurrentUser()
      const isAuth = !!user
      console.log('Is authenticated:', isAuth)
      return isAuth
    } catch (error) {
      console.error('Error checking authentication:', error)
      return false
    }
  },

  async getUserRole() {
    const user = await this.getCurrentUser()
    return user?.role || null
  },
}

// =============================================================
// Companies API
// =============================================================
export const companiesApi = {
  async getAll() {
    return await sendCommand(
      'companies',
      'filter=deleted_at==null&fields=id,name,company_id,address,city,phone,email,status,created_at',
    )
  },

  async getById(id) {
    const result = await sendCommand(
      'companies',
      `filter=id=="${id}"&fields=id,name,company_id,address,city,phone,email,contact_person,status,created_at`,
    )
    return Array.isArray(result) && result.length > 0 ? result[0] : null
  },

  async create(companyData) {
    return await sendCommand('companies', '', 'POST', {
      ...companyData,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    })
  },

  async update(id, companyData) {
    return await sendCommand('companies', '', 'PATCH', {
      ...companyData,
      id,
      updated_at: new Date().toISOString(),
    })
  },

  async delete(id) {
    return await sendCommand('companies', '', 'DELETE', {
      id,
      deleted_at: new Date().toISOString(),
      status: 0,
    })
  },

  async createWithManager(companyData, managerData, createdBy) {
    try {
      // שימוש בפרוצדורה שיצרנו
      const result = await sendCommand('proc/create_company_with_manager', '', 'POST', {
        p_company_name: companyData.name,
        p_company_id: companyData.company_id,
        p_company_address: companyData.address || '',
        p_company_city: companyData.city || '',
        p_company_phone: companyData.phone || '',
        p_company_email: companyData.email || '',
        p_manager_name: managerData.full_name,
        p_manager_username: managerData.username,
        p_manager_email: managerData.email,
        p_manager_phone: managerData.phone || '',
        p_manager_password: managerData.password,
        p_created_by: createdBy,
      })
      return result
    } catch (error) {
      console.error('Error creating company with manager:', error)
      throw error
    }
  },
}

// =============================================================
// Sites API
// =============================================================
export const sitesApi = {
  async getAll() {
    return await sendCommand(
      'sites',
      'filter=deleted_at==null&fields=id,name,company_id,address,city,phone,contact_person,status,created_at,company.name,company.company_id',
    )
  },

  async getByCompanyId(companyId) {
    return await sendCommand(
      'sites',
      `filter=company_id=="${companyId}" and deleted_at==null&fields=id,name,address,city,phone,contact_person,status,created_at`,
    )
  },

  async getById(id) {
    const result = await sendCommand(
      'sites',
      `filter=id=="${id}"&fields=id,name,company_id,address,city,phone,contact_person,status,created_at,company.name`,
    )
    return Array.isArray(result) && result.length > 0 ? result[0] : null
  },

  async create(siteData) {
    return await sendCommand('sites', '', 'POST', {
      ...siteData,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    })
  },

  async update(id, siteData) {
    return await sendCommand('sites', '', 'PATCH', {
      ...siteData,
      id,
      updated_at: new Date().toISOString(),
    })
  },

  async delete(id) {
    return await sendCommand('sites', '', 'DELETE', {
      id,
      deleted_at: new Date().toISOString(),
      status: 0,
    })
  },

  async createWithManager(siteData, managerData, createdBy) {
    try {
      const result = await sendCommand('proc/create_site_with_manager', '', 'POST', {
        p_site_name: siteData.name,
        p_company_id: siteData.company_id,
        p_site_address: siteData.address || '',
        p_site_city: siteData.city || '',
        p_site_phone: siteData.phone || '',
        p_manager_name: managerData.full_name,
        p_manager_username: managerData.username,
        p_manager_email: managerData.email,
        p_manager_phone: managerData.phone || '',
        p_manager_password: managerData.password,
        p_created_by: createdBy,
      })
      return result
    } catch (error) {
      console.error('Error creating site with manager:', error)
      throw error
    }
  },
}

// =============================================================
// Houses API - עדכון מלא
// =============================================================
export const housesApi = {
  async getAll() {
    return await sendCommand(
      'houses_full_view',
      'fields=house_id,number,resident,client_id,installation_date,active_sensors,total_sensors,house_status,site_name,company_name',
    )
  },

  async getBySiteId(siteId) {
    return await sendCommand(
      'houses',
      `filter=site_id=="${siteId}" and deleted_at==null&fields=id,number,resident,client_id,installation_date,active_sensors,total_sensors,status,address,phone`,
    )
  },

  async getById(id) {
    const result = await sendCommand('houses_full_view', `filter=house_id=="${id}"`)
    return Array.isArray(result) && result.length > 0 ? result[0] : null
  },

  async create(houseData) {
    return await sendCommand('houses', '', 'POST', {
      ...houseData,
      id: crypto.randomUUID(),
      installation_date: new Date().toISOString(),
      last_update: new Date().toISOString(),
    })
  },

  async update(id, houseData) {
    return await sendCommand('houses', '', 'PATCH', {
      ...houseData,
      id,
      last_update: new Date().toISOString(),
    })
  },

  async delete(id) {
    return await sendCommand('houses', '', 'PATCH', {
      id,
      deleted_at: new Date().toISOString(),
      status: 0,
    })
  },

  async createWithManager(houseData, managerData, createdBy) {
    try {
      const result = await sendCommand('proc/create_house_with_manager', '', 'POST', {
        p_house_number: houseData.number,
        p_resident: houseData.resident,
        p_client_id: houseData.client_id,
        p_site_id: houseData.site_id,
        p_house_address: houseData.address || '',
        p_house_phone: houseData.phone || '',
        p_emergency_contact: houseData.emergency_contact || '',
        p_emergency_phone: houseData.emergency_phone || '',
        p_manager_name: managerData.full_name,
        p_manager_username: managerData.username,
        p_manager_email: managerData.email,
        p_manager_phone: managerData.phone || '',
        p_manager_password: managerData.password,
        p_manager_role: managerData.role,
        p_created_by: createdBy,
      })
      return result
    } catch (error) {
      console.error('Error creating house with manager:', error)
      throw error
    }
  },
}

// =============================================================
// Sensors API - עדכון מלא
// =============================================================
export const sensorsApi = {
  async getAll() {
    return await sendCommand(
      'sensors_full_view',
      'fields=sensor_id,device_id,device_name,sensor_status,signal_strength,battery,last_reading_at,sensor_type,sensor_location,house_number,resident,site_name,company_name',
    )
  },

  async getByHouseId(houseId) {
    return await sendCommand('sensors_full_view', `filter=house_id=="${houseId}"`)
  },

  async getById(id) {
    const result = await sendCommand('sensors_full_view', `filter=sensor_id=="${id}"`)
    return Array.isArray(result) && result.length > 0 ? result[0] : null
  },

  async create(sensorData) {
    return await sendCommand('sensors', '', 'POST', {
      ...sensorData,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    })
  },

  async update(id, sensorData) {
    return await sendCommand('sensors', '', 'PATCH', {
      ...sensorData,
      id,
      updated_at: new Date().toISOString(),
    })
  },

  async updateByDeviceId(deviceId, updates) {
    try {
      // קבלת החיישן לפי device_id
      const sensorResult = await sendCommand('sensors', `filter=device_id=="${deviceId}"&fields=id`)

      if (!Array.isArray(sensorResult) || sensorResult.length === 0) {
        throw new Error(`Sensor not found with device_id: ${deviceId}`)
      }

      const sensor = sensorResult[0]

      // עדכון החיישן
      return await sendCommand('sensors', '', 'PATCH', {
        ...updates,
        id: sensor.id,
        last_reading_at: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Error updating sensor by device_id:', error)
      throw error
    }
  },

  async delete(id) {
    return await sendCommand('sensors', '', 'DELETE', {
      id,
      deleted_at: new Date().toISOString(),
    })
  },

  // סוגי חיישנים
  async getSensorTypes() {
    return await sendCommand(
      'sensors_type',
      'filter=status==1&fields=id,name,description,manufacturer,model',
    )
  },

  // מיקומי חיישנים
  async getSensorLocations() {
    return await sendCommand('sensors_location', 'filter=status==1&fields=id,name,description,icon')
  },
}

// =============================================================
// Events API - עדכון מלא
// =============================================================
export const eventsApi = {
  async getAll(limit = 50) {
    return await sendCommand(
      'events_full_view',
      `limit=${limit}&sort=datetime:desc&fields=event_id,type,category,title,description,priority,severity,datetime,acknowledged,resolved,house_number,resident,site_name,company_name,sensor_name,sensor_location`,
    )
  },

  async getByHouseId(houseId, limit = 20) {
    return await sendCommand(
      'events_full_view',
      `filter=house_id=="${houseId}"&limit=${limit}&sort=datetime:desc`,
    )
  },

  async getUnacknowledged(limit = 10) {
    return await sendCommand(
      'events_full_view',
      `filter=acknowledged==false&limit=${limit}&sort=datetime:desc,priority:desc`,
    )
  },

  async getByPriority(priority, limit = 10) {
    return await sendCommand(
      'events_full_view',
      `filter=priority=="${priority}"&limit=${limit}&sort=datetime:desc`,
    )
  },

  async create(eventData) {
    return await sendCommand('events', '', 'POST', {
      ...eventData,
      id: crypto.randomUUID(),
      datetime: new Date().toISOString(),
    })
  },

  async acknowledge(eventId, userId) {
    return await sendCommand('events', '', 'PATCH', {
      id: eventId,
      acknowledged: true,
      acknowledged_by: userId,
      acknowledged_at: new Date().toISOString(),
    })
  },

  async resolve(eventId, userId, notes = null) {
    return await sendCommand('events', '', 'PATCH', {
      id: eventId,
      resolved: true,
      resolved_by: userId,
      resolved_at: new Date().toISOString(),
      notes: notes,
    })
  },
}

// =============================================================
// Users API - עדכון מלא למבנה החדש
// =============================================================
export const usersApi = {
  async getAll() {
    return await sendCommand(
      'user_details_view',
      'filter=status==1&fields=user_id,username,full_name,email,phone,role_name,role_level,status,last_sign_in_at,created_at',
    )
  },

  async getById(id) {
    const result = await sendCommand('user_details_view', `filter=user_id=="${id}"`)
    return Array.isArray(result) && result.length > 0 ? result[0] : null
  },

  async getByRole(roleName) {
    return await sendCommand(
      'user_details_view',
      `filter=role_name=="${roleName}" and status==1&fields=user_id,username,full_name,email,phone,last_sign_in_at`,
    )
  },

  async create(userData) {
    const newUser = {
      ...userData,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      password_must_change: true,
      status: 1,
    }

    return await sendCommand('users', '', 'POST', newUser)
  },

  async update(id, userData) {
    return await sendCommand('users', '', 'PATCH', {
      ...userData,
      id,
      updated_at: new Date().toISOString(),
    })
  },

  async delete(id, deletedBy) {
    try {
      // שימוש בפרוצדורה למחיקה רכה
      const result = await sendCommand('proc/soft_delete_user', '', 'POST', {
        p_user_id: id,
        p_deleted_by: deletedBy,
      })
      return result
    } catch (error) {
      console.error('Error deleting user:', error)
      throw error
    }
  },

  // קבלת משתמשים עם המיפוי ההירכי שלהם
  async getUsersWithHierarchy() {
    return await sendCommand(
      'user_hierarchy_view',
      'filter=mapping_active==true or mapping_active==null&fields=user_id,username,full_name,role_name,role_level,company_name,site_name,house_number,house_resident',
    )
  },

  // עדכון הרשאות משתמש
  async updatePermissions(userId, permissions, grantedBy) {
    try {
      const result = await sendCommand('proc/manage_user_permissions', '', 'POST', {
        p_user_id: userId,
        p_permissions_json: JSON.stringify(permissions),
        p_granted_by: grantedBy,
      })
      return result
    } catch (error) {
      console.error('Error updating user permissions:', error)
      throw error
    }
  },
}

// =============================================================
// Roles API - חדש
// =============================================================
export const rolesApi = {
  async getAll() {
    return await sendCommand(
      'roles',
      'filter=status==1&fields=id,name,description,level,is_system_role,can_create_users,can_assign_roles&sort=level:asc,name:asc',
    )
  },

  async getById(id) {
    const result = await sendCommand(
      'roles',
      `filter=id=="${id}"&fields=id,name,description,level,is_system_role,can_create_users,can_assign_roles`,
    )
    return Array.isArray(result) && result.length > 0 ? result[0] : null
  },

  async getAssignableRoles(creatorRoleId) {
    // קבלת רשימת התפקידים שניתן להקצות
    const creatorResult = await sendCommand(
      'roles',
      `filter=id=="${creatorRoleId}"&fields=can_assign_roles`,
    )

    if (!Array.isArray(creatorResult) || creatorResult.length === 0) {
      return []
    }

    const assignableRoles = creatorResult[0].can_assign_roles || []

    if (assignableRoles.length === 0) {
      return []
    }

    const roleNames = assignableRoles.map((role) => `"${role}"`).join(',')
    return await sendCommand(
      'roles',
      `filter=name in (${roleNames})&fields=id,name,description,level&sort=level:asc`,
    )
  },

  async getRolePermissions(roleId) {
    return await sendCommand(
      'role_permissions',
      `filter=role_id=="${roleId}"&fields=permission.name,permission.description,permission.category`,
    )
  },
}

// =============================================================
// Permissions API - חדש
// =============================================================
export const permissionsApi = {
  async getAll() {
    return await sendCommand(
      'permissions',
      'filter=status==1&fields=id,name,description,category,resource_type,action_type,requires_ownership&sort=category:asc,name:asc',
    )
  },

  async getByCategory(category) {
    return await sendCommand(
      'permissions',
      `filter=category=="${category}" and status==1&fields=id,name,description,requires_ownership&sort=name:asc`,
    )
  },

  async getUserPermissions(userId) {
    return await sendCommand(
      'user_effective_permissions_view',
      `filter=user_id=="${userId}"&fields=permission_name,permission_description,permission_category,permission_source,resource_id,expires_at`,
    )
  },
}

// =============================================================
// System Mapping API - חדש לטבלת sys_map
// =============================================================
export const systemMappingApi = {
  async getUserMappings(userId) {
    return await sendCommand(
      'user_hierarchy_view',
      `filter=user_id=="${userId}" and mapping_active==true&fields=company_id,company_name,site_id,site_name,house_id,house_number,house_resident,permission_scope,access_level`,
    )
  },

  async createMapping(mappingData) {
    return await sendCommand('sys_map', '', 'POST', {
      ...mappingData,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      is_active: true,
    })
  },

  async updateMapping(id, mappingData) {
    return await sendCommand('sys_map', '', 'PATCH', {
      ...mappingData,
      id,
    })
  },

  async deactivateMapping(id) {
    return await sendCommand('sys_map', '', 'DELETE', {
      id,
      is_active: false,
    })
  },

  async getUsersByResource(resourceType, resourceId) {
    let filter = `is_active==true`

    switch (resourceType) {
      case 'company':
        filter += ` and company_id=="${resourceId}"`
        break
      case 'site':
        filter += ` and site_id=="${resourceId}"`
        break
      case 'house':
        filter += ` and house_id=="${resourceId}"`
        break
    }

    return await sendCommand(
      'user_hierarchy_view',
      `filter=${filter}&fields=user_id,username,full_name,role_name,permission_scope,access_level`,
    )
  },
}

// =============================================================
// Alerts API - חדש
// =============================================================
export const alertsApi = {
  async getUserAlerts(userId, limit = 20) {
    return await sendCommand(
      'alerts',
      `filter=user_id=="${userId}"&limit=${limit}&sort=sent_at:desc&fields=id,type,title,message,priority,sent_at,delivered_at,read_at,house.number`,
    )
  },

  async getUnreadAlerts(userId) {
    return await sendCommand(
      'alerts',
      `filter=user_id=="${userId}" and read_at==null&sort=sent_at:desc&fields=id,type,title,message,priority,sent_at`,
    )
  },

  async markAsRead(alertId) {
    return await sendCommand('alerts', '', 'PATCH', {
      id: alertId,
      read_at: new Date().toISOString(),
    })
  },

  async markAllAsRead(userId) {
    return await sendCommand('alerts', '', 'PATCH', {
      filter: `user_id=="${userId}" and read_at==null`,
      read_at: new Date().toISOString(),
    })
  },
}

// =============================================================
// System Health API - חדש
// =============================================================
export const systemHealthApi = {
  async runHealthCheck() {
    try {
      const result = await sendCommand('proc/system_health_check', '', 'POST', {})
      return result
    } catch (error) {
      console.error('Error running health check:', error)
      throw error
    }
  },

  async getHealthLogs(limit = 10) {
    return await sendCommand(
      'system_health_log',
      `limit=${limit}&sort=checked_at:desc&fields=check_type,status,message,checked_at`,
    )
  },

  async getHealthStatus() {
    // קבלת סטטוס כללי מהבדיקות האחרונות
    const result = await sendCommand(
      'system_health_log',
      'filter=checked_at>=date_sub(now(),interval 1 hour)&fields=check_type,status&sort=checked_at:desc',
    )

    if (!Array.isArray(result)) return { status: 'unknown', checks: [] }

    // קיבוץ לפי סוג בדיקה ולקיחת הסטטוס האחרון
    const latestChecks = {}
    result.forEach((check) => {
      if (!latestChecks[check.check_type]) {
        latestChecks[check.check_type] = check.status
      }
    })

    // קביעת סטטוס כללי
    const statuses = Object.values(latestChecks)
    let overallStatus = 'pass'

    if (statuses.includes('error')) {
      overallStatus = 'error'
    } else if (statuses.includes('warning')) {
      overallStatus = 'warning'
    }

    return {
      status: overallStatus,
      checks: latestChecks,
      lastCheck: result.length > 0 ? result[0].checked_at : null,
    }
  },
}

// =============================================================
// Session Security API - עדכון
// =============================================================
export const sessionSecurityApi = {
  async checkPasswordExpiry(userId) {
    try {
      const user = await usersApi.getById(userId)

      if (!user || !user.password_expires_at) {
        return { expired: false }
      }

      const expiryDate = new Date(user.password_expires_at)
      const now = new Date()

      return {
        expired: now > expiryDate,
        expiresAt: expiryDate,
        hoursLeft: Math.max(0, Math.floor((expiryDate - now) / (1000 * 60 * 60))),
      }
    } catch (error) {
      console.error('Error checking password expiry:', error)
      return { expired: false, error: error.message }
    }
  },

  async extendPasswordExpiry(userId, hours = 24) {
    try {
      const newExpiry = new Date(Date.now() + hours * 60 * 60 * 1000)

      await usersApi.update(userId, {
        password_expires_at: newExpiry.toISOString(),
      })

      return { success: true, newExpiry }
    } catch (error) {
      console.error('Error extending password expiry:', error)
      throw error
    }
  },

  async clearPasswordExpiry(userId) {
    try {
      await usersApi.update(userId, {
        password_expires_at: null,
      })

      return { success: true }
    } catch (error) {
      console.error('Error clearing password expiry:', error)
      throw error
    }
  },
}

// Export all APIs
export default {
  authApi,
  companiesApi,
  sitesApi,
  housesApi,
  sensorsApi,
  eventsApi,
  usersApi,
  rolesApi,
  permissionsApi,
  systemMappingApi,
  alertsApi,
  systemHealthApi,
  sessionSecurityApi,
}
