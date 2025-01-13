<script setup>
import ScoreboardFormDialog from './ScoreboardFormDialog.vue'
import { requiredValidator } from '@/utils/validators'
import SuccessDialog from './SuccessDialog.vue'
import { useScoreboardData, useScoreboardForm } from '@/composables/scoreboard/scoreboard'
import { ref } from 'vue'
import ErrorDialog from './ErrorDialog.vue'
const { handleDialogFormSubmit, handleFormSubmit, formData, formAction, isSuccess, refVForm } = useScoreboardForm()
const { options, prescribedPeriodValues, typesOfTransaction } = useScoreboardData(formData)
const timeMenu = ref()
</script>

<template>
  <v-card>
    <v-card-text>
      <v-form ref="refVForm" @submit.prevent="handleFormSubmit">
        <v-row>
          <v-col>
            <v-select label="Choose P/A/P" :items="options.pap" item-title="code" item-value="id"
              :rules="[requiredValidator]" outlined v-model="formData.particulars.pap">
            </v-select>
          </v-col>
          <v-col>
            <v-select label="Choose TS in Charge" :items="options.tsInCharge" item-title="name" item-value="tic_id"
              :rules="[requiredValidator]" outlined v-model="formData.particulars.ts">
            </v-select>
          </v-col>
        </v-row>
        <v-row>
          <v-col>
            <v-text-field :rules="[requiredValidator]" label="Agency Name" v-model="formData.particulars.agency"
              outlined clearable>
            </v-text-field>
          </v-col>
          <v-col>
            <v-select label="Choose Nature of Transaction" :items="options.natureOfRequest" :rules="[requiredValidator]"
              outlined v-model="formData.particulars.natureOfRequest">
            </v-select>
          </v-col>
        </v-row>
        <v-row>
          <v-col>
            <v-text-field :rule="requiredValidator" label="DMS Reference Number" v-model="formData.dmsReferenceNumber"
              outlined clearable>
            </v-text-field>
          </v-col>
        </v-row>
        <v-row>
          <v-col>
            <v-date-input label="Date and Time received by The Records Section" prepend-inner-icon="$calendar"
              prepend-icon="" v-model="formData.dateReceivedRecordSection" :rules="[requiredValidator]"></v-date-input>
          </v-col>
          <v-col>
            <v-text-field v-model="formData.timeReceivedRecordSection" label="Pick Time" :active="timeMenu"
              prepend-inner-icon="mdi-clock-time-four-outline" :rules="[requiredValidator]" readonly>
              <v-menu v-model="timeMenu" :close-on-content-click="false" activator="parent"
                transition="scale-transition">
                <v-time-picker v-if="timeMenu" v-model="formData.timeReceivedRecordSection" format="24hr">
                </v-time-picker>
              </v-menu>
            </v-text-field>
          </v-col>
        </v-row>
        <v-row>
          <v-col>
            <v-select :items="typesOfTransaction" item-title="transaction_type" item-value="transaction_type"
              v-model="formData.typeOfTransaction" outlined label="Choose Type of Transaction"
              :rules="[requiredValidator]"></v-select>
          </v-col>
        </v-row>
        <v-row v-if="prescribedPeriodValues.length !== 0">
          <!-- eslint-disable vue/valid-v-for -->
          <!-- eslint-disable-next-line vue/no-unused-vars -->
          <v-col v-for="(value, _) in prescribedPeriodValues">
            <ScoreboardFormDialog @form-submitted="handleDialogFormSubmit" :key="value.prescribed_periods_id"
              :report="value.report" :prescribedPeriod="{
                prescribed_period_value: value.prescribed_period_value,
                prescribed_period_id: value.prescribed_periods_id
              }" />
          </v-col>
        </v-row>
        <v-row>
          <v-col>
            <v-text-field label="Remarks" v-model="formData.remarks"> </v-text-field>
          </v-col>
          <v-col>
            <v-select v-model="formData.status" :items="options.statuses" item-title="status_name" item-value="id"
              label="Status" outlined></v-select>
          </v-col>
        </v-row>
        <v-row>
          <v-col>
            <v-text-field label="Output/Released Documents" v-model="formData.outputReleasedDocuments">
            </v-text-field>
          </v-col>
          <v-col>
            <v-text-field label="CSS Submission Date" v-model="formData.cssSubmissionDate">
            </v-text-field>
          </v-col>
        </v-row>

        <v-row dense>
          <v-spacer></v-spacer>
          <v-btn text="Submit Form" type="submit" color="red-darken-4" :loading="formAction.formProcess"
            :disabled="formAction.formProcess">
          </v-btn>
        </v-row>
      </v-form>
      <SuccessDialog @close-dialog="() => {
        isSuccess = false
      }
        " :isActive="isSuccess" />
      <ErrorDialog :isOpen="formAction.formErrorMessage.length !== 0" :errorMessage="formAction.formErrorMessage"
        @on-close="() => {
          formAction.formErrorMessage = ''
        }" />
    </v-card-text>
  </v-card>
</template>
