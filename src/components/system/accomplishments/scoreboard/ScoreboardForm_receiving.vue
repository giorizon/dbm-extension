<script setup>
import ScoreboardFormDialog from './ScoreboardFormDialog.vue';
import { requiredValidator } from '@/utils/validators';
import SuccessDialog from './SuccessDialog.vue';
import { useScoreboardData, useScoreboardForm } from '@/composables/scoreboard/scoreboard';
import { ref, onMounted, watch } from 'vue';
import ErrorDialog from './ErrorDialog.vue';
import supabase from './supabase'; 
import { format, parse } from 'date-fns';
import { useRouter } from 'vue-router';
const router = useRouter();


const { handleDialogFormSubmit, handleFormSubmit, formData, formAction, refVForm } = useScoreboardForm();
const { prescribedPeriodValues } = useScoreboardData(formData);

const isSuccess = ref(false);
const user = ref(null);

//
const fetchUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    console.error("Error fetching user:", error);
    return;
  }
  user.value = data?.user;
};
watch(isSuccess, (val) => {
  if (val === false) {
    router.go(0)
  }
})
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
      .select('id, firstname, lastname')
      .order('lastname', { ascending: true }); 

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

onMounted(() => {
  fetchloginUser();
  fetchAgencies();
  fetchStaff(); 
});
// Get the current time in HH:mm format
const selectedDateReceived = ref(null);
const selectedTimeReceived = ref(format(new Date(), 'HH:mm'));
const selectedDateForwarded = ref(null);
const selectedTimeForwarded = ref(format(new Date(), 'HH:mm'));

const dateReceivedDialog = ref(false);
const timeReceivedDialog = ref(false);
const dateForwardedDialog = ref(false);
const timeForwardedDialog = ref(false);

const submitScoreboard = async () => {
  if (!selectedDateReceived.value || !selectedTimeReceived.value) {
    alert('❌ Please select both date and time for received.');
    return;
  }
  
// Format time in AM/PM
    const formatTime = (time) => {
      if (!time) return '';
      const parsedTime = parse(time, 'HH:mm', new Date());
      return format(parsedTime, 'hh:mm a'); // 12-hour format with AM/PM
    };
    const formattedReceivedTime = formatTime(selectedTimeReceived.value);
    const formattedForwardedTime = formatTime(selectedTimeForwarded.value);

    console.log("✅ Time Received:", formattedReceivedTime);
    console.log("✅ Time Forwarded:", formattedForwardedTime);
  try {
    // ✅ Received Date + Time
    const formattedReceivedDate = format(new Date(selectedDateReceived.value), "yyyy-MM-dd");
    const formattedReceivedTime = selectedTimeReceived.value.includes(":") 
      ? selectedTimeReceived.value 
      : `${selectedTimeReceived.value}:00`;
    const receivedDateTime = `${formattedReceivedDate}T${formattedReceivedTime}:00Z`;
    const finalReceivedDateTime = format(new Date(receivedDateTime), "yyyy-MM-dd HH:mm:ss");

    // ✅ Forwarded Date + Time 
    let finalForwardedDateTime = null;
    if (selectedDateForwarded.value && selectedTimeForwarded.value) {
      const formattedForwardedDate = format(new Date(selectedDateForwarded.value), "yyyy-MM-dd");
      const formattedForwardedTime = selectedTimeForwarded.value.includes(":") 
        ? selectedTimeForwarded.value 
        : `${selectedTimeForwarded.value}:00`;
      const forwardedDateTime = `${formattedForwardedDate}T${formattedForwardedTime}:00Z`;
      finalForwardedDateTime = format(new Date(forwardedDateTime), "yyyy-MM-dd HH:mm:ss");
    }


    console.log("✅ Date-Time Received:", finalReceivedDateTime);
    console.log("✅ Date-Time Forwarded:", finalForwardedDateTime );

    // ✅ Insert into scoreboard_receiving and RETURN the inserted ID
    const { data: receivingData, error: receivingError } = await supabase
      .from('scoreboard_receiving')
      .insert([
        {
          dms_reference_number: formData.value.dmsReferenceNumber,
          agency_id: formData.value.particulars.agencyID,
          user_id: userUUID.value,
          date_received: finalReceivedDateTime, // ✅ Store as YYYY-MM-DD
          date_forwarded: finalForwardedDateTime  // ✅ Store as YYYY-MM-DD
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

    // ✅ Insert into scoreboard_individual using the newReceivingId
    const { data: technicalData, error: technicalError } = await supabase
      .from('scoreboard_technical_process')
      .insert([
        {
          scoreboard_id: newReceivingId, // ✅ Insert the new ID
          owner_id: formData.value.particulars.staffID,
          from_id: userUUID.value,
          date_received: finalReceivedDateTime,
          date_forwarded: null,
          status: 'Pending',
          level: 'Individual'
        }
      ]);

    if (technicalError) {
      console.error('🚨 Supabase Insert Error (Individual):', technicalError.message);
      alert('❌ Failed to save data in scoreboard_individual! Error: ' + technicalError.message);
      return;
    }

      isSuccess.value = true;
  } catch (err) {
    console.error('Unexpected error:', err);
    alert('❌ Unexpected error occurred while saving to the database.');
  }
};
const onCloseSuccess = () => {
  isSuccess.value = false 
  routePage()            
}
const routePage = async () => {
    router.push('/add-scoreboard');
}
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
           <v-autocomplete
            label="Agency Name"
            :items="agencies"
            item-title="agency_name"
            item-value="id"
            v-model="formData.particulars.agencyID"
            :rules="[requiredValidator]"
            outlined
            clearable
            @change="handleAgencyChange"
          />
          </v-col>
          <v-col>
            <v-autocomplete
              label="Assign to"
              :items="staffList"
              item-title="name"
              item-value="id"
              :rules="[requiredValidator]"
              outlined
              v-model="formData.particulars.staffID"
          />
          </v-col>
        </v-row>
        <!-- DATE RECEIVED -->
        <v-row>
          <v-col>
            <v-text-field
              v-model="selectedDateReceived"
              label="Date Received"
              prepend-icon="mdi-calendar"
              readonly
               :value="selectedDateReceived ? format(new Date(selectedDateReceived), 'yyyy-MM-dd') : ''"
              @click="dateReceivedDialog = true"
            ></v-text-field>
          </v-col>
          <v-col>
            <v-text-field
              v-model="selectedTimeReceived"
              label="Time Received"
              prepend-icon="mdi-clock"
              readonly
              @click="timeReceivedDialog = true"
            ></v-text-field>
          </v-col>
        </v-row>

     <!-- DATE FORWARDED -->
     <v-row>
          <v-col>
            <v-text-field
              v-model="selectedDateForwarded"
              label="Date Forwarded"
              prepend-icon="mdi-calendar"
              readonly
              :value="selectedDateForwarded ? format(new Date(selectedDateForwarded), 'yyyy-MM-dd') : ''"
              @click="dateForwardedDialog = true"
            ></v-text-field>
          </v-col>
          <v-col>
            <v-text-field
              v-model="selectedTimeForwarded"
              label="Time Forwarded"
              prepend-icon="mdi-clock"
              readonly
              @click="timeForwardedDialog = true"
            ></v-text-field>
          </v-col>
        </v-row>

        <!-- DATE PICKERS -->
        <v-dialog v-model="dateReceivedDialog" max-width="400">
          <v-card>
            <v-card-title>Select Date Received</v-card-title>
            <v-card-text>
              <v-date-picker 
                  v-model="selectedDateReceived" 
                  @update:model-value="dateReceivedDialog = false"
                />
            </v-card-text>
          </v-card>
        </v-dialog>

        <v-dialog v-model="dateForwardedDialog" max-width="400">
          <v-card>
            <v-card-title>Select Date Forwarded</v-card-title>
            <v-card-text>
              <v-date-picker 
                v-model="selectedDateForwarded" 
                @update:model-value="dateForwardedDialog = false"
              />
            </v-card-text>
          </v-card>
        </v-dialog>
        <!-- TIME PICKERS -->
      <v-dialog v-model="timeReceivedDialog" max-width="400">
        <v-card>
          <v-card-title>Select Time Received</v-card-title>
          <v-card-text>
            <v-time-picker 
              v-model="selectedTimeReceived" 
              format="ampm"
              ampm-in-title 
              @update:model-value="timeReceivedDialog = false"
            />
          </v-card-text>
        </v-card>
      </v-dialog>

      <v-dialog v-model="timeForwardedDialog" max-width="400">
        <v-card>
          <v-card-title>Select Time Forwarded</v-card-title>
          <v-card-text>
            <v-time-picker 
              v-model="selectedTimeForwarded" 
              format="ampm"
              ampm-in-title 
              @update:model-value="timeForwardedDialog = false"
            />
          </v-card-text>
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
          <v-btn color="primary" @click="submitScoreboard">Submit Scoreboard</v-btn>
        </v-row>
      </v-form>
      <SuccessDialog v-model="isSuccess" />
      <ErrorDialog
        :isOpen="formAction.formErrorMessage.length !== 0"
        :errorMessage="formAction.formErrorMessage"
        @on-close="() => { formAction.formErrorMessage = '' }"
      />
    </v-card-text>
  </v-card>
</template>