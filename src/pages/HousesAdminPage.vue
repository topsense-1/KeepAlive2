<!-- src/pages/HousesAdminPage.vue -->
<template>
  <q-page padding>
    <div class="row q-col-gutter-md">
      <div class="col-12">
        <div class="row items-center q-mb-md">
          <div class="text-h6">{{ $t('housesAdministration') }}</div>
          <q-space />
          <q-btn color="primary" :label="$t('addHouse')" icon="add" @click="showAddHouseForm" />
        </div>

        <q-table
          :rows="houses"
          :columns="houseColumns"
          row-key="id"
          :pagination="{ rowsPerPage: 10 }"
          :loading="loading"
        >
          <template v-slot:body="props">
            <q-tr :props="props">
              <q-td key="number" :props="props">{{ props.row.number }}</q-td>
              <q-td key="resident" :props="props">{{ props.row.resident }}</q-td>
              <q-td key="installationDate" :props="props">
                {{ formatDate(props.row.installation_date) }}
              </q-td>
              <q-td key="lastUpdate" :props="props">
                {{ formatDate(props.row.last_update) }}
              </q-td>
              <q-td key="sensorCount" :props="props">
                {{ props.row.active_sensors !== undefined ? props.row.active_sensors : '-' }} /
                {{ props.row.total_sensors !== undefined ? props.row.total_sensors : '-' }}
                <q-badge
                  :color="getBadgeColor(props.row.active_sensors, props.row.total_sensors)"
                  class="q-ml-sm"
                >
                  {{ getStatusText(props.row.active_sensors, props.row.total_sensors) }}
                </q-badge>
              </q-td>
              <q-td key="clientId" :props="props">{{ props.row.client_id }}</q-td>
              <q-td key="actions" :props="props">
                <q-btn icon="visibility" flat round dense size="sm" @click="viewHouse(props.row)" />
                <q-btn icon="edit" flat round dense size="sm" @click="editHouse(props.row)" />
                <q-btn
                  icon="settings"
                  flat
                  round
                  dense
                  size="sm"
                  @click="manageSensors(props.row)"
                />
                <q-btn
                  icon="delete"
                  flat
                  round
                  dense
                  size="sm"
                  color="negative"
                  @click="confirmDeleteHouse(props.row)"
                />
              </q-td>
            </q-tr>
          </template>
        </q-table>
      </div>
    </div>

    <!-- Add/Edit House Dialog -->
    <q-dialog v-model="showAddHouseDialog" persistent>
      <q-card style="min-width: 350px">
        <q-card-section class="row items-center">
          <div class="text-h6">{{ isEditing ? $t('editHouse') : $t('addHouse') }}</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-separator />

        <q-card-section>
          <q-form @submit="saveHouse">
            <q-input
              v-model="editedHouse.number"
              :label="$t('houseNumber')"
              filled
              :rules="[(val) => !!val || $t('fieldRequired')]"
              class="q-mb-md"
            />

            <q-input
              v-model="editedHouse.resident"
              :label="$t('residentName')"
              filled
              :rules="[(val) => !!val || $t('fieldRequired')]"
              class="q-mb-md"
            />

            <q-input
              v-model="editedHouse.clientId"
              :label="$t('clientId')"
              filled
              :rules="[(val) => !!val || $t('fieldRequired')]"
              class="q-mb-md"
            />

            <q-input
              v-model="editedHouse.installationDate"
              :label="$t('installationDate')"
              filled
              type="date"
              :rules="[(val) => !!val || $t('fieldRequired')]"
              class="q-mb-md"
            />

            <div class="row justify-end q-mt-md">
              <q-btn flat :label="$t('cancel')" v-close-popup />
              <q-btn :label="$t('save')" type="submit" color="primary" class="q-ml-sm" />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Sensor Management Dialog -->
    <q-dialog v-model="showSensorManagementDialog" maximized persistent>
      <q-card>
        <q-card-section class="row items-center">
          <div class="text-h6">{{ $t('manageSensors') }} - {{ selectedHouse?.number }}</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-separator />

        <q-card-section>
          <q-table
            :rows="houseSensors"
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
                <q-td key="location" :props="props">{{
                  getSensorLocationLabel(props.row.location)
                }}</q-td>
                <q-td key="temperature" :props="props">
                  {{
                    typeof props.row.temperature === 'number'
                      ? props.row.temperature + '°C'
                      : '----'
                  }}
                </q-td>
                <q-td key="humidity" :props="props">
                  {{ typeof props.row.humidity === 'number' ? props.row.humidity + '%' : '----' }}
                </q-td>
                <q-td key="status" :props="props">
                  <q-badge :color="props.row.status === 'active' ? 'positive' : 'negative'">
                    {{ getStatusLabel(props.row.status) }}
                  </q-badge>
                </q-td>
                <q-td key="signalStrength" :props="props">
                  <q-linear-progress
                    :value="getSensorSignalStrength(props.row) / 100"
                    :color="getSignalColor(getSensorSignalStrength(props.row))"
                    class="q-mt-xs"
                  />
                  {{ getSensorSignalStrength(props.row) }}%
                </q-td>
                <q-td key="battery" :props="props">
                  <q-linear-progress
                    :value="getSensorBattery(props.row) / 100"
                    :color="getBatteryColor(getSensorBattery(props.row))"
                    class="q-mt-xs"
                  />
                  {{ getSensorBattery(props.row) }}%
                </q-td>
                <q-td key="actions" :props="props">
                  <q-btn icon="edit" flat round dense size="sm" @click="editSensor(props.row)" />
                  <q-btn
                    icon="delete"
                    flat
                    round
                    dense
                    size="sm"
                    color="negative"
                    @click="confirmDeleteSensor(props.row)"
                  />
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
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Add Sensor Wizard Dialog -->
    <q-dialog v-model="showAddSensorDialog" persistent>
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
              :options="translatedLocationOptions"
              :label="$t('location')"
              filled
              class="q-mb-md"
              option-value="value"
              option-label="label"
              emit-value
              map-options
            />

            <q-stepper-navigation>
              <q-btn
                color="primary"
                :label="$t('next')"
                @click="sensorWizardStep = 2"
                :disable="!newSensor.location"
              />
              <q-btn
                flat
                color="primary"
                :label="$t('cancel')"
                @click="showAddSensorDialog = false"
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
            <!-- מידע על החיבור ל-MQTT -->
            <div class="q-mb-md">
              <q-banner
                :class="mqttConnected ? 'bg-positive text-white' : 'bg-negative text-white'"
                rounded
              >
                <template v-slot:avatar>
                  <q-icon :name="mqttConnected ? 'wifi' : 'wifi_off'" />
                </template>
                {{ mqttConnected ? $t('mqttConnected') : $t('mqttDisconnected') }}
                <span v-if="mqttConnectionError" class="text-caption block">
                  {{ mqttConnectionError }}
                </span>
              </q-banner>
            </div>

            <p>{{ $t('pairingInstructionsText') }}</p>

            <!-- כפתור התחלת זיווג -->
            <div v-if="!pairing" class="q-mb-md">
              <q-btn
                color="primary"
                :label="$t('startSensorPairing')"
                @click="startPairing"
                icon="bluetooth_searching"
                :loading="!mqttConnected"
              />
            </div>

            <!-- מצב חיפוש פעיל -->
            <div v-else class="q-mb-md">
              <div class="text-h6 q-mb-sm">
                <q-icon name="bluetooth_searching" class="q-mr-sm" />
                {{ $t('searchingForSensors') }}
              </div>

              <q-linear-progress indeterminate color="primary" class="q-mb-md" />

              <div class="text-body2 q-mb-md">
                {{ $t('timeRemaining', { seconds: pairingTimeRemaining }) }}
              </div>

              <!-- רשימת חיישנים שנמצאו -->
              <div v-if="discoveredSensors.length > 0" class="q-mb-md">
                <div class="text-subtitle2 q-mb-sm">
                  {{ $t('sensorsFound', { count: discoveredSensors.length }) }}:
                </div>

                <q-list bordered class="rounded-borders">
                  <q-item v-for="sensor in discoveredSensors" :key="sensor.id" class="q-pa-md">
                    <q-item-section avatar>
                      <q-icon
                        :name="getSensorIcon(newSensor.type)"
                        :color="
                          sensor.status === 'available'
                            ? 'positive'
                            : sensor.status === 'newly_detected'
                              ? 'warning'
                              : 'grey'
                        "
                        size="md"
                      />
                    </q-item-section>

                    <q-item-section>
                      <q-item-label class="text-weight-medium">
                        {{ sensor.name }}
                      </q-item-label>
                      <q-item-label caption>
                        ID: {{ sensor.id }} | {{ sensor.model }}
                      </q-item-label>
                      <q-item-label caption v-if="sensor.manufacturer !== 'Unknown'">
                        {{ sensor.manufacturer }}
                      </q-item-label>
                    </q-item-section>

                    <q-item-section side>
                      <q-badge
                        :color="
                          sensor.status === 'available'
                            ? 'positive'
                            : sensor.status === 'newly_detected'
                              ? 'warning'
                              : 'grey'
                        "
                      >
                        {{
                          $t(sensor.status === 'newly_detected' ? 'newlyDetected' : sensor.status)
                        }}
                      </q-badge>
                    </q-item-section>
                  </q-item>
                </q-list>
              </div>

              <!-- הודעה במצב חיפוש ללא תוצאות -->
              <div v-else-if="pairingTimeRemaining < 50" class="text-body2 text-grey-6">
                <q-icon name="info" class="q-mr-sm" />
                {{ $t('noSensorsFoundYet') }}
              </div>
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
              <!-- כפתור מעבר ידני לשלב הבא אם נמצאו חיישנים -->
              <q-btn
                v-if="discoveredSensors.length > 0"
                color="positive"
                :label="$t('continueWithSelectedSensor')"
                @click="continueWithSensor"
                class="q-ml-sm"
              />
            </q-stepper-navigation>
          </q-step>

          <q-step :name="3" :title="$t('complete')" icon="done">
            <!-- הצגת פרטי החיישן שנבחר -->
            <div v-if="discoveredSensors.length > 0" class="q-mb-md">
              <q-card flat bordered class="q-pa-md q-mb-md">
                <div class="text-subtitle1 q-mb-sm">{{ $t('selectedSensor') }}:</div>
                <div class="row items-center">
                  <q-icon
                    :name="getSensorIcon(newSensor.type)"
                    color="primary"
                    size="md"
                    class="q-mr-md"
                  />
                  <div>
                    <div class="text-weight-medium">{{ discoveredSensors[0].name }}</div>
                    <div class="text-caption text-grey-6">
                      {{ $t('type') }}: {{ getSensorTypeLabel(newSensor.type) }}
                    </div>
                    <div class="text-caption text-grey-6">
                      {{ $t('location') }}: {{ getSensorLocationLabel(newSensor.location) }}
                    </div>
                  </div>
                </div>
              </q-card>
            </div>

            <div class="text-positive">
              <q-icon name="check_circle" size="md" />
              {{ $t('sensorReadyToAdd') }}
            </div>

            <q-stepper-navigation>
              <q-btn
                color="positive"
                :label="$t('addSensor')"
                @click="finishAddSensor"
                icon="add_circle"
              />
              <q-btn
                color="primary"
                :label="$t('addAnotherSensor')"
                @click="resetWizard"
                class="q-ml-sm"
              />
              <q-btn
                flat
                color="grey"
                :label="$t('cancel')"
                @click="showAddSensorDialog = false"
                class="q-ml-sm"
              />
            </q-stepper-navigation>
          </q-step>
        </q-stepper>
      </q-card>
    </q-dialog>

    <!-- Edit Sensor Dialog -->
    <q-dialog v-model="showEditSensorDialog" persistent>
      <q-card style="min-width: 350px">
        <q-card-section class="row items-center">
          <div class="text-h6">
            {{ $t('editingSensor', { sensor: getSensorLocationLabel(editedSensor.location) }) }}
          </div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-separator />

        <q-card-section>
          <q-form @submit="saveSensor">
            <!-- Display sensor type (read-only) -->
            <q-input
              :model-value="getSensorTypeLabel(editedSensor.type)"
              :label="$t('sensorType')"
              filled
              readonly
              class="q-mb-md"
            />

            <!-- Location selection based on sensor type - עדכן את זה! -->
            <q-select
              v-model="editedSensor.location"
              :options="getLocationOptionsForSensorType(editedSensor.type)"
              :label="$t('location')"
              filled
              :rules="[(val) => !!val || $t('fieldRequired')]"
              class="q-mb-md"
              option-value="value"
              option-label="label"
              emit-value
              map-options
            />

            <div class="row justify-end q-mt-md">
              <q-btn flat :label="$t('cancel')" v-close-popup />
              <q-btn :label="$t('save')" type="submit" color="primary" class="q-ml-sm" />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Confirmation Dialog -->
    <q-dialog v-model="confirmDeleteDialog">
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="warning" color="negative" text-color="white" />
          <span class="q-ml-sm">{{ confirmDeleteText }}</span>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat :label="$t('cancel')" v-close-popup />
          <q-btn
            flat
            :label="$t('delete')"
            color="negative"
            @click="deleteConfirmed"
            v-close-popup
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useHousesStore } from '../stores/houses'
import { sensorsApi } from '../services/db2rest'
import { mqttHelper } from '../helpers/webSocket'

const { t } = useI18n()
const router = useRouter()
const $q = useQuasar()
const housesStore = useHousesStore()

const mqttConnected = ref(false)
const mqttConnectionError = ref(null)
const sensorDiscoveryActive = ref(false)
const discoveredSensors = ref([])

// Get loading state from store
const loading = computed(() => housesStore.loading)

// Get houses data from store
const houses = computed(() => housesStore.houses)

// House table columns
const houseColumns = ref([
  { name: 'number', label: t('houseNumber'), field: 'number', align: 'left', sortable: true },
  { name: 'resident', label: t('residentName'), field: 'resident', align: 'left', sortable: true },
  {
    name: 'installationDate',
    label: t('installationDate'),
    field: 'installation_date',
    align: 'left',
    sortable: true,
  },
  {
    name: 'lastUpdate',
    label: t('lastUpdate'),
    field: 'last_update',
    align: 'left',
    sortable: true,
  },
  {
    name: 'sensorCount',
    label: t('sensorCount'),
    field: (row) => `${row.active_sensors}/${row.total_sensors}`,
    align: 'center',
    sortable: true,
  },
  { name: 'clientId', label: t('clientId'), field: 'client_id', align: 'left', sortable: true },
  { name: 'actions', label: t('actions'), field: 'actions', align: 'center' },
])

// House dialog
const showAddHouseDialog = ref(false)
const isEditing = ref(false)
const editedHouse = ref({
  number: '',
  resident: '',
  installationDate: '',
  clientId: '',
})

// Sensor management
const showSensorManagementDialog = ref(false)
const selectedHouse = ref(null)
const houseSensors = computed(() => housesStore.houseSensors)

// Sensor columns
const sensorColumns = ref([
  { name: 'icon', label: '', field: 'icon', align: 'center' },
  { name: 'type', label: t('type'), field: 'type', align: 'left', sortable: true },
  { name: 'location', label: t('location'), field: 'location', align: 'left', sortable: true },
  {
    name: 'temperature',
    label: t('temperature'),
    field: 'temperature',
    align: 'center',
    sortable: true,
  },
  {
    name: 'humidity',
    label: t('humidity'),
    field: 'humidity',
    align: 'center',
    sortable: true,
  },
  { name: 'status', label: t('status'), field: 'status', align: 'center', sortable: true },
  {
    name: 'signalStrength',
    label: t('signalStrength'),
    field: 'signalStrength',
    align: 'center',
    sortable: true,
  },
  { name: 'battery', label: t('battery'), field: 'battery', align: 'center', sortable: true },
  { name: 'actions', label: t('actions'), field: 'actions', align: 'center' },
])

const startPairing = async () => {
  try {
    pairing.value = true
    pairingTimeRemaining.value = 60
    sensorDiscoveryActive.value = true
    discoveredSensors.value = []

    // התחברות ל-MQTT אם לא מחובר
    if (!mqttHelper.isConnected()) {
      console.log('Connecting to MQTT...')
      $q.notify({
        color: 'info',
        textColor: 'white',
        icon: 'wifi',
        message: t('connectingToMQTT'),
        timeout: 2000,
      })

      await mqttHelper.connect()
      mqttConnected.value = true

      $q.notify({
        color: 'positive',
        textColor: 'white',
        icon: 'wifi',
        message: t('mqttConnected'),
        timeout: 2000,
      })
    } else {
      mqttConnected.value = true
    }

    // הרשמה להודעות על חיישנים חדשים
    await setupSensorDiscoveryListeners()

    // שליחת בקשת הפעלת מצב זיווג
    console.log('Activating sensor pairing mode via MQTT...')
    await mqttHelper.startSensorPairing()

    $q.notify({
      color: 'info',
      textColor: 'white',
      icon: 'bluetooth_searching',
      message: t('pairingModeActivated'),
      timeout: 3000,
    })

    // Start countdown
    pairingInterval.value = setInterval(() => {
      pairingTimeRemaining.value--
      if (pairingTimeRemaining.value <= 0) {
        clearInterval(pairingInterval.value)
        sensorDiscoveryActive.value = false

        // בדיקה אם נמצאו חיישנים
        if (discoveredSensors.value.length > 0) {
          // עבור לשלב הבא עם החיישן שנמצא
          pairing.value = false
          sensorWizardStep.value = 3
        } else {
          // לא נמצאו חיישנים
          pairing.value = false
          $q.notify({
            color: 'warning',
            textColor: 'white',
            icon: 'warning',
            message: t('noSensorsFound'),
            timeout: 5000,
          })
        }
      }
    }, 1000)
  } catch (error) {
    console.error('Error starting sensor pairing:', error)
    pairing.value = false
    sensorDiscoveryActive.value = false
    mqttConnectionError.value = error.message

    $q.notify({
      color: 'negative',
      textColor: 'white',
      icon: 'error',
      message: t('errorStartingPairing', { error: error.message }),
      timeout: 5000,
    })
  }
}

const setupSensorDiscoveryListeners = async () => {
  try {
    // הרשמה לנושאים רלוונטיים
    await mqttHelper.subscribe('stat/TOPSENSE_579B40/RESULT')
    await mqttHelper.subscribe('tele/TOPSENSE_579B40/SENSOR')
    await mqttHelper.subscribe('stat/TOPSENSE_579B40/STATUS*')

    // הרשמה לכל הודעות החיישנים (לזיהוי חיישנים חדשים)
    await mqttHelper.subscribe('tele/TOPSENSE_579B40/+/SENSOR')

    // הוספת listener לטיפול בהודעות
    mqttHelper.addMessageListener('*', handleSensorDiscoveryMessage)

    console.log('MQTT sensor discovery listeners set up')
  } catch (error) {
    console.error('Error setting up MQTT listeners:', error)
    throw error
  }
}

const handleSensorDiscoveryMessage = (message, topic) => {
  try {
    console.log('Received MQTT message:', { topic, message })

    // ניסיון לפרסר את ההודעה כ-JSON
    let parsedMessage
    try {
      parsedMessage = JSON.parse(message)
    } catch {
      // אם זה לא JSON, התעלם
      return
    }

    // טיפול בהודעות ZbInfo (מידע על חיישנים קיימים)
    if (topic.includes('RESULT') && parsedMessage.ZbInfo) {
      console.log('ZbInfo received:', parsedMessage.ZbInfo)

      // עיבוד מידע החיישנים
      if (parsedMessage.ZbInfo.Device && Object.keys(parsedMessage.ZbInfo.Device).length > 0) {
        const devices = parsedMessage.ZbInfo.Device
        const newSensors = []

        for (const [deviceId, deviceInfo] of Object.entries(devices)) {
          newSensors.push({
            id: deviceId,
            name: deviceInfo.Name || `Sensor ${deviceId}`,
            model: deviceInfo.ModelId || 'Unknown',
            manufacturer: deviceInfo.Manufacturer || 'Unknown',
            status: deviceInfo.Reachable ? 'available' : 'unavailable',
            lastSeen: deviceInfo.LastSeen || null,
          })
        }

        discoveredSensors.value = newSensors
        console.log('Discovered sensors:', newSensors)

        if (newSensors.length > 0) {
          $q.notify({
            color: 'positive',
            textColor: 'white',
            icon: 'devices',
            message: t('sensorsFound', { count: newSensors.length }),
            timeout: 3000,
          })
        }
      }
    }

    // טיפול בהודעות חיישן חדש (זיהוי צימוד)
    // טיפול בהודעות חיישן חדש (זיהוי צימוד)
    if (topic.includes('SENSOR') && sensorDiscoveryActive.value && parsedMessage.ZbReceived) {
      console.log('ZbReceived data:', parsedMessage.ZbReceived)

      // עיבוד כל החיישנים בהודעה
      for (const [deviceKey, sensorData] of Object.entries(parsedMessage.ZbReceived)) {
        console.log('Processing sensor data:', { deviceKey, sensorData })

        // בדיקה אם זה חיישן חדש עם Device, ModelId, Manufacturer
        if (sensorData.Device && sensorData.ModelId && sensorData.Manufacturer) {
          console.log('New sensor detected for pairing:', sensorData)

          // זיהוי סוג החיישן לפי ModelId
          const detectedSensorType = detectSensorTypeByModel(sensorData.ModelId)

          if (!detectedSensorType) {
            // החיישן לא תואם למערכת
            $q.notify({
              color: 'negative',
              textColor: 'white',
              icon: 'error',
              message: 'החיישן לא תואם למערכת, פנה למנהל המערכת',
              timeout: 5000,
            })
            continue // ממשיך לחיישן הבא
          }

          // עדכון סוג החיישן שזוהה
          newSensor.value.type = detectedSensorType

          // בדיקה אם החיישן כבר קיים ברשימה
          const existingSensor = discoveredSensors.value.find((s) => s.id === sensorData.Device)
          if (!existingSensor) {
            const newDetectedSensor = {
              id: sensorData.Device,
              name: sensorData.Name || `Sensor ${sensorData.Device}`,
              model: sensorData.ModelId,
              manufacturer: sensorData.Manufacturer,
              status: 'newly_detected',
              data: sensorData,
              linkQuality: sensorData.LinkQuality,
              endpoint: sensorData.Endpoint,
              isNewlyPaired: true,
              detectedType: detectedSensorType, // הוסף את הסוג שזוהה
            }

            discoveredSensors.value.push(newDetectedSensor)

            $q.notify({
              color: 'positive',
              textColor: 'white',
              icon: 'add_circle',
              message: t('newSensorDetected') + ` (${sensorData.Device})`,
              timeout: 3000,
            })

            // אם אנחנו במצב צימוד, נתקדם אוטומטית לשלב הבא
            if (pairing.value && sensorDiscoveryActive.value) {
              setTimeout(() => {
                continueWithSensor()
              }, 2000)
            }
          }
        }
      }
    }

    // טיפול בעדכוני נתונים מחיישנים קיימים (אחרי הצימוד)
    if (topic.includes('SENSOR') && !sensorDiscoveryActive.value && parsedMessage.ZbReceived) {
      console.log('Sensor data update received:', parsedMessage.ZbReceived)

      // עיבוד עדכוני נתונים מחיישנים קיימים
      for (const [deviceName, sensorData] of Object.entries(parsedMessage.ZbReceived)) {
        if (sensorData.Device) {
          // עדכון נתוני החיישן בבסיס הנתונים
          updateSensorData(sensorData.Device, deviceName, sensorData)
        }
      }
    }
  } catch (error) {
    console.error('Error handling MQTT message:', error)
  }
}

const updateSensorData = async (deviceId, deviceName, sensorData) => {
  try {
    console.log('Updating sensor data for:', { deviceId, deviceName, sensorData })

    // הכנת נתוני העדכון
    const sensorUpdateData = {
      signal_strength: sensorData.LinkQuality || null,
      temperature: sensorData.Temperature || null,
      humidity: sensorData.Humidity || null,
      battery: sensorData.Battery || null,
      light_level: sensorData.Illuminance ? sensorData.Illuminance.toString() : null,
    }

    // מסנן שדות ריקים
    Object.keys(sensorUpdateData).forEach((key) => {
      if (sensorUpdateData[key] === null || sensorUpdateData[key] === undefined) {
        delete sensorUpdateData[key]
      }
    })

    // אם יש נתונים לעדכן
    if (Object.keys(sensorUpdateData).length > 0) {
      // עדכון באמצעות ה-store עם device_id
      await housesStore.updateSensorByDeviceId(deviceId, sensorUpdateData)
      console.log('Sensor data updated successfully for device:', deviceId)
    }
  } catch (error) {
    console.error('Error updating sensor data:', error)
  }
}

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

// Helper function to get sensor location label
const getSensorLocationLabel = (location) => {
  const locationMap = {
    livingRoom: t('livingRoom'),
    bedroom: t('bedroom'),
    bathroom: t('bathroom'),
    kitchen: t('kitchen'),
    mainDoor: t('mainDoor'),
    refrigeratorDoor: t('refrigeratorDoor'),
    bedroomDoor: t('bedroomDoor'),
    bathroomDoor: t('bathroomDoor'),
    mobile: t('mobile'),
  }
  return locationMap[location] || location
}

// Helper function to get signal strength
const getSensorSignalStrength = (sensor) => {
  // Check both signal_strength and signalStrength fields
  return sensor.signal_strength !== undefined
    ? sensor.signal_strength
    : sensor.signalStrength !== undefined
      ? sensor.signalStrength
      : 0
}

// Helper function to get battery level
const getSensorBattery = (sensor) => {
  return sensor.battery !== undefined ? sensor.battery : 0
}

// Translated options for dropdowns
const translatedLocationOptions = computed(() => [
  { label: t('livingRoom'), value: 'livingRoom' },
  { label: t('bedroom'), value: 'bedroom' },
  { label: t('bathroom'), value: 'bathroom' },
  { label: t('kitchen'), value: 'kitchen' },
  { label: t('mainDoor'), value: 'mainDoor' },
  { label: t('refrigeratorDoor'), value: 'refrigeratorDoor' },
  { label: t('bedroomDoor'), value: 'bedroomDoor' },
  { label: t('bathroomDoor'), value: 'bathroomDoor' },
  { label: t('mobile'), value: 'mobile' },
])

// Function to get location options based on sensor type
const getLocationOptionsForSensorType = (sensorType) => {
  const allLocations = translatedLocationOptions.value

  switch (sensorType) {
    case 'environmental': // טמפרטורה/לחות - כל המקומות
      return allLocations.filter((loc) =>
        ['livingRoom', 'bedroom', 'bathroom', 'kitchen'].includes(loc.value),
      )

    case 'motion': // חיישן תנועה - סלון, חדר שינה, שירותים/מקלחת
      return allLocations.filter((loc) =>
        ['living Room', 'bedroom', 'bathroom'].includes(loc.value),
      )

    case 'door': // חיישן מגנטי - דלתות בלבד
      return allLocations.filter((loc) =>
        ['mainDoor', 'refrigeratorDoor', 'bedroomDoor', 'bathroomDoor'].includes(loc.value),
      )

    case 'panic': // לחצן מצוקה - כל המקומות
      return allLocations.filter((loc) =>
        ['livingRoom', 'bedroom', 'bathroom', 'kitchen', 'mobile'].includes(loc.value),
      )

    case 'flood': // חיישן הצפה - מטבח וחדר רחצה
      return allLocations.filter((loc) => ['kitchen', 'bathroom'].includes(loc.value))

    default:
      return allLocations
  }
}

// Confirmation dialog
const confirmDeleteDialog = ref(false)
const confirmDeleteText = ref('')
const deleteCallback = ref(null)

// Helper functions
const formatDate = (date) => {
  if (!date) return '-'

  try {
    // If it's a string, convert it to a Date object
    const dateObj = typeof date === 'string' ? new Date(date) : date

    // Check if the date is valid
    if (isNaN(dateObj.getTime())) {
      return date // Return the original value if it's not a valid date
    }

    return dateObj.toLocaleDateString()
  } catch (error) {
    console.error('Error formatting date:', error, date)
    return date || '-' // Return the original value or a fallback
  }
}

const formatDateForInput = (date) => {
  if (!date) return ''

  try {
    const d = new Date(date)

    // Check if the date is valid
    if (isNaN(d.getTime())) {
      console.warn('Invalid date for input:', date)
      return ''
    }

    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  } catch (error) {
    console.error('Error formatting date for input:', error, date)
    return ''
  }
}

const getBadgeColor = (active, total) => {
  // Handle cases where active or total are undefined or not numbers
  if (active === undefined || total === undefined || total === 0) {
    return 'grey' // Default color if data is invalid
  }

  const percentage = (active / total) * 100
  if (percentage === 100) return 'positive'
  if (percentage >= 75) return 'warning'
  return 'negative'
}

const getStatusText = (active, total) => {
  // Handle cases where active or total are undefined or not numbers
  if (active === undefined || total === undefined || total === 0) {
    return t('unknown') // Default text if data is invalid
  }

  const percentage = (active / total) * 100
  if (percentage === 100) return t('allOperational')
  if (percentage >= 75) return t('mostlyOperational')
  return t('needsAttention')
}

const getSensorIcon = (type) => {
  const icons = {
    motion: 'directions_run',
    door: 'sensor_door',
    environmental: 'device_thermostat',
    panic: 'emergency',
    flood: 'water_drop',
  }
  return icons[type] || 'sensor'
}

const getSensorTypeLabel = (type) => {
  const labels = {
    motion: t('motionSensor'),
    door: t('doorSensor'),
    environmental: t('environmentalSensor'),
    panic: t('panicButton'),
    flood: t('floodSensor'),
  }
  return labels[type] || type
}

const detectSensorTypeByModel = (modelId) => {
  if (!modelId || !sensorTypes.value.length) {
    return null
  }

  // חיפוש סוג החיישן לפי ModelId
  for (const sensorType of sensorTypes.value) {
    if (sensorType.model) {
      try {
        // פרסור ה-JSON של המודלים
        const models = JSON.parse(sensorType.model)
        if (Array.isArray(models) && models.includes(modelId)) {
          return sensorType.name
        }
      } catch (error) {
        console.warn('Error parsing sensor type model:', sensorType.model, error)
      }
    }
  }

  return null
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

// CRUD operations
const viewHouse = (house) => {
  router.push({ name: 'houseDetails', params: { id: house.id } })
}

const editHouse = (house) => {
  isEditing.value = true
  editedHouse.value = {
    id: house.id,
    number: house.number,
    resident: house.resident,
    clientId: house.client_id,
    installationDate: formatDateForInput(house.installation_date),
  }
  showAddHouseDialog.value = true
}

const manageSensors = async (house) => {
  selectedHouse.value = house

  try {
    await housesStore.fetchHouseSensors(house.id)
    showSensorManagementDialog.value = true
  } catch (error) {
    $q.notify({
      color: 'negative',
      textColor: 'white',
      icon: 'error',
      message: t('errorFetchingSensors'),
    })
    console.error('Error fetching sensors:', error)
  }
}

const confirmDeleteHouse = (house) => {
  confirmDeleteText.value = t('confirmDeleteHouse', { house: house.number })
  deleteCallback.value = async () => {
    try {
      await housesStore.deleteHouse(house.id)
      $q.notify({
        color: 'positive',
        textColor: 'white',
        icon: 'check_circle',
        message: t('houseDeleted'),
      })
    } catch (error) {
      $q.notify({
        color: 'negative',
        textColor: 'white',
        icon: 'error',
        message: t('errorDeletingHouse'),
      })
      console.error('Error deleting house:', error)
    }
  }
  confirmDeleteDialog.value = true
}

// Edited sensor state
const showEditSensorDialog = ref(false)
const editedSensor = ref({
  id: '',
  type: '',
  location: '',
})

const editSensor = (sensor) => {
  // Populate the edited sensor state with only the fields we allow editing
  editedSensor.value = {
    id: sensor.id,
    type: sensor.type,
    location: sensor.location,
  }

  // Open the edit sensor dialog
  showEditSensorDialog.value = true
}

const saveSensor = async () => {
  try {
    // Update only the sensor location
    await housesStore.updateSensor(editedSensor.value.id, {
      location: editedSensor.value.location,
    })

    // Show success notification
    $q.notify({
      color: 'positive',
      textColor: 'white',
      icon: 'check_circle',
      message: t('sensorUpdated'),
    })

    // Close the dialog
    showEditSensorDialog.value = false
  } catch (error) {
    // Show error notification
    $q.notify({
      color: 'negative',
      textColor: 'white',
      icon: 'error',
      message: t('errorUpdatingSensor'),
    })
    console.error('Error updating sensor:', error)
  }
}

const confirmDeleteSensor = (sensor) => {
  confirmDeleteText.value = t('confirmDeleteSensor', {
    sensor: getSensorTypeLabel(sensor.type),
  })
  deleteCallback.value = async () => {
    try {
      await housesStore.deleteSensor(sensor.id)
      await mqttHelper.deleteSensor(sensor.device_id)

      $q.notify({
        color: 'positive',
        textColor: 'white',
        icon: 'check_circle',
        message: t('sensorDeleted'),
      })
    } catch (error) {
      $q.notify({
        color: 'negative',
        textColor: 'white',
        icon: 'error',
        message: t('errorDeletingSensor'),
      })
      console.error('Error deleting sensor:', error)
    }
  }
  confirmDeleteDialog.value = true
}

const deleteConfirmed = () => {
  if (deleteCallback.value) {
    deleteCallback.value()
    deleteCallback.value = null
  }
}

const saveHouse = async () => {
  try {
    if (isEditing.value) {
      // Update existing house
      await housesStore.updateHouse(editedHouse.value.id, {
        number: editedHouse.value.number,
        resident: editedHouse.value.resident,
        client_id: editedHouse.value.clientId,
        installation_date: new Date(editedHouse.value.installationDate),
      })

      $q.notify({
        color: 'positive',
        textColor: 'white',
        icon: 'check_circle',
        message: t('houseUpdated'),
      })
    } else {
      // Add new house
      await housesStore.createHouse({
        number: editedHouse.value.number,
        resident: editedHouse.value.resident,
        client_id: editedHouse.value.clientId,
        installation_date: new Date(editedHouse.value.installationDate),
        last_update: new Date(),
      })

      $q.notify({
        color: 'positive',
        textColor: 'white',
        icon: 'check_circle',
        message: t('houseAdded'),
      })
    }

    showAddHouseDialog.value = false
    resetHouseForm()
    await housesStore.fetchAllHouses()
  } catch (error) {
    $q.notify({
      color: 'negative',
      textColor: 'white',
      icon: 'error',
      message: isEditing.value ? t('errorUpdatingHouse') : t('errorAddingHouse'),
    })
    console.error('Error saving house:', error)
  }
}

const showAddHouseForm = () => {
  resetHouseForm()
  showAddHouseDialog.value = true
}

const resetHouseForm = () => {
  // Set default installation date to today
  const today = formatDateForInput(new Date())

  editedHouse.value = {
    number: '',
    resident: '',
    installationDate: today,
    clientId: '',
  }
  isEditing.value = false
}

// Sensor wizard dialog
const showAddSensorDialog = ref(false)
const sensorWizardStep = ref(1)
const pairing = ref(false)
const pairingTimeRemaining = ref(60)
const pairingInterval = ref(null)

const newSensor = ref({
  location: null,
  type: null,
})

const showAddSensorWizard = () => {
  if (!selectedHouse.value) {
    $q.notify({
      color: 'negative',
      textColor: 'white',
      icon: 'error',
      message: t('selectHouseFirst'),
    })
    return
  }

  showAddSensorDialog.value = true
  sensorWizardStep.value = 1
  newSensor.value = { location: null, type: null }
}

const cancelPairing = () => {
  clearInterval(pairingInterval.value)
  pairing.value = false
  sensorDiscoveryActive.value = false
  discoveredSensors.value = []
  showAddSensorDialog.value = false

  // הסרת listeners
  try {
    mqttHelper.removeMessageListener('*', handleSensorDiscoveryMessage)
  } catch (error) {
    console.error('Error removing MQTT listeners:', error)
  }

  $q.notify({
    color: 'info',
    textColor: 'white',
    icon: 'cancel',
    message: t('sensorPairingCancelled'),
    timeout: 2000,
  })
}

// Add missing functions
const finishAddSensor = async () => {
  try {
    // קבלת החיישן הראשון שנמצא
    const discoveredSensor =
      discoveredSensors.value.find((s) => s.isNewlyPaired) || discoveredSensors.value[0]

    if (!discoveredSensor) {
      throw new Error('No sensor found to add')
    }

    console.log('Adding sensor:', discoveredSensor)

    // שלב 1: שינוי שם החיישן במערכת Zigbee
    const locationName = newSensor.value.location
    //.toLowerCase()
    //.replace(/\s+/g, '_')
    //.replace(/[^a-z0-9_]/g, '')

    $q.notify({
      color: 'info',
      textColor: 'white',
      icon: 'settings',
      message: t('configuringSensor'),
      timeout: 2000,
    })

    try {
      await mqttHelper.setSensorName(discoveredSensor.id, locationName)
      console.log('Sensor name changed successfully')
    } catch (nameChangeError) {
      console.warn('Failed to change sensor name, continuing anyway:', nameChangeError)
    }

    // שלב 2: מציאת type_id ו-location_id
    let typeId = null
    let locationId = null

    // חיפוש type_id
    const sensorType = sensorTypes.value.find((type) => type.name === newSensor.value.type)
    if (sensorType) {
      typeId = sensorType.id
    } else {
      console.warn('Sensor type not found:', newSensor.value.type)
    }

    // חיפוש location_id
    const sensorLocation = sensorLocations.value.find(
      (loc) => loc.name === newSensor.value.location,
    )
    if (sensorLocation) {
      locationId = sensorLocation.id
    } else {
      console.warn('Sensor location not found:', newSensor.value.location)
    }

    // שלב 3: הכנת נתוני החיישן להוספה (עם device_id)
    const newSensorData = {
      house_id: selectedHouse.value.id,
      type_id: typeId,
      location_id: locationId,
      status: 'active',
      signal_strength: discoveredSensor.linkQuality || 100,
      battery: 100, // ברירת מחדל לחיישן חדש
      temperature: discoveredSensor.data?.Temperature || null,
      humidity: discoveredSensor.data?.Humidity || null,
      // נתוני המכשיר - עכשיו עם device_id
      device_id: discoveredSensor.id,
      device_name: locationName,
      model_id: discoveredSensor.model,
      manufacturer: discoveredSensor.manufacturer,
      endpoint: discoveredSensor.endpoint,
    }

    console.log('Sensor data to add:', newSensorData)

    // שלב 4: הוספת החיישן למסד הנתונים
    console.log(newSensorData)
    await housesStore.createSensor(selectedHouse.value.id, newSensorData)

    // שלב 5: הרשמה להודעות מהחיישן החדש
    try {
      await mqttHelper.subscribeToSensorData(discoveredSensor.id.replace('0x', ''))
      console.log('Subscribed to new sensor data')
    } catch (subscribeError) {
      console.warn('Failed to subscribe to sensor data:', subscribeError)
    }

    // שלב 6: ניקוי listeners והפסקת מצב גילוי
    try {
      mqttHelper.removeMessageListener('*', handleSensorDiscoveryMessage)
    } catch (error) {
      console.error('Error removing MQTT listeners:', error)
    }

    // איפוס משתנים
    sensorDiscoveryActive.value = false
    discoveredSensors.value = []

    $q.notify({
      color: 'positive',
      textColor: 'white',
      icon: 'check_circle',
      message: t('sensorAddedSuccessfully'),
      timeout: 3000,
    })

    showAddSensorDialog.value = false
  } catch (error) {
    console.error('Error adding sensor:', error)
    $q.notify({
      color: 'negative',
      textColor: 'white',
      icon: 'error',
      message: t('errorAddingSensor') + ': ' + error.message,
      timeout: 5000,
    })
  }
}

const checkMQTTConnection = async () => {
  try {
    if (!mqttHelper.isConnected()) {
      await mqttHelper.connect()
      mqttConnected.value = true
      mqttConnectionError.value = null
    }
    return true
  } catch (error) {
    mqttConnected.value = false
    mqttConnectionError.value = error.message
    console.error('MQTT connection failed:', error)
    return false
  }
}

const continueWithSensor = () => {
  sensorWizardStep.value = 3
  pairing.value = false
  sensorDiscoveryActive.value = false
  clearInterval(pairingInterval.value)

  $q.notify({
    color: 'positive',
    textColor: 'white',
    icon: 'check',
    message: t('sensorSelected'),
    timeout: 2000,
  })
}

const handlePermanentSensorUpdates = (message, topic) => {
  try {
    // רק אם זה לא במצב גילוי חיישנים
    if (sensorDiscoveryActive.value) return

    // בדיקה אם זה הודעת חיישן
    if (topic.includes('SENSOR')) {
      console.log('Permanent sensor update received:', { topic, message })

      let parsedMessage
      try {
        parsedMessage = JSON.parse(message)
      } catch {
        return
      }

      if (parsedMessage.ZbReceived) {
        for (const [deviceName, sensorData] of Object.entries(parsedMessage.ZbReceived)) {
          if (sensorData.Device) {
            updateSensorData(sensorData.Device, deviceName, sensorData)
          }
        }
      }
    }
  } catch (error) {
    console.error('Error in permanent sensor update handler:', error)
  }
}

const resetWizard = () => {
  // Reset the wizard to step 1
  sensorWizardStep.value = 1
  newSensor.value = { location: null, type: null }
  pairing.value = false
  clearInterval(pairingInterval.value)
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
      message: t('errorLoadingSensorTypes'),
    })
  }
}

// Add onMounted hook to load initial data
onMounted(async () => {
  try {
    await housesStore.fetchAllHouses()
    await loadSensorTypes()
    await loadSensorLocations()

    // התחברות ראשונית ל-MQTT
    try {
      await checkMQTTConnection()
      console.log('MQTT connection established on page load')

      // הרשמה להודעות מכל החיישנים הקיימים
      try {
        await mqttHelper.subscribeToAllSensorMessages()

        // הוספת listener קבוע לעדכוני נתונים מחיישנים
        mqttHelper.addMessageListener('*', handlePermanentSensorUpdates)

        console.log('Subscribed to all sensor updates')
      } catch (subscribeError) {
        console.warn('Failed to subscribe to sensor updates:', subscribeError)
      }
    } catch (error) {
      console.warn('Failed to connect to MQTT on page load:', error)
      // לא נכשל את טעינת הדף אם MQTT לא זמין
    }
  } catch (error) {
    console.error('Error loading initial data:', error)
    $q.notify({
      color: 'negative',
      textColor: 'white',
      icon: 'error',
      message: t('errorLoadingData'),
      timeout: 5000,
    })
  }
})
</script>
