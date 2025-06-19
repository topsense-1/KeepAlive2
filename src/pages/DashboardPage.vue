<!-- src/pages/DashboardPage.vue -->
<template>
  <q-page padding>
    <div v-if="loading" class="row justify-center items-center" style="height: 400px">
      <q-spinner color="primary" size="3em" />
      <div class="q-ml-md text-h6">{{ $t('loading') }}</div>
    </div>

    <div v-else class="row q-col-gutter-md">
      <!-- Summary Cards -->
      <div class="col-12 col-md-4">
        <q-card flat bordered class="bg-blue-1">
          <q-card-section class="text-center">
            <div class="text-overline">{{ $t('total') }}</div>
            <div class="text-h3 text-blue-9">{{ stats.total }}</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-md-4">
        <q-card flat bordered class="bg-orange-1">
          <q-card-section class="text-center">
            <div class="text-overline">{{ $t('needAttention') }}</div>
            <div class="text-h3 text-orange">{{ stats.needAttention }}</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-md-4">
        <q-card flat bordered class="bg-green-1">
          <q-card-section class="text-center">
            <div class="text-overline">{{ $t('actives') }}</div>
            <div class="text-h3 text-green">{{ stats.active }}</div>
          </q-card-section>
        </q-card>
      </div>

      <!-- House Grid -->
      <div class="col-12">
        <div class="text-h6 q-mb-md">{{ $t('houses') }}</div>
        <div class="row q-col-gutter-md houses-grid">
          <div v-for="house in houses" :key="house.id" class="col-6 col-sm-4 col-md-3 col-lg-2">
            <q-card
              class="house-card cursor-pointer"
              :class="{ 'house-card-alert': house.alerts !== undefined && house.alerts > 0 }"
              @click="showHouseDetails(house)"
            >
              <q-card-section class="text-center">
                <q-icon
                  name="home"
                  size="4rem"
                  :color="house.alerts !== undefined && house.alerts > 0 ? 'negative' : 'primary'"
                />
                <div class="text-h6 q-mt-sm">{{ house.number }}</div>
                <q-badge
                  v-if="house.total_sensors !== undefined && house.total_sensors > 0"
                  color="negative"
                  floating
                >
                  {{ house.total_sensors }}
                </q-badge>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </div>

      <!-- Events Table -->
      <div class="col-12 q-mt-md">
        <div class="text-h6 q-mb-md">{{ $t('recentEvents') }}</div>
        <q-table
          :rows="events"
          :columns="eventColumns"
          row-key="id"
          :pagination="{ rowsPerPage: 5 }"
        >
          <template v-slot:body="props">
            <q-tr :props="props">
              <q-td key="icon" :props="props">
                <q-icon
                  :name="getEventIcon(props.row.type)"
                  :color="getEventColor(props.row.priority)"
                  size="sm"
                />
              </q-td>
              <q-td key="house" :props="props">{{ props.row.house.number }}</q-td>
              <q-td key="datetime" :props="props">{{ formatDate(props.row.datetime) }}</q-td>
              <q-td key="description" :props="props">{{ props.row.description }}</q-td>
              <q-td key="priority" :props="props">
                <q-badge :color="getEventColor(props.row.priority)">
                  {{ props.row.priority }}
                </q-badge>
              </q-td>
            </q-tr>
          </template>
        </q-table>
      </div>

      <!-- Charts Section -->
      <div class="col-12 col-md-8 q-mt-md">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-h6">{{ $t('eventsOverTime') }}</div>
          </q-card-section>
          <q-card-section>
            <!-- Line chart would go here - using canvas for placeholder -->
            <div class="chart-container" style="position: relative; height: 250px">
              <canvas id="eventsChart"></canvas>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-md-4 q-mt-md">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-h6">{{ $t('eventTypes') }}</div>
          </q-card-section>
          <q-card-section>
            <!-- Pie chart would go here - using canvas for placeholder -->
            <div class="chart-container" style="position: relative; height: 250px">
              <canvas id="eventTypesChart"></canvas>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { eventsApi } from '../services/db2rest'
import { useRouter } from 'vue-router'
import { useHousesStore } from '../stores/houses'

const { t } = useI18n()
const router = useRouter()
const housesStore = useHousesStore()

// Get houses data from store
const houses = computed(() => housesStore.houses)
const events = ref([])
const loading = computed(() => housesStore.loading)

// Get stats from store
const stats = computed(() => ({
  total: housesStore.totalHouses,
  needAttention: housesStore.needAttentionHouses,
  active: housesStore.activeHouses,
}))

const eventColumns = [
  { name: 'icon', label: '', field: 'icon', align: 'center' },
  { name: 'house', label: t('house'), field: 'house', align: 'left', sortable: true },
  { name: 'datetime', label: t('dateTime'), field: 'datetime', align: 'left', sortable: true },
  { name: 'description', label: t('description'), field: 'description', align: 'left' },
  { name: 'priority', label: t('priority'), field: 'priority', align: 'center', sortable: true },
]

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
  if (!date) return ''

  // המרה לאובייקט Date - יעבוד על string, timestamp, או אובייקט Date קיים
  const d = new Date(date)

  // בדיקה שההמרה הצליחה והתאריך תקין
  if (isNaN(d.getTime())) {
    console.warn('Invalid date input:', date)
    return date // להחזיר את הקלט המקורי אם לא ניתן להמרה
  }

  // פורמט התאריך הרצוי
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')

  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`
}

const showHouseDetails = (house) => {
  router.push({ name: 'houseDetails', params: { id: house.id } })
}

// Chart initialization would go here
onMounted(async () => {
  // Initialize charts with Chart.js
  try {
    // Fetch houses data from store
    await housesStore.fetchAllHouses()
  } catch (error) {
    console.error('Error loading houses:', error)
  }

  try {
    const eventsData = await eventsApi.getAll()
    events.value = eventsData
  } catch (error) {
    console.error('Error loading events:', error)
  }
})
</script>

<style scoped>
.houses-grid {
  max-height: calc(66vh - 150px);
  overflow-y: auto;
}

.house-card {
  height: 150px;
  transition: all 0.2s ease;
}

.house-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.house-card-alert {
  border-left: 3px solid var(--q-negative);
}
</style>
