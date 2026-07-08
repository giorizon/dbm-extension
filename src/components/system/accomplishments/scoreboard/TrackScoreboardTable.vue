<script setup>
import { ref, onMounted, watch } from "vue";
import ConfirmDialog from "@/components/common/ConfirmDialog.vue";
import AlertNotification from "@/components/common/AlertNotification.vue";
import DeleteSuccessDialog from "@/components/common/DeleteSuccessDialog.vue";
import DeleteErrorDialog from "@/components/common/DeleteErrorDialog.vue";
import supabase from '@/components/system/accomplishments/scoreboard/supabase'
import { useScoreboardTable } from "@/composables/scoreboard/scoreboardTable";
import { useScoreboardLogic } from './scoreboardLogic.js'
import { useRouter } from 'vue-router';
import { formActionDefault } from '@/utils/supabase';
const router = useRouter();
import {
 trackProcesses,
 trackingHeaders,
 formatDate2
} from '@/utils/dashboardScript';

const {
  fetchLoggedInUser: logicFetchLoggedInUser,
  fetchUserDivisionId,
  fetchUsersByDivision,
}= useScoreboardLogic();

const formAction2 = ref({
  ...formActionDefault
})

const deleteSuccessDialog = ref(false)
const deleteErrorDialog = ref(false)
const deleteErrorMessage = ref("")

const {  formAction } = useScoreboardTable();

const userUUID = ref(null);
const userRole = ref(null);
const search = ref("");
const onConfirmDelete= ref(false);

const trackingData = ref([]);
const loading2 = ref(false);



const fetchLoggedInUser = async () => {
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError) {
    console.error("❌ Error fetching user:", userError);
    return;
  }

  userUUID.value = userData?.user?.id;
  console.log("✅ User UUID:", userUUID.value);

  // ✅ Now query your `technical_division_user` table using the user UUID
  if (userUUID.value) {
    try{
      const { data: profileData, error: profileError } = await supabase
      .from('user_profile_role')
      .select('user_role') // or 'user_role', depending on your schema
      .eq('user_id', userUUID.value)
      .single();

   if (profileError) {
      console.error("❌ Error fetching user role:", profileError);
      return;
    }
    userRole.value = profileData.user_role;
    console.log("✅ User role:", userRole.value);

    }catch (err) {
       console.error("❌ Unexpected error fetching scoreboard data:", err); 
    }
  }
};
const loadProcessTracker = async () => {
  loading2.value = true;
  
  const result = await trackProcesses();
  console.log("👉 Current Rows fetched from Supabase:", result);
  trackingData.value = result || []; 
  
  loading2.value = false;
};
onMounted(async () => {
  await fetchLoggedInUser(); 
  await logicFetchLoggedInUser();     // get the UUID
  await fetchUserDivisionId();        // get division using UUID
  await fetchUsersByDivision();   
  await loadProcessTracker();
});
</script>

<template>
  <AlertNotification :form-success-message="formAction.formSuccessMessage"
    :form-error-message="formAction.formErrorMessage"></AlertNotification>

 
  <v-text-field
    v-model="search"
    label="Search"
    prepend-icon="mdi-magnify"
    clearable
    hide-details
    class="mb-4"
  />
  
  <v-data-table
                    :items="trackingData"
                    :headers="trackingHeaders"
                    :items-per-page="10"
                    :search="search"
                    :loading="loading2"
                    item-value="id"
                    class="elevation-1"
                  >
                  <template #[`item.date_received`]="{ item }">
                    {{ formatDate2(item.date_received) }}
                  </template>
                  </v-data-table>
  
  <ConfirmDialog v-model:is-dialog-visible="isDialogVisible"  
    text="Are you sure you want to delete scoreboard record?" title="Delete Scoreboard"
    @confirm="onConfirmDelete"></ConfirmDialog>
    <DeleteSuccessDialog 
      v-model="deleteSuccessDialog"
      @after-close="router.push('/scoreboard')" 
    />

    <DeleteErrorDialog 
      v-model="deleteErrorDialog"
      :message="deleteErrorMessage"
    />

</template>