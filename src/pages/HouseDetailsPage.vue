<!-- src/pages/HouseDetailsPage.vue -->
<template>
  <q-page padding>
    <div v-if="loading" class="row justify-center items-center" style="height: 400px">
      <q-spinner color="primary" size="3em" />
      <div class="q-ml-md text-h6">{{ $t('loading') }}</div>
    </div>

    <div v-else class="row q-col-gutter-md">
      <div class="col-12">
        <q-card flat bordered>
          <q-card-section class="row items-center">
            <div class="text-h6">{{ house?.name || $t('loading') }}</div>
            <q-space />
            <q-btn icon="arrow_back" flat round dense :to="{ name: 'dashboard' }" />
          </q-card-section>

          <q-separator />

          <q-tabs
            v-model="activeTab"
            dense
            class="text-grey"
            active-color="primary"
            indicator-color="primary"
            align="left"
          >
            <q-tab name="floorplan" :label="$t('floorplan')" />
            <q-tab name="sensors" :label="$t('sensors')" />
            <q-tab name="residents" :label="$t('residents')" />
            <q-tab name="events" :label="$t('events')" />
          </q-tabs>

          <q-separator />

          <q-tab-panels v-model="activeTab" animated>
            <q-tab-panel name="floorplan">
              <div class="floorplan-container">
                <div class="floorplan">
                  <!-- House floorplan with positioned sensors -->
                  <div
                    v-for="sensor in sensors"
                    :key="sensor.id"
                    :style="{ left: `${sensor.position_x}%`, top: `${sensor.position_y}%` }"
                    class="sensor-icon"
                  >
                    <q-icon
                      :name="getSensorIcon(sensor.type)"
                      :color="sensor.status === 'active' ? 'positive' : 'negative'"
                      size="sm"
                    >
                      <q-tooltip>
                        <strong>{{ getSensorTypeLabel(sensor.type) }}</strong
                        ><br />
                        {{ $t('location') }}: {{ sensor.location }}<br />
                        {{ $t('status') }}: {{ getStatusLabel(sensor.status) }}<br />
                        {{ $t('signalStrength') }}: {{ sensor.signalStrength }}%<br />
                        {{ $t('battery') }}: {{ sensor.battery }}%
                        <template v-if="sensor.type === 'motion'">
                          <br />{{ $t('lightLevel') }}: {{ sensor.lightLevel }}
                        </template>
                        <template v-if="sensor.type === 'environmental'">
                          <br />{{ $t('temperature') }}: {{ sensor.temperature }}°C <br />{{
                            $t('humidity')
                          }}: {{ sensor.humidity }}%
                        </template>
                      </q-tooltip>
                    </q-icon>
                  </div>
                </div>
              </div>
            </q-tab-panel>

            <q-tab-panel name="sensors">
              <q-table
                :rows="sensors"
                :columns="sensorColumns"
                row-key="id"
                :pagination="{ rowsPerPage: 10 }"
              >
                <template v-slot:body="props">
                  <q-tr :props="props">
                    <q-td key="icon" :props="props">
                      <q-icon
                        :name="getSensorIcon(props.row.type)"
                        :color="props.row.status === 'active' ? 'positive' : 'negative'"
                      />
                    </q-td>
                    <q-td key="type" :props="props">{{ getSensorTypeLabel(props.row.type) }}</q-td>
                    <q-td key="location" :props="props">{{ $t(props.row.location) }}</q-td>
                    <q-td key="status" :props="props">
                      <q-badge :color="props.row.status === 'active' ? 'positive' : 'negative'">
                        {{ getStatusLabel(props.row.status) }}
                      </q-badge>
                    </q-td>
                    <q-td key="signalStrength" :props="props">
                      <q-linear-progress
                        :value="props.row.signalStrength / 100"
                        :color="getSignalColor(props.row.signalStrength)"
                        class="q-mt-xs"
                      />
                      {{ props.row.signalStrength }}%
                    </q-td>
                    <q-td key="battery" :props="props">
                      <q-linear-progress
                        :value="props.row.battery / 100"
                        :color="getBatteryColor(props.row.battery)"
                        class="q-mt-xs"
                      />
                      {{ props.row.battery }}%
                    </q-td>
                    <q-td key="temperature" :props="props">{{ props.row.temperature }}°C</q-td>
                    <q-td key="humidity" :props="props">{{ props.row.humidity }}%</q-td>
                    <q-td key="actions" :props="props">
                      <q-btn icon="edit" flat round dense size="sm" />
                      <q-btn icon="delete" flat round dense size="sm" color="negative" />
                    </q-td>
                  </q-tr>
                </template>
              </q-table>
              <div class="q-mt-md">
                <q-btn
                  color="primary"
                  :label="$t('addSensor')"
                  icon="add"
                  @click="showAddSensorWizard"
                />
              </div>
            </q-tab-panel>

            <q-tab-panel name="residents">
              <!-- Residents information -->
              <q-list bordered separator>
                <q-item v-for="resident in residents" :key="resident.id">
                  <q-item-section avatar>
                    <q-avatar>
                      <img :src="resident.avatar" />
                    </q-avatar>
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>{{ resident.name }}</q-item-label>
                    <q-item-label caption>{{ resident.role }}</q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-btn flat round icon="phone" size="sm" :href="`tel:${resident.phone}`" />
                    <q-btn flat round icon="mail" size="sm" :href="`mailto:${resident.email}`" />
                  </q-item-section>
                </q-item>
              </q-list>
            </q-tab-panel>

            <q-tab-panel name="events">
              <!-- Events for this house -->
              <q-table
                :rows="houseEvents"
                :columns="eventColumns"
                row-key="id"
                :pagination="{ rowsPerPage: 10 }"
              >
                <template v-slot:body="props">
                  <q-tr :props="props">
                    <q-td key="icon" :props="props">
                      <q-icon
                        :name="getEventIcon(props.row.type)"
                        :color="getEventColor(props.row.priority)"
                      />
                    </q-td>
                    <q-td key="datetime" :props="props">{{ formatDate(props.row.datetime) }}</q-td>
                    <q-td key="description" :props="props">{{ props.row.description }}</q-td>
                    <q-td key="sensor" :props="props">{{ props.row.sensor }}</q-td>
                    <q-td key="priority" :props="props">
                      <q-badge :color="getEventColor(props.row.priority)">
                        {{ getStatusLabel(props.row.priority) }}
                      </q-badge>
                    </q-td>
                  </q-tr>
                </template>
              </q-table>
            </q-tab-panel>
          </q-tab-panels>
        </q-card>
      </div>
    </div>

    <!-- Add Sensor Wizard Dialog -->
    <q-dialog v-model="addSensorDialog" persistent>
      <q-card style="min-width: 350px">
        <q-card-section class="row items-center">
          <div class="text-h6">{{ $t('addNewSensor') }}</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-separator />

        <q-stepper v-model="sensorWizardStep" vertical color="primary" animated>
          <q-step
            :name="1"
            :title="$t('selectSensorLocation')"
            icon="place"
            :done="sensorWizardStep > 1"
          >
            <q-select
              v-model="newSensor.location"
              :options="locationOptions"
              :label="$t('location')"
              filled
              class="q-mb-md"
            />

            <q-stepper-navigation>
              <q-btn color="primary" :label="$t('next')" @click="sensorWizardStep = 2" />
              <q-btn
                flat
                color="primary"
                :label="$t('cancel')"
                @click="addSensorDialog = false"
                class="q-ml-sm"
              />
            </q-stepper-navigation>
          </q-step>

          <q-step
            :name="2"
            :title="$t('pairingInstructions')"
            icon="bluetooth"
            :done="sensorWizardStep > 2"
          >
            <p>{{ $t('pairingInstructionsText') }}</p>

            <div v-if="!pairing">
              <q-btn color="primary" :label="$t('addSensor')" @click="startPairing" />
            </div>

            <div v-else>
              <p>{{ $t('waitForConnection') }}</p>
              <q-linear-progress indeterminate />
              <p>{{ $t('timeRemaining', { seconds: pairingTimeRemaining }) }}</p>
            </div>

            <q-stepper-navigation>
              <q-btn
                flat
                color="primary"
                :label="$t('back')"
                @click="sensorWizardStep = 1"
                :disable="pairing"
              />
              <q-btn
                flat
                color="negative"
                :label="$t('cancel')"
                @click="cancelPairing"
                :disable="!pairing"
              />
            </q-stepper-navigation>
          </q-step>

          <q-step :name="3" :title="$t('complete')" icon="done">
            <div class="text-positive">
              <q-icon name="check_circle" size="md" />
              {{ $t('sensorAddedSuccessfully') }}
            </div>

            <q-stepper-navigation>
              <q-btn color="positive" :label="$t('finish')" @click="finishAddSensor" />
              <q-btn
                color="primary"
                :label="$t('addAnotherSensor')"
                @click="resetWizard"
                class="q-ml-sm"
              />
            </q-stepper-navigation>
          </q-step>
        </q-stepper>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import { useHousesStore } from '../stores/houses'
import { usersApi, sensorsApi } from '../services/db2rest'

const { t } = useI18n()
const route = useRoute()
const $q = useQuasar()
const housesStore = useHousesStore()

// Get data from store
const house = computed(() => housesStore.currentHouse)
const sensors = computed(() => housesStore.houseSensors)
const residents = ref([])
const loading = computed(() => housesStore.loading)

// Tabs
const activeTab = ref('floorplan')

// Sensor table columns
const sensorColumns = ref([
  { name: 'icon', label: '', field: 'icon', align: 'center' },
  { name: 'type', label: t('type'), field: 'type', align: 'left', sortable: true },
  { name: 'location', label: t('location'), field: 'location', align: 'left', sortable: true },
  { name: 'status', label: t('status'), field: 'status', align: 'center', sortable: true },
  {
    name: 'signalStrength',
    label: t('signalStrength'),
    field: 'signalStrength',
    align: 'center',
    sortable: true,
  },
  { name: 'battery', label: t('battery'), field: 'battery', align: 'center', sortable: true },
  {
    name: 'temperature',
    label: t('temperature'),
    field: 'temperature',
    align: 'center',
    sortable: true,
  },
  { name: 'humidity', label: t('humidity'), field: 'humidity', align: 'center', sortable: true },
  { name: 'actions', label: t('actions'), field: 'actions', align: 'center' },
])

// Events data for this house - will be implemented with Supabase later
const houseEvents = ref([])

// Event table columns
const eventColumns = ref([
  { name: 'icon', label: '', field: 'icon', align: 'center' },
  { name: 'datetime', label: t('dateTime'), field: 'datetime', align: 'left', sortable: true },
  { name: 'description', label: t('description'), field: 'description', align: 'left' },
  { name: 'sensor', label: t('sensor'), field: 'sensor', align: 'left', sortable: true },
  { name: 'priority', label: t('priority'), field: 'priority', align: 'center', sortable: true },
])

// Sensor wizard
const addSensorDialog = ref(false)
const sensorWizardStep = ref(1)
const pairing = ref(false)
const pairingTimeRemaining = ref(60)
const pairingInterval = ref(null)

const locationOptions = [
  'Living Room',
  'Bedroom',
  'Bathroom/Toilet',
  'Front Door',
  'Refrigerator Door',
  'Temperature & Humidity',
  'Emergency Button',
]

// Helper function to translate status
const getStatusLabel = (status) => {
  if (!status) return t('unknown')
  // Map database status values to translation keys
  const statusMap = {
    active: 'active',
    inactive: 'inactive',
    offline: 'offline',
    low_signal: 'lowSignal',
    error: 'error',
    low_battery: 'lowBattery',
    warning: 'warning',
    critical: 'critical',
    maintenance: 'maintenance',
    disconnected: 'disconnected',
    pending: 'pending',
    archived: 'archived',
  }

  const mappedKey = statusMap[status] || 'unknown'
  const translatedStatus = t(mappedKey)
  return translatedStatus
}

const newSensor = ref({
  location: null,
  type: null,
})

const showAddSensorWizard = () => {
  addSensorDialog.value = true
  sensorWizardStep.value = 1
  newSensor.value = { location: null, type: null }
}

const startPairing = () => {
  pairing.value = true
  pairingTimeRemaining.value = 60

  // Determine sensor type based on location
  if (
    newSensor.value.location === 'Front Door' ||
    newSensor.value.location === 'Refrigerator Door'
  ) {
    newSensor.value.type = 'door'
  } else if (newSensor.value.location === 'Temperature & Humidity') {
    newSensor.value.type = 'environmental'
  } else if (newSensor.value.location === 'Emergency Button') {
    newSensor.value.type = 'panic'
  } else {
    newSensor.value.type = 'motion'
  }

  // Start countdown
  pairingInterval.value = setInterval(() => {
    pairingTimeRemaining.value--
    if (pairingTimeRemaining.value <= 0) {
      clearInterval(pairingInterval.value)
      pairing.value = false
      // Simulate successful pairing
      sensorWizardStep.value = 3
    }
  }, 1000)
}

const cancelPairing = () => {
  clearInterval(pairingInterval.value)
  pairing.value = false
  addSensorDialog.value = false
}

// Sensor types and locations data
const sensorTypes = ref([])
const sensorLocations = ref([])

// Load sensor types and locations
const loadSensorTypes = async () => {
  try {
    sensorTypes.value = await sensorsApi.getSensorTypes()
  } catch (error) {
    console.error('Error loading sensor types:', error)
    $q.notify({
      color: 'negative',
      textColor: 'white',
      icon: 'error',
      message: t('errorLoadingSensorTypes'),
    })
  }
}

const loadSensorLocations = async () => {
  try {
    sensorLocations.value = await sensorsApi.getSensorLocations()
  } catch (error) {
    console.error('Error loading sensor locations:', error)
    $q.notify({
      color: 'negative',
      textColor: 'white',
      icon: 'error',
      message: t('errorLoadingSensorLocations'),
    })
  }
}

const finishAddSensor = async () => {
  try {
    // Create position values for the sensor
    const position_x = Math.floor(Math.random() * 80) + 10
    const position_y = Math.floor(Math.random() * 80) + 10

    // Find the type_id based on the type name
    let type_id = null

    // If we have a type name, find the corresponding type_id
    if (newSensor.value.type) {
      const sensorType = sensorTypes.value.find((t) => t.name === newSensor.value.type)
      if (sensorType) {
        type_id = sensorType.id
      } else {
        throw new Error(`Sensor type "${newSensor.value.type}" not found`)
      }
    }

    if (!type_id) {
      throw new Error('No sensor type selected')
    }

    // Find the location_id based on the location name
    let location_id = null

    // If we have a location name, find the corresponding location_id
    if (newSensor.value.location) {
      const sensorLocation = sensorLocations.value.find((l) => l.name === newSensor.value.location)
      if (sensorLocation) {
        location_id = sensorLocation.id
      } else {
        throw new Error(`Sensor location "${newSensor.value.location}" not found`)
      }
    }

    if (!location_id) {
      throw new Error('No sensor location selected')
    }

    // Add the new sensor using the store
    await housesStore.createSensor(house.value.id, {
      type_id: type_id, // Use type_id instead of type
      location_id: location_id, // Use location_id instead of location
      status: 'active',
      signalStrength: 95,
      battery: 100,
      position_x,
      position_y,
    })

    // Show success notification
    $q.notify({
      color: 'positive',
      textColor: 'white',
      icon: 'check_circle',
      message: t('sensorAddedSuccessfully'),
    })

    // Close the dialog
    addSensorDialog.value = false

    // Refresh the sensors list
    await housesStore.fetchHouseSensors(house.value.id)
  } catch (error) {
    console.error('Error adding sensor:', error)

    // Show error notification
    $q.notify({
      color: 'negative',
      textColor: 'white',
      icon: 'error',
      message: t('errorAddingSensor', { error: error.message }),
    })
  }
}

const resetWizard = () => {
  sensorWizardStep.value = 1
  newSensor.value = { location: null, type: null }
  pairing.value = false
}

// Helper functions
const getSensorIcon = (type) => {
  const icons = {
    motion: 'directions_run',
    door: 'sensor_door',
    environmental: 'device_thermostat',
    panic: 'emergency',
  }
  return icons[type] || 'sensor'
}

const getSensorTypeLabel = (type) => {
  const labels = {
    motion: t('motionSensor'),
    door: t('doorSensor'),
    environmental: t('environmentalSensor'),
    panic: t('panicButton'),
  }
  return labels[type] || type
}

const getSignalColor = (strength) => {
  // Handle cases where strength is undefined or not a number
  if (strength === undefined || isNaN(strength)) {
    return 'grey' // Default color if data is invalid
  }

  if (strength > 70) return 'positive'
  if (strength > 40) return 'warning'
  return 'negative'
}

const getBatteryColor = (level) => {
  // Handle cases where level is undefined or not a number
  if (level === undefined || isNaN(level)) {
    return 'grey' // Default color if data is invalid
  }

  if (level > 50) return 'positive'
  if (level > 20) return 'warning'
  return 'negative'
}

const getEventIcon = (type) => {
  const icons = {
    motion: 'directions_run',
    door: 'sensor_door',
    temperature: 'device_thermostat',
    humidity: 'water_drop',
    battery: 'battery_alert',
  }
  return icons[type] || 'event'
}

const getEventColor = (priority) => {
  const colors = {
    Critical: 'negative',
    Medium: 'warning',
    Informative: 'info',
  }
  return colors[priority] || 'grey'
}

const formatDate = (date) => {
  if (!date) return '-'

  try {
    // If it's a string, convert it to a Date object
    const dateObj = typeof date === 'string' ? new Date(date) : date

    // Check if the date is valid
    if (isNaN(dateObj.getTime())) {
      return date // Return the original value if it's not a valid date
    }

    return dateObj.toLocaleString()
  } catch (error) {
    console.error('Error formatting date:', error, date)
    return date || '-' // Return the original value or a fallback
  }
}

onMounted(async () => {
  const houseId = route.params.id

  try {
    // Load sensor types and locations first
    await Promise.all([loadSensorTypes(), loadSensorLocations()])

    // Fetch house data
    await housesStore.fetchHouseById(houseId)

    // Fetch house sensors
    await housesStore.fetchHouseSensors(houseId)

    // Fetch residents data
    try {
      const residentsData = await usersApi.getByHouseId(houseId)
      residents.value = residentsData
    } catch (error) {
      console.error('Error loading users:', error)
    }

    // Fetch events data (to be implemented with Supabase later)
    // For now, we'll just use an empty array
    houseEvents.value = []

    // console.log('House details page mounted with ID:', houseId)
  } catch (error) {
    console.error('Error loading house details:', error)
  }
})
</script>

<style scoped>
.floorplan-container {
  position: relative;
  width: 100%;
  height: 500px;
  background-color: #f0f0f0;
  overflow: hidden;
}

.floorplan {
  width: 100%;
  height: 100%;
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><rect x="50" y="50" width="700" height="500" fill="none" stroke="gray" stroke-width="2"/><line x1="400" y1="50" x2="400" y2="300" stroke="gray" stroke-width="2"/><line x1="400" y1="300" x2="750" y2="300" stroke="gray" stroke-width="2"/><line x1="50" y1="300" x2="250" y2="300" stroke="gray" stroke-width="2"/><line x1="250" y1="300" x2="250" y2="550" stroke="gray" stroke-width="2"/><line x1="250" y1="425" x2="400" y2="425" stroke="gray" stroke-width="2"/><line x1="400" y1="300" x2="400" y2="550" stroke="gray" stroke-width="2"/><text x="150" y="175" font-family="Arial" font-size="14" fill="gray">Living Room</text><text x="500" y="175" font-family="Arial" font-size="14" fill="gray">Bedroom</text><text x="325" y="475" font-family="Arial" font-size="14" fill="gray">Bathroom</text><text x="575" y="425" font-family="Arial" font-size="14" fill="gray">Kitchen</text><text x="150" y="425" font-family="Arial" font-size="14" fill="gray">Hallway</text></svg>');
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  position: relative;
}

.sensor-icon {
  position: absolute;
  width: 24px;
  height: 24px;
  margin-left: -12px;
  margin-top: -12px;
  cursor: pointer;
  z-index: 10;
}
</style>
