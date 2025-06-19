<!-- src/pages/SupportPage.vue -->
<template>
  <q-page padding>
    <div class="row q-col-gutter-md">
      <div class="col-12">
        <div class="text-h6 q-mb-md">{{ $t('support') }}</div>
      </div>

      <!-- FAQ Section -->
      <div class="col-12 col-md-6">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-h6">{{ $t('faq') }}</div>
          </q-card-section>

          <q-separator />

          <q-card-section>
            <q-list bordered separator>
              <q-expansion-item
                v-for="(faq, index) in faqs"
                :key="index"
                :label="faq.question"
                header-class="text-primary"
                expand-separator
              >
                <q-card>
                  <q-card-section>
                    <!-- תצוגה מותאמת לפי סוג התשובה -->
                    <template v-if="faq.type === 'simple'">
                      <p>{{ faq.answer }}</p>
                    </template>

                    <template v-else-if="faq.type === 'steps'">
                      <p>{{ faq.intro }}</p>
                      <ol>
                        <li v-for="(step, i) in faq.steps" :key="i">{{ step }}</li>
                      </ol>
                    </template>
                  </q-card-section>
                </q-card>
              </q-expansion-item>
            </q-list>
          </q-card-section>
        </q-card>
      </div>

      <!-- Tutorials Section -->
      <div class="col-12 col-md-6">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-h6">{{ $t('tutorials') }}</div>
          </q-card-section>

          <q-separator />

          <q-card-section>
            <q-list bordered separator>
              <q-item
                v-for="(tutorial, index) in tutorials"
                :key="index"
                clickable
                @click="openTutorial(tutorial)"
              >
                <q-item-section avatar>
                  <q-icon name="videocam" color="primary" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ tutorial.title }}</q-item-label>
                  <q-item-label caption>{{ tutorial.duration }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-btn flat round icon="play_circle" color="primary" />
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>
      </div>

      <!-- Documentation Section -->
      <div class="col-12 col-md-6">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-h6">{{ $t('documentation') }}</div>
          </q-card-section>

          <q-separator />

          <q-card-section>
            <q-list bordered separator>
              <q-item
                v-for="(doc, index) in documentation"
                :key="index"
                clickable
                @click="openDocument(doc)"
              >
                <q-item-section avatar>
                  <q-icon :name="doc.icon" color="primary" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ doc.title }}</q-item-label>
                  <q-item-label caption>{{ doc.description }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-btn flat round icon="arrow_forward" color="primary" />
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>
      </div>

      <!-- Contact Support Section -->
      <div class="col-12 col-md-6">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-h6">{{ $t('contactSupport') }}</div>
          </q-card-section>

          <q-separator />

          <q-card-section>
            <q-form @submit="submitSupportRequest" class="q-gutter-md">
              <q-input
                v-model="supportRequest.subject"
                :label="$t('subject')"
                filled
                :rules="[(val) => !!val || $t('fieldRequired')]"
              />

              <q-select
                v-model="supportRequest.category"
                :options="supportCategories"
                :label="$t('category')"
                filled
                :rules="[(val) => !!val || $t('fieldRequired')]"
              />

              <q-input
                v-model="supportRequest.message"
                :label="$t('message')"
                filled
                type="textarea"
                rows="5"
                :rules="[(val) => !!val || $t('fieldRequired')]"
              />

              <div class="row justify-end q-mt-md">
                <q-btn
                  :label="$t('submitRequest')"
                  type="submit"
                  color="primary"
                  :loading="submitting"
                />
              </div>
            </q-form>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Tutorial Dialog -->
    <q-dialog v-model="showTutorialDialog" full-width>
      <q-card>
        <q-card-section class="row items-center">
          <div class="text-h6">{{ selectedTutorial?.title }}</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-separator />

        <q-card-section>
          <div class="video-container">
            <!-- Placeholder for video -->
            <div class="video-placeholder">
              <q-icon name="videocam" size="5rem" color="primary" />
              <div class="text-subtitle1 q-mt-md">{{ $t('videoPlaceholder') }}</div>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'

const { t } = useI18n()
const $q = useQuasar()

// FAQ data - שינוי לפורמט מובנה ובטוח יותר
const faqs = ref([
  {
    question: t('howToAddSensor'),
    type: 'simple',
    answer: t('howToAddSensorAnswer'),
  },
  {
    question: t('batteryLow'),
    type: 'simple',
    answer: t('batteryLowAnswer'),
  },
  {
    question: t('sensorNotRespondingQuestion'),
    type: 'steps',
    intro: t('sensorNotResponding.intro'),
    steps: [
      t('sensorNotResponding.step1'),
      t('sensorNotResponding.step2'),
      t('sensorNotResponding.step3'),
      t('sensorNotResponding.step4'),
    ],
  },
  {
    question: t('temperatureReadings'),
    type: 'simple',
    answer: t('temperatureReadingsAnswer'),
  },
  {
    question: t('loginIssuesQuestion'),
    type: 'steps',
    intro: t('loginIssues.intro'),
    steps: [
      t('loginIssues.step1'),
      t('loginIssues.step2'),
      t('loginIssues.step3'),
      t('loginIssues.step4'),
      t('loginIssues.step5'),
      t('loginIssues.step6'),
    ],
  },
])

// Tutorials data
const tutorials = ref([
  {
    id: 1,
    title: t('settingUpNewHome'),
    duration: '5:32',
    url: '#',
  },
  {
    id: 2,
    title: t('pairingSensors'),
    duration: '3:47',
    url: '#',
  },
  {
    id: 3,
    title: t('usingDashboard'),
    duration: '4:12',
    url: '#',
  },
  {
    id: 4,
    title: t('managingUsers'),
    duration: '6:05',
    url: '#',
  },
])

// Documentation data
const documentation = ref([
  {
    id: 1,
    title: t('userGuide'),
    description: t('userGuideDesc'),
    icon: 'menu_book',
    url: '#',
  },
  {
    id: 2,
    title: t('sensorManual'),
    description: t('sensorManualDesc'),
    icon: 'sensors',
    url: '#',
  },
  {
    id: 3,
    title: t('adminReference'),
    description: t('adminReferenceDesc'),
    icon: 'settings',
    url: '#',
  },
  {
    id: 4,
    title: t('apiDocs'),
    description: t('apiDocsDesc'),
    icon: 'code',
    url: '#',
  },
])

// Support request form
const supportRequest = ref({
  subject: '',
  category: null,
  message: '',
})

const supportCategories = [
  t('technicalIssue'),
  t('accountHelp'),
  t('billingQuestion'),
  t('featureRequest'),
  t('other'),
]

const submitting = ref(false)

// Tutorial dialog
const showTutorialDialog = ref(false)
const selectedTutorial = ref(null)

const openTutorial = (tutorial) => {
  selectedTutorial.value = tutorial
  showTutorialDialog.value = true
}

const openDocument = (doc) => {
  // In a real app, this would open the document
  // For demo purposes, just show a notification
  $q.notify({
    message: t('openingDocument', { title: doc.title }),
    color: 'info',
  })
}

const submitSupportRequest = () => {
  submitting.value = true

  // Simulate API call
  setTimeout(() => {
    $q.notify({
      message: t('supportRequestSubmitted'),
      color: 'positive',
      icon: 'check_circle',
    })

    // Reset form
    supportRequest.value = {
      subject: '',
      category: null,
      message: '',
    }

    submitting.value = false
  }, 1500)
}
</script>

<style scoped>
.video-container {
  width: 100%;
  height: 300px;
  background: #f0f0f0;
  display: flex;
  justify-content: center;
  align-items: center;
}

.video-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 2rem;
}
</style>
