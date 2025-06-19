// src/stores/events.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { eventsApi } from '../services/db2rest'

export const useEventsStore = defineStore('events', () => {
  const events = ref([])
  const houseEvents = ref([])
  const loading = ref(false)
  const error = ref(null)

  async function fetchAllEvents(limit = 20) {
    loading.value = true

    try {
      // For demo purposes, use mock data in development mode
      if (import.meta.env.DEV) {
        events.value = [
          {
            id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
            house: 'House #101',
            house_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
            datetime: new Date(2025, 4, 14, 9, 15),
            description: 'Motion detected in living room',
            type: 'motion',
            priority: 'Medium',
          },
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            house: 'House #103',
            house_id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
            datetime: new Date(2025, 4, 14, 8, 30),
            description: 'Front door opened',
            type: 'door',
            priority: 'Informative',
          },
          {
            id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
            house: 'House #101',
            house_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
            datetime: new Date(2025, 4, 14, 7, 45),
            description: 'Temperature above threshold (28°C)',
            type: 'temperature',
            priority: 'Critical',
          },
          {
            id: '6ba7b811-9dad-11d1-80b4-00c04fd430c8',
            house: 'House #105',
            house_id: '6ba7b812-9dad-11d1-80b4-00c04fd430c8',
            datetime: new Date(2025, 4, 13, 22, 10),
            description: 'Low battery on motion sensor',
            type: 'battery',
            priority: 'Medium',
          },
          {
            id: '6ba7b812-9dad-11d1-80b4-00c04fd430c8',
            house: 'House #102',
            house_id: '550e8400-e29b-41d4-a716-446655440000',
            datetime: new Date(2025, 4, 13, 18, 20),
            description: 'Humidity below threshold (30%)',
            type: 'humidity',
            priority: 'Informative',
          },
        ]
        return events.value
      }

      // Use real API in production
      const result = await eventsApi.getAll(limit)
      events.value = result
      return result
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchHouseEvents(houseId, limit = 20) {
    loading.value = true

    try {
      // For demo purposes, use mock data in development mode
      if (import.meta.env.DEV) {
        houseEvents.value = [
          {
            id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
            datetime: new Date(2025, 4, 14, 9, 15),
            description: 'Motion detected in living room',
            sensor: 'Living Room Motion',
            type: 'motion',
            priority: 'Medium',
          },
          {
            id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
            datetime: new Date(2025, 4, 14, 7, 45),
            description: 'Temperature above threshold (28°C)',
            sensor: 'Bedroom Environmental',
            type: 'temperature',
            priority: 'Critical',
          },
          {
            id: '6ba7b811-9dad-11d1-80b4-00c04fd430c8',
            datetime: new Date(2025, 4, 13, 22, 10),
            description: 'Low battery on motion sensor',
            sensor: 'Living Room Motion',
            type: 'battery',
            priority: 'Medium',
          },
          {
            id: '6ba7b812-9dad-11d1-80b4-00c04fd430c8',
            datetime: new Date(2025, 4, 13, 18, 20),
            description: 'Refrigerator door opened',
            sensor: 'Refrigerator Door',
            type: 'door',
            priority: 'Informative',
          },
        ]
        return houseEvents.value
      }

      // Use real API in production
      const result = await eventsApi.getByHouseId(houseId, limit)
      houseEvents.value = result
      return result
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createEvent(event) {
    loading.value = true

    try {
      // For demo purposes, use mock data in development mode
      if (import.meta.env.DEV) {
        //const newId = crypto.randomUUID()
        const newEvent = {
          //id: newId,
          ...event,
          datetime: new Date(),
        }
        events.value.unshift(newEvent)
        return newEvent
      }

      // Use real API in production
      const result = await eventsApi.create(event)
      events.value.unshift(result)
      return result
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // Computed getters for charts
  const eventsByType = computed(() => {
    const types = {}
    events.value.forEach((event) => {
      types[event.type] = (types[event.type] || 0) + 1
    })
    return Object.entries(types).map(([type, count]) => ({ type, count }))
  })

  const eventsByPriority = computed(() => {
    const priorities = {}
    events.value.forEach((event) => {
      priorities[event.priority] = (priorities[event.priority] || 0) + 1
    })
    return Object.entries(priorities).map(([priority, count]) => ({ priority, count }))
  })

  const eventsTimeline = computed(() => {
    // Group by day
    const days = {}
    events.value.forEach((event) => {
      const day = event.datetime.toISOString().split('T')[0]
      days[day] = (days[day] || 0) + 1
    })

    // Sort by date
    return Object.entries(days)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))
  })

  return {
    events,
    houseEvents,
    loading,
    error,
    eventsByType,
    eventsByPriority,
    eventsTimeline,
    fetchAllEvents,
    fetchHouseEvents,
    createEvent,
  }
})
