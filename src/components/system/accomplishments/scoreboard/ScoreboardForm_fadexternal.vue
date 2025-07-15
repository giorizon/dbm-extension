<script setup>
import { ref, defineProps, onMounted } from 'vue'
import { format } from 'date-fns'
import '@/assets/scoreboard.css'
import ScoreboardFormDialog from './ScoreboardFormDialog.vue'
import SuccessDialog from './SuccessDialog.vue'
import ErrorDialog from './ErrorDialog.vue'
import { useScoreboardLogic } from './scoreboardLogic.js'
import supabase from './supabase'; 
import { watch } from 'vue';

const validationError = ref("")
const isSuccess = ref(false)
const formErrorMessage = ref("")

const props = defineProps({
  dmsReferenceNumber: String,
  dateReceived: String,
  report: String,
  subunit: String,
  scoreboardId: String,
  processId: String
});

const {
  formData,
  formAction,
  refVForm,
  prescribedPeriodValues,
  requiredValidator
} = useScoreboardLogic();

const downtimeChecker = ref(false);

formData.dateReceivedRecordSection = ref(format(new Date(), 'yyyy-MM-dd'))
const dateForwardedValue = ref(format(new Date(), 'yyyy-MM-dd'))
const selectedTimeForwarded = ref(format(new Date(), 'HH:mm'))
const timeDialogForwarded = ref(false)
const showEndConfirmDialog = ref(false);
const showEndProcessDialog = ref(false);

const downtimeValue = ref(null);
const typeDowntime = ref(null);
const remark = ref(null);
const downtimeFlag = ref(0); 
const userUUID = ref(null);
const processOwners = ref([]);
const fadSubUnits = ref([]);

const releasing_id =ref(null)
const staffID = ref(null);
const agencyID = ref(null);

watch(downtimeChecker, (newVal) => {
  downtimeFlag.value = newVal ? 1 : 0;
});

const fetchLoggedInUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    console.error("Error fetching user:", error);
    return;
  }
  userUUID.value = data?.user?.id;

};

const type_of_downtime = ref([])
  // Fetch Type of Transactions from Supabase
  const fetchTypeOfDowntime = async () => {
    try {
     
      const { data, error } = await supabase.from('type_of_downtime').select('id, name')
      if (error) {
        console.error('Error fetching Type of Downtime:', error)
        return
      }
      type_of_downtime.value = data.map(item => ({
        title: item.name,
        value: item.id
      }))
      console.log("Fetched Downtime Types:", data);
    } catch (err) {
      console.error('Unexpected error fetching Type of downtime:', err)
    }
  } 
formData.dmsReferenceNumber = props.dmsReferenceNumber;
formData.dateReceived = props.dateReceived;
formData.agencyName = props.agencyName;
formData.scoreboardId = props.scoreboardId;
formData.processId = props.processId;
// Ensure default values are set on component mount
onMounted(() => {
  formData.dateForwarded = dateForwardedValue.value;
  fetchTypeOfDowntime();
  fetchLoggedInUser();
   fetchProcessOwners();
   
   fetchFADSubUnits();
  selectedTimeForwarded.value = format(new Date(), 'HH:mm');
});
onMounted(async () => {
  formData.dateForwarded = dateForwardedValue.value;
  await fetchReleasingId();
});
const handleFormSubmit = async () => {
  const combinedDatetimeStr = `${formData.dateForwarded}T${selectedTimeForwarded.value}:00Z`;


  validationError.value = "";
  formErrorMessage.value = "";

  if (!formData.scoreboardId?.value) {
    validationError.value = "Scoreboard ID is required";
    return;
  }

  // 🆕 Safely extract from formData
  const combinedDate = new Date(combinedDatetimeStr);
  const dateForwarded = combinedDate.toISOString();
  const scoreboardId = formData.scoreboardId.value;
  const updateData = {
    date_forwarded: dateForwarded,
    status: "Accepted"
  };

  try {
   const { data: updatedRows, error: updateError } = await supabase
  .from('scoreboard_fad_process')
  .update(updateData)
  .eq('id', props.processId.value)
  .select()// 👈 include this to return affected rows
   .throwOnError();

    
    console.log("🔁 Updated rows:", updatedRows);
    if (updateError) {
      console.error("❌ Update error:", updateError);
      throw updateError;
    }
    if (downtimeFlag.value === 1) {
    const { error: insertError, data: insertedData } = await supabase
      .from('fad_downtime')
      .insert([{
        downtime_id: typeDowntime.value,
        downtime: downtimeValue.value,
        process_id: props.processId.value,
        remark: remark.value
      }]);
    console.log("Insert response:", insertedData, insertError);
    if (insertError) throw insertError;
    isSuccess.value = true;
  console.log("✅ Passed downtime insert successfully"); // ← add this
  }
    const { error: insertError, data: insertedData } = await supabase
      .from('scoreboard_fad_process')
      .insert([{
        scoreboard_id: formData.scoreboardId?.value ?? null,
        status: 'Pending',
        date_forwarded: null,
        date_received: dateForwarded,
        owner_id: staffID?.value ?? null,
        sub_unit_id: agencyID?.value ?? null,
        from_id: userUUID.value
      }])
      .throwOnError();
        console.log("Insert response:", insertedData, insertError);
        if (insertError) {
          console.error("Insert error:", insertError);
          throw insertError;
        }
        isSuccess.value = true;
  } catch (err) {
     console.error("❌ Caught error:", err); 
    formErrorMessage.value = err.message || "Failed to submit the form.";
  } 
};
const fetchProcessOwners = async () => {
  try {
    const { data, error } = await supabase
      .from('fad_process_owners_view')
      .select('*');
    if (error) {
      console.error('Error fetching process owners:', error);
      return;
    }

    processOwners.value = data.map(user => {
       // 👈 Logs the UUID
      return {
        id: user.id,
        name: `${user.pos} - ${user.firstname} ${user.lastname}`.trim()
      };
    });


  } catch (err) {
    console.error('Unexpected error fetching process owners:', err);
  }
};
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
const confirmEndProcess = async () => {
  showEndConfirmDialog.value = false;
  const combinedDatetimeStr = `${formData.dateForwarded}T${selectedTimeForwarded.value}:00Z`;
  const combinedDate = new Date(combinedDatetimeStr);
  const dateEnded = combinedDate.toISOString();
    const updateData = {
    end_date: dateEnded,
    status: "Process End"
  };
  try {
  const { data: updatedRows, error: updateError } = await supabase
  .from('scoreboard_fad_process')
  .update(updateData)
  .eq('id', props.processId.value)
  .select()// 👈 include this to return affected rows
  .throwOnError();
        
  console.log("🔁 Updated rows:", updatedRows);
  if (updateError) {
    console.error("❌ Update error:", updateError);
    throw updateError;
  }
  } catch (err) {
    console.error("❌ Caught error:", err); 
    formErrorMessage.value = err.message || "Failed to submit the form.";
  } 
   showEndProcessDialog.value = true;
};

const handleEndProcess = async () => {
  showEndConfirmDialog.value = true;
  
};

const fetchReleasingId = async () => {

  const { data, error } = await supabase
    .from('user_profile_role')
    .select('user_id') 
    .eq('user_role', 'Releasing Data')
    .single(); 

  if (error) {
    console.error("Error fetching releasing ID:", error);
    return;
  }
  releasing_id.value = data?.user_id;
  console.log("✅ Retrieved User releasing ID:",releasing_id.value);
};

const handleRelease = async () => {

  const combinedDatetimeStr = `${formData.dateForwarded}T${selectedTimeForwarded.value}:00Z`;


  validationError.value = "";
  formErrorMessage.value = "";

  if (!formData.scoreboardId?.value) {
    validationError.value = "Scoreboard ID is required";
    return;
  }

  // 🆕 Safely extract from formData
  const combinedDate = new Date(combinedDatetimeStr);
  const dateForwarded = combinedDate.toISOString();
  const updateData = {
    date_forwarded: dateForwarded,
    status: "Accepted"
  };
  try {
    const { data: updatedRows, error: updateError } = await supabase
      .from('scoreboard_fad_process')
      .update(updateData)
      .eq('id', props.processId.value)
      .select()
      .throwOnError();

    console.log("🔁 Updated rows:", updatedRows);

    if (downtimeFlag.value === 1) {
      const { error: insertError, data: insertedData } = await supabase
        .from('fad_downtime')
        .insert([{
          downtime_id: typeDowntime.value,
          downtime: downtimeValue.value,
          process_id: props.processId.value,
          remark: remark.value
        }]);
      
      console.log("Insert response:", insertedData, insertError);
      if (insertError) throw insertError;
    }

    // ✅ This block should run regardless of downtime
    const { data: insertedRelease } = await supabase
      .from('scoreboard_fad_release')
      .insert([{
        scoreboard_id: formData.scoreboardId?.value ?? null,
        status: 'Pending',
        date_released: null,
        date_received: dateForwarded, 
      }])
      .throwOnError();

    console.log("✅ Insert into scoreboard_fad_release successful:", insertedRelease);
    isSuccess.value = true;

  } catch (err) {
    console.error("❌ Caught error:", err); 
    formErrorMessage.value = err.message || "Failed to submit the form.";
  }
};
</script>

<template>
  <v-card>
    <v-card-text>
      <v-form ref="refVForm" @submit.prevent="handleFormSubmit">
        <v-row>
          <v-col>
             <p class="ms-4 text-wrap">
              Process ID: <b style="padding-left: 10px;">{{ processId }}</b>
            </p>
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
          </v-row>
          </transition>
          <transition name="slide-fade">
          <v-row v-if="downtimeChecker">
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
              v-model="agencyID"   
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
              v-model="staffID"
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
            @click="handleRelease"
          >
            Release
          </v-btn>
        </v-col>
        </v-row>
      </v-form>
      <SuccessDialog @close-dialog="isSuccess = false" :isActive="isSuccess" />
      <SuccessDialog
  :isActive="showEndProcessDialog"
  @close-dialog="showEndProcessDialog = false"
/>
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
      <ErrorDialog 
        :isOpen="formAction.formErrorMessage.length !== 0"
        :errorMessage="formAction.formErrorMessage"
        @on-close="formAction.formErrorMessage = ''"
      />
    </v-card-text>
  </v-card>
</template>