<script setup>
import { ref, onMounted } from 'vue';
import supabase from '@/components/system/accomplishments/scoreboard/supabase'
//import supabase from './supabase';  // Ensure Supabase is properly configured
import '@/assets/dashboard.css';

const userUUID = ref(null);
const scoreboardData = ref([]);
const scoreboardData2 = ref([]);
const loading = ref(true);
const tdId = ref(null);

// ✅ Fetch the logged-in user
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
    const { data: tdData, error: tdError } = await supabase
      .from('technical_division_user')
      .select('td_id')
      .eq('user_id', userUUID.value)
      .single(); // Use .single() if you're expecting exactly one match

    if (tdError) {
      console.error("❌ Error fetching td_id:", tdError);
      return;
    }

    tdId.value = tdData?.td_id;
    console.log("✅ Retrieved td_id:", tdId.value);

    await fetchScoreboardData();
    await fetchScoreboardData2();
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
      .from('technical_individual_monitor')
      .select('*')
      .eq('owner_id', userUUID.value) // ✅ Filter by current user
      .eq('status', 'Pending')
      .in('level', ['Supervisor', 'Senior BMS', 'Supervising BMS']);
    if (error) {
      console.error("❌ Error fetching scoreboard data:", error);
      return;
    }

    scoreboardData.value = data.map(row => ({
      dms_reference_number: row.dms_reference_number,
      date_received: formatDate(row.date_received),
      name: row.name,
      status: row.status,
      agency_name: row.agency_name,
      process_id: row.process_id, 
      scoreboard_id: row.scoreboard_id
    }));

    console.log("✅ Filtered scoreboardData:", JSON.stringify(scoreboardData.value, null, 2));
  } catch (err) {
    console.error("❌ Unexpected error fetching scoreboard data:", err);
  } finally {
    loading.value = false;
  }
};

const fetchScoreboardData2 = async () => {
  loading.value = true;

  try {
    const { data, error } = await supabase
      .from('technical_individual_monitor')
      .select('*')
      .eq('owner_id', userUUID.value) // ✅ Filter by current user
      .eq('status', 'Pending')
      .eq('level', 'Individual');
    if (error) {
      console.error("❌ Error fetching scoreboard data 2:", error);
      return;
    }

    scoreboardData2.value = data.map(row => ({
      dms_reference_number: row.dms_reference_number,
      date_received: formatDate(row.date_received),
      name: row.name,
      status: row.status,
      agency_name: row.agency_name,
      process_id: row.process_id,
      scoreboard_id: row.scoreboard_id
    }));

    console.log("✅ Filtered scoreboardData2:", JSON.stringify(scoreboardData2.value, null, 2));
  } catch (err) {
    console.error("❌ Unexpected error fetching scoreboard data 2:", err);
  } finally {
    loading.value = false;
  }
};

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
      scoreboard_id: item.scoreboard_id,
      process_id: item.process_id
    }
  });
};

const goToAddScoreboard2 = (item) => {
 
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
  await fetchScoreboardData2();
});

</script>
<template>
 <v-card-text>
       <v-row>
        <v-col cols="12" md="6">
            <v-container>
                <v-card>
                <v-card-title>Pending DMS</v-card-title>
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
                        Pending
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
          
        </v-col>
      </v-row>
    </v-card-text>
</template>