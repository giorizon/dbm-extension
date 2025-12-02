<script setup>
import { ref, onMounted } from 'vue';
import supabase from '@/components/system/accomplishments/scoreboard/supabase'
//import supabase from './supabase';  // Ensure Supabase is properly configured
import '@/assets/dashboard.css';

const userUUID = ref(null);
const PendingReceiving = ref([]);
const TechnicalDMS = ref([]);
const loading = ref(true);
//const tdId = ref(null);

// ✅ Fetch the logged-in user
const fetchLoggedInUser = async () => {
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError) {
    console.error("❌ Error fetching user:", userError);
    return;
  }

  userUUID.value = userData?.user?.id;
  console.log("✅ User UUID:", userUUID.value);
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
const fetchpendingreceiving = async () => {
  loading.value = true;

  try {
    const { data, error } = await supabase
      .from('fad_receiving_monitor')
      .select('*')
      .eq('receiver_id', userUUID.value); 

    if (error) {
      console.error("❌ Error fetching scoreboard data:", error);
      return;
    }
    PendingReceiving.value = data.map(row => ({
      dms_reference_number: row.dms_reference_number,
      date_received: formatDate(row.date_received),
      date_forwarded: formatDate(row.date_forwarded),
      owner: row.owner,
      receiving: row.receiving,
      owner_id: row.owner_id,
      receiving_id: row.receiving_id,
      status: row.status,
      sub_unit: row.sub_unit,
      current_owner_id: row.current_owner_id,
      current_owner: row.current_owner,
      scoreboard_id: row.scoreboard_id,
      proess_id: row.process_id
    }));

    console.log("Fetch row :", PendingReceiving);
  } catch (err) {
    console.error("❌ Unexpected error fetching Pending Receving Report data:", err);
  } finally {
    loading.value = false;
  }
};

const fetchprocesseddms = async () => {
  loading.value = true;

  try {
    const { data, error } = await supabase
      .from('view_technical_tracker')
      .select('*');
    if (error) {
      console.error("❌ Error fetching scoreboard data:", error);
      return;
    }
    TechnicalDMS.value = data.map(row => ({
      dms_reference_number: row.dms_reference_number,
      date_forwarded: formatDate(row.date_forwarded),
      date_received: formatDate(row.date_received),
      owner: row.owner,
      status: row.status,
      owner_id: row.owner_id,
      level: row.level
    }));

    console.log("Fetch row :", TechnicalDMS);
  } catch (err) {
    console.error("❌ Unexpected error fetching Pending Receving Report data:", err);
  } finally {
    loading.value = false;
  }
};


// ✅ Run on page load
onMounted(async () => {
  await fetchLoggedInUser();
  await fetchpendingreceiving();
  await fetchprocesseddms();
});

</script>
<template>
 <v-card-text>
     
      <v-row>
        <v-col>        
          <v-container>
                <v-card>
                <v-card-title><b>FAD DMS</b></v-card-title>
                <v-card-text>
                 <v-data-table :items="PendingReceiving" class="elevation-1">
                  <template v-slot:headers>
                    <tr>
                      <th>DMS Reference Number</th>
                      <th>Sub Unit</th>
                      <th>Current Owner</th>
                      <th>Date Received</th>
                      <th>Date Forwarded</th>
                      <th>Status</th>
                    
                    </tr>
                  </template>
                  <template v-slot:body="{ items }">
                    <tr v-for="item in items" :key="item.dms_reference_number">
                      <td>{{ item.dms_reference_number }}</td>
                      <td>{{ item.sub_unit }}</td>   
                      <td>{{ item.current_owner }}</td> 
                      <td>{{ item.date_received }}</td>
                      <td>{{ item.date_forwarded }}</td>
                      <td>{{ item.status }}</td>
                    </tr>
                  </template>
                 </v-data-table>
                </v-card-text>
                </v-card>
            </v-container>
          </v-col>
          <v-col>

          </v-col>
      </v-row>
      <v-row>
        <v-col>
              <v-container>
                <v-card>
                <v-card-title><b>Technical DMS</b></v-card-title>
                <v-card-text>
                 <v-data-table :items="TechnicalDMS" :search="search" class="elevation-1">
                  <template v-slot:headers>
                    <tr>
                      <th>DMS Reference Number</th>
                      <th>Owner</th>
                      <th>Level</th>
                      <th>Date Received</th>
                      <th>Date Forwarded</th>
                      <th>Status</th>
                    </tr>
                  </template>
                  <template v-slot:body="{ items }">
                    <tr v-for="item in items" :key="item.dms_reference_number">
                      <td>{{ item.dms_reference_number }}</td>
                      <td>{{ item.owner }}</td>
                      <td>{{ item.level }}</td>
                      <td>{{ item.date_received }}</td>
                      <td>{{ item.date_forwarded }}</td>
                      <td>{{ item.status }}</td>
                    </tr>
                  </template>
                 </v-data-table>
                </v-card-text>
                </v-card>
            </v-container>
          </v-col>
          <v-col>
            
          </v-col>
      </v-row>
    </v-card-text>
</template>