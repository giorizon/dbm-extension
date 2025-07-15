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


const processOwners = ref([]);
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
  fetchProcessOwners();
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

//fetch process owner
const fetchProcessOwners = async () => {
  try {
    const { data, error } = await supabase
      .from('fad_process_owners_view')
      .select('*');
    console.log('Fetched process owner data:', data);
    if (error) {
      console.error('Error fetching process owners:', error);
      return;
    }

    processOwners.value = data.map(user => {
      console.log('user_id:', user.user_id); // 👈 Logs the UUID
      return {
        id: user.id,
        name: `${user.pos} - ${user.firstname} ${user.lastname}`.trim()
      };
    });

    console.log('🏷️ Owner ID:', user.value.id);
  } catch (err) {
    console.error('Unexpected error fetching process owners:', err);
  }
};

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

  if (formData.value.particulars.transactionID === 1) {
    tableName = 'citizen_charter';
    
  } else if (formData.value.particulars.transactionID === 2) {
    tableName = 'internal_reports';
  }else if (formData.value.particulars.transactionID === 3) {
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

const selectedTime = ref(format(new Date(), 'HH:mm'));
const selectedTime2 = ref(format(new Date(), 'HH:mm'));
const timeDialog = ref(false); 

const submitScoreboard = async () => {
  try {
    // Format received datetime
    const receivedDatePart = format(new Date(formData.value.dateReceivedRecordSection), "yyyy-MM-dd");
    const receivedTimePart = selectedTime.value.includes(":") ? selectedTime.value : `${selectedTime.value}:00`;
    const combinedDateTime = `${receivedDatePart}T${receivedTimePart}:00`;
    const formattedDateTime = format(new Date(combinedDateTime), "yyyy-MM-dd HH:mm:ss");

    // Format forwarded datetime
    const forwardedDatePart = format(new Date(formData.value.forwardedRecordSection), "yyyy-MM-dd");
    const forwardedTimePart = selectedTime2.value.includes(":") ? selectedTime2.value : `${selectedTime2.value}:00`;
    const forwardedCombinedDateTime = `${forwardedDatePart}T${forwardedTimePart}:00`;
    const formattedForwardedDateTime = format(new Date(forwardedCombinedDateTime), "yyyy-MM-dd HH:mm:ss");
    
    //check if user is logged in
    if (!user.value?.id) {
        alert("User not yet loaded. Please wait and try again.");
    return;
    }   
    console.log('User ID:', user.value?.id);
    console.log('DMS:', formData.dmsReferenceNumber);
    // 1️⃣ Insert into scoreboard_receiving_fad
    const { data: fadInsertData, error: fadError } = await supabase
      .from('scoreboard_receiving_fad')
      .insert([
        {
          date_received: formattedDateTime,
          date_forwarded: formattedForwardedDateTime,
          sub_unit_id: formData.value.particulars.agencyID,
          owner_id: formData.value.particulars.staffID,
          receiver_id: user.value?.id,
          dms_reference_number: formData.value.dmsReferenceNumber,
          remark: "Pending"
        }
      ])
      .select('id')
      .single(); // Return the inserted row
 
    // console.log('Auth UID match policy will allow this:', userUUID.value === <value you expect>);   
    if (fadError) {
      console.error('🚨 Insert Error (FAD Receiving):', fadError.message);
      alert('❌ Failed to save data in scoreboard_receiving_fad! Error: ' + fadError.message);
      return;
    }

    const insertedScoreboardID = fadInsertData?.id;
    //Insert function for the scoreboard_fad_process table

    const { error: fadprocessInsertError } = await supabase
        .from('scoreboard_fad_process')
        .insert([
          {
            scoreboard_id: insertedScoreboardID,
            status: 'Pending',
            sub_unit_id: formData.value.particulars.agencyID,
            owner_id: formData.value.particulars.staffID,
            date_received: formattedDateTime,
            from_id: userUUID.value
          }
        ]);
      if (fadprocessInsertError) {
        console.error('🚨 Insert Error (FAD Process table):', fadprocessInsertError.message);
        alert('❌ Failed to save data in scoreboard_fad_process! Error: ' + fadprocessInsertError.message);
        return;
      }
      console.log("✅ Data saved in internal_report_received");
    // 2️⃣ If "Internal Reports" selected (transactionID === 2), insert into internal_report_received
    if(formData.value.particulars.transactionID === 1){
      const { error: internalCitizenCharterError } = await supabase
          .from('citizen_charter_received')
          .insert([
            {
              scoreboard_id: insertedScoreboardID,
              cc_id: formData.value.particulars.subTypeID,
            }
          ]);

        if (internalCitizenCharterError) {
          console.error('🚨 Insert Error (Citizen Charter Report):', internalCitizenCharterError.message);
          alert('❌ Failed to save data in citizen_charter_received! Error: ' + internalCitizenCharterError.message);
          return;
        }

        console.log("✅ Data saved in internal_report_received");
    }
    else if (formData.value.particulars.transactionID === 2) {
      const { error: internalInsertError } = await supabase
        .from('internal_report_received')
        .insert([
          {
            scoreboard_id: insertedScoreboardID,
            internal_id: formData.value.particulars.subTypeID,
          }
        ]);

      if (internalInsertError) {
        console.error('🚨 Insert Error (Internal Report):', internalInsertError.message);
        alert('❌ Failed to save data in internal_report_received! Error: ' + internalInsertError.message);
        return;
      }

      console.log("✅ Data saved in internal_report_received");
    }
    else if (formData.value.particulars.transactionID === 3) {
       console.log("scoreboard_id: ",insertedScoreboardID );
      console.log("external_id: ",insertedScoreboardID );
      const { error: externalInsertError } = await supabase
        .from('external_report_received')
        .insert([
          {
            scoreboard_id: insertedScoreboardID,
            external_id: formData.value.particulars.subTypeID,
          }
        ]);

      if (externalInsertError) {
        console.error('🚨 Insert Error (External Report):', externalInsertError.message);
        alert('❌ Failed to save data in external_report_received! Error: ' + externalInsertError.message);
        return;
      }

      console.log("✅ Data saved in external_report_received");
    }
    // ✅ Show final success message
    alert('✅ Data successfully submitted New DMS');

  } catch (e) {
    console.error('Unexpected Error in submitScoreboard:', e);
    alert('⚠️ An unexpected error occurred: ' + e.message);
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
              @update:model-value="handleSubunitChange"
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
              v-model="formData.forwardedRecordSection"
              :rules="[requiredValidator]"
            />
          </v-col>
          <v-col>
            <v-text-field
              v-model="selectedTime2"
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
              format="ampm"               
              ampm-in-title               
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