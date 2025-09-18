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
const assignableUsers = ref([]);
const formatDate = (timestamp) => {
  if (!timestamp) return "N/A"; // Handle empty cases

  const date = new Date(timestamp);

  return new Intl.DateTimeFormat("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric"
  }).format(date);
};

const props = defineProps({
  dmsReferenceNumber: String,
  dateReceived: String,
  agencyName: String,
  scoreboardId: String,
  processId: String
});

const {
  //handleDialogFormSubmit,
  //handleFormSubmit,
  formData,
  formAction,
 // isSuccess,
  refVForm,
  prescribedPeriodValues,
  type_of_transaction,
  //type_of_downtime,
  nature_of_transaction,
  fetchToTDowntime,
  fetchPAP,
  papData,
  requiredValidator
} = useScoreboardLogic();

const downtimeChecker = ref(false);


const selectedTimeForwarded = ref(format(new Date(), 'HH:mm'))
const timeDialogForwarded = ref(false)

const downtimeValue = ref(null);
const remark = ref(null);
const downtimeFlag = ref(0); 
const userUUID = ref(null);
const selectedAssignee = ref(null);
const selectedAssigneeRole = ref(null);
const selDateForwarded = ref(null);
const dateForwardedDialog = ref(false);

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
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    console.error("Error fetching user:", error);
    return;
  }
  userUUID.value = data?.user?.id;
  console.log("✅ User UUID:", userUUID.value);
};


const fetchUserDivisionId = async () => {
  if (!userUUID.value) {
    console.error("User UUID is not available.");
    return;
  }

  const { data, error } = await supabase
    .from('technical_division_user')
    .select('td_id') // Replace 'td_id' with the actual column name if different
    .eq('user_id', userUUID.value)
    .single(); // Use .single() if each user has only one role/row

  if (error) {
    console.error("Error fetching division ID:", error);
    return;
  }

  userDivisionId.value = data?.td_id;
  console.log("✅ Retrieved User Division ID:", userDivisionId.value);
};

const type_of_downtime = ref([])
  // Fetch Type of Transactions from Supabase
  const fetchTypeOfDowntime = async () => {
    try {
     
      const { data, error } = await supabase.from('type_of_downtime').select('id, name')
      if (error) {
        alert("error1");
        console.error('Error fetching Type of Downtime:', error)
        return
      }
      type_of_downtime.value = data.map(item => ({
        title: item.name,
        value: item.id
      }))
      console.log("Fetched Downtime Types:", data);
    } catch (err) {
      alert("error2");
      console.error('Unexpected error fetching Type of downtime:', err)
    }
  } 
formData.dmsReferenceNumber = props.dmsReferenceNumber;
formData.dateReceived = props.dateReceived;
formData.agencyName = props.agencyName;
formData.scoreboardId = props.scoreboardId;
formData.processId = props.processId;


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

// Ensure default values are set on component mount
onMounted(async () => {
  await fetchLoggedInUser(); 
  await fetchUserDivisionId();   
  await fetchUsersByDivision();
  await fetchTypeOfDowntime ();
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

  console.log("📅 Selected Date (after new Date()):", dateForFormatting);
console.log("📅 Selected Date:", dateForFormatting);
 const combinedDateTime = `${dateForFormatting}T${selectedTimeForwarded.value}:00`;
  console.log("📅 Combined DateTime:", combinedDateTime);

  validationError.value = "";
  formErrorMessage.value = "";

  if (!formData.scoreboardId?.value) {
    validationError.value = "❌ Scoreboard ID is required";
    return;
  }

  const scoreboardId = formData.scoreboardId.value;

  const updateData = {
    date_forwarded: combinedDateTime,
    status: 'Accepted'
  };

  try {
    console.log("🔄 Attempting to update scoreboard_technical_process with:", updateData, "for ID:", scoreboardId);

    const { error: updateError } = await supabase
      .from('scoreboard_technical_process')
      .update(updateData)
      .eq('id', formData.processId.value);

    if (updateError) {
      console.error("❌ Update failed:", updateError);
      throw updateError;
    }

    console.log("✅ Update successful.");

    // Additional debug info
    console.log("🕒 Downtime value:", downtimeValue.value);
    console.log("🗒️ Remark:", remark.value);
    console.log("🎯 Scoreboard ID Final:", scoreboardId);

    if (downtimeFlag.value === 1) {
      const downtimeInsertPayload = {
        downtime: downtimeValue.value,
        process_id: formData.processId.value,
        remark: remark.value
  };

      console.log("➕ Attempting to insert into technical_downtime with:", downtimeInsertPayload);

      const { error: insertError, data: insertedData } = await supabase
        .from('technical_downtime')
        .insert([downtimeInsertPayload]);

      if (insertError) {
        console.error("❌ Insert into technical_downtime failed:", insertError);
        throw insertError;
      }

      console.log("✅ Insert into technical_downtime successful:", insertedData);
    }

    const processInsertPayload = {
      scoreboard_id: scoreboardId,
      status: 'Pending',
      owner_id: selectedAssignee.value,
      from_id: userUUID.value,
      level: selectedAssigneeRole.value,
      date_received: combinedDateTime,
      date_forwarded: null
    };

    console.log("➕ Attempting to insert into scoreboard_technical_process with:", processInsertPayload);

    const { error: insertProcessError, data: insertedProcessData } = await supabase
      .from('scoreboard_technical_process')
      .insert([processInsertPayload]);

    if (insertProcessError) {
      console.error("❌ Insert into scoreboard_technical_process failed:", insertProcessError);
      throw insertProcessError;
    }
    console.log("✅ Insert into scoreboard_technical_process successful:", insertedProcessData);

    //adding to for type of transaction and nature of transaction
    console.log("Nature of transaction id", formData.value.particulars.nature);
    console.log("Type of transaction id", formData.value.particulars.type);
    
    const naturetypeInsertPayload = {
      not_id: formData.value.particulars.nature,
      tot_id: formData.value.particulars.type,
      scoreboard_id: scoreboardId
    };  
    const { error: errorTotNature, data: insertedTotNature} = await supabase
      .from('scoreboard_type_nature')
      .insert([naturetypeInsertPayload]);
    if (errorTotNature) {
      console.error("❌ Insert into scoreboard_type_nature failed:", errorTotNature);
      throw errorTotNature;
    }
    console.log("✅ Insert into scoreboard_type_nature successful:", insertedTotNature);
    isSuccess.value = true;


  } catch (err) {
    console.error("🔥 Form submission error:", err);
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
              DMS Reference Number: <b style="padding-left: 10px;">{{ dmsReferenceNumber }}</b>
            </p>
            <p class="ms-4 text-wrap">
              Date Received: <b style="padding-left: 10px;">{{ formatDate(dateReceived)  }}</b>
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
            <v-text-field
              :rules="[requiredValidator]"
              label="PAP"
              v-model="papData"
              outlined
              readonly
            />
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
              v-model="formData.particulars.type"
              @update:modelValue="fetchToTDowntime"
              >
            </v-select>
          </v-col>
           <v-col>
            <v-select 
                label="Assign to" 
                :items="assignableUsers" 
                item-title="title" 
                item-value="value"
                :rules="[requiredValidator]" 
                outlined 
                v-model="selectedAssignee"
                @update:modelValue="handleAssigneeChange"
              />
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