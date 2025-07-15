<script setup>
import { ref, onMounted } from "vue";
import { scoreboardTableHeaders } from "@/components/system/accomplishments/scoreboard/scoreboardTableUtils";
import ConfirmDialog from "@/components/common/ConfirmDialog.vue";
import AlertNotification from "@/components/common/AlertNotification.vue";
import supabase from '@/components/system/accomplishments/scoreboard/supabase'
import { useScoreboardTable } from "@/composables/scoreboard/scoreboardTable";
import { useScoreboardStore } from "@/stores/scoreboard";

const scoreboardStore = useScoreboardStore();
const { onLoadItems, tableOptions, formAction } = useScoreboardTable();
const dialog = ref(false);
const userUUID = ref(null);
const userRole = ref(null);
const search = ref("");
const scoreboardData = ref([]);

const formatDate = (timestamp) => {
  if (!timestamp) return "N/A"; // Handle empty cases

  const date = new Date(timestamp);

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  }).format(date);
};

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

     await fetchScoreboardDataBasedOnRole(); 
    }catch (err) {
       console.error("❌ Unexpected error fetching scoreboard data:", err); 
    }
  }
};
const fetchScoreboardDataBasedOnRole = async () => {
  try {
    let tableName;

    if (userRole.value === 'FAD') {
      tableName = 'scoreboard_monitor_fad';
    } else {
      tableName = 'scoreboad_monitor'; // typo? maybe should be 'scoreboard_monitor'
    } 
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('from_id', userUUID.value);

    if (error) {
      console.error(`❌ Error fetching data from ${tableName}:`, error);
      return;
    }

    // 🛠 Normalize the data for consistent table rendering
    scoreboardData.value = data.map(row => {
      if (userRole.value === 'FAD') {
        return {
          dms_reference_number: row.dms_reference_number ?? '—',
          date_received: formatDate(row.date_received ?? row.date_forwarded),
          name: row.owner_name ?? row.name ?? '—',
          agency_name: row.sub_unit ?? '—',
          status: row.status ?? '—',
          process_id: row.process_id ?? null,
          scoreboard_id: row.scoreboard_id ?? null
        };
      } else {
        return {
          dms_reference_number: row.dms_reference_number ?? '—',
          date_received: formatDate(row.date_forwarded ?? row.date_received),
          name: row.name ?? '—',
          agency_name: row.agency_name ?? '—',
          level: row.level ?? '—',
          status: row.status ?? '—',
          process_id: row.process_id ?? null,
          scoreboard_id: row.scoreboard_id ?? null
        };
      }
    });

  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}
onMounted(async () => {
  await fetchLoggedInUser(); 

});
</script>

<template>
  <AlertNotification :form-success-message="formAction.formSuccessMessage"
    :form-error-message="formAction.formErrorMessage"></AlertNotification>

  <v-btn class="my-1" prepend-icon="mdi-account-plus" color="green-darken-1" @click="dialog = true">
            Add Received DMS
          </v-btn>

  <v-text-field
    v-model="search"
    label="Search"
    prepend-icon="mdi-magnify"
    clearable
    hide-details
    class="mb-4"
  />
 <v-data-table :items="scoreboardData"   :search="search" class="elevation-1">
                <template v-slot:headers>
                  <tr>
                    <th>DMS Reference Number</th>
                    <th>Date Received</th>
                    <th>Name</th>
                    <th>Agency/Sub Unit</th>
                    <th>Level</th>
                    <th>Status</th>
                    <th style = "text-align: center;" colspan ="2">Action</th>
                  </tr>
                </template>
                <template v-slot:body="{ items }">
                  <tr v-for="item in items" :key="item.dms_reference_number">
                    <td>{{ item.dms_reference_number }}</td>
                    <td>{{ item.date_received }}</td>
                    <td>{{ item.name }}</td>
                    <td>{{ item.agency_name }}</td>
                    <td>{{ item.level }}</td>
                    <td>{{ item.status }}</td>
                    <td>
                      <v-btn 
                        color="lime-darken-1" 
                        class="mr-2"
                        size="small" 
                        @click="goToAddScoreboard(item)"
                      >
                       <v-icon left>mdi-pencil</v-icon>
                        Edit
                      </v-btn>
                    </td>
                     <td>
                      <v-btn 
                        color="red-lighten-1" 
                        size="small" 
                        @click="goToAddScoreboard(item)"
                      ><v-icon left>mdi-delete</v-icon>
                        Delete
                      </v-btn>
                    </td>
                  </tr>
                </template>
              </v-data-table>
          
  <!-- Add Dialog -->
  <v-dialog v-model="dialog" max-width="500px">
      <v-card 
          prepend-icon="mdi-account-multiple-plus" 
          title=" Add Scoreboard Record"
          class ="pt-3"
          subtitle="Please select a user category to add a scoreboard record. ">
          <v-container class="d-flex justify-center ">
          <v-row justify="center" dense style="max-width: 400px;">
            <v-col cols="6">
              <v-btn color="blue-darken-4" block to="/add-scoreboard-fad">
                FAD
              </v-btn>
            </v-col>
            <v-col cols="6">
              <v-btn class="mb-6" color="red-darken-4" block to="/add-scoreboard">
                Technical
              </v-btn>
            </v-col>
          </v-row>
        </v-container>
        <v-divider></v-divider>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn class="mr-5 my-2" text="Close" variant="plain" prepend-icon="mdi-close" @click="dialog = false"></v-btn>
        </v-card-actions>
      </v-card>
     </v-dialog>

  <ConfirmDialog v-model:is-dialog-visible="isDialogVisible"
    text="Are you sure you want to delete scoreboard record?" title="Delete Scoreboard"
    @confirm="onConfirmDelete"></ConfirmDialog>
</template>