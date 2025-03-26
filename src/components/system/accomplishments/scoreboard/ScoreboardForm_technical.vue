<script setup>
import { ref, defineProps, onMounted } from 'vue'
import { format } from 'date-fns'
import ScoreboardFormDialog from './ScoreboardFormDialog.vue'
import SuccessDialog from './SuccessDialog.vue'
import ErrorDialog from './ErrorDialog.vue'
import { useScoreboardLogic } from './scoreboardLogic.js'



const validationError = ref("");

const props = defineProps({
  dmsReferenceNumber: String,
  dateReceived: String,
  agencyName: String,
  scoreboardId: String
});

const {
  handleDialogFormSubmit,
  handleFormSubmit,
  formData,
  formAction,
  isSuccess,
  refVForm,
  options,
  prescribedPeriodValues,
  type_of_transaction,
  nature_of_transaction,
  fetchPAP,
  papData,
  requiredValidator
} = useScoreboardLogic();

// Initialize Date Pickers with Current Date
formData.dateReceivedRecordSection = ref(format(new Date(), 'yyyy-MM-dd'))
const dateForwardedValue = ref(format(new Date(), 'yyyy-MM-dd'));

// Initialize Time Pickers with Current Time
//const selectedTimeReceived = ref(format(new Date(), 'hh:mm a'))  // ✅ AM/PM format
//const timeDialogReceived = ref(false)

const selectedTimeForwarded = ref(format(new Date(), 'hh:mm a'))  // ✅ AM/PM format
const timeDialogForwarded = ref(false)

// Pre-fill form fields with received data
formData.dmsReferenceNumber = props.dmsReferenceNumber;
formData.dateReceived = props.dateReceived;
formData.agencyName = props.agencyName;
formData.scoreboardId = props.scoreboardId;

// Ensure default values are set on component mount
onMounted(() => {
  formData.dateForwarded = dateForwardedValue.value;
  selectedTimeForwarded.value = format(new Date(), 'HH:mm')
})


//for submit scoreboard
</script>

<template>
  <v-card>
    <v-card-text>
      <v-form ref="refVForm" @submit.prevent="handleFormSubmit">
        <v-row>
          <v-col>
            <p class="ms-4 text-wrap">
              Scoreboard ID: <b style="padding-left: 10px;">{{ scoreboardId }}</b>
            </p>
            <p class="ms-4 text-wrap">
              DMS Reference Number: <b style="padding-left: 10px;">{{ dmsReferenceNumber }}</b>
            </p>
            <p class="ms-4 text-wrap">
              Date Received: <b style="padding-left: 10px;">{{ dateReceived }}</b>
            </p>
            <p class="ms-4 text-wrap">
              Agency Name: <b style="padding-left: 10px;">{{ agencyName }}</b>
            </p>
          </v-col>
        </v-row>

        <v-row>
          <v-col>
            <v-select 
              label="Nature of Transaction" 
              :items="nature_of_transaction" 
              item-title="title" 
              item-value="value"
              :rules="[requiredValidator]" 
              outlined 
              v-model="formData.particulars.nature"
              @update:modelValue="fetchPAP"
            ></v-select>
          </v-col>
        </v-row>

        <v-row>
          <v-col>
            <v-select 
              label="Type of Transaction" 
              :items="type_of_transaction" 
              item-title="title" 
              item-value="value"
              :rules="[requiredValidator]" 
              outlined 
              v-model="formData.particulars.type">
            </v-select>
          </v-col>
          <v-col>
            <v-text-field
              :rules="[requiredValidator]"
              label="PAP"
              v-model="papData"
              outlined
              readonly
            />
          </v-col>
        </v-row>

        <!-- Date and Time Picker Row for Date Received 
        <v-row>
          <v-col cols="5">
             <v-date-input 
               label="Date Received" 
               prepend-inner-icon="$calendar"
               v-model="formData.dateReceivedRecordSection" 
               :rules="[requiredValidator]"
             ></v-date-input>
          </v-col>
          <v-col cols="5">
      
            <v-text-field
              v-model="selectedTimeReceived"
              label="Time Received"
              prepend-inner-icon="mdi-clock"
              readonly
              @click="timeDialogReceived = true"
            ></v-text-field>
          </v-col>
        </v-row> -->

        <!-- Time Picker Dialog for Date Received 
        <v-dialog v-model="timeDialogReceived" max-width="400">
        <v-card>
          <v-card-title class="text-center">Select Time</v-card-title>
          <v-card-text>
            <v-time-picker 
              v-model="selectedTimeReceived"
              format="ampm"  
              ampm-in-title 
              @update:model-value="timeDialogReceived = false"
            ></v-time-picker>
          </v-card-text>
          <v-card-actions class="justify-center">
            <v-btn text="Close" @click="timeDialogReceived = false"></v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
            -->
        <!-- Date and Time Picker Row for Date Forwarded -->
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
          <v-col v-for="(value, _) in prescribedPeriodValues" :key="value.prescribed_periods_id">
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

      <SuccessDialog @close-dialog="isSuccess = false" :isActive="isSuccess" />
      <ErrorDialog 
        :isOpen="formAction.formErrorMessage.length !== 0"
        :errorMessage="formAction.formErrorMessage"
        @on-close="formAction.formErrorMessage = ''"
      />
    </v-card-text>
  </v-card>
</template>