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
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  }).format(date);
};

// ✅ Fetch scoreboard data from Supabase
const fetchScoreboardData = async () => {
  if (!userUUID.value) {
    console.log("❌ User UUID is not set, skipping fetchScoreboardData.");
    return;
  }

  console.log("✅ Fetching data for User UUID:", userUUID.value);

  try {
    const { data, error } = await supabase
      .from('individualwelcome')
      .select('*')
      .eq('owner_id', userUUID.value)  
      .eq('status', 'Pending');

    console.log("🔍 Raw Supabase view response:", JSON.stringify(data, null, 2));

    if (error) {
      console.error("❌ Error fetching data from view:", error);
      return;
    }

    if (!Array.isArray(data)) {
      console.error("❌ Supabase returned an invalid format:", data);
      return;
    }

    // ✅ Format and assign the filtered data
    scoreboardData.value = data.map(row => ({
      dms_reference_number: row.dms_reference_number,
      date_received: row.date_received, 
      agency_name: row.agency_name || "N/A",
      status: "Pending",  // You can customize or include status in the view if needed
      scoreboard_id: row.scoreboard_id,
      process_id: row.process_id
    }));

    console.log("✅ Final scoreboardData from view:", JSON.stringify(scoreboardData.value, null, 2));
  } catch (err) {
    console.error("Unexpected error fetching scoreboard data:", err);
  } finally {
    loading.value = false;
  }
};
const headers = ref([
  { text: 'DMS Reference Number', value: 'dms_reference_number' },
  { text: 'Date Received', value: 'date_received' },
  { text: 'Agency Name', value: 'agency_name' },  // ✅ Corrected ordering
  { text: 'Status', value: 'status' }
]);
console.log(scoreboardData.value);
import { useRouter } from 'vue-router';

const router = useRouter();

const goToAddScoreboard = (item) => {
  if (!item.scoreboard_id) {
    console.warn("⛔ Missing scoreboard_id, cannot proceed.");
    return;
  }
  router.push({
    path: '/add-scoreboard-individual',
    query: {
      dms_reference_number: item.dms_reference_number,
      date_received: item.date_received,
      agency_name: item.agency_name,
      scoreboard_id: item.scoreboard_id,
      process_id: item.process_id
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
        <v-col cols="12" md="8">
            <v-container>
                <v-card>
                <v-card-title>📊 Scoreboard Receiving Data</v-card-title>
                <v-card-text>
                  <v-data-table
                  :items="scoreboardData"
                  :headers="headers"
                  :items-per-page="10"
                  :loading="loading"
                  item-value="dms_reference_number"
                  class="elevation-1"
                >
                  <template v-slot:item.status="{ item }">
                    <v-btn 
                      color="primary" 
                      size="small" 
                      @click="goToAddScoreboard(item)"
                    >
                      Process
                    </v-btn>
                  </template>
                </v-data-table>
                </v-card-text>
                </v-card>
            </v-container>
        </v-col>
        <v-col cols="12" md="4">
          <h3 class = "text-center">
            Breakdown of Transaction/Request <br>
            Acted per Nature of Transaction as of
          </h3>
          <div class="pie-chart"></div>
        </v-col>
      </v-row>
    </v-card-text>
</template>