// src/services/supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Houses API
export const housesApi = {
  async getAll() {
    const { data, error } = await supabase.from('houses').select('*')

    if (error) throw error
    return data
  },

  async getById(id) {
    try {
      const { data, error } = await supabase
        .from('houses')
        .select('*, sensors(*)')
        .eq('id', id)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching house by ID:', error)
      throw error
    }
  },

  async create(house) {
    const { data, error } = await supabase.from('houses').insert([house]).select()

    if (error) throw error
    return data[0]
  },

  async update(id, house) {
    const { data, error } = await supabase.from('houses').update(house).eq('id', id).select()

    if (error) throw error
    return data[0]
  },

  async delete(id) {
    const { error } = await supabase.from('houses').delete().eq('id', id)

    if (error) throw error
    return true
  },
}

// Sensors API
export const sensorsApi = {
  async getByHouseId(houseId) {
    try {
      const { data, error } = await supabase
        .from('sensors')
        .select(
          'temperature, humidity, *, sensor_type:sensors_type(id, name), sensor_location:sensors_location(id, name)',
        )
        .eq('house_id', houseId)

      if (error) throw error

      // Transform the data to make it easier to work with
      return data.map((sensor) => ({
        ...sensor,
        // Add a type property that contains the name from sensor_type
        type: sensor.sensor_type ? sensor.sensor_type.name : 'unknown',
        // Keep the original type_id
        type_id: sensor.type_id,
        // Add a location property that contains the name from sensor_location
        location: sensor.sensor_location ? sensor.sensor_location.name : 'unknown',
        // Keep the original location_id
        location_id: sensor.location_id,
      }))
    } catch (error) {
      console.error('Error fetching sensors by house ID:', error)
      throw error
    }
  },

  // Get all sensor types
  async getSensorTypes() {
    try {
      const { data, error } = await supabase.from('sensors_type').select('*')

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching sensor types:', error)
      throw error
    }
  },

  // Get all sensor locations
  async getSensorLocations() {
    try {
      const { data, error } = await supabase.from('sensors_location').select('*')

      if (error) throw error
      return data
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

      // יצירת אובייקט חיישן נקי
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

      // Insert sensor into database
      const { data, error } = await supabase.from('sensors').insert([sensorData]).select(`
        *,
        sensor_type:type_id(id, name),
        sensor_location:location_id(id, name)
      `)

      if (error) {
        console.error('Supabase error creating sensor:', error)
        throw error
      }

      if (!data || data.length === 0) {
        throw new Error('No data returned after creating sensor')
      }

      // Transform the returned data to match expected format
      const createdSensor = data[0]
      return {
        ...createdSensor,
        type: createdSensor.sensor_type ? createdSensor.sensor_type.name : 'unknown',
        location: createdSensor.sensor_location ? createdSensor.sensor_location.name : 'unknown',
      }
    } catch (error) {
      console.error('Error in sensorsApi.create:', error)
      throw error
    }
  },

  async update(id, sensor) {
    try {
      // If we have a location but not a location_id, we need to convert it
      if (sensor.location && !sensor.location_id) {
        try {
          // Get the sensor location by name
          const { data: locationData, error: locationError } = await supabase
            .from('sensors_location')
            .select('id')
            .eq('name', sensor.location)
            .single()

          if (locationError) {
            console.error('Error finding sensor location:', locationError)
            throw new Error(`Could not find sensor location: ${sensor.location}`)
          }

          // Set the location_id and remove the location property
          sensor.location_id = locationData.id
        } catch (locationError) {
          console.error('Error converting location to location_id:', locationError)
          throw new Error(`Could not convert location to location_id: ${locationError.message}`)
        }
      }

      // Create a clean sensor object without the location property
      const cleanSensor = { ...sensor }
      delete cleanSensor.location // Remove the location property as we're using location_id
      delete cleanSensor.sensor_location // Remove any sensor_location object if present

      // Update the sensor
      const { error } = await supabase.from('sensors').update(cleanSensor).eq('id', id).select()

      if (error) throw error

      // Fetch the updated sensor with joins to get the full data
      const { data: fullData, error: fetchError } = await supabase
        .from('sensors')
        .select(
          'temperature, humidity, *, sensor_type:sensors_type(id, name), sensor_location:sensors_location(id, name)',
        )
        .eq('id', id)
        .single()

      if (fetchError) throw fetchError

      // Transform the data like in getByHouseId
      return {
        ...fullData,
        type: fullData.sensor_type ? fullData.sensor_type.name : 'unknown',
        type_id: fullData.type_id,
        location: fullData.sensor_location ? fullData.sensor_location.name : 'unknown',
        location_id: fullData.location_id,
      }
    } catch (error) {
      console.error('Error in sensorsApi.update:', error)
      throw error
    }
  },

  async updateByDeviceId(deviceId, updateData) {
    try {
      console.log('Updating sensor by device_id:', deviceId, updateData)

      const { data, error } = await supabase
        .from('sensors')
        .update(updateData)
        .eq('device_id', deviceId).select(`
        *,
        sensor_type:type_id(id, name),
        sensor_location:location_id(id, name)
      `)

      if (error) {
        console.error('Error updating sensor by device ID:', error)
        throw error
      }

      if (data && data.length > 0) {
        const updatedSensor = data[0]
        console.log('Successfully updated sensor:', updatedSensor.id)

        return {
          ...updatedSensor,
          type: updatedSensor.sensor_type ? updatedSensor.sensor_type.name : 'unknown',
          location: updatedSensor.sensor_location ? updatedSensor.sensor_location.name : 'unknown',
        }
      }

      console.log('No sensor found with device_id:', deviceId)
      return null
    } catch (error) {
      console.error('Error in sensorsApi.updateByDeviceId:', error)
      throw error
    }
  },

  async delete(id) {
    const { error } = await supabase.from('sensors').delete().eq('id', id)

    if (error) throw error
    return true
  },
}

// Events API
export const eventsApi = {
  async getAll(limit = 20) {
    const { data, error } = await supabase
      .from('events')
      .select('*, house:houses(number)')
      .order('datetime', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data
  },

  async getByHouseId(houseId, limit = 20) {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('house_id', houseId)
      .order('datetime', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data
  },

  async create(event) {
    const { data, error } = await supabase.from('events').insert([event]).select()

    if (error) throw error
    return data[0]
  },
}

// Users API - Updated to work with auth.users and user_profiles
// Users API - Updated to match actual database schema
// Users API - Updated to match actual database schema
export const usersApi = {
  async getAll() {
    try {
      // Get all user profiles with their assigned houses
      const { data, error } = await supabase.from('user_profiles').select(`
          *,
          assignedHouses:user_houses(
            house:houses(id, number)
          )
        `)

      if (error) throw error

      // Transform the data to flatten house assignments
      return data.map((user) => ({
        ...user,
        assignedHouses:
          user.assignedHouses?.map((uh) => ({
            id: uh.house.id,
            name: uh.house.number, // Use number field as name
          })) || [],
      }))
    } catch (error) {
      console.error('Error fetching all users:', error)

      // Fallback: get users without house assignments if join fails
      try {
        const { data: profiles, error: profilesError } = await supabase
          .from('user_profiles')
          .select('*')

        if (profilesError) throw profilesError

        return profiles.map((user) => ({
          ...user,
          assignedHouses: [],
        }))
      } catch (fallbackError) {
        console.error('Fallback query also failed:', fallbackError)
        throw fallbackError
      }
    }
  },

  async getById(id) {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select(
          `
          *,
          assignedHouses:user_houses(
            house:houses(id, number)
          )
        `,
        )
        .eq('id', id)
        .single()

      if (error) throw error

      return {
        ...data,
        assignedHouses:
          data.assignedHouses?.map((uh) => ({
            id: uh.house.id,
            name: uh.house.number,
          })) || [],
      }
    } catch (error) {
      console.error('Error fetching user by ID:', error)
      throw error
    }
  },

  async getByHouseId(houseId) {
    try {
      const { data, error } = await supabase
        .from('user_houses')
        .select(
          `
          user:user_profiles(*)
        `,
        )
        .eq('house_id', houseId)

      if (error) throw error
      return data.map((item) => item.user)
    } catch (error) {
      console.error('Error fetching users by house ID:', error)
      return []
    }
  },

  async update(id, userData) {
    try {
      const updateData = {}

      // Only update fields that are provided
      if (userData.role !== undefined) {
        updateData.role = userData.role
      }
      if (userData.full_name !== undefined) {
        updateData.full_name = userData.full_name
      }
      if (userData.phone !== undefined) {
        updateData.phone = userData.phone
      }

      updateData.updated_at = new Date().toISOString()

      const { data, error } = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('id', id)
        .select()

      if (error) throw error
      return data[0]
    } catch (error) {
      console.error('Error updating user:', error)
      throw error
    }
  },

  async assignHouses(userId, houseIds) {
    try {
      // Get the default site_id and company_id from existing records
      let siteId = null
      let companyId = null

      // Try to get site and company from existing user_houses records
      const { data: existingRecord } = await supabase
        .from('user_houses')
        .select('site_id, company_id')
        .limit(1)
        .single()

      if (existingRecord) {
        siteId = existingRecord.site_id
        companyId = existingRecord.company_id
      } else {
        // Get default site and company if no existing records
        const { data: siteData } = await supabase.from('site').select('id').limit(1).single()

        const { data: companyData } = await supabase.from('company').select('id').limit(1).single()

        siteId = siteData?.id
        companyId = companyData?.id
      }

      if (!siteId || !companyId) {
        console.warn('Missing site_id or company_id for user_houses assignment')
        return false
      }

      // First delete existing assignments for this user
      await supabase.from('user_houses').delete().eq('user_id', userId)

      // Then create new assignments
      if (houseIds.length > 0) {
        const assignments = houseIds.map((houseId) => ({
          user_id: userId,
          house_id: houseId,
          site_id: siteId,
          company_id: companyId,
        }))

        const { error } = await supabase.from('user_houses').insert(assignments)

        if (error) throw error
      }

      return true
    } catch (error) {
      console.error('Error assigning houses:', error)
      throw error
    }
  },

  async updatePermissions(userId, permissions) {
    try {
      console.log('Updating permissions for user:', userId)
      console.log('Permissions to update:', permissions)

      // Delete existing permissions for this user
      const { error: deleteError } = await supabase
        .from('user_permissions')
        .delete()
        .eq('user_id', userId)

      if (deleteError) {
        console.error('Error deleting existing permissions:', deleteError)
        throw deleteError
      }

      // Get permission IDs from the permissions table
      const { data: permissionData, error: permError } = await supabase
        .from('permissions')
        .select('id, name')

      if (permError) {
        console.error('Error fetching permissions:', permError)
        throw permError
      }

      console.log('Available permissions from DB:', permissionData)

      // Create mapping from permission names to IDs
      const permissionMap = {}
      permissionData.forEach((perm) => {
        permissionMap[perm.name] = perm.id
      })

      // Filter and prepare permissions to insert
      const permissionRecords = permissions
        .filter((p) => {
          const hasValidId = permissionMap[p.name]
          if (!hasValidId) {
            console.warn(`Permission "${p.name}" not found in database`)
          }
          return p.granted && hasValidId
        })
        .map((p) => ({
          user_id: userId,
          permission_id: permissionMap[p.name], // Use UUID from permissions table
          granted: true,
        }))

      console.log('Permission records to insert:', permissionRecords)

      if (permissionRecords.length > 0) {
        const { error: insertError } = await supabase
          .from('user_permissions')
          .insert(permissionRecords)

        if (insertError) {
          console.error('Error inserting permissions:', insertError)
          throw insertError
        }
      }

      console.log('Permissions updated successfully')
      return true
    } catch (error) {
      console.error('Error updating permissions:', error)
      throw error
    }
  },
}

// Authentication API - שימוש ישיר בטבלת auth.users
export const authApi = {
  async login(email, password, rememberMe = false) {
    try {
      // התחברות בסיסית
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: {
          // תמיכה ב"זכור אותי" דרך קביעת תוקף המושב
          expiresIn: rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60, // 30 ימים או יום אחד
        },
      })

      if (error) throw error

      // בדיקה אם ההתחברות הצליחה וקבלת פרופיל המשתמש
      if (data.user) {
        try {
          // שליפת פרטי המשתמש מטבלת user_profiles
          const { data: profileData, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', data.user.id)
            .single()

          if (profileError) {
            console.warn('Could not fetch user profile:', profileError)

            // אם יש שגיאת "infinite recursion" בפוליסי, נשתמש במידע מ-auth.users
            if (
              profileError.code === '42P17' &&
              profileError.message.includes('infinite recursion')
            ) {
              console.log('Using auth user data instead of profile due to policy recursion issue')

              // עדכון user_metadata אם נדרש (אופציונלי)
              const role = data.user.user_metadata?.role || 'user'
              await supabase.auth.updateUser({
                data: { role },
              })
            }
          } else {
            console.log('User role from profile:', profileData.role)

            // עדכון user_metadata אם נדרש (אופציונלי)
            if (profileData.role && profileData.role !== data.user.user_metadata?.role) {
              await supabase.auth.updateUser({
                data: { role: profileData.role },
              })
            }
          }
        } catch (profileFetchError) {
          console.error('Error fetching user profile:', profileFetchError)
          // המשך למרות השגיאה - נשתמש במידע הבסיסי מ-auth
        }
      }

      return data
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  },

  async logout() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    return true
  },

  async resetPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) throw error
    return true
  },

  async updatePassword(newPassword) {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) throw error
    return data
  },

  // עדכון authApi.getCurrentUser שיעבוד עם מבנה הטבלה הנכון
  async getCurrentUser() {
    try {
      const { data, error } = await supabase.auth.getUser()
      if (error) throw error
      if (!data.user) return null

      try {
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', data.user.id)
          .single()

        if (profileError && profileError.code !== 'PGRST116') {
          console.warn('Error fetching user profile:', profileError)
        }

        // אם אין פרופיל, צור ברירת מחדל או השתמש בנתוני auth
        const userData = {
          id: data.user.id,
          email: data.user.email,
          created_at: data.user.created_at,
          email_confirmed_at: data.user.email_confirmed_at,
          last_sign_in_at: data.user.last_sign_in_at,
          role: profileData?.role || data.user.user_metadata?.role || 'System Admin', // ברירת מחדל
          full_name:
            profileData?.full_name ||
            data.user.user_metadata?.full_name ||
            data.user.email.split('@')[0],
          ...(profileData || {}),
        }

        return userData
      } catch (profileFetchError) {
        console.error('Error in profile fetch process:', profileFetchError)

        // החזר נתונים בסיסיים עם תפקיד ברירת מחדל
        return {
          id: data.user.id,
          email: data.user.email,
          created_at: data.user.created_at,
          role: 'System Admin', // ברירת מחדל לבדיקות
          full_name: data.user.email.split('@')[0],
        }
      }
    } catch (error) {
      console.error('Error getting current user:', error)
      throw error
    }
  },

  // בעת יצירת משתמש או עדכון משתמש, עדכן גם את הפרופיל
  async updateUserProfile(userData) {
    try {
      // קבלת משתמש נוכחי
      const currentUser = await this.getCurrentUser()
      if (!currentUser) throw new Error('No authenticated user')

      // עדכון מטא-דאטה בטבלת auth (אופציונלי, אפשר גם לוותר על זה)
      const { data: authData, error: authError } = await supabase.auth.updateUser({
        data: userData,
      })

      if (authError) throw authError

      // עדכון טבלת user_profiles
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .upsert(
          {
            user_id: currentUser.id,
            // אם יש שדה rule בנתונים שהתקבלו, עדכן אותו
            rule: userData.role || userData.rule || currentUser.role || 'user',
            // אם יש פרמטרים נוספים, העבר גם אותם
            ...userData,
          },
          {
            onConflict: 'user_id',
            returning: 'representation',
          },
        )

      if (profileError) throw profileError

      return { ...authData, profile: profileData }
    } catch (error) {
      console.error('Error updating user profile:', error)
      throw error
    }
  },

  // קבלת תפקיד המשתמש הנוכחי
  async getUserRole() {
    try {
      const user = await this.getCurrentUser()
      if (!user) return null
      // כאן אנחנו מחזירים את role שכבר ממוזג מפונקציית getCurrentUser
      return user.role
    } catch (error) {
      console.error('Error getting user role:', error)
      return null
    }
  },

  // בדיקה אם המשתמש מחובר
  async isAuthenticated() {
    try {
      const { data } = await supabase.auth.getSession()
      return !!data.session
    } catch (error) {
      console.error('Auth check error:', error)
      return false
    }
  },

  // קבלת המושב הנוכחי
  async getSession() {
    const { data, error } = await supabase.auth.getSession()
    if (error) throw error
    return data.session
  },

  // קבלת פרטי המשתמש עם פרטים נוספים מטבלת users אם קיימת
  async getUserDetails() {
    try {
      // קבלת משתמש האימות
      const authUser = await this.getCurrentUser()
      if (!authUser) return null

      // ניסיון לקבל פרטים נוספים מטבלת users אם קיימת
      try {
        const { data } = await supabase.from('users').select('*').eq('id', authUser.id).single()

        // מיזוג נתוני המשתמש מהטבלאות
        return { ...authUser, ...(data || {}) }
      } catch {
        // אם אין נתונים בטבלת users או יש שגיאה, נחזיר רק את נתוני האימות
        return authUser
      }
    } catch (error) {
      console.error('Error getting user details:', error)
      return null
    }
  },

  // בדיקה אם למשתמש יש תפקיד מסוים
  async hasRole(role) {
    try {
      const userRole = await this.getUserRole()
      return userRole === role
    } catch {
      return false
    }
  },
}
