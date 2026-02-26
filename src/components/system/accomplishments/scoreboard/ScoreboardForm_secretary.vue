<script setup>
import { ref, defineProps, onMounted } from 'vue'
import { format } from 'date-fns'
import '@/assets/scoreboard.css'
import ScoreboardFormDialog from './ScoreboardFormDialog.vue'
import SuccessDialog from './SuccessDialog2.vue'
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
const DivisionChiefId = ref(null)
const selDateForwarded = ref(null);
const showDialog = ref(false);
const dateForwardedDialog = ref(false);
const ard_remark = ref(null);
const props = defineProps({
  dmsReferenceNumber: String,
  dateReceived: String,
  unformattedDate: String,
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
  options,
  prescribedPeriodValues,
  type_of_transaction,
  //type_of_downtime,
  nature_of_transaction,
  fetchPAP,
  papData,
  requiredValidator
} = useScoreboardLogic();

const downtimeChecker = ref(false);

formData.dateReceivedRecordSection = ref(format(new Date(), 'yyyy-MM-dd'))
const dateForwardedValue = ref(format(new Date(), 'yyyy-MM-dd'))
const selectedTimeForwarded = ref(format(new Date(), 'HH:mm'))
const timeDialogForwarded = ref(false)

const downtimeValue = ref(null);
const remark = ref(null);
const downtimeFlag = ref(0); 
const userUUID = ref(null);
const scoreboardId = props.scoreboardId;
const unformattedDate = props.unformattedDate;
const fromId = props.processId;

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
  console.log("✅ User UUID:", userUUID.value);
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

const releasing_id = ref(null);
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
const fetchDivisionChiefId = async () => {
  if (!userDivisionId.value) {
    console.error("User Division ID is not available.");
    return;
  }

  const { data, error } = await supabase
    .from('technical_division_user_roles')
    .select('user_id') 
    .eq('user_role', 'Division Chief')
    .eq('division_id', userDivisionId.value);

  if (error) {
    console.error("Error fetching division chief ID:", error);
    return;
  }

  if (data.length === 0) {
    console.warn("No Division Chief found for this division.");
    return;
  }

  DivisionChiefId.value = data[0].user_id;
  console.log("✅ Retrieved User Division Chief ID:", DivisionChiefId.value);
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
onMounted(async () => {
  formData.dateForwarded = dateForwardedValue.value;
  fetchTypeOfDowntime();
  await fetchLoggedInUser();      
  await fetchUserDivisionId();    
  await fetchDivisionChiefId();
  await fetchReleasingId();
  selectedTimeForwarded.value = format(new Date(), 'HH:mm');
});

const handleFormSubmit = async () => { 

 // const scoreboardId = formData.scoreboardId.value;
   console.log("Date selected: ", selDateForwarded.value);
  const dateForFormatting = selDateForwarded.value
      ? format(new Date(selDateForwarded.value), "yyyy-MM-dd") 
      : null; 
   if (!selectedLevel.value) {
    validationError.value = "❌ A process level must be selected";
    return;
  }
  if (!selDateForwarded.value) {
    validationError.value = "❌ Date Forwarded is required.";
    return;
  }

  if (!selectedTimeForwarded.value) {
    validationError.value = "❌ Time Forwarded is required.";
    return;
  }
  
  const combinedDateTime = `${dateForFormatting}T${selectedTimeForwarded.value}:00`;
  console.log("📅 Combined DateTime:", combinedDateTime);
 
  validationError.value = "";
  formErrorMessage.value = "";

  console.log("Scoreboard ID is ", scoreboardId);
  const updateData = {
    date_forwarded: combinedDateTime,
    level: selectedLevel.value,
    status: "Accepted"
  };
  try {
    const { data, error: updateError } = await supabase
        .from('scoreboard_technical_process')
        .update(updateData)
        .eq('id', formData.processId)
        .select();
   
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
        owner_id: releasing_id.value,
        from_id: userUUID.value,
        level: 'Releasing',
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
const selectedLevel = ref('')
const levels = ['Assistant Regional Director', 'Regional Director']

const confirmedfunction = async () => {
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
  const combinedDateTime = `${dateForFormatting}T${selectedTimeForwarded.value}:00`;
  console.log("📅 Combined DateTime:", combinedDateTime);
  try{
      const updateData = {
      status: 'Forwarded',
      date_forwarded:combinedDateTime,
      level: levels.value,
    };
    const { data: updatedRows, error: updateError } = await supabase
      .from('secretary_technical')
      .update(updateData)
      .eq('scoreboard_id', props.scoreboardId)
      .select();

    if (updateError) {
      console.error("❌ Update error (secretary-technical):", updateError);
      throw new Error("Failed to update secretary-technical.");
    }
    console.log("✅ Updated secretary_technical", updatedRows);
        alert("Successfully Updated DMS");
  } catch (err) {
    console.error("❌ Caught error in updating secretay_technical:", err);
    formErrorMessage.value = err.message || "An unknown error occurred while submitting the form.";
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
              Process_id: <b style="padding-left: 10px;">{{ processId }}</b>
            </p>
          <p class="ms-4 text-wrap">
              Scoreboard_id: <b style="padding-left: 10px;">{{ scoreboardId }}</b>
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
          <v-col>
            <v-select
              v-model="selectedLevel"
              :items="levels"
              label="Select Level"
              outlined
            ></v-select>
          </v-col>
          <v-col></v-col>
        </v-row>
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
            text="Submit to Releasing" 
            type="submit" 
            color="green-darken-4"
          >
          </v-btn>
        </v-row>
      </v-form>
    <v-dialog v-model="showDialog" max-width="500">
        <v-card>
          <v-card-title class="text-h6">
            Confirm Assistant Regional Director is not available.
          </v-card-title>
          <v-card-text>
            <v-row>
              <v-text-field
                v-model="ard_remark"
                label="Enter Remarks"
                type="text"
              ></v-text-field>
            </v-row>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="grey" @click="showDialog = false">Cancel</v-btn>
            <v-btn color="blue-darken-4" @click="confirmedfunction">Confirm</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>  
   <SuccessDialog v-model="isSuccess" @closed="routePage" />      
      <ErrorDialog 
        :isOpen="formAction.formErrorMessage.length !== 0"
        :errorMessage="formAction.formErrorMessage"
        @on-close="formAction.formErrorMessage = ''"
      />
    </v-card-text>
  </v-card>
</template>