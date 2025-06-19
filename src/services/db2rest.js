// src/services/db2rest.js
import { Notify } from 'quasar'

const DB_BASE_URL = '/api'

// Session configuration
const SESSION_CONFIG = {
  TOKEN_EXPIRY_MINUTES: 30, // Configurable token expiry time
  STORAGE_KEY: 'KeePAlive-TopSense2025-Ssession',
  CHECK_INTERVAL: 60000, // Check session every minute
}

// Session manager class
class SessionManager {
  constructor() {
    this.checkInterval = null
    this.startSessionCheck()
  }

  // Generate a simple token (you can replace with more secure implementation)
  generateToken() {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2)
    return `${timestamp}.${random}` // Simple format: timestamp.randomstring
  }

  // Create session data
  createSession(user) {
    const now = new Date()
    const expiresAt = new Date(now.getTime() + SESSION_CONFIG.TOKEN_EXPIRY_MINUTES * 60 * 1000)

    const sessionData = {
      access_token: this.generateToken(),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      created_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      last_activity: now.toISOString(),
    }

    this.saveSession(sessionData)
    return sessionData
  }

  // Save session to localStorage
  saveSession(sessionData) {
    try {
      localStorage.setItem(SESSION_CONFIG.STORAGE_KEY, JSON.stringify(sessionData))
    } catch (error) {
      console.error('Error saving session:', error)
    }
  }

  // Get session from localStorage
  getSession() {
    try {
      const sessionData = localStorage.getItem(SESSION_CONFIG.STORAGE_KEY)
      return sessionData ? JSON.parse(sessionData) : null
    } catch (error) {
      console.error('Error getting session:', error)
      return null
    }
  }

  // Check if session is valid
  isSessionValid() {
    const session = this.getSession()
    if (!session || !session.expires_at) {
      return false
    }

    const now = new Date()
    const expiresAt = new Date(session.expires_at)

    return now < expiresAt
  }

  // Update last activity time
  updateActivity() {
    const session = this.getSession()
    if (session && this.isSessionValid()) {
      session.last_activity = new Date().toISOString()
      this.saveSession(session)
    }
  }

  // Extend session (refresh expiry time)
  extendSession() {
    const session = this.getSession()
    if (session && this.isSessionValid()) {
      const now = new Date()
      const newExpiresAt = new Date(now.getTime() + SESSION_CONFIG.TOKEN_EXPIRY_MINUTES * 60 * 1000)

      session.expires_at = newExpiresAt.toISOString()
      session.last_activity = now.toISOString()
      this.saveSession(session)

      return true
    }
    return false
  }

  // Clear session
  clearSession() {
    try {
      localStorage.removeItem(SESSION_CONFIG.STORAGE_KEY)
    } catch (error) {
      console.error('Error clearing session:', error)
    }
  }

  // Get current user from session
  getCurrentUser() {
    const session = this.getSession()
    if (session && this.isSessionValid()) {
      this.updateActivity()
      return session.user
    }
    return null
  }

  // Get current user id from session
  getSessionUserId() {
    const session = this.getSession()
    if (session && this.isSessionValid()) {
      this.updateActivity()
      return session.user.id
    }
    return null
  }

  // Get time until expiry (in minutes)
  getTimeUntilExpiry() {
    const session = this.getSession()
    if (!session || !session.expires_at) {
      return 0
    }

    const now = new Date()
    const expiresAt = new Date(session.expires_at)
    const diffMs = expiresAt.getTime() - now.getTime()

    return Math.max(0, Math.floor(diffMs / (1000 * 60)))
  }

  // Start automatic session checking
  startSessionCheck() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
    }

    this.checkInterval = setInterval(() => {
      if (!this.isSessionValid()) {
        this.handleSessionExpiry()
      }
    }, SESSION_CONFIG.CHECK_INTERVAL)
  }

  // Handle session expiry
  handleSessionExpiry() {
    const session = this.getSession()
    if (session) {
      this.clearSession()

      // Notify user about session expiry
      Notify.create({
        message: 'Your session has expired. Please log in again.',
        color: 'warning',
        position: 'top',
        timeout: 5000,
      })

      // Trigger auto-logout
      this.triggerAutoLogout()
    }
  }

  // Trigger auto-logout (you can customize this based on your routing)
  triggerAutoLogout() {
    // Dispatch custom event for components to listen to
    window.dispatchEvent(new CustomEvent('session-expired'))

    // You can also redirect to login page here if using vue-router
    // Example: this.$router.push('/login')
  }

  // Stop session checking
  stopSessionCheck() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
  }

  // Get session info for debugging
  getSessionInfo() {
    const session = this.getSession()
    if (!session) {
      return { status: 'No session' }
    }

    return {
      status: this.isSessionValid() ? 'Valid' : 'Expired',
      created_at: session.created_at,
      expires_at: session.expires_at,
      last_activity: session.last_activity,
      time_until_expiry: this.getTimeUntilExpiry(),
      user_id: session.user?.id,
      user_email: session.user?.email,
    }
  }
}

// Create global session manager instance
const sessionManager = new SessionManager()

// Helper function for making API calls
const sendCommand = async (table, params = '', successMessage = null, errorMessage = null) => {
  try {
    const url = params
      ? `${DB_BASE_URL}/${encodeURIComponent(table)}?${params}`
      : `${DB_BASE_URL}/${encodeURIComponent(table)}`

    console.log('DB2REST API call:', url)

    const response = await fetch(url)

    if (!response.ok) {
      if (errorMessage) {
        Notify.create({ message: errorMessage, color: 'negative' })
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    if (successMessage) {
      Notify.create({ message: successMessage, color: 'positive' })
    }

    const result = await response.json()

    // Update session activity on successful API calls
    sessionManager.updateActivity()

    return result
  } catch (error) {
    if (errorMessage) {
      Notify.create({ message: errorMessage, color: 'negative' })
    }
    console.error('DB2REST API error:', error)
    throw error
  }
}

// POST request helper
const sendPostCommand = async (table, data, successMessage = null, errorMessage = null) => {
  try {
    const url = `${DB_BASE_URL}/${encodeURIComponent(table)}`

    console.log('DB2REST POST call:', url, data)

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      if (errorMessage) {
        Notify.create({ message: errorMessage, color: 'negative' })
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    if (successMessage) {
      Notify.create({ message: successMessage, color: 'positive' })
    }

    const result = await response.json()

    // Update session activity on successful API calls
    sessionManager.updateActivity()

    return result
  } catch (error) {
    if (errorMessage) {
      Notify.create({ message: errorMessage, color: 'negative' })
    }
    console.error('DB2REST POST error:', error)
    throw error
  }
}

// PUT request helper
const sendPutCommand = async (table, id, data, successMessage = null, errorMessage = null) => {
  try {
    const url = `${DB_BASE_URL}/${encodeURIComponent(table)}?filter=id==${id}`

    console.log('DB2REST PATCH call:', url, data)

    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      if (errorMessage) {
        Notify.create({ message: errorMessage, color: 'negative' })
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    if (successMessage) {
      Notify.create({ message: successMessage, color: 'positive' })
    }

    const result = await response.json()

    // Update session activity on successful API calls
    sessionManager.updateActivity()

    return result
  } catch (error) {
    if (errorMessage) {
      Notify.create({ message: errorMessage, color: 'negative' })
    }
    console.error('DB2REST PUT error:', error)
    throw error
  }
}

// DELETE request helper
const sendDeleteCommand = async (table, id, successMessage = null, errorMessage = null) => {
  try {
    const url = `${DB_BASE_URL}/${encodeURIComponent(table)}?filter=id==${id}`

    console.log('DB2REST DELETE call:', url)

    const response = await fetch(url, {
      method: 'DELETE',
    })

    if (!response.ok) {
      if (errorMessage) {
        Notify.create({ message: errorMessage, color: 'negative' })
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    if (successMessage) {
      Notify.create({ message: successMessage, color: 'positive' })
    }

    // Update session activity on successful API calls
    sessionManager.updateActivity()

    return true
  } catch (error) {
    if (errorMessage) {
      Notify.create({ message: errorMessage, color: 'negative' })
    }
    console.error('DB2REST DELETE error:', error)
    throw error
  }
}

// Houses API
export const housesApi = {
  async getAll() {
    try {
      const housesResult = await sendCommand('houses')
      const houses = Array.isArray(housesResult) ? housesResult : []

      // חישוב נתוני החיישנים לכל בית
      const housesWithSensorCounts = []

      for (const house of houses) {
        try {
          // קבלת כל החיישנים של הבית
          const sensorsResult = await sendCommand('sensors', `filter=house_id==${house.id}`)
          const sensors = Array.isArray(sensorsResult) ? sensorsResult : []

          // חישוב מספר החיישנים הפעילים והכוללים
          const totalSensors = sensors.length
          const activeSensors = sensors.filter((sensor) => sensor.status === 'active').length

          housesWithSensorCounts.push({
            ...house,
            total_sensors: totalSensors,
            active_sensors: activeSensors,
          })
        } catch (error) {
          console.warn(`Error fetching sensors for house ${house.id}:`, error)
          // אם יש שגיאה, הוסף ערכי ברירת מחדל
          housesWithSensorCounts.push({
            ...house,
            total_sensors: 0,
            active_sensors: 0,
          })
        }
      }

      return housesWithSensorCounts
    } catch (error) {
      console.error('Error fetching houses:', error)
      throw error
    }
  },

  async getById(id) {
    try {
      // Get house with sensors - using joins or separate calls
      const houseResult = await sendCommand('houses', `filter=id==${id}`)

      if (!Array.isArray(houseResult) || houseResult.length === 0) {
        throw new Error('House not found')
      }

      const house = houseResult[0]

      // Get sensors for this house
      const sensorsResult = await sendCommand('sensors', `filter=house_id==${id}`)
      house.sensors = Array.isArray(sensorsResult) ? sensorsResult : []

      return house
    } catch (error) {
      console.error('Error fetching house by ID:', error)
      throw error
    }
  },

  async create(house) {
    try {
      console.log(house)
      const result = await sendPostCommand('houses', house)
      return result
    } catch (error) {
      console.error('Error creating house:', error)
      throw error
    }
  },

  async update(id, house) {
    try {
      const result = await sendPutCommand('houses', id, house)
      return result
    } catch (error) {
      console.error('Error updating house:', error)
      throw error
    }
  },

  async delete(id) {
    try {
      await sendDeleteCommand('houses', id)
      return true
    } catch (error) {
      console.error('Error deleting house:', error)
      throw error
    }
  },
}

// Sensors API
export const sensorsApi = {
  async getByHouseId(houseId) {
    try {
      const result = await sendCommand('sensors', `filter=house_id==${houseId}`)

      if (!Array.isArray(result)) {
        return []
      }

      // Transform the data to match the expected format
      const transformedSensors = []

      for (const sensor of result) {
        let transformedSensor = { ...sensor }

        // Get sensor type name if type_id exists
        if (sensor.type_id) {
          try {
            const typeResult = await sendCommand('sensors_type', `filter=id==${sensor.type_id}`)
            if (Array.isArray(typeResult) && typeResult.length > 0) {
              transformedSensor.type = typeResult[0].name
              transformedSensor.sensor_type = typeResult[0]
            }
          } catch (error) {
            console.warn('Error fetching sensor type:', error)
            transformedSensor.type = 'unknown'
          }
        } else {
          transformedSensor.type = 'unknown'
        }

        // Get sensor location name if location_id exists
        if (sensor.location_id) {
          try {
            const locationResult = await sendCommand(
              'sensors_location',
              `filter=id==${sensor.location_id}`,
            )
            if (Array.isArray(locationResult) && locationResult.length > 0) {
              transformedSensor.location = locationResult[0].name
              transformedSensor.sensor_location = locationResult[0]
            }
          } catch (error) {
            console.warn('Error fetching sensor location:', error)
            transformedSensor.location = 'unknown'
          }
        } else {
          transformedSensor.location = 'unknown'
        }

        transformedSensors.push(transformedSensor)
      }

      return transformedSensors
    } catch (error) {
      console.error('Error fetching sensors by house ID:', error)
      throw error
    }
  },

  async getSensorTypes() {
    try {
      const result = await sendCommand('sensors_type')
      return Array.isArray(result) ? result : []
    } catch (error) {
      console.error('Error fetching sensor types:', error)
      throw error
    }
  },

  async getSensorLocations() {
    try {
      const result = await sendCommand('sensors_location')
      return Array.isArray(result) ? result : []
    } catch (error) {
      console.error('Error fetching sensor locations:', error)
      throw error
    }
  },

  async create(sensor) {
    try {
      // Validate required fields
      if (!sensor.house_id) {
        throw new Error('Sensor must have a house_id')
      }

      // Create clean sensor object
      const sensorData = {
        house_id: sensor.house_id,
        type_id: sensor.type_id || null,
        location_id: sensor.location_id || null,
        status: sensor.status || 'active',
        signal_strength: sensor.signal_strength || 100,
        battery: sensor.battery || 100,
        position_x: sensor.position_x || null,
        position_y: sensor.position_y || null,
        light_level: sensor.light_level || null,
        temperature: sensor.temperature || null,
        humidity: sensor.humidity || null,
        device_id: sensor.device_id || null,
        device_name: sensor.device_name || null,
        model_id: sensor.model_id || null,
        manufacturer: sensor.manufacturer || null,
        endpoint: sensor.endpoint || null,
      }

      console.log('Creating sensor with data:', sensorData)

      const result = await sendPostCommand('sensors', sensorData)

      // Transform the returned data to match expected format
      let transformedSensor = { ...result }

      // Get type and location names
      if (result.type_id) {
        try {
          const typeResult = await sendCommand('sensors_type', `filter=id==${result.type_id}`)
          if (Array.isArray(typeResult) && typeResult.length > 0) {
            transformedSensor.type = typeResult[0].name
            transformedSensor.sensor_type = typeResult[0]
          }
        } catch {
          transformedSensor.type = 'unknown'
        }
      }

      if (result.location_id) {
        try {
          const locationResult = await sendCommand(
            'sensors_location',
            `filter=id==${result.location_id}`,
          )
          if (Array.isArray(locationResult) && locationResult.length > 0) {
            transformedSensor.location = locationResult[0].name
            transformedSensor.sensor_location = locationResult[0]
          }
        } catch {
          transformedSensor.location = 'unknown'
        }
      }

      return transformedSensor
    } catch (error) {
      console.error('Error in sensorsApi.create:', error)
      throw error
    }
  },

  async update(id, sensor) {
    try {
      // If we have a location but not a location_id, convert it
      if (sensor.location && !sensor.location_id) {
        try {
          const locationResult = await sendCommand(
            'sensors_location',
            `filter=name=="${sensor.location}"`,
          )
          if (Array.isArray(locationResult) && locationResult.length > 0) {
            sensor.location_id = locationResult[0].id
          } else {
            throw new Error(`Could not find sensor location: ${sensor.location}`)
          }
        } catch (locationError) {
          console.error('Error converting location to location_id:', locationError)
          throw new Error(`Could not convert location to location_id: ${locationError.message}`)
        }
      }

      // Create clean sensor object
      const cleanSensor = { ...sensor }
      delete cleanSensor.location
      delete cleanSensor.sensor_location
      delete cleanSensor.type
      delete cleanSensor.sensor_type

      // Update the sensor
      await sendPutCommand('sensors', id, cleanSensor)

      // Fetch the updated sensor with full data
      const updatedResult = await sendCommand('sensors', `filter=id==${id}`)

      if (!Array.isArray(updatedResult) || updatedResult.length === 0) {
        throw new Error('Updated sensor not found')
      }

      let updatedSensor = updatedResult[0]

      // Get type and location names
      if (updatedSensor.type_id) {
        try {
          const typeResult = await sendCommand(
            'sensors_type',
            `filter=id==${updatedSensor.type_id}`,
          )
          if (Array.isArray(typeResult) && typeResult.length > 0) {
            updatedSensor.type = typeResult[0].name
            updatedSensor.sensor_type = typeResult[0]
          }
        } catch {
          updatedSensor.type = 'unknown'
        }
      }

      if (updatedSensor.location_id) {
        try {
          const locationResult = await sendCommand(
            'sensors_location',
            `filter=id==${updatedSensor.location_id}`,
          )
          if (Array.isArray(locationResult) && locationResult.length > 0) {
            updatedSensor.location = locationResult[0].name
            updatedSensor.sensor_location = locationResult[0]
          }
        } catch {
          updatedSensor.location = 'unknown'
        }
      }

      return updatedSensor
    } catch (error) {
      console.error('Error in sensorsApi.update:', error)
      throw error
    }
  },

  async updateByDeviceId(deviceId, updateData) {
    try {
      console.log('Updating sensor by device_id:', deviceId, updateData)

      // First find the sensor by device_id
      const sensorResult = await sendCommand('sensors', `filter=id=="${deviceId}"`)

      if (!Array.isArray(sensorResult) || sensorResult.length === 0) {
        console.log('No sensor found with device_id:', deviceId)
        return null
      }

      const sensor = sensorResult[0]

      // Update the sensor
      await sendPutCommand('sensors', sensor.id, updateData)

      // Get the updated sensor with full data
      const updatedResult = await sendCommand('sensors', `filter=id==${sensor.id}`)
      let updatedSensor = updatedResult[0]

      // Get type and location names
      if (updatedSensor.type_id) {
        try {
          const typeResult = await sendCommand(
            'sensors_type',
            `filter=id==${updatedSensor.type_id}`,
          )
          if (Array.isArray(typeResult) && typeResult.length > 0) {
            updatedSensor.type = typeResult[0].name
            updatedSensor.sensor_type = typeResult[0]
          }
        } catch {
          updatedSensor.type = 'unknown'
        }
      }

      if (updatedSensor.location_id) {
        try {
          const locationResult = await sendCommand(
            'sensors_location',
            `filter=id==${updatedSensor.location_id}`,
          )
          if (Array.isArray(locationResult) && locationResult.length > 0) {
            updatedSensor.location = locationResult[0].name
            updatedSensor.sensor_location = locationResult[0]
          }
        } catch {
          updatedSensor.location = 'unknown'
        }
      }

      console.log('Successfully updated sensor:', updatedSensor.id)
      return updatedSensor
    } catch (error) {
      console.error('Error in sensorsApi.updateByDeviceId:', error)
      throw error
    }
  },

  async delete(id) {
    try {
      await sendDeleteCommand('sensors', id)
      return true
    } catch (error) {
      console.error('Error deleting sensor:', error)
      throw error
    }
  },
}

// Events API
export const eventsApi = {
  async getAll(limit = 20) {
    try {
      const result = await sendCommand('events', `limit=${limit}&sort=datetime`)

      if (!Array.isArray(result)) {
        return []
      }

      // Get house information for each event
      const eventsWithHouses = []
      for (const event of result) {
        let eventWithHouse = { ...event }

        if (event.house_id) {
          try {
            const houseResult = await sendCommand(
              'houses',
              `filter=id==${event.house_id}&fields=id,number`,
            )
            if (Array.isArray(houseResult) && houseResult.length > 0) {
              eventWithHouse.house = houseResult[0]
            }
          } catch (error) {
            console.warn('Error fetching house for event:', error)
          }
        }

        eventsWithHouses.push(eventWithHouse)
      }

      return eventsWithHouses
    } catch (error) {
      console.error('Error fetching events:', error)
      throw error
    }
  },

  async getByHouseId(houseId, limit = 20) {
    try {
      const result = await sendCommand(
        'events',
        `filter=house_id==${houseId}&limit=${limit}&sort=-datetime`,
      )
      return Array.isArray(result) ? result : []
    } catch (error) {
      console.error('Error fetching events by house ID:', error)
      throw error
    }
  },

  async create(event) {
    try {
      const result = await sendPostCommand('events', event)
      return result
    } catch (error) {
      console.error('Error creating event:', error)
      throw error
    }
  },
}

// Users API
// Enhanced Users API with CRUD operations
export const usersApi = {
  async getAll() {
    try {
      // Get all users including soft deleted ones
      const result = await sendCommand('users')

      if (!Array.isArray(result)) {
        return []
      }

      // Get house assignments for each user
      const usersWithHouses = []
      for (const user of result) {
        try {
          // Get user's assigned houses
          const houseAssignments = await sendCommand('user_houses', `filter=user_id=="${user.id}"`)

          const assignedHouses = []
          if (Array.isArray(houseAssignments)) {
            for (const assignment of houseAssignments) {
              try {
                const houseResult = await sendCommand(
                  'houses',
                  `filter=id=="${assignment.house_id}"`,
                )
                if (Array.isArray(houseResult) && houseResult.length > 0) {
                  assignedHouses.push({
                    id: houseResult[0].id,
                    name: houseResult[0].number,
                  })
                }
              } catch (error) {
                console.warn('Error fetching house details:', error)
              }
            }
          }

          usersWithHouses.push({
            ...user,
            assignedHouses,
          })
        } catch (error) {
          console.warn('Error fetching user houses:', error)
          usersWithHouses.push({
            ...user,
            assignedHouses: [],
          })
        }
      }

      return usersWithHouses
    } catch (error) {
      console.error('Error fetching users:', error)
      throw error
    }
  },

  async getById(id) {
    try {
      const result = await sendCommand('users', `filter=id=="${id}"`)
      if (Array.isArray(result) && result.length > 0) {
        return result[0]
      }
      return null
    } catch (error) {
      console.error('Error fetching user by ID:', error)
      throw error
    }
  },

  // תחליף את הפונקציה usersApi.create ב-db2rest.js:

  async create(userData) {
    try {
      console.log('usersApi.create called with:', userData)

      // Helper function לניקוי ערכים
      const cleanValue = (value) => {
        if (value === undefined || value === '') return null
        return value
      }

      // Helper function לטיפול בתאריכים
      const formatDateTime = (date) => {
        if (!date) return null
        if (date instanceof Date) {
          return date.toISOString()
        }
        if (typeof date === 'string' && date.trim() !== '') {
          try {
            const parsed = new Date(date)
            if (isNaN(parsed.getTime())) return null
            return parsed.toISOString()
          } catch {
            return null
          }
        }
        return null
      }

      const now = new Date().toISOString()

      // Create clean user object - רק שדות שקיימים בטבלת users
      const userToCreate = {
        id: generateUUID(),
        email: cleanValue(userData.email?.trim()?.toLowerCase()),
        full_name: cleanValue(userData.full_name?.trim()),
        phone: cleanValue(userData.phone?.trim()),
        israeli_id: cleanValue(userData.israeli_id?.trim()),
        address: cleanValue(userData.address?.trim()),
        city: cleanValue(userData.city?.trim()),
        role: userData.role || 'Family Member',

        // שדות סיסמה
        password: cleanValue(userData.password?.trim()),
        password_expires_at: formatDateTime(userData.password_expires_at),

        // שדות תאריך
        created_at: userData.created_at || now,
        updated_at: userData.updated_at || now,
        deleted_at: null,
        email_confirmed_at: formatDateTime(userData.email_confirmed_at),
        invitation_sent_at: formatDateTime(userData.invitation_sent_at),
        last_sign_in_at: formatDateTime(userData.last_sign_in_at),
      }

      // וודא שהשדות הנדרשים קיימים
      if (!userToCreate.email) {
        throw new Error('Email is required')
      }
      if (!userToCreate.full_name) {
        throw new Error('Full name is required')
      }

      // הסר שדות עם ערכים null/undefined כדי למנוע בעיות המרה
      const cleanedUser = Object.keys(userToCreate).reduce((acc, key) => {
        const value = userToCreate[key]
        if (value !== null && value !== undefined) {
          acc[key] = value
        }
        return acc
      }, {})

      console.log('Sending cleaned user data to API:', cleanedUser)

      const result = await sendPostCommand('users', cleanedUser)

      // הערה: assignedHouses מנוהל עכשיו בנפרד ולא כאן!
      // הקוד הקורא אחראי לקרוא ל-assignHouses אחרי יצירת המשתמש

      console.log('User created successfully:', result)
      return result
    } catch (error) {
      console.error('Error in usersApi.create:', error)

      // הוסף מידע נוסף לשגיאה
      if (error.message && error.message.includes('LocalDateTime')) {
        error.message = 'Date format error: ' + error.message
      }

      throw error
    }
  },

  // תחליף את usersApi.update ב-db2rest.js:

  async update(id, userData) {
    try {
      console.log('usersApi.update called with:', { id, userData })

      // Helper function לניקוי ערכים
      const cleanValue = (value) => {
        if (value === undefined || value === '') return null
        return value
      }

      // Helper function לטיפול בתאריכים
      const formatDateTime = (date) => {
        if (!date) return null
        if (date instanceof Date) {
          return date.toISOString()
        }
        if (typeof date === 'string' && date.trim() !== '') {
          try {
            const parsed = new Date(date)
            if (isNaN(parsed.getTime())) return null
            return parsed.toISOString()
          } catch {
            return null
          }
        }
        return null
      }

      // יצר אובייקט עדכון נקי - רק שדות מטבלת users
      const updateData = {}

      // העתק רק שדות רלוונטיים
      if (userData.full_name !== undefined)
        updateData.full_name = cleanValue(userData.full_name?.trim())
      if (userData.email !== undefined)
        updateData.email = cleanValue(userData.email?.trim()?.toLowerCase())
      if (userData.phone !== undefined) updateData.phone = cleanValue(userData.phone?.trim())
      if (userData.israeli_id !== undefined)
        updateData.israeli_id = cleanValue(userData.israeli_id?.trim())
      if (userData.address !== undefined) updateData.address = cleanValue(userData.address?.trim())
      if (userData.city !== undefined) updateData.city = cleanValue(userData.city?.trim())
      if (userData.role !== undefined) updateData.role = userData.role
      if (userData.password !== undefined)
        updateData.password = cleanValue(userData.password?.trim())

      // טיפול בתאריכים
      if (userData.password_expires_at !== undefined) {
        updateData.password_expires_at = formatDateTime(userData.password_expires_at)
      }
      if (userData.email_confirmed_at !== undefined) {
        updateData.email_confirmed_at = formatDateTime(userData.email_confirmed_at)
      }
      if (userData.invitation_sent_at !== undefined) {
        updateData.invitation_sent_at = formatDateTime(userData.invitation_sent_at)
      }
      if (userData.last_sign_in_at !== undefined) {
        updateData.last_sign_in_at = formatDateTime(userData.last_sign_in_at)
      }
      if (userData.deleted_at !== undefined) {
        updateData.deleted_at = formatDateTime(userData.deleted_at)
      }
      if (userData.created_at !== undefined) {
        updateData.created_at = formatDateTime(userData.created_at)
      }
      if (userData.updated_at !== undefined) {
        updateData.updated_at = formatDateTime(userData.updated_at)
      }

      // הסר שדות עם ערכים null/undefined
      const cleanedData = Object.keys(updateData).reduce((acc, key) => {
        const value = updateData[key]
        if (value !== null && value !== undefined) {
          acc[key] = value
        }
        return acc
      }, {})

      console.log('Sending cleaned update data to API:', cleanedData)

      if (Object.keys(cleanedData).length === 0) {
        console.log('No data to update')
        return { success: true }
      }

      const result = await sendPutCommand('users', id, cleanedData)

      // הערה: assignedHouses מנוהל בנפרד ולא כאן!
      // הקוד הקורא אחראי לקרוא ל-assignHouses בנפרד

      console.log('User updated successfully:', result)
      return result
    } catch (error) {
      console.error('Error in usersApi.update:', error)

      // הוסף מידע נוסף לשגיאה
      if (error.message && error.message.includes('LocalDateTime')) {
        error.message = 'Date format error: ' + error.message
      }

      throw error
    }
  },

  async softDelete(id) {
    try {
      const result = await sendPutCommand('users', id, {
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      return result
    } catch (error) {
      console.error('Error soft deleting user:', error)
      throw error
    }
  },

  async restore(id) {
    try {
      const result = await sendPutCommand('users', id, {
        deleted_at: null,
        updated_at: new Date().toISOString(),
      })
      return result
    } catch (error) {
      console.error('Error restoring user:', error)
      throw error
    }
  },

  async hardDelete(id) {
    try {
      // First remove all house assignments
      await this.removeAllHouseAssignments(id)

      // Then delete the user
      await sendDeleteCommand('users', id)
      return true
    } catch (error) {
      console.error('Error hard deleting user:', error)
      throw error
    }
  },

  async assignHouses(userId, houseIds) {
    try {
      // First, remove all existing house assignments
      await this.removeAllHouseAssignments(userId)

      // Then add new assignments
      if (houseIds && houseIds.length > 0) {
        for (const houseId of houseIds) {
          try {
            await sendPostCommand('user_houses', {
              // id: generateUUID(),
              user_id: userId,
              house_id: houseId,
              assigned_at: new Date().toISOString(),
            })
          } catch (error) {
            console.warn(`Error assigning house ${houseId} to user ${userId}:`, error)
          }
        }
      }

      return true
    } catch (error) {
      console.error('Error assigning houses:', error)
      throw error
    }
  },

  async removeAllHouseAssignments(userId) {
    try {
      const assignments = await sendCommand('user_houses', `filter=user_id=="${userId}"`)

      if (Array.isArray(assignments)) {
        for (const assignment of assignments) {
          try {
            await sendDeleteCommand('user_houses', assignment.id)
          } catch (error) {
            console.warn('Error removing house assignment:', error)
          }
        }
      }

      return true
    } catch (error) {
      console.error('Error removing house assignments:', error)
      throw error
    }
  },

  async updatePermissions(userId, permissions) {
    try {
      // First, remove all existing permissions
      const existingPermissions = await sendCommand(
        'user_permissions',
        `filter=user_id=="${userId}"`,
      )

      if (Array.isArray(existingPermissions)) {
        for (const perm of existingPermissions) {
          try {
            await sendDeleteCommand('user_permissions', perm.id)
          } catch (error) {
            console.warn('Error removing existing permission:', error)
          }
        }
      }

      // Then add new permissions
      for (const permission of permissions) {
        if (permission.granted) {
          try {
            await sendPostCommand('user_permissions', {
              // id: generateUUID(),
              user_id: userId,
              permission_id: permission.id,
              granted: true,
              granted_at: new Date().toISOString(),
            })
          } catch (error) {
            console.warn('Error granting permission:', error)
          }
        }
      }

      return true
    } catch (error) {
      console.error('Error updating permissions:', error)
      throw error
    }
  },

  async getActiveSystemAdmins() {
    try {
      const result = await sendCommand('users', `filter=role=="System Admin" AND deleted_at==null`)
      return Array.isArray(result) ? result : []
    } catch (error) {
      console.error('Error fetching active system admins:', error)
      return []
    }
  },

  async checkEmailExists(email, excludeUserId = null) {
    try {
      let filter = `filter=email=="${email}"`
      if (excludeUserId) {
        filter += ` AND id!="${excludeUserId}"`
      }

      const result = await sendCommand('users', filter)
      return Array.isArray(result) && result.length > 0
    } catch (error) {
      console.error('Error checking email existence:', error)
      return false
    }
  },

  async updateLastLogin(userId) {
    try {
      await sendPutCommand('users', userId, {
        last_sign_in_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      return true
    } catch (error) {
      console.error('Error updating last login:', error)
      return false
    }
  },

  async resetPassword(userId, newPassword, isTemporary = true) {
    try {
      const updateData = {
        password: newPassword,
        updated_at: new Date().toISOString(),
      }

      if (isTemporary) {
        updateData.password_expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      } else {
        updateData.password_expires_at = null
      }

      await sendPutCommand('users', userId, updateData)
      return true
    } catch (error) {
      console.error('Error resetting password:', error)
      throw error
    }
  },

  async markEmailConfirmed(userId) {
    try {
      await sendPutCommand('users', userId, {
        email_confirmed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      return true
    } catch (error) {
      console.error('Error marking email as confirmed:', error)
      throw error
    }
  },
}

// Email API for sending invitations and notifications
export const emailApi = {
  async sendInvitation(email, userId) {
    try {
      // In a real implementation, this would send an actual email
      // For now, we'll simulate the email sending
      console.log(`Sending invitation to ${email} for user ${userId}`)

      // You would typically use a service like SendGrid, AWS SES, etc.
      // const invitationData = {
      //   to: email,
      //   subject: 'Invitation to join our platform',
      //   template: 'user-invitation',
      //   data: {
      //     invitationLink: `${window.location.origin}/register?token=${generateInvitationToken(userId)}`,
      //     userId: userId,
      //   },
      // }

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // In production, replace with actual email service call:
      // const result = await fetch('/api/send-email', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(invitationData)
      // })

      return { success: true, messageId: generateUUID() }
    } catch (error) {
      console.error('Error sending invitation email:', error)
      throw error
    }
  },

  async sendTemporaryPassword(email, tempPassword) {
    try {
      console.log(`Sending temporary password to ${email}: ${tempPassword}`)

      // const emailData = {
      //   to: email,
      //   subject: 'Your temporary password',
      //   template: 'temporary-password',
      //   data: {
      //     tempPassword: tempPassword,
      //     loginLink: `${window.location.origin}/login`,
      //     expiryHours: 24,
      //   },
      // }

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // In production, replace with actual email service call
      return { success: true, messageId: generateUUID() }
    } catch (error) {
      console.error('Error sending temporary password email:', error)
      throw error
    }
  },

  async sendPasswordReset(email, resetToken) {
    try {
      console.log(`Sending password reset to ${email} with token ${resetToken}`)

      // const emailData = {
      //   to: email,
      //   subject: 'Password Reset Request',
      //   template: 'password-reset',
      //   data: {
      //     resetLink: `${window.location.origin}/reset-password?token=${resetToken}`,
      //     expiryHours: 1,
      //   },
      // }

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      return { success: true, messageId: generateUUID() }
    } catch (error) {
      console.error('Error sending password reset email:', error)
      throw error
    }
  },

  async sendWelcomeEmail(email, userName) {
    try {
      console.log(`Sending welcome email to ${email} for ${userName}`)

      // const emailData = {
      //   to: email,
      //   subject: 'Welcome to our platform!',
      //   template: 'welcome',
      //   data: {
      //     userName: userName,
      //     loginLink: `${window.location.origin}/login`,
      //   },
      // }

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 500))

      return { success: true, messageId: generateUUID() }
    } catch (error) {
      console.error('Error sending welcome email:', error)
      throw error
    }
  },
}

// Helper function to generate UUID
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0
    const v = c == 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

// Helper function to generate invitation token
// function generateInvitationToken(userId) {
//   // In production, use a proper JWT or secure token generation
//   const timestamp = Date.now()
//   const random = Math.random().toString(36).substring(2)
//   return btoa(`${userId}:${timestamp}:${random}`)
// }

// Enhanced validation helpers
export const validationHelpers = {
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  },

  isValidIsraeliId(id) {
    if (!id || id.length !== 9) return false

    // Israeli ID validation algorithm (Luhn-like)
    const digits = id.split('').map(Number)
    let sum = 0

    for (let i = 0; i < 8; i++) {
      let digit = digits[i] * ((i % 2) + 1)
      if (digit > 9) digit = Math.floor(digit / 10) + (digit % 10)
      sum += digit
    }

    const checkDigit = (10 - (sum % 10)) % 10
    return checkDigit === digits[8]
  },

  isValidPhone(phone) {
    if (!phone) return true // Phone is optional
    // Israeli phone format: 05X-XXX-XXXX or 0X-XXX-XXXX
    const phoneRegex = /^0[2-9]-?\d{3}-?\d{4}$/
    return phoneRegex.test(phone.replace(/\s/g, ''))
  },

  isStrongPassword(password) {
    if (!password || password.length < 8) return false

    // Check for at least one uppercase, one lowercase, one number
    const hasUpper = /[A-Z]/.test(password)
    const hasLower = /[a-z]/.test(password)
    const hasNumber = /\d/.test(password)

    return hasUpper && hasLower && hasNumber
  },

  generateSecurePassword(length = 12) {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const lowercase = 'abcdefghijklmnopqrstuvwxyz'
    const numbers = '0123456789'
    const symbols = '!@#$%^&*'

    let password = ''

    // Ensure at least one of each type
    password += uppercase[Math.floor(Math.random() * uppercase.length)]
    password += lowercase[Math.floor(Math.random() * lowercase.length)]
    password += numbers[Math.floor(Math.random() * numbers.length)]
    password += symbols[Math.floor(Math.random() * symbols.length)]

    // Fill the rest randomly
    const allChars = uppercase + lowercase + numbers + symbols
    for (let i = password.length; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)]
    }

    // Shuffle the password
    return password
      .split('')
      .sort(() => 0.5 - Math.random())
      .join('')
  },

  sanitizeInput(input) {
    if (typeof input !== 'string') return input

    // Remove potentially dangerous characters
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove HTML brackets
      .replace(/['"]/g, '') // Remove quotes to prevent SQL injection
      .substring(0, 255) // Limit length
  },

  formatPhoneNumber(phone) {
    if (!phone) return ''

    // Remove all non-digits
    const digits = phone.replace(/\D/g, '')

    // Format as XXX-XXX-XXXX
    if (digits.length === 10) {
      return `${digits.substring(0, 3)}-${digits.substring(3, 6)}-${digits.substring(6)}`
    }

    return phone
  },
}

// User statistics and analytics helpers
export const userStatsApi = {
  async getUserStats() {
    try {
      const users = await usersApi.getAll()

      const stats = {
        total: users.length,
        active: users.filter((u) => !u.deleted_at && u.email_confirmed_at).length,
        pending: users.filter((u) => !u.deleted_at && !u.email_confirmed_at).length,
        deleted: users.filter((u) => u.deleted_at).length,
        byRole: {},
        recentLogins: users.filter((u) => {
          if (!u.last_sign_in_at) return false
          const lastLogin = new Date(u.last_sign_in_at)
          const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          return lastLogin > weekAgo
        }).length,
      }

      // Count by role
      users.forEach((user) => {
        if (!user.deleted_at) {
          stats.byRole[user.role] = (stats.byRole[user.role] || 0) + 1
        }
      })

      return stats
    } catch (error) {
      console.error('Error getting user stats:', error)
      throw error
    }
  },

  async getRecentActivity() {
    try {
      const users = await usersApi.getAll()

      // Get recent user activities
      const recentActivities = users
        .filter((u) => u.updated_at || u.created_at)
        .map((u) => ({
          id: u.id,
          name: u.full_name,
          email: u.email,
          action: u.created_at === u.updated_at ? 'created' : 'updated',
          timestamp: u.updated_at || u.created_at,
          role: u.role,
        }))
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 10) // Last 10 activities

      return recentActivities
    } catch (error) {
      console.error('Error getting recent activity:', error)
      throw error
    }
  },
}

// Bulk operations for users
export const userBulkApi = {
  async bulkCreate(usersData) {
    const results = {
      successful: [],
      failed: [],
    }

    for (const userData of usersData) {
      try {
        const createdUser = await usersApi.create(userData)
        results.successful.push({
          user: createdUser,
          email: userData.email,
        })
      } catch (error) {
        results.failed.push({
          userData,
          error: error.message,
        })
      }
    }

    return results
  },

  async bulkUpdate(updates) {
    const results = {
      successful: [],
      failed: [],
    }

    for (const update of updates) {
      try {
        const updatedUser = await usersApi.update(update.id, update.data)
        results.successful.push(updatedUser)
      } catch (error) {
        results.failed.push({
          userId: update.id,
          error: error.message,
        })
      }
    }

    return results
  },

  async bulkDelete(userIds) {
    const results = {
      successful: [],
      failed: [],
    }

    for (const userId of userIds) {
      try {
        await usersApi.softDelete(userId)
        results.successful.push(userId)
      } catch (error) {
        results.failed.push({
          userId,
          error: error.message,
        })
      }
    }

    return results
  },

  async bulkAssignHouses(userIds, houseIds) {
    const results = {
      successful: [],
      failed: [],
    }

    for (const userId of userIds) {
      try {
        await usersApi.assignHouses(userId, houseIds)
        results.successful.push(userId)
      } catch (error) {
        results.failed.push({
          userId,
          error: error.message,
        })
      }
    }

    return results
  },

  async bulkUpdateRole(userIds, newRole) {
    const results = {
      successful: [],
      failed: [],
    }

    for (const userId of userIds) {
      try {
        await usersApi.update(userId, { role: newRole })
        results.successful.push(userId)
      } catch (error) {
        results.failed.push({
          userId,
          error: error.message,
        })
      }
    }

    return results
  },
}

// Import/Export functionality
export const userImportExportApi = {
  async exportUsers(includeDeleted = false) {
    try {
      const users = await usersApi.getAll()

      const filteredUsers = includeDeleted ? users : users.filter((u) => !u.deleted_at)

      const exportData = filteredUsers.map((user) => ({
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        israeli_id: user.israeli_id,
        address: user.address,
        city: user.city,
        role: user.role,
        assigned_houses: user.assignedHouses?.map((h) => h.name).join(', '),
        status: user.deleted_at ? 'Deleted' : user.email_confirmed_at ? 'Active' : 'Pending',
        last_login: user.last_sign_in_at,
        created_at: user.created_at,
        updated_at: user.updated_at,
      }))

      return exportData
    } catch (error) {
      console.error('Error exporting users:', error)
      throw error
    }
  },

  async importUsers(csvData) {
    const results = {
      successful: [],
      failed: [],
      duplicates: [],
    }

    for (const row of csvData) {
      try {
        // Validate required fields
        if (!row.email || !row.full_name) {
          results.failed.push({
            row,
            error: 'Missing required fields (email, full_name)',
          })
          continue
        }

        // Check for duplicates
        const emailExists = await usersApi.checkEmailExists(row.email)
        if (emailExists) {
          results.duplicates.push({
            row,
            error: 'Email already exists',
          })
          continue
        }

        // Validate email format
        if (!validationHelpers.isValidEmail(row.email)) {
          results.failed.push({
            row,
            error: 'Invalid email format',
          })
          continue
        }

        // Validate Israeli ID if provided
        if (row.israeli_id && !validationHelpers.isValidIsraeliId(row.israeli_id)) {
          results.failed.push({
            row,
            error: 'Invalid Israeli ID',
          })
          continue
        }

        // Create user data
        const userData = {
          full_name: validationHelpers.sanitizeInput(row.full_name),
          email: row.email.toLowerCase().trim(),
          phone: validationHelpers.formatPhoneNumber(row.phone),
          israeli_id: row.israeli_id?.trim(),
          address: validationHelpers.sanitizeInput(row.address),
          city: validationHelpers.sanitizeInput(row.city),
          role: row.role || 'Family Member',
          password: validationHelpers.generateSecurePassword(),
          password_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        }

        const createdUser = await usersApi.create(userData)

        // Send welcome email with temporary password
        try {
          await emailApi.sendTemporaryPassword(userData.email, userData.password)
        } catch (emailError) {
          console.warn('Failed to send welcome email:', emailError)
        }

        results.successful.push({
          user: createdUser,
          email: userData.email,
        })
      } catch (error) {
        results.failed.push({
          row,
          error: error.message,
        })
      }
    }

    return results
  },
}

// Session management for password expiry
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

// Enhanced Authentication API with real session management
export const authApi = {
  async login(email, password) {
    try {
      // Get user by email
      const userResult = await sendCommand('users', `filter=email=="${email}"`)

      if (!Array.isArray(userResult) || userResult.length === 0) {
        throw new Error('User not found')
      }

      const user = userResult[0]

      // For now, we'll do simple password comparison
      // In production, you should use proper password hashing
      if (user.password !== password) {
        throw new Error('Invalid password')
      }

      // Create session with token
      const session = sessionManager.createSession(user)

      // Update last login time in database
      try {
        await sendPutCommand('users', user.id, {
          last_sign_in_at: new Date().toISOString(),
        })
      } catch (error) {
        console.warn('Error updating last sign in time:', error)
      }

      // Return session data in format similar to Supabase
      return {
        user: session.user,
        access_token: session.access_token,
        expires_at: session.expires_at,
        session: session,
      }
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  },

  async logout() {
    try {
      // Clear session
      sessionManager.clearSession()
      return true
    } catch (error) {
      console.error('Logout error:', error)
      return false
    }
  },

  async resetPassword(email) {
    try {
      // Check if user exists
      const userResult = await sendCommand('users', `filter=email=="${email}"`)

      if (!Array.isArray(userResult) || userResult.length === 0) {
        throw new Error('User not found')
      }

      // In a real implementation, you would send a reset email
      // For now, we'll just return success
      console.log('Password reset requested for:', email)
      return true
    } catch (error) {
      console.error('Reset password error:', error)
      throw error
    }
  },

  async updatePassword(userId, newPassword) {
    try {
      const result = await sendPutCommand('users', userId, {
        password: newPassword,
        updated_at: new Date().toISOString(),
      })

      return result
    } catch (error) {
      console.error('Update password error:', error)
      throw error
    }
  },

  async getCurrentUser() {
    try {
      return sessionManager.getCurrentUser()
    } catch (error) {
      console.error('Error getting current user:', error)
      return null
    }
  },

  async updateUser(userData) {
    try {
      // Get current user from session
      const currentUser = sessionManager.getCurrentUser()
      if (!currentUser) throw new Error('No authenticated user')

      // Update user in database
      const result = await sendPutCommand('users', currentUser.id, {
        ...userData,
        updated_at: new Date().toISOString(),
      })

      // Update session with new user data
      const session = sessionManager.getSession()
      if (session) {
        session.user = { ...session.user, ...userData }
        sessionManager.saveSession(session)
      }

      return result
    } catch (error) {
      console.error('Error updating user :', error)
      throw error
    }
  },

  async getUserRole() {
    try {
      const user = sessionManager.getCurrentUser()
      if (!user) return null

      // Get full user details from database to get role
      const userResult = await sendCommand('users', `filter=id=="${user.id}"`)
      if (Array.isArray(userResult) && userResult.length > 0) {
        return userResult[0].role
      }

      return null
    } catch (error) {
      console.error('Error getting user role:', error)
      return null
    }
  },

  async isAuthenticated() {
    try {
      return sessionManager.isSessionValid()
    } catch (error) {
      console.error('Auth check error:', error)
      return false
    }
  },

  async getSession() {
    try {
      const session = sessionManager.getSession()
      if (session && sessionManager.isSessionValid()) {
        return session
      }
      return null
    } catch (error) {
      console.error('Error getting session:', error)
      return null
    }
  },

  async getUserDetails() {
    try {
      const currentUser = sessionManager.getCurrentUser()
      if (!currentUser) return null

      // Get full user details from database
      const userResult = await sendCommand('users', `filter=id=="${currentUser.id}"`)
      if (Array.isArray(userResult) && userResult.length > 0) {
        return userResult[0]
      }

      return null
    } catch (error) {
      console.error('Error getting user details:', error)
      return null
    }
  },

  async hasRole(role) {
    try {
      const userRole = await this.getUserRole()
      return userRole === role
    } catch {
      return false
    }
  },

  // Session management helper functions
  async extendSession() {
    try {
      const success = sessionManager.extendSession()
      if (success) {
        Notify.create({
          message: 'Session extended successfully',
          color: 'positive',
          position: 'top',
        })
      }
      return success
    } catch (error) {
      console.error('Error extending session:', error)
      return false
    }
  },

  getSessionInfo() {
    return sessionManager.getSessionInfo()
  },

  getSessionUserId() {
    return sessionManager.getSessionUserId()
  },

  getTimeUntilExpiry() {
    return sessionManager.getTimeUntilExpiry()
  },

  // Function to check if session will expire soon (within 5 minutes)
  isSessionExpiringSoon() {
    const minutesLeft = sessionManager.getTimeUntilExpiry()
    return minutesLeft <= 5 && minutesLeft > 0
  },
}

// Export session manager for direct access if needed
export { sessionManager }

// Export session configuration for customization
export { SESSION_CONFIG }

// Helper function to set up session event listeners
export const setupSessionListeners = () => {
  // Listen for session expiry events
  window.addEventListener('session-expired', () => {
    console.log('Session expired - handling auto logout')
    // You can add custom logic here, like redirecting to login page
  })

  // Listen for storage events (for multi-tab session sync)
  window.addEventListener('storage', (e) => {
    if (e.key === SESSION_CONFIG.STORAGE_KEY) {
      if (!e.newValue) {
        // Session was cleared in another tab
        console.log('Session cleared in another tab')
        sessionManager.triggerAutoLogout()
      }
    }
  })
}

// Permissions API
export const permissionsApi = {
  async getAll() {
    try {
      const result = await sendCommand('permissions')
      return Array.isArray(result) ? result : []
    } catch (error) {
      console.error('Error fetching permissions:', error)
      throw error
    }
  },

  async getUserPermissions(userId) {
    try {
      // Get user permissions with permission details
      const userPermissionsResult = await sendCommand(
        'user_permissions',
        `filter=user_id=="${userId}"`,
      )
      console.log(userId)
      console.log(userPermissionsResult)

      if (!Array.isArray(userPermissionsResult)) {
        return []
      }

      // Get permission details for each user permission
      const userPermissionsWithDetails = []
      for (const userPerm of userPermissionsResult) {
        try {
          const permissionResult = await sendCommand(
            'permissions',
            `filter=id==${userPerm.permission_id}`,
          )
          if (Array.isArray(permissionResult) && permissionResult.length > 0) {
            userPermissionsWithDetails.push({
              ...userPerm,
              permission: permissionResult[0],
            })
          }
        } catch (error) {
          console.warn('Error fetching permission details:', error)
        }
      }

      return userPermissionsWithDetails
    } catch (error) {
      console.error('Error fetching user permissions:', error)
      throw error
    }
  },

  async create(permission) {
    try {
      const result = await sendPostCommand('permissions', permission)
      return result
    } catch (error) {
      console.error('Error creating permission:', error)
      throw error
    }
  },

  async update(id, permission) {
    try {
      const result = await sendPutCommand('permissions', id, permission)
      return result
    } catch (error) {
      console.error('Error updating permission:', error)
      throw error
    }
  },

  async delete(id) {
    try {
      await sendDeleteCommand('permissions', id)
      return true
    } catch (error) {
      console.error('Error deleting permission:', error)
      throw error
    }
  },
}

// Companies API - הוסף את הפונקציות הבאות ל-db2rest.js

export const companiesApi = {
  async getAll() {
    try {
      const companiesResult = await sendCommand('companies')
      const companies = Array.isArray(companiesResult) ? companiesResult : []

      // חישוב נתוני האתרים והבתים לכל חברה
      const companiesWithCounts = []

      for (const company of companies) {
        try {
          // קבלת כל האתרים של החברה
          const sitesResult = await sendCommand('sites', `filter=company_id==${company.id}`)
          const sites = Array.isArray(sitesResult) ? sitesResult : []
          const totalSites = sites.length

          // חישוב סה"כ בתים מכל האתרים
          let totalHouses = 0
          for (const site of sites) {
            try {
              const housesResult = await sendCommand('houses', `filter=site_id==${site.id}`)
              const houses = Array.isArray(housesResult) ? housesResult : []
              totalHouses += houses.length
            } catch (error) {
              console.warn(`Error fetching houses for site ${site.id}:`, error)
            }
          }

          companiesWithCounts.push({
            ...company,
            total_sites: totalSites,
            total_houses: totalHouses,
          })
        } catch (error) {
          console.warn(`Error fetching sites for company ${company.id}:`, error)
          // אם יש שגיאה, הוסף ערכי ברירת מחדל
          companiesWithCounts.push({
            ...company,
            total_sites: 0,
            total_houses: 0,
          })
        }
      }

      return companiesWithCounts
    } catch (error) {
      console.error('Error fetching companies:', error)
      throw error
    }
  },

  async getById(id) {
    try {
      const companyResult = await sendCommand('companies', `filter=id==${id}`)

      if (!Array.isArray(companyResult) || companyResult.length === 0) {
        throw new Error('Company not found')
      }

      const company = companyResult[0]

      // קבלת האתרים של החברה
      const sitesResult = await sendCommand('sites', `filter=company_id==${id}`)
      company.sites = Array.isArray(sitesResult) ? sitesResult : []

      // קבלת הבתים של החברה
      let allHouses = []
      for (const site of company.sites) {
        try {
          const housesResult = await sendCommand('houses', `filter=site_id==${site.id}`)
          const houses = Array.isArray(housesResult) ? housesResult : []
          allHouses = [...allHouses, ...houses]
        } catch (error) {
          console.warn(`Error fetching houses for site ${site.id}:`, error)
        }
      }
      company.houses = allHouses

      return company
    } catch (error) {
      console.error('Error fetching company by ID:', error)
      throw error
    }
  },

  async create(company) {
    try {
      const result = await sendPostCommand('companies', company)
      return result
    } catch (error) {
      console.error('Error creating company:', error)
      throw error
    }
  },

  async update(id, company) {
    try {
      const result = await sendPutCommand('companies', id, company)
      return result
    } catch (error) {
      console.error('Error updating company:', error)
      throw error
    }
  },

  async delete(id) {
    try {
      await sendDeleteCommand('companies', id)
      return true
    } catch (error) {
      console.error('Error deleting company:', error)
      throw error
    }
  },

  async getCompanySites(companyId) {
    try {
      const result = await sendCommand('sites', `filter=company_id==${companyId}`)
      return Array.isArray(result) ? result : []
    } catch (error) {
      console.error('Error fetching company sites:', error)
      throw error
    }
  },

  async getCompanyHouses(companyId) {
    try {
      // קבלת כל האתרים של החברה
      const sites = await this.getCompanySites(companyId)

      if (sites.length === 0) {
        return []
      }

      // קבלת כל הבתים מכל האתרים
      let allHouses = []
      for (const site of sites) {
        try {
          const housesResult = await sendCommand('houses', `filter=site_id==${site.id}`)
          const houses = Array.isArray(housesResult) ? housesResult : []
          allHouses = [...allHouses, ...houses]
        } catch (error) {
          console.warn(`Error fetching houses for site ${site.id}:`, error)
        }
      }

      return allHouses
    } catch (error) {
      console.error('Error fetching company houses:', error)
      throw error
    }
  },
}

export const sitesApi = {
  async getAll() {
    try {
      const sitesResult = await sendCommand('sites')
      const sites = Array.isArray(sitesResult) ? sitesResult : []

      // חישוב נתוני הבתים לכל אתר והוספת שם החברה
      const sitesWithCounts = []

      for (const site of sites) {
        try {
          // קבלת כל הבתים של האתר
          const housesResult = await sendCommand('houses', `filter=site_id==${site.id}`)
          const houses = Array.isArray(housesResult) ? housesResult : []
          const totalHouses = houses.length

          // קבלת שם החברה
          let companyName = '-'
          if (site.company_id) {
            try {
              const companyResult = await sendCommand('companies', `filter=id==${site.company_id}`)
              if (Array.isArray(companyResult) && companyResult.length > 0) {
                companyName = companyResult[0].name
              }
            } catch (error) {
              console.warn(`Error fetching company for site ${site.id}:`, error)
            }
          }

          sitesWithCounts.push({
            ...site,
            total_houses: totalHouses,
            company_name: companyName,
          })
        } catch (error) {
          console.warn(`Error fetching houses for site ${site.id}:`, error)
          // אם יש שגיאה, הוסף ערכי ברירת מחדל
          sitesWithCounts.push({
            ...site,
            total_houses: 0,
            company_name: '-',
          })
        }
      }

      return sitesWithCounts
    } catch (error) {
      console.error('Error fetching sites:', error)
      throw error
    }
  },

  async getById(id) {
    try {
      const siteResult = await sendCommand('sites', `filter=id==${id}`)

      if (!Array.isArray(siteResult) || siteResult.length === 0) {
        throw new Error('Site not found')
      }

      const site = siteResult[0]

      // קבלת החברה של האתר
      if (site.company_id) {
        try {
          const companyResult = await sendCommand('companies', `filter=id==${site.company_id}`)
          if (Array.isArray(companyResult) && companyResult.length > 0) {
            site.company = companyResult[0]
            site.company_name = companyResult[0].name
          }
        } catch (error) {
          console.warn('Error fetching company for site:', error)
        }
      }

      // קבלת הבתים של האתר
      const housesResult = await sendCommand('houses', `filter=site_id==${id}`)
      site.houses = Array.isArray(housesResult) ? housesResult : []

      return site
    } catch (error) {
      console.error('Error fetching site by ID:', error)
      throw error
    }
  },

  async getByCompanyId(companyId) {
    try {
      const result = await sendCommand('sites', `filter=company_id==${companyId}`)
      const sites = Array.isArray(result) ? result : []

      // הוסף מספר בתים לכל אתר
      const sitesWithHouseCounts = []
      for (const site of sites) {
        try {
          const housesResult = await sendCommand('houses', `filter=site_id==${site.id}`)
          const houses = Array.isArray(housesResult) ? housesResult : []

          sitesWithHouseCounts.push({
            ...site,
            total_houses: houses.length,
          })
        } catch (error) {
          console.warn(`Error fetching houses for site ${site.id}:`, error)
          sitesWithHouseCounts.push({
            ...site,
            total_houses: 0,
          })
        }
      }

      return sitesWithHouseCounts
    } catch (error) {
      console.error('Error fetching sites by company ID:', error)
      throw error
    }
  },

  async create(site) {
    try {
      const result = await sendPostCommand('sites', site)
      return result
    } catch (error) {
      console.error('Error creating site:', error)
      throw error
    }
  },

  async update(id, site) {
    try {
      const result = await sendPutCommand('sites', id, site)
      return result
    } catch (error) {
      console.error('Error updating site:', error)
      throw error
    }
  },

  async delete(id) {
    try {
      await sendDeleteCommand('sites', id)
      return true
    } catch (error) {
      console.error('Error deleting site:', error)
      throw error
    }
  },

  async getSiteHouses(siteId) {
    try {
      const result = await sendCommand('houses', `filter=site_id==${siteId}`)
      return Array.isArray(result) ? result : []
    } catch (error) {
      console.error('Error fetching site houses:', error)
      throw error
    }
  },
}

// Call setup function immediately
setupSessionListeners()
