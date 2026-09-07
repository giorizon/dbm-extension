<script setup>
import { ref, defineProps, onMounted, watch } from 'vue' // Combined imports
import { format } from 'date-fns'
import { useRouter } from 'vue-router'
import supabase from './supabase'
import { useScoreboardLogic } from './scoreboardLogic.js'
import ScoreboardFormDialog from './ScoreboardFormDialog.vue'
import SuccessDialog from './SuccessDialog.vue'
import SuccessEndProcessDialog from './Dialog/SuccessEndProcess.vue'
import ErrorDialog from './ErrorDialog.vue'
import '@/assets/scoreboard.css'

const router = useRouter()

// UI Dialog & Error Controls
const validationError = ref("")
const isSuccess = ref(false)
const isSuccessEnd = ref(false)
const formErrorMessage = ref("")
const downtimeChecker = ref(false)
const selectedTimeForwarded = ref(format(new Date(), 'HH:mm'))
const timeDialogForwarded = ref(false)
const showEndConfirmDialog = ref(false)
const showReleaseDialog = ref(false)
const showEndProcessDialog = ref(false)
const showErrorDialog = ref(false)
const errorDialogTitle = ref("")
const errorDialogMessage = ref("")

// Data Storage Refs
const downtimeValue = ref(null)
const typeDowntime = ref(null)
const remark = ref(null)
const userUUID = ref(null)
const processOwners = ref([])
const fadSubUnits = ref([])
const type_of_downtime = ref([])
const releasing_id = ref(null)

const props = defineProps({
  dmsReferenceNumber: String,
  dateReceived: String,
  report: String,
  subunit: String,
  scoreboardId: String,
  processId: String,
  agencyName: String // ✅ Added missing prop
})

const {
  formData,
  formAction,
  refVForm,
  prescribedPeriodValues,
  insertReleasingFad,
  requiredValidator
} = useScoreboardLogic()

// ✅ Critical Fix: Standardized .value notation across initial mapping
formData.value.dateReceivedRecordSection = format(new Date(), 'yyyy-MM-dd')
formData.value.dmsReferenceNumber = props.dmsReferenceNumber
formData.value.dateReceived = props.dateReceived
formData.value.agencyName = props.agencyName
formData.value.scoreboardId = props.scoreboardId
formData.value.processId = props.processId

const showError = (title, message) => {
  errorDialogTitle.value = title
  errorDialogMessage.value = message
  showErrorDialog.value = true
}

// 🛠️ Optimization: Shared Helper to generate and validate timestamps (DRY)
const getFormattedTimestamp = () => {
  if (!formData.value.dateForwarded) {
    showError("Date Forwarded is empty", "Please select a valid date before continuing.")
    return null
  }

  const datePart = format(new Date(formData.value.dateForwarded), 'yyyy-MM-dd')
  const timePart = selectedTimeForwarded.value
  const combinedDate = new Date(`${datePart}T${timePart}:00Z`)

  if (isNaN(combinedDate.getTime())) {
    formErrorMessage.value = "Invalid date or time format."
    return null
  }
  return combinedDate.toISOString()
}

// System Fetches
const fetchLoggedInUser = async () => {
  const { data, error } = await supabase.auth.getUser()
  if (!error) userUUID.value = data?.user?.id
}

const fetchTypeOfDowntime = async () => {
  try {
    const { data, error } = await supabase.from('type_of_downtime').select('id, name')
    if (!error) {
      type_of_downtime.value = data.map(item => ({ title: item.name, value: item.id }))
    }
  } catch (err) {
    console.error('Unexpected error fetching Type of downtime:', err)
  }
}

const fetchReleasingId = async () => {
  const { data, error } = await supabase
    .from('user_profile_role')
    .select('user_id')
    .eq('user_role', 'Releasing Data')
    .maybeSingle()
  if (!error) releasing_id.value = data?.user_id
}

const fetchFADSubUnits = async () => {
  const { data, error } = await supabase.from('fad_sub_units').select('id, name')
  if (!error) fadSubUnits.value = data.map(item => ({ id: item.id, name: item.name }))
}

const fetchProcessOwners = async () => {
  const subunitID = formData.value.particulars.agencyID
  if (!subunitID) return
  
  const { data, error } = await supabase
    .from('view_fad_process_owner')
    .select('*')
    .eq('sub_unit_id', subunitID)

  if (!error && data) {
    processOwners.value = data.map(user => ({
      id: user.id,
      name: `${user.pos} - ${user.firstname} ${user.lastname}`.trim()
    }))
  }
}

// Form Submission & Document Lifecycle Actions
const handleFormSubmit = async () => {
  const timestamp = getFormattedTimestamp()
  if (!timestamp) return

  try {
    const cleanProcessId = props.processId && typeof props.processId === 'object'
      ? (props.processId.id ?? props.processId.value)
      : props.processId;

    const cleanDowntimeId = typeDowntime.value && typeof typeDowntime.value === 'object'
      ? (typeDowntime.value.value ?? typeDowntime.value.id)
      : typeDowntime.value;

    const cleanScoreboardId = formData.value.scoreboardId && typeof formData.value.scoreboardId === 'object'
      ? formData.value.scoreboardId.id
      : formData.value.scoreboardId;

    const cleanSubUnitId = formData.value.particulars.agencyID && typeof formData.value.particulars.agencyID === 'object'
      ? formData.value.particulars.agencyID.id
      : formData.value.particulars.agencyID;

    const cleanOwnerId = formData.value.particulars.staffID && typeof formData.value.particulars.staffID === 'object'
      ? formData.value.particulars.staffID.id
      : formData.value.particulars.staffID;


    // 1. Update the current active process stage
    await supabase
      .from('scoreboard_fad_process')
      .update({ date_forwarded: timestamp, status: "Accepted" })
      .eq('id', cleanProcessId)
      .throwOnError()

    // 2. Conditional Downtime log
    if (downtimeChecker.value) {
      await supabase
        .from('fad_downtime')
        .insert([{
          downtime_id: cleanDowntimeId,
          downtime: downtimeValue.value,
          process_id: cleanProcessId,
          remark: remark.value
        }])
        .throwOnError()
    }

    // 3. Chain/Route the process forward to the next stage
    await supabase
      .from('scoreboard_fad_process')
      .insert([{
        scoreboard_id: cleanScoreboardId ?? null,
        status: 'Pending',
        date_forwarded: null,
        date_received: timestamp,
        owner_id: cleanOwnerId ?? null,
        sub_unit_id: cleanSubUnitId ?? null,
        from_id: userUUID.value,
        remark: formData.value.remark ?? null
      }])
      .throwOnError()

        isSuccess.value = true
  } catch (err) {
    console.error("❌ Form Submission Failed:", err)
    validationError.value = err.message || "Failed to submit the form."
  }
}

const confirmEndProcess = async () => {
  alert(formData.value.processId);
  const timestamp = getFormattedTimestamp()
  if (!timestamp) return

  try {
    await supabase
      .from('scoreboard_fad_process')
      .update({ end_date: timestamp, status: "Process End" })
      .eq('id', formData.value.processId) // ✅ Removed broken .value layout
      .throwOnError()

    isSuccessEnd.value=true  
  } catch (err) {
    formErrorMessage.value = err.message || "Failed to end process."
  }
}

const handleRelease = async () => {
  showReleaseDialog.value = false
  const timestamp = getFormattedTimestamp()
  if (!timestamp) return

  try {
    await supabase
      .from('scoreboard_fad_process')
      .update({ date_forwarded: timestamp, status: "Pending in Releasing" })
      .eq('id', props.processId) // ✅ Fixed
      .throwOnError()

    if (downtimeChecker.value) {
      await supabase
        .from('fad_downtime')
        .insert([{
          downtime_id: typeDowntime.value,
          downtime: downtimeValue.value,
          process_id: props.processId,
          remark: remark.value || null
        }])
        .throwOnError()
    }

    await insertReleasingFad({ formData, dateForwarded: timestamp, userUUID, typeId: 1 })
    isSuccess.value = true
  } catch (err) {
    formErrorMessage.value = err.message || "An unknown error occurred during release."
  }
}

const handleEndProcess = () => {
  if (getFormattedTimestamp()) showEndConfirmDialog.value = true
}

const releaseWarning = () => {
  if (getFormattedTimestamp()) showReleaseDialog.value = true
}
const handleDialogClose = (isOpen) => {
  // When isOpen becomes false (the user dismissed the dialog)
  if (!isOpen) {
    routePage()
  }
}

const routePage = () => {
  router.push('/dashboard')
}
// Reactive Observers
watch(() => formData.value.particulars.agencyID, fetchProcessOwners)

onMounted(() => {
  fetchTypeOfDowntime()
  fetchReleasingId()
  fetchLoggedInUser()
  fetchFADSubUnits()
  selectedTimeForwarded.value = format(new Date(), 'HH:mm')
})
</script>

<template>
  <v-card>
    <v-card-text>
      <v-form ref="refVForm" @submit.prevent="handleFormSubmit">
        <v-row>
          <v-col>
            <p class="ms-4 text-wrap">
              DMS Reference Number: <b style="padding-left: 10px;">{{ dmsReferenceNumber }}</b>
            </p>
            <p class="ms-4 text-wrap">
              Date Received: <b style="padding-left: 10px;">{{ dateReceived }}</b>
            </p>
            <p class="ms-4 text-wrap">
              Report: <b style="padding-left: 10px;">{{ report }}</b>
            </p>
            <p class="ms-4 text-wrap">
              Sub Unit: <b style="padding-left: 10px;">{{ subunit }}</b>
            </p>
          </v-col>
        </v-row>
        <v-row>
          <v-col>
            <v-checkbox
              v-model="downtimeChecker"
              label="Check for Downtime"
              color="primary"
            ></v-checkbox>
            <span v-if="downtimeChecker">
              <b style = "color: red">Submit with Downtime</b>
            </span>
          </v-col>
        </v-row>
          <transition name="slide-fade">
          <v-row v-if="downtimeChecker">
            <v-col>
              <v-text-field
                v-model="downtimeValue"
                label="Downtime"
                type="number"
              ></v-text-field>
            </v-col>
            <v-col>
              <v-select 
                label="Type of Downtime" 
                :items="type_of_downtime" 
                item-title="title" 
                item-value="value"
                :rules="[requiredValidator]" 
                outlined 
                v-model="typeDowntime"
              ></v-select>
            </v-col>
             <v-col>
              <v-text-field
                v-model="remark"
                label="Downtime Remark"
                type="text"
              ></v-text-field>
            </v-col>
          </v-row>
          </transition>

        <v-row>
          <v-col cols="5">
             <v-date-input 
               label="Date Forwarded"
               v-model="formData.dateForwarded" 
               :rules="[requiredValidator]"
             ></v-date-input>
          </v-col>
          <v-col cols="5">
            <!-- Clickable Time Input -->
            <v-text-field
              v-model="selectedTimeForwarded"
              label="Time Forwarded"
              prepend-inner-icon="mdi-clock"
              readonly
              @click="timeDialogForwarded = true"
            ></v-text-field>
          </v-col>
        </v-row>
        <v-row>
            <v-col>
               <v-select
              label="FAD Sub Units"
              :items="fadSubUnits" 
              item-title="name"      
              item-value="id" 
              :rules="[requiredValidator]"
              outlined
              v-model="formData.particulars.agencyID"   
            />
          </v-col>
           <v-col>
            <v-select
              label="Process Owner"
              :items="processOwners.length ? processOwners : [{ id: null, name: 'No available owners' }]"
              item-title="name"
              item-value="id"
              :rules="[requiredValidator]"
              outlined
              v-model="formData.particulars.staffID"
            />
          </v-col>
        </v-row>
        <v-row>
            <v-col>
            <v-text-field
              label="DMS Remark"
              v-model="formData.remark"
              type= "text"
              outlined
              clearable
            />
          </v-col>
        </v-row>
        <!-- Time Picker Dialog for Date Forwarded -->
        <v-dialog v-model="timeDialogForwarded" max-width="400">
        <v-card>
          <v-card-title class="text-center">Select Time</v-card-title>
          <v-card-text>
            <v-time-picker 
              v-model="selectedTimeForwarded"
              format="ampm" 
              ampm-in-title 
              @update:model-value="timeDialogForwarded = false"
            ></v-time-picker>
          </v-card-text>
          <v-card-actions class="justify-center">
            <v-btn text="Close" @click="timeDialogForwarded = false"></v-btn>
          </v-card-actions>
          
        </v-card>
      </v-dialog>
      
        <v-row v-if="prescribedPeriodValues.length !== 0">
          <v-col v-for="(value, ) in prescribedPeriodValues" :key="value.prescribed_periods_id">
            <ScoreboardFormDialog 
              @form-submitted="handleDialogFormSubmit"
              :report="value.report"
              :prescribedPeriod="{
                prescribed_period_value: value.prescribed_period_value,
                prescribed_period_id: value.prescribed_periods_id
              }" 
            />
          </v-col>
          
        </v-row>
        <v-row dense>
          <v-spacer></v-spacer>
          <v-alert v-if="validationError" type="error" class="mb-3">
            {{ validationError }}
          </v-alert>
          <v-col>
            <v-btn 
              type="submit" 
              color="green-darken-4"
            >
              Submit Form
            </v-btn>
          </v-col>
          <v-col>
          <v-btn 
            color="blue-darken-4"
            @click="handleEndProcess"
          >
            End Process
          </v-btn>
        </v-col>

        <v-col>
          <v-btn 
            color="red-darken-4"
            @click="releaseWarning"
          >
            Release
          </v-btn>
        </v-col>
        </v-row>
      </v-form>
    <SuccessDialog 
      v-model="isSuccess" 
      @update:model-value="handleDialogClose" 
    />
    
    <SuccessEndProcessDialog 
      v-model="isSuccessEnd" 
      @update:model-value="handleDialogClose" 
    />
    <!-- <SuccessDialog
            :isActive="showEndProcessDialog"
            @close-dialog="routePage"
          />  -->  
      <v-dialog v-model="showEndConfirmDialog" max-width="500">
        <v-card>
          <v-card-title class="text-h6">
            Confirm End Process
          </v-card-title>
          <v-card-text>
            Are you sure you want to end this process? This action cannot be undone.
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="grey" @click="showEndConfirmDialog = false">Cancel</v-btn>
            <v-btn color="blue-darken-4" @click="confirmEndProcess">Confirm</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
      <v-dialog v-model="showReleaseDialog" max-width="500">
        <v-card>
          <v-card-title class="text-h6">
            Confirm Release DMS
          </v-card-title>
          <v-card-text>
            Are you sure you want to release the process? This action cannot be undone.
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="grey" @click="showReleaseDialog = false">Cancel</v-btn>
            <v-btn color="blue-darken-4" @click="handleRelease">Confirm</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
      <v-dialog v-model="showErrorDialog" max-width="420" transition="dialog-bottom-transition">
        <v-card class="rounded-xl elevation-4">
          <v-card-title class="flex items-center gap-2 text-red-600 text-lg font-bold">
            <v-icon color="red" size="28">mdi-alert-circle</v-icon>
            {{ errorDialogTitle || "Error" }}
          </v-card-title>
          <v-divider></v-divider>
          <v-card-text class="text-base py-4">
            {{ errorDialogMessage || "Something went wrong. Please try again." }}
          </v-card-text>
          <v-card-actions class="justify-end">
            <v-btn 
             class="mr-5 my-2" text="Close" variant="plain" prepend-icon="mdi-close"
              @click="showErrorDialog = false"
            >
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
      <ErrorDialog 
        :isOpen="formAction.formErrorMessage.length !== 0"
        :errorMessage="formAction.formErrorMessage"
        @on-close="formAction.formErrorMessage = ''"
      />
    </v-card-text>
  </v-card>
</template>