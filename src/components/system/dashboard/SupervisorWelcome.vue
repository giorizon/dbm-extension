<script setup>
import { ref, onMounted } from 'vue';
import supabase from '@/components/system/accomplishments/scoreboard/supabase'
//import supabase from './supabase';  // Ensure Supabase is properly configured
import '@/assets/dashboard.css';

const userUUID = ref(null);
const scoreboardData = ref([]);
const loading = ref(true);

// ✅ Fetch the logged-in user
const fetchLoggedInUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    console.error("Error fetching user:", error);
    return;
  }
  userUUID.value = data?.user?.id;
  console.log("✅ User UUID:", userUUID.value);

  if (userUUID.value) {
    await fetchScoreboardData();  // Fetch only after UUID is set
  }
};
const formatDate = (timestamp) => {
  if (!timestamp) return "N/A"; // Handle empty cases

  const date = new Date(timestamp);

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  }).format(date);
};

// ✅ Fetch scoreboard data from Supabase
const fetchScoreboardData = async () => {
  loading.value = true;

  try {
    const { data, error } = await supabase
      .from('accepted_individual_scoreboard6')
      .select('*');

    if (error) {
      console.error("❌ Error fetching scoreboard data:", error);
      return;
    }

    scoreboardData.value = data.map(row => ({
      dms_reference_number: row.dms_reference_number,
      date_received: formatDate(row.date_forwarded),
      name: row.name,
      status: row.status,
      agency_name: row.agency_name,
      scoreboard_supervising_id: row.scoreboard_supervising_id,
    }));

    console.log("✅ Final scoreboardData:", JSON.stringify(scoreboardData.value, null, 2));
  } catch (err) {
    console.error("❌ Unexpected error fetching scoreboard data:", err);
  } finally {
    loading.value = false;
  }
};
const headers = ref([
  { text: 'DMS Reference Number', value: 'dms_reference_number' },
  { text: 'Date Received', value: 'date_received' },
  { text: 'Name', value: 'name' },
  { text: 'Status', value: 'status' },
  { text: 'Agency', value: 'agency_name' },
  
]);
console.log(scoreboardData.value);
import { useRouter } from 'vue-router';

const router = useRouter();

const goToAddScoreboard = (item) => {
 
  router.push({
    path: '/add-scoreboard-supervisor',
    query: {
      dms_reference_number: item.dms_reference_number,
      date_received: item.date_received,
      agency_name: item.agency_name,
      scoreboard_supervising_id: item.scoreboard_supervising_id
    }
  });
};
// ✅ Run on page load
onMounted(async () => {
  await fetchLoggedInUser();
  await fetchScoreboardData();
});

</script>
<template>
 <v-card-text>
       <v-row>
        <v-col cols="12" md="6">
            <v-container>
                <v-card>
                <v-card-title>From Individual:</v-card-title>
                <v-card-text>
                  <v-data-table :items="scoreboardData" class="elevation-1">
                <template v-slot:headers>
                  <tr>
                    <th>DMS Reference Number</th>
                    <th>Date Received</th>
                    <th>Name</th>
                    <th>Agency</th>
                    <th>Status</th>
                  </tr>
                </template>
                <template v-slot:body="{ items }">
                  <tr v-for="item in items" :key="item.dms_reference_number">
                    <td>{{ item.dms_reference_number }}</td>
                    <td>{{ item.date_received }}</td>
                    <td>{{ item.name }}</td>
                    <td>{{ item.agency_name }}</td>
                    <td>
                      <v-btn 
                        color="primary" 
                        size="small" 
                        @click="goToAddScoreboard(item)"
                      >
                        Accept
                      </v-btn>
                    </td>
                  </tr>
                </template>
              </v-data-table>
                </v-card-text>
                </v-card>
            </v-container>
        </v-col>
        <v-col cols="12" md="6">
          <v-container>
                <v-card>
                <v-card-title>From Receiving:</v-card-title>
                <v-card-text>
                  <v-data-table :items="scoreboardData2" class="elevation-1">
             
              </v-data-table>
                </v-card-text>
                </v-card>
            </v-container>
        </v-col>
      </v-row>
    </v-card-text>
</template>