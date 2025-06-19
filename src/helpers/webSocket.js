// src/helpers/webSocket.js
import mqtt from 'mqtt'

class MQTTService {
  constructor() {
    this.client = null
    this.isConnected = false
    this.listeners = new Map()
    this.connectionOptions = {
      clientId: 'SH-KeepAlive',
      username: 'SH-KeepAlive',
      password: 'SH-KeepAlive_1',
      keepalive: 60,
      // reconnectPeriod: 1000,
      connectTimeout: 30 * 1000,
      will: {
        topic: 'WillMsg',
        payload: 'Connection Closed abnormally..!',
        qos: 0,
        retain: false,
      },
    }
  }

  // התחברות ל-MQTT broker
  connect() {
    return new Promise((resolve, reject) => {
      try {
        console.log('Connecting to MQTT broker...')

        this.client = mqtt.connect('ws://192.168.1.179:8084/mqtt', this.connectionOptions)

        this.client.on('connect', () => {
          console.log('Successfully connected to MQTT broker')
          this.isConnected = true
          resolve(this.client)
        })

        this.client.on('error', (error) => {
          console.error('MQTT connection error:', error)
          this.isConnected = false
          reject(error)
        })

        this.client.on('offline', () => {
          console.log('MQTT client is offline')
          this.isConnected = false
        })

        this.client.on('reconnect', () => {
          console.log('MQTT client reconnecting...')
        })

        this.client.on('message', (topic, message) => {
          console.log('MQTT message received:', { topic, message: message.toString() })
          this.handleMessage(topic, message.toString())
        })

        this.client.on('close', () => {
          console.log('MQTT connection closed')
          this.isConnected = false
        })
      } catch (error) {
        console.error('Error creating MQTT connection:', error)
        reject(error)
      }
    })
  }

  // ניתוק מ-MQTT broker
  disconnect() {
    if (this.client) {
      this.client.end()
      this.isConnected = false
      console.log('MQTT client disconnected')
    }
  }

  // פרסום הודעה
  publish(topic, message, options = {}) {
    return new Promise((resolve, reject) => {
      if (!this.isConnected || !this.client) {
        reject(new Error('MQTT client is not connected'))
        return
      }

      const publishOptions = {
        qos: 0,
        retain: false,
        ...options,
      }

      console.log('Publishing MQTT message:', { topic, message, options: publishOptions })

      this.client.publish(topic, message, publishOptions, (error) => {
        if (error) {
          console.error('MQTT publish error:', error)
          reject(error)
        } else {
          console.log('MQTT message published successfully')
          resolve()
        }
      })
    })
  }

  // הרשמה לנושא
  subscribe(topic, qos = 0) {
    return new Promise((resolve, reject) => {
      if (!this.isConnected || !this.client) {
        reject(new Error('MQTT client is not connected'))
        return
      }

      console.log('Subscribing to MQTT topic:', topic)

      this.client.subscribe(topic, { qos }, (error, granted) => {
        if (error) {
          console.error('MQTT subscribe error:', error)
          reject(error)
        } else {
          console.log('Successfully subscribed to topic:', granted)
          resolve(granted)
        }
      })
    })
  }

  // ביטול הרשמה לנושא
  unsubscribe(topic) {
    return new Promise((resolve, reject) => {
      if (!this.isConnected || !this.client) {
        reject(new Error('MQTT client is not connected'))
        return
      }

      this.client.unsubscribe(topic, (error) => {
        if (error) {
          console.error('MQTT unsubscribe error:', error)
          reject(error)
        } else {
          console.log('Successfully unsubscribed from topic:', topic)
          resolve()
        }
      })
    })
  }

  // הוספת listener להודעות
  addMessageListener(topic, callback) {
    if (!this.listeners.has(topic)) {
      this.listeners.set(topic, [])
    }
    this.listeners.get(topic).push(callback)
  }

  // הסרת listener
  removeMessageListener(topic, callback) {
    if (this.listeners.has(topic)) {
      const callbacks = this.listeners.get(topic)
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  // טיפול בהודעות נכנסות
  handleMessage(topic, message) {
    if (this.listeners.has(topic)) {
      this.listeners.get(topic).forEach((callback) => {
        try {
          callback(message, topic)
        } catch (error) {
          console.error('Error in message listener:', error)
        }
      })
    }

    // טיפול גלובלי בהודעות
    if (this.listeners.has('*')) {
      this.listeners.get('*').forEach((callback) => {
        try {
          callback(message, topic)
        } catch (error) {
          console.error('Error in global message listener:', error)
        }
      })
    }
  }

  // פונקציות ספציפיות לחיישנים

  // בקשת מידע על חיישנים זמינים
  async requestSensorInfo() {
    try {
      await this.publish('cmnd/TOPSENSE_579B40/ZbInfo', '')
      console.log('Sensor info request sent')
      return true
    } catch (error) {
      console.error('Failed to send sensor info request:', error)
      throw error
    }
  }

  // הוספת חיישן (זימון מצב זיווג)
  async startSensorPairing() {
    try {
      await this.publish('cmnd/TOPSENSE_579B40/ZbPermitJoin', '')
      console.log('Sensor pairing mode activated')
      return true
    } catch (error) {
      console.error('Failed to start sensor pairing:', error)
      throw error
    }
  }

  // שינוי שם חיישן
  async setSensorName(deviceId, locationName) {
    try {
      const command = `${deviceId}, '${locationName}'`
      await this.publish('cmnd/TOPSENSE_579B40/ZbName', command)
      console.log('Sensor name change command sent:', { deviceId, locationName, command })
      return true
    } catch (error) {
      console.error('Failed to set sensor name:', error)
      throw error
    }
  }

  async deleteSensor(deviceId) {
    try {
      const command = `${deviceId}`
      await this.publish('cmnd/TOPSENSE_579B40/ZbForget', command)
      console.log('Sensor name change command sent:', { deviceId, command })
      return true
    } catch (error) {
      console.error('Failed to delete sensor: ', error)
      throw error
    }
  }

  // הרשמה להודעות מחיישן ספציפי
  async subscribeToSensorData(deviceId) {
    try {
      const topic = `tele/TOPSENSE_579B40/${deviceId}/SENSOR`
      await this.subscribe(topic)
      console.log('Subscribed to sensor data:', deviceId)
      return true
    } catch (error) {
      console.error('Failed to subscribe to sensor data:', error)
      throw error
    }
  }

  // הרשמה לכל הודעות החיישנים
  async subscribeToAllSensorMessages() {
    try {
      await this.subscribe('tele/TOPSENSE_579B40/+/SENSOR')
      console.log('Subscribed to all sensor messages')
      return true
    } catch (error) {
      console.error('Failed to subscribe to all sensor messages:', error)
      throw error
    }
  }

  // בדיקת סטטוס החיבור
  isClientConnected() {
    return this.isConnected && this.client && this.client.connected
  }

  // קבלת פרטי החיבור
  getConnectionInfo() {
    return {
      isConnected: this.isConnected,
      clientId: this.connectionOptions.clientId,
      brokerUrl: 'ws://192.168.1.179:8084/mqtt',
    }
  }
}

// יצירת instance יחיד
const mqttService = new MQTTService()

// התחברות אוטומטית בעת טעינת המודול
let autoConnectPromise = null

const getConnectedClient = async () => {
  if (mqttService.isClientConnected()) {
    return mqttService
  }

  if (!autoConnectPromise) {
    autoConnectPromise = mqttService.connect().catch((error) => {
      autoConnectPromise = null
      throw error
    })
  }

  await autoConnectPromise
  return mqttService
}

// Export של הפונקציות הראשיות
export default mqttService

export { getConnectedClient, mqttService }

// Export של פונקציות נוחות
export const mqttHelper = {
  async connect() {
    return await getConnectedClient()
  },

  async requestSensorInfo() {
    const client = await getConnectedClient()
    return await client.requestSensorInfo()
  },

  async startSensorPairing() {
    const client = await getConnectedClient()
    return await client.startSensorPairing()
  },

  async enablePairingMode() {
    const client = await getConnectedClient()
    return await client.startSensorPairing()
  },

  async setSensorName(deviceId, locationName) {
    const client = await getConnectedClient()
    return await client.setSensorName(deviceId, locationName)
  },

  async subscribeToSensorData(deviceId) {
    const client = await getConnectedClient()
    return await client.subscribeToSensorData(deviceId)
  },

  async subscribeToAllSensorMessages() {
    const client = await getConnectedClient()
    return await client.subscribeToAllSensorMessages()
  },

  async publish(topic, message, options) {
    const client = await getConnectedClient()
    return await client.publish(topic, message, options)
  },

  async subscribe(topic, qos) {
    const client = await getConnectedClient()
    return await client.subscribe(topic, qos)
  },

  async addMessageListener(topic, callback) {
    const client = await getConnectedClient()
    return client.addMessageListener(topic, callback)
  },

  async removeMessageListener(topic, callback) {
    const client = await getConnectedClient()
    return client.removeMessageListener(topic, callback)
  },

  isConnected() {
    return mqttService.isClientConnected()
  },

  getConnectionInfo() {
    return mqttService.getConnectionInfo()
  },
}
