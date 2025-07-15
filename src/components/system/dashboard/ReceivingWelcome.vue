<script setup>
import { ref, onMounted } from 'vue';
import supabase from '@/components/system/accomplishments/scoreboard/supabase'
//import supabase from './supabase';  // Ensure Supabase is properly configured
import '@/assets/dashboard.css';

const userUUID = ref(null);
const PendingReceiving = ref([]);
const ProcesedFadDMS = ref([]);
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
      date_forwarded: formatDate(row.date_forwarded),
      owner: row.owner,
      receiving: row.receiving,
      owner_id: row.owner_id,
      receiving_id: row.receiving_id,
      remark: row.remark,
      scoreboard_id: row.scoreboard_id
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
      .from('processed_fad_monitor')
      .select('*');
    if (error) {
      console.error("❌ Error fetching scoreboard data:", error);
      return;
    }
    ProcesedFadDMS.value = data.map(row => ({
      dms_reference_number: row.dms_reference_number,
      date_forwarded: formatDate(row.date_forwarded),
      owner_user: row.owner_user,
      from_user: row.from_user,
      owner_id: row.owner_id,
      sub_unit: row.sub_unit
    }));

    console.log("Fetch row :", ProcesedFadDMS);
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
                <v-card-title><b>FAD : Received DMS</b></v-card-title>
                <v-card-text>
                 <v-data-table :items="PendingReceiving" class="elevation-1">
                  <template v-slot:headers>
                    <tr>
                      <th>DMS Reference Number</th>
                      <th>Date Forwarded</th>
                      <th>Process Owner</th>
                      <th>Status</th>
                    </tr>
                  </template>
                  <template v-slot:body="{ items }">
                    <tr v-for="item in items" :key="item.dms_reference_number">
                      <td>{{ item.dms_reference_number }}</td>
                      <td>{{ item.date_forwarded }}</td>
                      <td>{{ item.owner }}</td>
                      <td>{{ item.remark}}</td>
                    </tr>
                  </template>
                 </v-data-table>
                </v-card-text>
                </v-card>
            </v-container>
          </v-col>
          <v-col>
              <v-container>
                <v-card>
                <v-card-title><b>FAD : Processed DMS</b></v-card-title>
                <v-card-text>
                 <v-data-table :items="ProcesedFadDMS" class="elevation-1">
                  <template v-slot:headers>
                    <tr>
                      <th>DMS Reference Number</th>
                      <th>Date Forwarded</th>
                      <th>Previous Owner</th>
                      <th>Current Owner</th>
                      <th>Sub Unit</th>
                    </tr>
                  </template>
                  <template v-slot:body="{ items }">
                    <tr v-for="item in items" :key="item.dms_reference_number">
                      <td>{{ item.dms_reference_number }}</td>
                      <td>{{ item.date_forwarded }}</td>
                      <td>{{ item.from_user }}</td>
                      <td>{{ item.owner_user }}</td>
                      <td>{{ item.sub_unit}}</td>
                    </tr>
                  </template>
                 </v-data-table>
                </v-card-text>
                </v-card>
            </v-container>
          </v-col>
      </v-row>
      <v-row>
        <v-container>
                <v-card>
                <v-card-title>Technical DNS Processes:</v-card-title>
                <v-card-text>
                 
                </v-card-text>
                </v-card>
            </v-container>
      </v-row>
    </v-card-text>
</template>