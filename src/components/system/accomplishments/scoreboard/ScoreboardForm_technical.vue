<script setup>
import ScoreboardFormDialog from './ScoreboardFormDialog.vue'
import SuccessDialog from './SuccessDialog.vue'
import ErrorDialog from './ErrorDialog.vue'
import { useScoreboardLogic } from './scoreboardLogic.js'

const {
  handleDialogFormSubmit,
  handleFormSubmit,
  formData,
  formAction,
  isSuccess,
  refVForm,
  options,
  prescribedPeriodValues,
  selectedTime,
  timeDialog,
  type_of_transaction,
  nature_of_transaction,
  fetchPAP,
  papData,
  requiredValidator
} = useScoreboardLogic()
</script>

<template>
  <v-card>
    <v-card-text>
      <v-form ref="refVForm" @submit.prevent="handleFormSubmit">
        <v-row>
          <v-col>
            <p class="ms-4 text-wrap">
              DMS Reference Number: <b style="padding-left: 10px;">16-0123456</b>
            </p>
            <p class="ms-4 text-wrap">
              Date Received:<b style="padding-left: 10px;">February 1, 2025</b>
            </p>
            <p class="ms-4 text-wrap">
              Agency Name: <b style="padding-left: 10px;">Agency Company</b>
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
          <v-col>
            
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
        <!-- Date and Time Picker Row -->
        <v-row>
          <v-col cols="5">
             <!-- Date Picker -->
             <v-date-input label="Date Forwarded" prepend-inner-icon="$calendar"
             prepend-icon="" v-model="formData.dateReceivedRecordSection" :rules="[requiredValidator]"></v-date-input>
          </v-col>
          <v-col cols="5">
            <!-- Clickable Time Input -->
            <v-text-field
              v-model="selectedTime"
              label="Time Forwarded"
              prepend-icon="mdi-clock"
              readonly
              @click="timeDialog = true"
            ></v-text-field>
          </v-col>
        </v-row>
        <!-- Centered Time Picker inside v-dialog -->
        <v-dialog v-model="timeDialog" max-width="400">
          <v-card>
            <v-card-title class="text-center">Select Time</v-card-title>
            <v-card-text>
              <v-time-picker 
                v-model="selectedTime"
                @update:model-value="timeDialog = false"
              ></v-time-picker>
            </v-card-text>
            <v-card-actions class="justify-center">
              <v-btn text="Close" @click="timeDialog = false"></v-btn>
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
          <v-btn text="Submit Form" type="submit" color="red-darken-4" :loading="formAction.formProcess" :disabled="formAction.formProcess">
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