<script setup>
import ScoreboardFormDialog from './ScoreboardFormDialog.vue';
import { requiredValidator } from '@/utils/validators';
import SuccessDialog from './SuccessDialog.vue';
import { useScoreboardData, useScoreboardForm } from '@/composables/scoreboard/scoreboard';
import { ref, onMounted, watch} from 'vue';
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

  const selectedAgency = agencies.value.find(a => a.id === formData.value.particulars.agencyID);
  if (selectedAgency) {
    const assignedUser = staffList.value.find(user => user.id === selectedAgency.user_id);
    formData.value.particulars.staffID = assignedUser ? assignedUser.id : null;
  }
};

const userUUID = ref(null);

// ✅ Fetch the logged-in user's UUID
const fetchloginUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    console.error("Error fetching user:", error);
    return;
  }
  userUUID.value = data?.user?.id; // ✅ Store the UUID
  console.log("User UUID:", userUUID.value);
};
const transactionList = ref([]); // Store transactions
const subtypeList = ref([]);  // For Subtypes

// ✅ Fetch Type of Transactions from Supabase
const fetchTransactionTypes = async () => {
  try {
    const { data, error } = await supabase
      .from('type_of_transactions_fad')
      .select('id, name');

    if (error) {
      console.error('Error fetching transactions:', error);
      return;
    }

    // Map the fetched data
    transactionList.value = data.map(item => ({
      id: item.id,
      transaction_name: item.name, // Display name
    }));

  } catch (err) {
    console.error('Unexpected error fetching transaction types:', err);
  }
};
// Function to fetch sub-types based on selected transaction type
const fetchSubTypes = async () => {
  if (!formData.value.particulars.transactionID) {
    subtypeList.value = []; // Clear sub-type list if no transaction selected
    return;
  }

  let tableName = '';

  if (formData.value.particulars.transactionID === 2) {
    tableName = 'internal_reports';
  } else if (formData.value.particulars.transactionID === 3) {
    tableName = 'external_reports';
  } else {
    subtypeList.value = []; // No valid transaction type selected
    return;
  }

  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('id, name'); // Fetch sub-types

    if (error) {
      console.error(`Error fetching ${tableName}:`, error);
      return;
    }

    subtypeList.value = data.map(item => ({
      id: item.id,
      subtype: item.name,
    }));

  } catch (err) {
    console.error(`Unexpected error fetching ${tableName}:`, err);
  }
};

// Watch for changes in "Type of Transaction" to trigger fetchSubTypes
watch(() => formData.value.particulars.transactionID, fetchSubTypes);


const fetchFADSubUnits = async () => {
  try {
    const { data, error } = await supabase
      .from('fad_sub_units')
      .select('id, name'); 

    if (error) {
      console.error('Error fetching FAD Sub Units:', error);
      return;
    }

    console.log("FAD Sub Units Data:", data); // ✅ Log fetched data

    fadSubUnits.value = data.map(item => ({
      id: item.id,
      name: item.name, // Display name
    }));

  } catch (err) {
    console.error('Unexpected error fetching FAD Sub Units:', err);
  }
};
onMounted(() => {
  fetchTransactionTypes();
  fetchloginUser();
  fetchAgencies();
  fetchStaff(); 
  fetchFADSubUnits(); 
});

const selectedTime = ref(format(new Date(), 'HH:mm'))
const timeDialog = ref(false); 

const submitScoreboard = async () => {
  if (!formData.value.dateReceivedRecordSection || !selectedTime.value) {
    alert('❌ Please select both date and time.');
    return;
  }

  try {
    const datePart = format(new Date(formData.value.dateReceivedRecordSection), "yyyy-MM-dd");
    const timePart = selectedTime.value.includes(":") ? selectedTime.value : `${selectedTime.value}:00`;
    const combinedDateTime = `${datePart}T${timePart}:00`;
    const parsedDateTime = new Date(combinedDateTime);
    const formattedDateTime = format(parsedDateTime, "yyyy-MM-dd HH:mm:ss");

    console.log("Formatted Date-Time:", formattedDateTime);
    console.log("DMS Reference Number:", formData.value.dmsReferenceNumber);
    console.log("Agency ID:", formData.value.particulars.agencyID);
    console.log("User ID (Creator):", userUUID.value);

    // ✅ Insert into scoreboard_receiving and RETURN the inserted ID
    const { data: receivingData, error: receivingError } = await supabase
      .from('scoreboard_receiving')
      .insert([
        {
          dms_reference_number: formData.value.dmsReferenceNumber,
          agency_id: formData.value.particulars.agencyID,
          user_id: userUUID.value,
          date_received: formattedDateTime
        }
      ])
      .select('id'); 
    if (receivingError) {
      console.error('🚨 Supabase Insert Error (Receiving):', receivingError.message);
      alert('❌ Failed to save data! Error: ' + receivingError.message);
      return;
    }

    const newReceivingId = receivingData ? receivingData[0]?.id : null; // ✅ Get the inserted ID
    if (!newReceivingId) {
      alert('❌ Error: Could not retrieve new scoreboard_receiving ID.');
      return;
    }

    console.log("✅ New scoreboard_receiving ID:", newReceivingId);

    // ✅ Insert into scoreboard_technical using the newReceivingId
    const { data: technicalData, error: technicalError } = await supabase
      .from('scoreboard_technical')
      .insert([
        {
          scoreboard_id: newReceivingId, // ✅ Insert the new ID
          user_id: formData.value.particulars.staffID,
          status: 'Pending'
        }
      ]);

    if (technicalError) {
      console.error('🚨 Supabase Insert Error (Technical):', technicalError.message);
      alert('❌ Failed to save data in scoreboard_technical! Error: ' + technicalError.message);
      return;
    }

    alert('✅ Data successfully saved to both tables!');
  } catch (err) {
    console.error('Unexpected error:', err);
    alert('❌ Unexpected error occurred while saving to the database.');
  }
};
const fadSubUnits = ref([]); // Store FAD Sub Units

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
              label="Type of Transaction"
              :items="transactionList"
              item-title="transaction_name" 
              item-value="id"
              :rules="[requiredValidator]"
              outlined
              v-model="formData.particulars.transactionID" 
            ></v-select>
          </v-col>
          <v-col>
            <v-select
            label="Sub-Type"
            :items="subtypeList"
            item-title="subtype"
            item-value="id"
            :rules="[requiredValidator]"
            outlined
            v-model="formData.particulars.subTypeID" 
          ></v-select>
          </v-col>
        </v-row>
        <v-row>

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
              @update:model-value="handleAgencyChange"
            />
          </v-col>
          <v-col>
            <v-select
              label="Process Owner"
              :items="staffList"
              item-title="name"
              item-value="id"
              :rules="[requiredValidator]"
              outlined
              v-model="formData.particulars.staffID"
          ></v-select>
          </v-col>
        </v-row>
        <v-row>
          <v-col>
            <v-date-input
              label="Date received"
              prepend-inner-icon="$calendar"
              v-model="formData.dateReceivedRecordSection"
              :rules="[requiredValidator]"
            />
          </v-col>
          <v-col>
            <v-text-field
              v-model="selectedTime"
              label="Time Received"
              prepend-icon="mdi-clock"
              readonly
              @click="timeDialog = true"
            ></v-text-field>
          </v-col>
          
        </v-row>
        <v-row>
          <v-col>
            <v-date-input
              label="Date Forwarded"
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
          <!-- <v-btn
            text="Submit Form"
            type="submit"
            color="red-darken-4"
            :loading="formAction.formProcess"
            :disabled="formAction.formProcess"
          /> -->
          <v-btn color="primary" @click="submitScoreboard">Submit FAD Scoreboard</v-btn>
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