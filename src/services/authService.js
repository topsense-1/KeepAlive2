// src/services/authService.js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

class AuthService {
  constructor() {
    this.currentUser = null
    this.token = null
    this.permissions = []
    this.isAuthenticated = false
  }

  // Authentication methods
  async login(credentials) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Login failed')
      }

      const data = await response.json()

      // Store authentication data
      this.token = data.token
      this.currentUser = data.user
      this.permissions = data.permissions || []
      this.isAuthenticated = true

      // Store in localStorage for persistence
      localStorage.setItem('auth_token', this.token)
      localStorage.setItem('current_user', JSON.stringify(this.currentUser))
      localStorage.setItem('user_permissions', JSON.stringify(this.permissions))

      return data
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  async logout() {
    try {
      if (this.token) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        })
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Clear authentication data
      this.currentUser = null
      this.token = null
      this.permissions = []
      this.isAuthenticated = false

      // Clear localStorage
      localStorage.removeItem('auth_token')
      localStorage.removeItem('current_user')
      localStorage.removeItem('user_permissions')
    }
  }

  async refreshToken() {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Token refresh failed')
      }

      const data = await response.json()
      this.token = data.token
      localStorage.setItem('auth_token', this.token)

      return data
    } catch (error) {
      console.error('Token refresh error:', error)
      await this.logout()
      throw error
    }
  }

  // Initialize from stored data
  initializeFromStorage() {
    const token = localStorage.getItem('auth_token')
    const userStr = localStorage.getItem('current_user')
    const permissionsStr = localStorage.getItem('user_permissions')

    if (token && userStr) {
      this.token = token
      this.currentUser = JSON.parse(userStr)
      this.permissions = permissionsStr ? JSON.parse(permissionsStr) : []
      this.isAuthenticated = true
    }
  }

  // Permission checking methods
  hasPermission(permission) {
    if (!this.isAuthenticated || !this.currentUser) {
      return false
    }

    // System Admin has all permissions
    if (this.currentUser.role === 'System Admin') {
      return true
    }

    return this.permissions.includes(permission)
  }

  hasAnyPermission(permissions) {
    return permissions.some((permission) => this.hasPermission(permission))
  }

  hasAllPermissions(permissions) {
    return permissions.every((permission) => this.hasPermission(permission))
  }

  // Role checking methods
  hasRole(role) {
    return this.currentUser?.role === role
  }

  hasAnyRole(roles) {
    return roles.includes(this.currentUser?.role)
  }

  // Resource access checking
  async canAccessResource(resourceType, resourceId, action = 'view') {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/check-access`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify({
          resourceType,
          resourceId,
          action,
        }),
      })

      if (!response.ok) {
        return false
      }

      const data = await response.json()
      return data.hasAccess
    } catch (error) {
      console.error('Access check error:', error)
      return false
    }
  }

  // Get user's accessible resources
  async getAccessibleResources(resourceType) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/auth/accessible-resources?type=${resourceType}`,
        {
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        },
      )

      if (!response.ok) {
        throw new Error('Failed to fetch accessible resources')
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching accessible resources:', error)
      throw error
    }
  }

  // Get current user info
  getCurrentUser() {
    return this.currentUser
  }

  getToken() {
    return this.token
  }

  getPermissions() {
    return this.permissions
  }

  // Check if user is authenticated
  isUserAuthenticated() {
    return this.isAuthenticated && this.token && this.currentUser
  }

  // Password management
  async changePassword(currentPassword, newPassword) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Password change failed')
      }

      return await response.json()
    } catch (error) {
      console.error('Password change error:', error)
      throw error
    }
  }

  async requestPasswordReset(email) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Password reset request failed')
      }

      return await response.json()
    } catch (error) {
      console.error('Password reset error:', error)
      throw error
    }
  }

  // User management (for authorized users)
  async getUsers() {
    try {
      const response = await fetch(`${API_BASE_URL}/users`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching users:', error)
      throw error
    }
  }

  async createUser(userData) {
    try {
      const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify(userData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'User creation failed')
      }

      return await response.json()
    } catch (error) {
      console.error('User creation error:', error)
      throw error
    }
  }

  async updateUser(userId, userData) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify(userData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'User update failed')
      }

      return await response.json()
    } catch (error) {
      console.error('User update error:', error)
      throw error
    }
  }

  async deleteUser(userId) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'User deletion failed')
      }

      return await response.json()
    } catch (error) {
      console.error('User deletion error:', error)
      throw error
    }
  }

  // Hierarchy management
  async createCompanyWithManager(companyData) {
    try {
      const response = await fetch(`${API_BASE_URL}/companies/with-manager`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify(companyData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Company creation failed')
      }

      return await response.json()
    } catch (error) {
      console.error('Company creation error:', error)
      throw error
    }
  }

  async createSiteWithManager(siteData) {
    try {
      const response = await fetch(`${API_BASE_URL}/sites/with-manager`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify(siteData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Site creation failed')
      }

      return await response.json()
    } catch (error) {
      console.error('Site creation error:', error)
      throw error
    }
  }

  async createHouseWithManager(houseData) {
    try {
      const response = await fetch(`${API_BASE_URL}/houses/with-manager`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify(houseData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'House creation failed')
      }

      return await response.json()
    } catch (error) {
      console.error('House creation error:', error)
      throw error
    }
  }
}

// Create singleton instance
const authService = new AuthService()

// Initialize from storage on module load
authService.initializeFromStorage()

export default authService
