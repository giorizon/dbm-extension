<script setup>
import { ref, onMounted } from 'vue';
import supabase from '@/components/system/accomplishments/scoreboard/supabase'
import {
 fetchSupportServices,
 fetchUserPosition,
 approvalHeaders,
 fetchApprovalList,
 insertRecord,
 updateRemark
} from '@/utils/dashboardScript';
import '@/assets/dashboard.css';
const headers = approvalHeaders
const items = ref([])
//const loading = ref(false)
const successDialog = ref(false);
const userUUID = ref(null);
const InternalReportData = ref([]);
const ExternalReportData = ref([]);
const CitizenCharterData = ref([]);
const SupportServicesData = ref([]);
const loading = ref(true);
const posName = ref('');
const dialogFAD = ref(false)
const selected = ref([]) // Holds selected row objects
const isBatchProcessing = ref(false)
//const tdId = ref(null);
import { useRouter } from 'vue-router';

const router = useRouter();
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
const fetchSS = async () => {
  const result = await fetchSupportServices(userUUID.value);
  console.log("👉 Current Rows fetched from Supabase:", result);
  
  SupportServicesData.value = result || []; 
};
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

const goToAddScoreboardFADSupportServices = (item) => {
  router.push({
    path: '/add-scoreboard-fad-support-services',
    query: {
      dms_reference_number: item.dms_reference_number,
      date_received: item.date_received,
      report: `${item.ss_name} - ${item.ss_items_name}`, 
      sub_unit: item.sub_unit,
      scoreboard_id: item.scoreboard_id,
      process_id: item.process_id
    }
  });
};
const loadData = async () => {
  loading.value = true
  items.value = await fetchApprovalList()
  loading.value = false
}
const loadPosition = async () => {
  const positionData = await fetchUserPosition(userUUID.value)
  
  if (positionData) {
    posName.value = positionData.position_name
  }
}
const handleSelectRow = async (rowData) => {
  console.log('Full Row Data:', rowData)
  const insertData = await insertRecord(rowData)

  if (insertData) {
   
    const updateData = await updateRemark(rowData)
    // Actions to take on success:
    
    if (updateData.success) {
      console.log('Inserte and update are successful');
    //  await fetchApprovalList();
         successDialog.value = true;
    }
    else{
           console.error('Failed to update record.')  

    }
  } else {
    console.error('Failed to insert record.')  
  }
  dialogFAD.value = false
}
function reloadPage() {
  window.location.reload();
}
const handleBatchApprove = async () => {
  if (selected.value.length === 0) return

  isBatchProcessing.value = true
  let hasError = false

  // Process each selected record
  for (const rowData of selected.value) {
    const insertData = await insertRecord(rowData)
    
    if (insertData) {
      const updateData = await updateRemark(rowData)
      if (!updateData.success) {
        hasError = true
        console.error(`Failed to update record ID: ${rowData.id}`)
      }
    } else {
      hasError = true
      console.error(`Failed to insert record ID: ${rowData.id}`)
    }
  }

  isBatchProcessing.value = false

  if (!hasError) {
    selected.value = [] // Clear selected items
    await fetchApprovalList() // Refresh datatable
    dialogFAD.value = false // Close main dialog
      successDialog.value = true;
  } else {
    alert('Some items failed to process. Please check the logs.')
  }
}
onMounted(async () => {
  await fetchLoggedInUser();
  await fetchInternalReport();
  await fetchExternalReport ();
  await fetchCitizenCharterReport();
  await fetchSS();
  await loadPosition();
  await loadData();
});

</script>
<template>
 <v-card-text>
       <v-row>
        <v-col cols="12" >
            <v-container>
                <v-card><v-btn 
                    v-if="['CAO', 'SAO'].includes(posName)" 
                    class="mb-6" 
                    color="red-darken-4"
                    @click="dialogFAD = true"
                  >
                    For approval
                  </v-btn></v-card>
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
            <v-container>
              <v-card>
                <v-card-title>Support Services Reports:</v-card-title>
                <v-card-text>
                  <v-data-table :items="SupportServicesData" class="elevation-1">
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
                        <td>{{ item.ss_name }} - {{ item.ss_items_name }}</td> <!-- ✅ Changed item.report to real view columns -->
                        <td>{{ item.date_received }}</td>
                        <td>{{ item.sub_unit }}</td>
                        <td>
                          <v-btn 
                            color="primary" 
                            size="small" 
                            @click="goToAddScoreboardFADSupportServices(item)"
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
    <!-- for DataTable Dialog -->
  <v-dialog v-model="dialogFAD" max-width="800px">
  <v-card flat border>
    <v-card-title class="d-flex align-center">
      <span>Pending Approvals</span>
      <v-spacer></v-spacer>

      <!-- Bulk Approval Button (Visible when 1+ rows are selected) -->
      <v-btn
        v-if="selected.length > 0"
        color="success"
        class="mr-2"
        size="small"
        prepend-icon="mdi-check-all"
        :loading="isBatchProcessing"
        @click="handleBatchApprove"
      >
        Approve Selected ({{ selected.length }})
      </v-btn>

      <!-- Refresh Button -->
      <v-btn icon="mdi-refresh" variant="text" @click="fetchApprovalList"></v-btn>
    </v-card-title>

    <v-data-table
      v-model="selected"
      show-select
      return-object
      item-value="id"
      :headers="headers"
      :items="items"
      :loading="loading || isBatchProcessing"
      loading-text="Loading approval requests..."
      no-data-text="No pending approvals found."
      class="elevation-0"
    >
      <template #item.date_received="{ value }">
        {{ formatDate(value) }}
      </template>

      <template #item.remark="{ value }">
        <v-chip color="warning" size="small" variant="tonal">
          {{ value }}
        </v-chip>
      </template>

      <!-- Single Row Action -->
      <template #item.actions="{ item }">
        <v-btn 
          size="small" 
          color="blue-darken-4" 
          variant="outlined" 
          @click="handleSelectRow(item.raw)"
        >
          Approve
        </v-btn>
      </template>
    </v-data-table>
  </v-card>

  <v-divider></v-divider>
  <v-card-actions>
    <v-spacer></v-spacer>
    <v-btn class="mr-5 my-2" text="Close" variant="plain" prepend-icon="mdi-close" @click="dialogFAD = false"></v-btn>
  </v-card-actions>
</v-dialog>
  <v-dialog v-model="successDialog" width="400">
        <v-card color="" class="pa-4">
          <v-card-title class="text-h6 text-green-darken-3">
            <v-icon left color="green-darken-2" class="mr-2">mdi-check-circle</v-icon>
            Successful
          </v-card-title>
          <v-card-text class="text-body-1">
            The process was successfully approved
          </v-card-text>
          <v-card-actions class="justify-end">
            <v-btn color="green-darken-2" variant="elevated" @click="reloadPage">
              OK
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
</template>