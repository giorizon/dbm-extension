<script setup>
import { insertScoreboardData, fetchScoreboardOptions } from '@/composables/scoreboard'
import ScoreboardFormDialog from './ScoreboardFormDialog.vue'
import { requiredValidator } from '@/utils/validators'
import { formActionDefault } from '@/utils/supabase'
import SuccessDialog from './SuccessDialog.vue'
import { ref, computed, onMounted } from 'vue'

const formDataDefault = {
  particulars: {
    pap: '',
    ts: '',
    agencyName: '',
    natureOfRequest: ''
  },
  dmsReferenceNumber: '',
  dateReceivedRecordSection: new Date(Date.now()),
  timeReceivedRecordSection: '',
  typeOfTransaction: '',
  reportsData: [],
  status: '',
  remarks: '',
  outputReleasedDocuments: '',
  cssSubmissionDate: ''
}
const timeMenu = ref()
const isSuccess = ref(false)
const formAction = ref({ ...formActionDefault })
const formData = ref({
  ...formDataDefault
})
const typesOfTransaction = ref([])
const options = ref({})
const refVForm = ref()

//computes the prescribed period values for each report type
const prescribedPeriodValues = computed(() => {
  //iterate each reports and create prescribed value for each reports based on the selected type of transaction
  if (
    Array.isArray(typesOfTransaction.value) &&
    formData.value.typeOfTransaction?.length !== 0 &&
    formData.value.typeOfTransaction !== null
  ) {
    const prescribedPeriodsResult = typesOfTransaction.value.find(
      (transaction) => transaction.transaction_type === formData.value.typeOfTransaction
    ).prescribed_periods
    return prescribedPeriodsResult
  }
  return []
})
const handleDialogFormSubmit = (formDialogData) => {
  console.log(formDialogData)
  //update if already exists
  const reportsData = formData.value.reportsData.filter(
    (reportData) => reportData.report.report_id !== formDialogData.report.report_id
  )
  formData.value.reportsData = [...reportsData, formDialogData]
}
const handleFormSubmit = async () => {
  formAction.value.formProcess = true
  console.log(formData.value)
  //i have to manually unwraped the proxied nested objects in these ref (will ask for suggestions)
  const { error } = await insertScoreboardData({
    ...formData.value,
    particulars: { ...formData.value.particulars },
    reportsData: [...formData.value.reportsData]
  })
  if (error) {
    console.error('Error inserting data into scoreboard')
    formAction.value.formErrorMessage = error
  }

  formAction.value.formProcess = false
  isSuccess.value = true
  refVForm.value?.reset()
  console.log(formData.value.typeOfTransaction)
}
onMounted(async () => {
  console.log('component mounted')
  const [natureOfRequestData, tsInChargeData, papData, typeOfTransactionData, statuses] =
    await fetchScoreboardOptions()
  options.value = {
    natureOfRequest: natureOfRequestData,
    tsInCharge: tsInChargeData,
    pap: papData,
    statuses: statuses
  }
  typesOfTransaction.value = typeOfTransactionData
})
</script>

<template>
  <v-card>
    <v-card-text>
      <v-form ref="refVForm" @submit.prevent="handleFormSubmit">
        <v-row>
          <v-col>
            <v-select
              label="Choose P/A/P"
              :items="options.pap"
              item-title="code"
              item-value="id"
              :rules="[requiredValidator]"
              outlined
              v-model="formData.particulars.pap"
            >
            </v-select>
          </v-col>
          <v-col>
            <v-select
              label="Choose TS in Charge"
              :items="options.tsInCharge"
              item-title="name"
              item-value="tic_id"
              :rules="[requiredValidator]"
              outlined
              v-model="formData.particulars.ts"
            >
            </v-select>
          </v-col>
        </v-row>
        <v-row>
          <v-col>
            <v-text-field
              :rules="[requiredValidator]"
              label="Agency Name"
              v-model="formData.particulars.agency"
              outlined
              clearable
            >
            </v-text-field>
          </v-col>
          <v-col>
            <v-select
              label="Choose Nature of Transaction"
              :items="options.natureOfRequest"
              :rules="[requiredValidator]"
              outlined
              v-model="formData.particulars.natureOfRequest"
            >
            </v-select>
          </v-col>
        </v-row>
        <v-row>
          <v-col>
            <v-text-field
              :rule="requiredValidator"
              label="DMS Reference Number"
              v-model="formData.dmsReferenceNumber"
              outlined
              clearable
            >
            </v-text-field>
          </v-col>
        </v-row>
        <v-row>
          <v-col>
            <v-date-input
              label="Date and Time received by The Records Section"
              prepend-inner-icon="$calendar"
              prepend-icon=""
              v-model="formData.dateReceivedRecordSection"
              :rules="[requiredValidator]"
            ></v-date-input>
          </v-col>
          <v-col>
            <v-text-field
              v-model="formData.timeReceivedRecordSection"
              label="Pick Time"
              :active="timeMenu"
              prepend-inner-icon="mdi-clock-time-four-outline"
              readonly
            >
              <v-menu
                v-model="timeMenu"
                :close-on-content-click="false"
                activator="parent"
                transition="scale-transition"
              >
                <v-time-picker
                  v-if="timeMenu"
                  v-model="formData.timeReceivedRecordSection"
                  format="24hr"
                >
                </v-time-picker>
              </v-menu>
            </v-text-field>
          </v-col>
        </v-row>
        <v-row>
          <v-col>
            <v-select
              :items="typesOfTransaction"
              item-title="transaction_type"
              item-value="transaction_type"
              v-model="formData.typeOfTransaction"
              outlined
              label="Choose Type of Transaction"
            ></v-select>
          </v-col>
        </v-row>
        <v-row v-if="prescribedPeriodValues.length !== 0">
          <!-- eslint-disable vue/valid-v-for -->
          <!-- eslint-disable-next-line vue/no-unused-vars -->
          <v-col v-for="(value, _) in prescribedPeriodValues">
            <ScoreboardFormDialog
              @form-submitted="handleDialogFormSubmit"
              :key="value.prescribed_periods_id"
              :report="value.report"
              :prescribedPeriod="{
                prescribed_period_value: value.prescribed_period_value,
                prescribed_period_id: value.prescribed_periods_id
              }"
            />
          </v-col>
        </v-row>
        <v-row>
          <v-col>
            <v-text-field label="Remarks" v-model="formData.remarks"> </v-text-field>
          </v-col>
          <v-col>
            <v-select
              v-model="formData.status"
              :items="options.statuses"
              item-title="status_name"
              item-value="id"
              label="Status"
              outlined
            ></v-select>
          </v-col>
        </v-row>
        <v-row>
          <v-col>
            <v-text-field
              label="Output/Released Documents"
              v-model="formData.outputReleasedDocuments"
            >
            </v-text-field>
          </v-col>
          <v-col>
            <v-text-field label="CSS Submission Date" v-model="formData.cssSubmissionDate">
            </v-text-field>
          </v-col>
        </v-row>

        <v-row dense>
          <v-spacer></v-spacer>
          <v-btn
            text="Submit Form"
            type="submit"
            color="red-darken-4"
            :loading="formAction.formProcess"
            :disabled="formAction.formProcess"
          >
          </v-btn>
        </v-row>
      </v-form>
      <SuccessDialog
        @close-dialog="
          () => {
            isSuccess = false
          }
        "
        :isActive="isSuccess"
      />
    </v-card-text>
  </v-card>
</template>
