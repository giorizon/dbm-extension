<script setup>
import ScoreboardFormDialog from './ScoreboardFormDialog.vue';
import { requiredValidator } from '@/utils/validators';
import SuccessDialog from './SuccessDialog.vue';
import { useScoreboardData, useScoreboardForm } from '@/composables/scoreboard/scoreboard';
import { ref, onMounted } from 'vue';
import ErrorDialog from './ErrorDialog.vue';
import supabase from './supabase'; 
import { format } from 'date-fns';

const { handleDialogFormSubmit, handleFormSubmit, formData, formAction, isSuccess, refVForm } = useScoreboardForm();
const { prescribedPeriodValues } = useScoreboardData(formData);
const timeMenu = ref();


const user = ref(null);

const fetchUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    console.error("Error fetching user:", error);
    return;
  }
  user.value = data?.user;
};

onMounted(() => {
  fetchUser();
  fetchAgencies();
  fetchStaff();
});

// ✅ Reactive Variable to Store Agencies
const agencies = ref([]);

// ✅ Fetch Agencies from Supabase
const fetchAgencies = async () => {
  try {
    const { data, error } = await supabase.from('agency').select('id, agency_name, user_id');

    if (error) {
      console.error('Error fetching agencies:', error);
      return;
    }

    agencies.value = data; 
  } catch (err) {
    console.error('Unexpected error fetching agencies:', err);
  }
};
const staffList = ref([]);

// ✅ Fetch Staff from Supabase
const fetchStaff = async () => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, firstname, lastname');

    if (error) {
      console.error('Error fetching staff:', error);
      return;
    }

    staffList.value = data.map(user => ({
      id: user.id,
      name: `${user.lastname || ''}, ${user.firstname || ''}`.trim() || 'No Name'
    }));
  } catch (err) {
    console.error('Unexpected error fetching staff:', err);
  }
};

// ✅ Auto-Select Assigned Staff when Agency is Chosen
const handleAgencyChange = () => {
  if (!formData.value.particulars) {
    formData.value.particulars = {}; // ✅ Ensure particulars exists
  }

  const selectedAgency = agencies.value.find(a => a.id === formData.value.particulars.ts);
  if (selectedAgency) {
    const assignedUser = staffList.value.find(user => user.id === selectedAgency.user_id);
    formData.value.particulars.assigned_to = assignedUser ? assignedUser.id : null;
  }
};
onMounted(() => {
  fetchAgencies();
  fetchStaff(); 
});
// Get the current time in HH:mm format
const selectedTime = ref(format(new Date(), 'HH:mm'))
const timeDialog = ref(false); // ✅ Add this reactive variable
</script>

<template>
  <v-card>
    <v-card-text>
      <v-form ref="refVForm" @submit.prevent="handleFormSubmit">
        <v-row>
          <v-col>
            <v-text-field
              :rules="[requiredValidator]"
              label="DMS Reference Number"
              v-model="formData.dmsReferenceNumber"
              outlined
              clearable
            />
          </v-col>  
          <v-col> 
          </v-col>
        </v-row>

        <v-row>
          <v-col>
            <v-select
              label="Agency Name"
              :items="agencies"
              item-title="agency_name"
              item-value="id"
              :rules="[requiredValidator]"
              outlined
              v-model="formData.particulars.ts"
              @update:model-value="handleAgencyChange"
            >
              <template v-slot:prepend-item>
               
              </template>
            </v-select>
          </v-col>
          <v-col>
            <v-select
              label="Assign to"
              :items="staffList"
              item-title="name"
              item-value="id"
              :rules="[requiredValidator]"
              outlined
              v-model="formData.particulars.assigned_to"
          ></v-select>
          </v-col>
        </v-row>
        <v-row>
          <v-col>
            <v-date-input
              label="Date and Time received by The Records Section"
              prepend-inner-icon="$calendar"
              v-model="formData.dateReceivedRecordSection"
              :rules="[requiredValidator]"
            />
          </v-col>
          <v-col>
            <v-text-field
              v-model="selectedTime"
              label="Time Forwarded"
              prepend-icon="mdi-clock"
              readonly
              @click="timeDialog = true"
            ></v-text-field>
          </v-col>
          
        </v-row>

        <!-- Time Picker-->
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
          <v-col v-for="(value, index) in prescribedPeriodValues" :key="index">
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
          <v-btn
            text="Submit Form"
            type="submit"
            color="red-darken-4"
            :loading="formAction.formProcess"
            :disabled="formAction.formProcess"
          />
        </v-row>
      </v-form>

      <SuccessDialog
        @close-dialog="() => { isSuccess = false }"
        :isActive="isSuccess"
      />
      <ErrorDialog
        :isOpen="formAction.formErrorMessage.length !== 0"
        :errorMessage="formAction.formErrorMessage"
        @on-close="() => { formAction.formErrorMessage = '' }"
      />
    </v-card-text>
  </v-card>
</template>