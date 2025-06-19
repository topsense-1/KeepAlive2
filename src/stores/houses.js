// src/stores/houses.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { housesApi, sensorsApi } from '../services/db2rest'

export const useHousesStore = defineStore('houses', () => {
  const houses = ref([])
  const currentHouse = ref(null)
  const houseSensors = ref([])
  const loading = ref(false)
  const error = ref(null)

  // Stats
  const totalHouses = computed(() => houses.value.length)
  const activeHouses = computed(() => {
    // Filter houses where all sensors are active
    return houses.value.filter((h) => {
      // If activeSensors or totalSensors don't exist, consider the house as not active
      if (h.activeSensors === undefined || h.totalSensors === undefined) return false
      return h.activeSensors === h.totalSensors && h.totalSensors > 0
    }).length
  })
  const needAttentionHouses = computed(() => {
    // Filter houses that need attention (some sensors are inactive)
    return houses.value.filter((h) => {
      // If activeSensors or totalSensors don't exist, consider the house as not needing attention
      if (h.activeSensors === undefined || h.totalSensors === undefined) return false
      return h.activeSensors < h.totalSensors
    }).length
  })

  async function fetchAllHouses() {
    loading.value = true

    try {
      const result = await housesApi.getAll()
      houses.value = result
      return result
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchHouseById(id) {
    loading.value = true

    try {
      const result = await housesApi.getById(id)
      currentHouse.value = result
      return result
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchHouseSensors(houseId) {
    loading.value = true

    try {
      const result = await sensorsApi.getByHouseId(houseId)
      houseSensors.value = result
      return result
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createHouse(house) {
    loading.value = true

    try {
      const result = await housesApi.create(house)
      houses.value.push(result)
      return result
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateHouse(id, house) {
    loading.value = true

    try {
      const result = await housesApi.update(id, house)
      const index = houses.value.findIndex((h) => h.id === id)
      if (index !== -1) {
        houses.value[index] = result
      }
      return result
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteHouse(id) {
    loading.value = true

    try {
      await housesApi.delete(id)
      houses.value = houses.value.filter((h) => h.id !== id)
      return true
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createSensor(houseId, sensor) {
    loading.value = true
    error.value = null

    try {
      // Validate required fields
      if (!houseId) {
        throw new Error('House ID is required')
      }

      if (!sensor.type_id || !sensor.location_id) {
        throw new Error('Sensor type and location are required')
      }

      // Add house_id to sensor data
      const sensorWithHouseId = { ...sensor, house_id: houseId }

      // Create sensor in database
      const result = await sensorsApi.create(sensorWithHouseId)

      // Add to local state
      houseSensors.value.push(result)

      // Refresh houses list to update sensor counts
      await fetchAllHouses()

      return result
    } catch (err) {
      console.error('Error creating sensor:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateSensorByDeviceId(deviceId, sensorData) {
    loading.value = true

    try {
      console.log('Updating sensor by device ID:', { deviceId, sensorData })

      const result = await sensorsApi.updateByDeviceId(deviceId, sensorData)

      if (result) {
        // עדכון החיישן ברשימה המקומית אם נמצא
        const index = houseSensors.value.findIndex((s) => s.device_id === deviceId)

        if (index !== -1) {
          houseSensors.value[index] = result
          console.log('Updated sensor in local state at index:', index)
        } else {
          console.log('Sensor not found in local state, may be from different house')
        }

        // עדכון רשימת הבתים לספירת חיישנים (אופציונלי - רק אם צריך)
        // await fetchAllHouses()

        console.log('Sensor updated successfully by device ID:', deviceId)
      } else {
        console.log('No sensor found with device ID:', deviceId)
      }

      return result
    } catch (err) {
      console.error('Error in updateSensorByDeviceId:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateSensor(id, sensor) {
    loading.value = true

    try {
      console.log('Updating sensor with data:', sensor) // לדיבוג

      const result = await sensorsApi.update(id, sensor)
      const index = houseSensors.value.findIndex((s) => s.id === id)
      if (index !== -1) {
        // Replace the sensor in the local state with the updated data
        houseSensors.value[index] = result
      }

      // Update house sensor counts
      await fetchAllHouses()

      return result
    } catch (err) {
      console.error('Error in updateSensor:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteSensor(id) {
    loading.value = true

    try {
      await sensorsApi.delete(id)
      houseSensors.value = houseSensors.value.filter((s) => s.id !== id)

      // Update house
      await fetchAllHouses()

      return true
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    houses,
    currentHouse,
    houseSensors,
    loading,
    error,
    totalHouses,
    activeHouses,
    needAttentionHouses,
    fetchAllHouses,
    fetchHouseById,
    fetchHouseSensors,
    createHouse,
    updateHouse,
    deleteHouse,
    createSensor,
    updateSensor,
    updateSensorByDeviceId, // הוסף שורה זו
    deleteSensor,
  }
})
