<script setup>
import { ref, onMounted } from 'vue';
import supabase from '@/components/system/accomplishments/scoreboard/supabase';
import '@/assets/dashboard.css';

const activeRow = ref('row1');
const userUUID = ref(null);
const scoreboardData = ref([]);
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
      .eq('status', 'Pending')
      .in('level', ['Secretary']);
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

console.log(scoreboardData.value);
import { useRouter } from 'vue-router';

const router = useRouter();

const goToAddScoreboard = (item) => {
 
  router.push({
    path: '/add-scoreboard-secretary-level',
    query: {
      dms_reference_number: item.dms_reference_number,
      date_received: item.date_received,
      unformatted_date: item.unformatted_date,
      agency_name: item.agency_name,
      scoreboard_id: item.scoreboard_id,
      process_id: item.process_id,
      from_id: item.from_id
    }
  });
};

onMounted(async () => {
  await fetchLoggedInUser();
  await fetchScoreboardData();
});
</script>
<template>
 <v-card-text>
    <v-row>
              <!-- Control Buttons -->
            <v-btn @click="activeRow = 'row1'" :color="activeRow === 'row1' ? 'primary' : 'default'" class="me-2">
              Technical
            </v-btn>
            <v-btn @click="activeRow = 'row2'" :color="activeRow === 'row2' ? 'primary' : 'default'">
              FAD
            </v-btn>
    </v-row>
       <v-row v-row  v-if="activeRow === 'row1'" class="mt-4">
        <v-col>
            <v-container>
                <v-card>
                <v-card-title>Pending DMS:</v-card-title>
                <v-card-text>
              <v-data-table :items="scoreboardData" class="elevation-1">
                <template v-slot:headers>
                  <tr>
                    <th>DMS Reference Number</th>
                    <th>Date Received</th>
                    <th>Name</th>
                    <th>Agency</th>
                    <th><b>Action</b></th>
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
                        class="me-2" 
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
       
      </v-row>
      <!-- Start For FAD section -->

      <v-row v-if="activeRow === 'row2'" class="mt-4">
        <v-col>
            <v-container>
                <v-card>
                <v-card-title>PENDING FAD DMS:</v-card-title>
                <v-card-text>
                  <v-data-table :items="releasedFAD" class="elevation-1">
                <template v-slot:headers>
                  <tr>
                    <th>DMS Reference Number</th>
                    <th>Date Received</th>
                    <th>Name</th>
                    <th>Type of Transaction</th>
                    <th>DMS Title</th>
                    <th>Action</th>
                  </tr>
                </template>
                <template v-slot:body="{ items }">
                  <tr v-for="item in items" :key="item.scoreboard_id">
                    <td>{{ item.dms_reference_number }}</td>
                    <td>{{ item.date_received }}</td>
                    <td>{{ item.name }}</td>
                    <td>{{ item.type_of_transaction }}</td>
                    <td>{{ item.dms_title }}</td>
                    <td>
                      <v-btn 
                        color="primary" 
                        size="small" 
                        class="me-2" 
                        @click="goToFadreleasing(item)"
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
       
      </v-row>
       <!-- End For FAD section -->
    </v-card-text>
</template>