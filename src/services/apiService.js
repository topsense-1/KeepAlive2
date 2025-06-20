// src/services/apiService.js
import authService from './authService.js'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

// Base API class with common functionality
class BaseAPI {
  constructor(endpoint) {
    this.endpoint = endpoint
  }

  async makeRequest(url, options = {}) {
    const token = authService.getToken()

    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    }

    const mergedOptions = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers,
      },
    }

    try {
      const response = await fetch(`${API_BASE_URL}${url}`, mergedOptions)

      // Handle token expiration
      if (response.status === 401) {
        try {
          await authService.refreshToken()
          // Retry request with new token
          mergedOptions.headers.Authorization = `Bearer ${authService.getToken()}`
          const retryResponse = await fetch(`${API_BASE_URL}${url}`, mergedOptions)

          if (!retryResponse.ok) {
            throw new Error(`HTTP ${retryResponse.status}: ${retryResponse.statusText}`)
          }

          return await retryResponse.json()
        } catch {
          authService.logout()
          throw new Error('Session expired. Please login again.')
        }
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }))
        throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`API Error (${url}):`, error)
      throw error
    }
  }

  async getAll(params = {}) {
    const queryString = new URLSearchParams(params).toString()
    const url = `${this.endpoint}${queryString ? `?${queryString}` : ''}`
    return this.makeRequest(url)
  }

  async getById(id) {
    return this.makeRequest(`${this.endpoint}/${id}`)
  }

  async create(data) {
    return this.makeRequest(this.endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async update(id, data) {
    return this.makeRequest(`${this.endpoint}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async delete(id) {
    return this.makeRequest(`${this.endpoint}/${id}`, {
      method: 'DELETE',
    })
  }
}

// Companies API
export class CompaniesAPI extends BaseAPI {
  constructor() {
    super('/companies')
  }

  async createWithManager(companyData) {
    return this.makeRequest('/companies/with-manager', {
      method: 'POST',
      body: JSON.stringify(companyData),
    })
  }

  async getManageableCompanies() {
    return this.makeRequest('/companies/manageable')
  }

  async getCompanyHierarchy(companyId) {
    return this.makeRequest(`/companies/${companyId}/hierarchy`)
  }
}

// Sites API
export class SitesAPI extends BaseAPI {
  constructor() {
    super('/sites')
  }

  async createWithManager(siteData) {
    return this.makeRequest('/sites/with-manager', {
      method: 'POST',
      body: JSON.stringify(siteData),
    })
  }

  async getByCompany(companyId) {
    return this.makeRequest(`/companies/${companyId}/sites`)
  }

  async getManageableSites() {
    return this.makeRequest('/sites/manageable')
  }
}

// Houses API
export class HousesAPI extends BaseAPI {
  constructor() {
    super('/houses')
  }

  async createWithManager(houseData) {
    return this.makeRequest('/houses/with-manager', {
      method: 'POST',
      body: JSON.stringify(houseData),
    })
  }

  async getBySite(siteId) {
    return this.makeRequest(`/sites/${siteId}/houses`)
  }

  async getByCompany(companyId) {
    return this.makeRequest(`/companies/${companyId}/houses`)
  }

  async getManageableHouses() {
    return this.makeRequest('/houses/manageable')
  }

  async getAccessibleHouses() {
    return this.makeRequest('/houses/accessible')
  }

  async getHouseWithSensors(houseId) {
    return this.makeRequest(`/houses/${houseId}/with-sensors`)
  }

  async updateSensorCounts(houseId) {
    return this.makeRequest(`/houses/${houseId}/sensor-counts`, {
      method: 'PUT',
    })
  }
}

// Sensors API
export class SensorsAPI extends BaseAPI {
  constructor() {
    super('/sensors')
  }

  async getByHouse(houseId) {
    return this.makeRequest(`/houses/${houseId}/sensors`)
  }

  async updateByDeviceId(deviceId, updateData) {
    return this.makeRequest(`/sensors/device/${deviceId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    })
  }

  async getTypes() {
    return this.makeRequest('/sensors/types')
  }

  async getLocations() {
    return this.makeRequest('/sensors/locations')
  }

  async bulkUpdate(updates) {
    return this.makeRequest('/sensors/bulk-update', {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
  }
}

// Users API
export class UsersAPI extends BaseAPI {
  constructor() {
    super('/users')
  }

  async getWithPermissions() {
    return this.makeRequest('/users/with-permissions')
  }

  async getManageableUsers() {
    return this.makeRequest('/users/manageable')
  }

  async updatePermissions(userId, permissions) {
    return this.makeRequest(`/users/${userId}/permissions`, {
      method: 'PUT',
      body: JSON.stringify({ permissions }),
    })
  }

  async assignHouses(userId, houseIds) {
    return this.makeRequest(`/users/${userId}/houses`, {
      method: 'PUT',
      body: JSON.stringify({ houseIds }),
    })
  }

  async getHouseAssignments(userId) {
    return this.makeRequest(`/users/${userId}/houses`)
  }

  async softDelete(userId) {
    return this.makeRequest(`/users/${userId}/soft-delete`, {
      method: 'DELETE',
    })
  }

  async restore(userId) {
    return this.makeRequest(`/users/${userId}/restore`, {
      method: 'PUT',
    })
  }

  async bulkCreate(usersData) {
    return this.makeRequest('/users/bulk-create', {
      method: 'POST',
      body: JSON.stringify({ users: usersData }),
    })
  }

  async bulkUpdate(updates) {
    return this.makeRequest('/users/bulk-update', {
      method: 'PUT',
      body: JSON.stringify({ updates }),
    })
  }

  async bulkDelete(userIds) {
    return this.makeRequest('/users/bulk-delete', {
      method: 'DELETE',
      body: JSON.stringify({ userIds }),
    })
  }

  async getRecentActivity() {
    return this.makeRequest('/users/recent-activity')
  }
}

// Events API
export class EventsAPI extends BaseAPI {
  constructor() {
    super('/events')
  }

  async getByHouse(houseId, params = {}) {
    const queryString = new URLSearchParams(params).toString()
    return this.makeRequest(`/houses/${houseId}/events${queryString ? `?${queryString}` : ''}`)
  }

  async getAccessibleEvents(params = {}) {
    const queryString = new URLSearchParams(params).toString()
    return this.makeRequest(`/events/accessible${queryString ? `?${queryString}` : ''}`)
  }

  async acknowledge(eventId) {
    return this.makeRequest(`/events/${eventId}/acknowledge`, {
      method: 'PUT',
    })
  }

  async resolve(eventId, notes = '') {
    return this.makeRequest(`/events/${eventId}/resolve`, {
      method: 'PUT',
      body: JSON.stringify({ notes }),
    })
  }

  async getByPriority(priority, params = {}) {
    const queryString = new URLSearchParams({ priority, ...params }).toString()
    return this.makeRequest(`/events/by-priority?${queryString}`)
  }
}

// Alerts API
export class AlertsAPI extends BaseAPI {
  constructor() {
    super('/alerts')
  }

  async getUnread() {
    return this.makeRequest('/alerts/unread')
  }

  async markAsRead(alertId) {
    return this.makeRequest(`/alerts/${alertId}/read`, {
      method: 'PUT',
    })
  }

  async markAllAsRead() {
    return this.makeRequest('/alerts/mark-all-read', {
      method: 'PUT',
    })
  }

  async getUserAlerts(params = {}) {
    const queryString = new URLSearchParams(params).toString()
    return this.makeRequest(`/alerts/user${queryString ? `?${queryString}` : ''}`)
  }
}

// Roles and Permissions API
export class RolesAPI extends BaseAPI {
  constructor() {
    super('/roles')
  }

  async getWithPermissions() {
    return this.makeRequest('/roles/with-permissions')
  }

  async getAssignableRoles() {
    return this.makeRequest('/roles/assignable')
  }

  async updateRolePermissions(roleId, permissions) {
    return this.makeRequest(`/roles/${roleId}/permissions`, {
      method: 'PUT',
      body: JSON.stringify({ permissions }),
    })
  }
}

export class PermissionsAPI extends BaseAPI {
  constructor() {
    super('/permissions')
  }

  async getByCategory() {
    return this.makeRequest('/permissions/by-category')
  }

  async checkUserPermission(permission, resourceId = null, resourceType = null) {
    return this.makeRequest('/permissions/check', {
      method: 'POST',
      body: JSON.stringify({ permission, resourceId, resourceType }),
    })
  }
}

// Dashboard API
export class DashboardAPI extends BaseAPI {
  constructor() {
    super('/dashboard')
  }

  async getStats() {
    return this.makeRequest('/dashboard/stats')
  }

  async getRecentEvents(limit = 10) {
    return this.makeRequest(`/dashboard/recent-events?limit=${limit}`)
  }

  async getSystemHealth() {
    return this.makeRequest('/dashboard/system-health')
  }

  async getAccessibleSummary() {
    return this.makeRequest('/dashboard/accessible-summary')
  }
}

// System Health API
export class SystemHealthAPI extends BaseAPI {
  constructor() {
    super('/system')
  }

  async runHealthCheck() {
    return this.makeRequest('/system/health-check', {
      method: 'POST',
    })
  }

  async getHealthLogs(params = {}) {
    const queryString = new URLSearchParams(params).toString()
    return this.makeRequest(`/system/health-logs${queryString ? `?${queryString}` : ''}`)
  }

  async getSettings() {
    return this.makeRequest('/system/settings')
  }

  async updateSettings(settings) {
    return this.makeRequest('/system/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    })
  }
}

// Export API instances
export const companiesApi = new CompaniesAPI()
export const sitesApi = new SitesAPI()
export const housesApi = new HousesAPI()
export const sensorsApi = new SensorsAPI()
export const usersApi = new UsersAPI()
export const eventsApi = new EventsAPI()
export const alertsApi = new AlertsAPI()
export const rolesApi = new RolesAPI()
export const permissionsApi = new PermissionsAPI()
export const dashboardApi = new DashboardAPI()
export const systemHealthApi = new SystemHealthAPI()

// Legacy compatibility - keep the same interface as before
export const legacyApi = {
  // Houses
  houses: {
    getAll: () => housesApi.getAccessibleHouses(),
    getById: (id) => housesApi.getHouseWithSensors(id),
    create: (data) => housesApi.create(data),
    update: (id, data) => housesApi.update(id, data),
    delete: (id) => housesApi.delete(id),
  },

  // Sensors
  sensors: {
    getByHouseId: (houseId) => sensorsApi.getByHouse(houseId),
    updateByDeviceId: (deviceId, data) => sensorsApi.updateByDeviceId(deviceId, data),
    create: (data) => sensorsApi.create(data),
    update: (id, data) => sensorsApi.update(id, data),
    delete: (id) => sensorsApi.delete(id),
  },

  // Events
  events: {
    getAll: (limit) => eventsApi.getAccessibleEvents({ limit }),
    getByHouseId: (houseId, limit) => eventsApi.getByHouse(houseId, { limit }),
    create: (data) => eventsApi.create(data),
  },

  // Users
  users: {
    getAll: () => usersApi.getWithPermissions(),
    create: (data) => usersApi.create(data),
    update: (id, data) => usersApi.update(id, data),
    delete: (id) => usersApi.softDelete(id),
    updatePermissions: (id, permissions) => usersApi.updatePermissions(id, permissions),
  },
}

export default legacyApi
