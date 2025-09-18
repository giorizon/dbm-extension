<script setup>
import { ref, onMounted } from 'vue';
import supabase from '@/components/system/accomplishments/scoreboard/supabase'
//import supabase from './supabase';  // Ensure Supabase is properly configured
import '@/assets/dashboard.css';

const userUUID = ref(null);
const InternalReportData = ref([]);
const ExternalReportData = ref([]);
const CitizenCharterData = ref([]);
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
const fetchInternalReport = async () => {
  loading.value = true;

  try {
    const { data, error } = await supabase
      .from('fad_internal_pending')
      .select('*')
      .eq('owner_id', userUUID.value); 
    if (error) {
      console.error("❌ Error fetching scoreboard data:", error);
      return;
    }

    InternalReportData.value = data.map(row => ({
      dms_reference_number: row.dms_reference_number,
      date_received: formatDate(row.date_received),
      report: row.report,
      status: row.status,
      sub_unit: row.sub_unit,
      owner_id: row.owner_id,
      scoreboard_id: row.scoreboard_id,
      process_id: row.process_id
    }));

    console.log("Owner ID:", InternalReportData);
  } catch (err) {
    console.error("❌ Unexpected error fetching Internal Report data:", err);
  } finally {
    loading.value = false;
  }
};

const fetchExternalReport = async () => {
  loading.value = true;

  try {
    const { data, error } = await supabase
      .from('fad_external_pending')
      .select('*')
      .eq('owner_id', userUUID.value); // ✅ Filter by current user

    if (error) {
      console.error("❌ Error fetching external data:", error);
      return;
    }

    ExternalReportData.value = data.map(row => ({
      dms_reference_number: row.dms_reference_number,
      date_received: formatDate(row.date_received),
      report: row.report,
      status: row.status,
      sub_unit: row.sub_unit,
      owner_id: row.owner_id,
      scoreboard_id: row.scoreboard_id,
       process_id: row.process_id
    }));

    console.log("✅ Filtered External data:", JSON.stringify(ExternalReportData.value, null, 2));
  } catch (err) {
    console.error("❌ Unexpected error fetching Eternal Report:", err);
  } finally {
    loading.value = false;
  }
};
const fetchCitizenCharterReport = async () => {
  loading.value = true;

  try {
    const { data, error } = await supabase
      .from('fad_citizen_charter_pending')
      .select('*')
      .eq('owner_id', userUUID.value); // ✅ Filter by current user

    if (error) {
      console.error("❌ Error fetching external data:", error);
      return;
    }

    CitizenCharterData.value = data.map(row => ({
      dms_reference_number: row.dms_reference_number,
      date_received: formatDate(row.date_received),
      report: row.report,
      status: row.status,
      sub_unit: row.sub_unit,
      owner_id: row.owner_id,
      scoreboard_id: row.scoreboard_id,
      process_id: row.process_id
    }));

    console.log("✅ Filtered citizen charter data:", JSON.stringify(CitizenCharterData.value, null, 2));
  } catch (err) {
    console.error("❌ Unexpected error fetching Eternal Report:", err);
  } finally {
    loading.value = false;
  }
};
import { useRouter } from 'vue-router';

const router = useRouter();

const goToAddScoreboardFADinternal = (item) => {
 
  router.push({
    path: '/add-scoreboard-fad-internal',
    query: {
      dms_reference_number: item.dms_reference_number,
      date_received: item.date_received,
      report: item.report,
      sub_unit: item.sub_unit,
      scoreboard_id: item.scoreboard_id,
      process_id: item.process_id
    }
  });
};
const goToAddScoreboardFADexternal = (item) => {
 
  router.push({
    path: '/add-scoreboard-fad-external',
    query: {
      dms_reference_number: item.dms_reference_number,
      date_received: item.date_received,
      report: item.report,
      sub_unit: item.sub_unit,
      scoreboard_id: item.scoreboard_id,
      process_id: item.process_id
    }
  });
};
const goToAddScoreboardFADcitizencharter = (item) => {
 
  router.push({
    path: '/add-scoreboard-fad-citizen-charter',
    query: {
      dms_reference_number: item.dms_reference_number,
      date_received: item.date_received,
      report: item.report,
      sub_unit: item.sub_unit,
      scoreboard_id: item.scoreboard_id,
      process_id: item.process_id
    }
  });
};
// ✅ Run on page load
onMounted(async () => {
  await fetchLoggedInUser();
  await fetchInternalReport();
  await fetchExternalReport ();
  await fetchCitizenCharterReport();
});

</script>
<template>
 <v-card-text>
       <v-row>
        <v-col cols="12" >
            <v-container>
                <v-card>
                <v-card-title>Internal Reports:</v-card-title>
                <v-card-text>
                  <v-data-table :items="InternalReportData" class="elevation-1">
                <template v-slot:headers>
                  <tr>
                    <th>DMS Reference Number</th>
                    <th>Report</th>
                    <th>Date Received</th>
                    <th>Sub Unit</th>
                    <th>Status</th>
                  </tr>
                </template>
                <template v-slot:body="{ items }">
                  <tr v-for="item in items" :key="item.dms_reference_number">
                    <td>{{ item.dms_reference_number }}</td>
                    <td>{{ item.report }}</td>
                    <td>{{ item.date_received }}</td>
                    <td>{{ item.sub_unit }}</td>
                    <td>
                      <v-btn 
                        color="primary" 
                        size="small" 
                        @click="goToAddScoreboardFADinternal(item)"
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
        
      </v-row>
      <v-row>
        <v-container>
                <v-card>
                <v-card-title>External Reports:</v-card-title>
                <v-card-text>
                  <v-data-table :items="ExternalReportData" class="elevation-1">
                    <template v-slot:headers>
                  <tr>
                   <th>DMS Reference Number</th>
                    <th>Report</th>
                    <th>Date Received</th>
                    <th>Sub Unit</th>
                    <th>Status</th>
                  </tr>
                </template>
                <template v-slot:body="{ items }">
                  <tr v-for="item in items" :key="item.dms_reference_number">
                    <td>{{ item.dms_reference_number }}</td>
                    <td>{{ item.report }}</td>
                    <td>{{ item.date_received }}</td>
                    <td>{{ item.sub_unit }}</td>
                    <td>
                      <v-btn 
                        color="primary" 
                        size="small" 
                        @click="goToAddScoreboardFADexternal(item)"
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
      </v-row>
      <v-row>
        <v-container>
                <v-card>
                <v-card-title>Citizen Charter Reports:</v-card-title>
                <v-card-text>
                  <v-data-table :items="CitizenCharterData" class="elevation-1">
                    <template v-slot:headers>
                  <tr>
                   <th>DMS Reference Number</th>
                    <th>Report</th>
                    <th>Date Received</th>
                    <th>Sub Unit</th>
                    <th>Status</th>
                  </tr>
                </template>
                <template v-slot:body="{ items }">
                  <tr v-for="item in items" :key="item.dms_reference_number">
                    <td>{{ item.dms_reference_number }}</td>
                    <td>{{ item.report }}</td>
                    <td>{{ item.date_received }}</td>
                    <td>{{ item.sub_unit }}</td>
                    <td>
                      <v-btn 
                        color="primary" 
                        size="small" 
                        @click="goToAddScoreboardFADcitizencharter(item)"
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
      </v-row>
    </v-card-text>
</template>