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
const DivisionChiefId = ref(null)

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
  //handleDialogFormSubmit,
  //handleFormSubmit,
  formData,
  formAction,
 // isSuccess,
  refVForm,
  RD_NAME,
  prescribedPeriodValues,
  //type_of_downtime,
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

const newDocument = ref('');
const releasedDocuments = ref([]);

const processId = props.processId;
const scoreboardId = props.scoreboardId;

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

// Ensure default values are set on component mount
onMounted(async () => {
  formData.dateForwarded = dateForwardedValue.value;
  fetchTypeOfDowntime();
  await fetchLoggedInUser();      
  await fetchUserDivisionId();    
  await fetchDivisionChiefId();
  selectedTimeForwarded.value = format(new Date(), 'HH:mm');
});
const successMessage = ref("DMS Successfully Released");

const addDocument = () => {
  if (newDocument.value.trim()) {
    releasedDocuments.value.push(newDocument.value.trim());
    newDocument.value = ''; // reset input
  }
};

const removeDocument = (index) => {
  releasedDocuments.value.splice(index, 1);
};


const handleFormSubmit = async () => {
  console.log("--- Starting handleFormSubmit ---");
  console.log("selDateForwarded.value:", selDateForwarded.value);
  console.log("selectedTimeForwarded.value:", selectedTimeForwarded.value);

  const dateForFormatting = selDateForwarded.value
    ? format(new Date(selDateForwarded.value), "yyyy-MM-dd")
    : null;

  if (!selDateForwarded.value) {
    validationError.value = "❌ Date Forwarded is required.";
    console.log(validationError.value);
    return;
  }

  if (!selectedTimeForwarded.value) {
    validationError.value = "❌ Time Forwarded is required.";
    console.log(validationError.value);
    return;
  }

  const combinedDateTime = `${dateForFormatting}T${selectedTimeForwarded.value}:00`;
  console.log("📅 Combined DateTime:", combinedDateTime);

  validationError.value = "";
  formErrorMessage.value = "";
  successMessage.value = ""; // Clear previous success messages
  isSuccess.value = false; // Reset success state

  console.log("Scoreboard ID is ", scoreboardId.value); // Access .value for refs
  console.log("formData.processId:", formData.processId);

  const updateData = {
    date_released: combinedDateTime,
    status: "Released"
  };

  try {
    console.log("Attempting to update scoreboard_technical_process...");
    const { data: updatedProcessData, error: updateError } = await supabase
      .from('scoreboard_technical_process')
      .update(updateData)
      .eq('id', formData.processId)
      .select(); // Add .select() to get the updated data back, useful for debugging

    if (updateError) {
      console.error("Supabase Update Error:", updateError.message);
      throw updateError;
    }
    if (!updatedProcessData || updatedProcessData.length === 0) {
      console.error("Update failed: No matching process ID found for update.");
      throw new Error("Update failed: No matching process ID found.");
    }
    console.log("scoreboard_technical_process updated successfully:", updatedProcessData);
    successMessage.value = "✅ DMS Released Successfully";
    isSuccess.value = true;

    // --- Downtime Section ---
    console.log("downtimeFlag.value:", downtimeFlag.value);
    if (downtimeFlag.value === 1) {
      console.log("Entering downtime insert block.");
      console.log("downtimeValue.value:", downtimeValue.value);
      console.log("remark.value:", remark.value);

      const { error: insertError, data: insertedData } = await supabase
        .from('technical_downtime')
        .insert([{
          downtime: downtimeValue.value,
          process_id: formData.processId,
          remark: remark.value
        }])
        .select(); // Add .select() to get the inserted data back

      console.log("Insert technical_downtime response:", insertedData, insertError);
      if (insertError) {
        console.error("Supabase Downtime Insert Error:", insertError.message);
        throw insertError;
      }
      const newInsertedId = insertedData[0]?.id;
      console.log("New technical_downtime ID:", newInsertedId);
      console.log("Downtime data inserted successfully.");
    } else {
      console.log("downtimeFlag.value is not 1. Skipping downtime insert.");
    }

    // --- Released Documents Section ---
    console.log("Checking releasedDocuments array...");
    if (!releasedDocuments.value || releasedDocuments.value.length === 0) {
      console.log('The releasedDocuments array is null/undefined or empty. Skipping document insert.');
    } else {
      console.log("Start inserting for released documents.");
      try {
        console.log("Inside the try block for released documents insert.");
        // The check for length === 0 here is redundant if the outer `if` passed.
        // But keeping it for clarity based on your original code.
        if (releasedDocuments.value.length === 0) {
            console.log('No documents to save in inner check. This should not be reached if outer check passed.');
            return;
        }
        console.log("Scoreboard ID for the released Document:", formData.scoreboardId);
        const dataToInsert = releasedDocuments.value.map(docName => ({
            name: docName,
            scoreboard_id: formData.scoreboardId, // Ensure scoreboardId.value is defined
        }));
        console.log("Data to insert for released_document:", dataToInsert);

        const { data: insertedDocs, error: docsInsertError } = await supabase
            .from('released_document')
            .insert(dataToInsert)
            .select(); // Add .select() to get the inserted data back

        if (docsInsertError) {
            console.error('Supabase Released Documents Insert Error:', docsInsertError.message);
            throw docsInsertError; // Throw to be caught by the outer catch, or handle locally
        }
        console.log('Documents successfully inserted:', insertedDocs);
      } catch (e) {
          console.error('An unexpected error occurred during released documents insert:', e.message);
          formErrorMessage.value = `Error saving documents: ${e.message}`;
      }
    }
    console.log("--- handleFormSubmit finished successfully (or with handled errors) ---");

  } catch (err) {
    console.error("--- Caught an error in handleFormSubmit ---");
    console.error("Error details:", err);
    formErrorMessage.value = err.message || "Failed to submit the form due to an unknown error.";
    isSuccess.value = false; 
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
        <v-row >
            <v-col>
               <v-text-field
                  v-model="newDocument"
                  label="Enter Released Document"
                  dense
                  outlined
                />
            </v-col>
             <v-col>
                 <v-btn color="primary" @click="addDocument" :disabled="!newDocument.trim()">
                  <v-icon left>mdi-plus</v-icon>Add
                </v-btn>
            
            </v-col>
             <v-col>
                 
            </v-col>
          </v-row>
          <v-row>
            <v-col>
            <v-table dense class="mt-4">
                      <thead>
                        <tr>
                          <th class="text-left">#</th>
                          <th class="text-left">Document Name</th>
                          <th class="text-left">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="(doc, index) in releasedDocuments" :key="index">
                          <td>{{ index + 1 }}</td>
                          <td>{{ doc }}</td>
                          <td>
                            <v-btn icon size="small" @click="removeDocument(index)">
                              <v-icon>mdi-close-circle</v-icon>
                            </v-btn>
                          </td>
                        </tr>
                      </tbody>
                    </v-table>
            </v-col>
            <v-col>
           
            </v-col>
            <v-col>

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
        <v-row>
            <!-- Table to Display Added Documents -->
          
          
        </v-row>
        <v-row dense>
          <v-spacer></v-spacer>
          <v-alert v-if="validationError" type="error" class="mb-3">
            {{ validationError }}
          </v-alert>
          <v-btn 
            text="Release DMS" 
            type="submit" 
            color="green-darken-4"
          >
          </v-btn>
        </v-row>
      </v-form>

      <SuccessDialog @close-dialog="routePage" :isActive="isSuccess"  :message="successMessage" />
      <ErrorDialog 
        :isOpen="formAction.formErrorMessage.length !== 0"
        :errorMessage="formAction.formErrorMessage"
        @on-close="formAction.formErrorMessage = ''"
      />
    </v-card-text>
  </v-card>
</template>