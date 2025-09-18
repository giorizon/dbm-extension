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
import { useRouter } from 'vue-router';
const router = useRouter();


const validationError = ref("")
const isSuccess = ref(false)
const formErrorMessage = ref("")
const userDivisionId = ref(null)
const selDateForwarded = ref(null);
const dateForwardedDialog = ref(false);
const props = defineProps({
  dmsReferenceNumber: String,
  dateReceived: String,
  agencyName: String,
  scoreboardId: String,
  processId: String
});

const {
  formData,
  formAction,
  refVForm,
  options,
  prescribedPeriodValues,
  requiredValidator
} = useScoreboardLogic();

const downtimeChecker = ref(false);

formData.dateReceivedRecordSection = ref(format(new Date(), 'yyyy-MM-dd'))
const selectedTimeForwarded = ref(format(new Date(), 'HH:mm'))
const timeDialogForwarded = ref(false)

const downtimeValue = ref(null);
const remark = ref(null);
const downtimeFlag = ref(0); 
const userUUID = ref(null);
const processId = props.processId;
const scoreboardId = props.scoreboardId;
const assignableUsers = ref([]);
const selectedAssignee = ref(null);
const currentUserRole = ref(null);
const selectedAssigneeRole = ref(null);
const showAssignTo = ref(null);
const type_downtime = ref(null);
const divisionChief_id = ref(null);

watch(downtimeChecker, (newVal) => {
  downtimeFlag.value = newVal ? 1 : 0;
});
function handleAssigneeChange(value) {
  const selected = assignableUsers.value.find(user => user.value === value);
  if (selected) {
    selectedAssigneeRole.value = selected.role;
    console.log("Selected role:", selectedAssigneeRole.value);
  }
}
const fetchLoggedInUser = async () => {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) {
    console.error("Error fetching user:", userError);
    return;
  }

  userUUID.value = userData?.user?.id;
  console.log("✅ User UUID:", userUUID.value);
    fetchUserDivisionId();
  const { data: roleData, error: roleError } = await supabase
    .from('technical_division_user_roles')
    .select('user_role')
    .eq('user_id', userUUID.value)
    .single(); // assume only one role per user

  if (roleError) {
    console.error("Error fetching user role:", roleError);
    return;
  }

  currentUserRole.value = roleData?.user_role;
  console.log("✅ Current User Role:", currentUserRole.value);

  // Set this to use in other logicd
  if (currentUserRole.value === 'Supervising BMS') {

    selectedAssigneeRole.value = 'Division Chief';
    selectedAssignee.value = divisionChief_id.value;
   
    showAssignTo.value = false; // hide the select
  } else {
   
    showAssignTo.value = true; // show the select for others
  }
};


const fetchUserDivisionId = async () => {
 
  if (!userUUID.value) {
    console.error("User UUID is not available.");
    return;
  }
  const { data, error } = await supabase
    .from('technical_division_user')
    .select('td_id') 
    .eq('user_id', userUUID.value)
    .single(); 
  if (error) {
    console.error("Error fetching division ID:", error);
    return;
  }
  userDivisionId.value = data?.td_id;
  console.log("✅ Retrieved User Division ID:", userDivisionId.value);

};

const fetchUserDivisionChiefId = async () => {
  if (!userDivisionId.value) {
    console.error("User userDiisionID is not available.");
    return;
  }
  const { data, error } = await supabase
    .from('technical_division_user_roles')
    .select('user_id') 
    .eq('division_id', userDivisionId.value)
    .eq('user_role', 'Division Chief')
    .single(); 

  if (error) {
    console.error("Error fetching division ID:", error);
    return;
  }
    divisionChief_id.value = data?.user_id;
  console.log("✅ Retrieved User Division Chief ID:", divisionChief_id.value);
};

const fetchUsersByDivision = async () => {
  if (!userDivisionId.value) {
    console.error("No division ID available");
    return;
  }

  const { data, error } = await supabase
    .from('technical_division_user_roles') // your view or table
    .select('user_id, supervisor, user_role')
    .eq('division_id', userDivisionId.value);

  if (error) {
    console.error("Error fetching users:", error);
    return;
  }

  assignableUsers.value = data
  .filter(user => user.user_id !== userUUID.value)
  .map(user => ({
    title: `[${user.user_role}] - ${user.supervisor}`,
    value: user.user_id,
    role: user.user_role  // <-- Add this line
  }));
};
const setLevelandOwner = async () =>{
  if (!currentUserRole.value) {
    console.error("No current user ID available");
    return;
  }
    // Set this to use in other logic
  if (currentUserRole.value === 'Supervising BMS') {
    selectedAssigneeRole.value = 'Division Chief';
    selectedAssignee.value = divisionChief_id.value;
   
    showAssignTo.value = false; // hide the select
  } else {
    showAssignTo.value = true; // show the select for others
  }
  console.log("Value of selectedAssigneeRole.value is", selectedAssigneeRole.value );
  console.log("Value of selectedAssignee.value is", selectedAssignee.value );
}

const fetchtypedowntime = async () => {

    console.log("scoreboardID is ", scoreboardId)

  const { data, error } = await supabase
    .from('view_tot_downtime') // your view or table
    .select('*')
    .eq('scoreboard_id',scoreboardId);

  if (error) {
    console.error("Error fetching users:", error);
    return;
  }
  type_downtime.value = data[0].tod_id;
  console.log("Type of downtime: ", type_downtime.value);
  
};

formData.dmsReferenceNumber = props.dmsReferenceNumber;
formData.dateReceived = props.dateReceived;
formData.agencyName = props.agencyName;
formData.scoreboardId = props.scoreboardId;
formData.processId = props.processId;

// Ensure default values are set on component mount
onMounted(async () => {

  await fetchLoggedInUser();      
  await fetchUsersByDivision();
  await fetchtypedowntime();
  await fetchUserDivisionChiefId();
    await setLevelandOwner();  
  selectedTimeForwarded.value = format(new Date(), 'HH:mm');
});

const handleFormSubmit = async () => { 

  console.log("Date selected: ", selDateForwarded.value);
  const dateForFormatting = selDateForwarded.value
      ? format(new Date(selDateForwarded.value), "yyyy-MM-dd") 
      : null; 
  if (!selDateForwarded.value) {
    validationError.value = "❌ Date Forwarded is required.";
    return;
  }

  if (!selectedTimeForwarded.value) {
    validationError.value = "❌ Time Forwarded is required.";
    return;
  }

  const combinedDateTime = `${dateForFormatting}T${selectedTimeForwarded.value}:00`; // Use the string value here
  console.log("📅 Combined DateTime:", combinedDateTime);
 
  validationError.value = "";
  formErrorMessage.value = "";
  // 🆕 Safely extract from formData
  const scoreboardId = formData.scoreboardId.value;
  //const typeDowntime = formData.typeDowntime || null;
  const updateData = {
    date_forwarded: combinedDateTime,
    status: "Accepted"
  };
  try {
   
      const { data, error: updateError } = await supabase
      .from('scoreboard_technical_process')
      .update(updateData)
      .eq('id', formData.processId)
      .select(); // <- fetch updated row back

    console.log("Update result:", data);

    if (updateError) throw updateError;
    if (!data || data.length === 0) {
      throw new Error("Update failed: No matching process ID found.");
    }

    console.log("Downtime ", downtimeValue.value);
    console.log("Remark:", remark.value);

    console.log("Scoreboard ID Final:", scoreboardId);

    if (downtimeFlag.value === 1) {
      const { error: insertError, data: insertedData } = await supabase
      .from('technical_downtime')
      .insert([{
        downtime: downtimeValue.value,
        process_id: formData.processId,
        remark: remark.value
      }])
       .select();
        console.log("Insert response:", insertedData, insertError);
        if (insertError) throw insertError;

        const newInsertedId = insertedData[0]?.id;
        console.log("New technical_individual_downtime ID:", newInsertedId);

        isSuccess.value = true;
    }
    const { error: insertError, data: insertedData } = await supabase
      .from('scoreboard_technical_process')
      .insert([{
        scoreboard_id: formData.scoreboardId,
        status: 'Pending',
        owner_id: selectedAssignee.value,
        from_id: userUUID.value,
        level: selectedAssigneeRole.value,
        date_received: combinedDateTime,
        date_forwarded: null
      }])
        .select();
        console.log("Insert response:", insertedData, insertError);
        if (insertError) {
          console.error("Insert error:", insertError);
          throw insertError;
        }
        
        isSuccess.value = true;
  } catch (err) {
    formErrorMessage.value = err.message || "Failed to submit the form.";
  } 
};
const routePage = async () => {
    router.push('/dashboard');
}
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
              Agency Name: <b style="padding-left: 10px;">{{ agencyName }}</b>
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
          <v-row>
          <v-col v-if="showAssignTo">
          <v-select 
            label="Assign to" 
            :items="assignableUsers" 
            item-title="title" 
            item-value="value"
            :rules="[requiredValidator]" 
            outlined 
            v-model="selectedAssignee"
            @update:modelValue="handleAssigneeChange"
          ></v-select>
        </v-col>
        <v-col>

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
              <v-text-field
              v-model="selDateForwarded"
              label="Date Forwarded"
              prepend-icon="mdi-calendar"
              readonly
               :value="selDateForwarded ? format(new Date(selDateForwarded), 'yyyy-MM-dd') : ''"
              @click="dateForwardedDialog = true"
            ></v-text-field>
        <v-dialog v-model="dateForwardedDialog" max-width="400">
          <v-card>
            <v-card-title>Select Date Forwarded</v-card-title>
            <v-card-text>
              <v-date-picker 
                v-model="selDateForwarded" 
                @update:model-value="dateForwardedDialog = false"
              />
            </v-card-text>
          </v-card>
        </v-dialog>
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
            color="green-darken-4"
          >
          </v-btn>
        </v-row>
      </v-form>

      <SuccessDialog @close-dialog="routePage" :isActive="isSuccess" />
      <ErrorDialog 
        :isOpen="formAction.formErrorMessage.length !== 0"
        :errorMessage="formAction.formErrorMessage"
        @on-close="formAction.formErrorMessage = ''"
      />
    </v-card-text>
  </v-card>
</template>