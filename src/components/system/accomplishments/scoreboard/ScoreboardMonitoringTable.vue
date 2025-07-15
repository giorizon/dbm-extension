<script setup>
import { ref, onMounted, computed } from "vue";

import ConfirmDialog from "@/components/common/ConfirmDialog.vue";
import AlertNotification from "@/components/common/AlertNotification.vue";
import supabase from '@/components/system/accomplishments/scoreboard/supabase'
import { useScoreboardTable } from "@/composables/scoreboard/scoreboardTable";
import { useScoreboardStore } from "@/stores/scoreboard";
import "@/assets/css/scoreboardTableStyle.css";
import{
  formatDate,
  formatTime,
  quarter,
  reportYear,
  fetchRD,
  ExtensionName,
  RD_name,
  RD_pos,
  useSelectedLabels
} from '@/utils/scoreboardHelpers';

const scoreboardStore = useScoreboardStore();
const { onLoadItems, tableOptions, formAction } = useScoreboardTable();
const dialog = ref(false);
const userUUID = ref(null);
const userRole = ref(null);
const search = ref("");
const scoreboardData = ref([]);

const CBMS_name = ref(null);
const CBMS_pos = ref(null);
const ARD_name = ref(null);
const ARD_pos = ref(null);
const selectedUser = ref(null)
const selectedYear = ref(null)

const selQuarter = ref(null);
const { dateRange, selectedYearName } = useSelectedLabels(selQuarter, selectedYear);

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

    // await fetchScoreboardDataBasedOnRole(); 
    }catch (err) {
       console.error("❌ Unexpected error fetching scoreboard data:", err); 
    }
  }
};
const fetchCBMS = async () => {

  const { data, error } = await supabase
    .from('view_signatory')
    .select('*') 
    .eq('pos_id', '16')

  if (error) {
    console.error("Error fetching CBMS name and position:", error);
    return;
  }

  if (data.length === 0) {
    console.warn("No Data was fetch.");
    return;
  }

    CBMS_name.value = data[0].name;
    CBMS_pos.value = data[0].position;
  console.log("✅ Retrieved Name and Position:",CBMS_name.value, "and ", CBMS_pos.value);
};
const fetchARD = async () => {

  const { data, error } = await supabase
    .from('view_signatory')
    .select('*') 
    .eq('pos_id', '4')

  if (error) {
    console.error("Error fetching CBMS name and position:", error);
    return;
  }

  if (data.length === 0) {
    console.warn("No Data was fetch.");
    return;
  }

    ARD_name.value = data[0].name;
    ARD_pos.value = data[0].position;
  console.log("✅ Retrieved Name and Position:",ARD_name.value, "and ", ARD_pos.value);
};
const printSection = () => {
  const printContents = document.getElementById('printSection').innerHTML;
  const originalContents = document.body.innerHTML;

  document.body.innerHTML = printContents;
  window.print();
  document.body.innerHTML = originalContents;
  window.location.reload(); // Optional: reload to restore event bindings (esp. for Vue)
};


function getQuarterDateRange(year, quarter) {
  const ranges = {
    1: [`${year}-01-01`, `${year}-03-31`],
    2: [`${year}-04-01`, `${year}-06-30`],
    3: [`${year}-07-01`, `${year}-09-30`],
    4: [`${year}-10-01`, `${year}-12-31`],
  };
  return ranges[quarter];
}

const fetchYear = async () => {
  try {
    const { data, error } = await supabase.rpc('get_unique_years');

    if (error) {
      console.error('Error fetching Years:', error);
      return;
    }

    // 👇 Map year to match item-title & item-value
    reportYear.value = data.map((item) => ({
      name: item.year.toString(),  // title to show
      id: item.year                // value to bind
    }));
  } catch (err) {
    console.error('Unexpected error fetching Years:', err);
  }
};
const generateTable = async () => {
  if (!selQuarter.value || !selectedYear.value) {
      alert("⚠️ Please select both a quarter and a year before generating the report.");
    return;
  }

  const [startDate, endDate] = getQuarterDateRange(selectedYear.value, selQuarter.value );

  const { data, error } = await supabase
    .from('view_scoreboard_released')
    .select('*')
    .gte('date_released', startDate)
    .lte('date_released', endDate);
    
  if (error) return console.error("Error fetching data:", error);
  scoreboardData.value = data.map(row => {
  let numberDaysWork;
  let numberDowntime;
  if(row.total_downtime == null)
  {
    numberDowntime = 0;
  }
  else{
    numberDowntime = row.total_downtime;
  }

  if (row.tod_id == 1) {
    numberDaysWork = row.calendar_days - numberDowntime + " calendar days";
  } else if (row.tod_id == 2) {
    numberDaysWork = row.working_days - numberDowntime + " working days";
  } else {
    numberDaysWork = '—';
  }

  console.log("Total number of calendar days:", row.calendar_days);
  console.log("Total number of working days:", row.working_days);

  return {
    dms_reference_number: row.dms_reference_number ?? '—',
    agency_name: row.agency_name ?? '—',
    date_received: formatDate(row.date_received),
    date_released: formatDate(row.date_released),
    not_name: row.not_name ?? '—',
    number_days_work: numberDaysWork,
    time_released: formatTime(row.date_released),
    downtime_remarks: row.downtime_remarks ?? 'N/A',
    released_document: row.released_document ?? 'N/A'
  };
});
    
};
onMounted(async () => {
  await fetchLoggedInUser(); 
  await fetchCBMS();
  await fetchARD();
   await fetchRD();
  await fetchYear();

});
</script>

<template>
  <AlertNotification :form-success-message="formAction.formSuccessMessage"
    :form-error-message="formAction.formErrorMessage"></AlertNotification>
  <v-container>
    <v-row align="center">
       <v-col cols="auto">
           <v-select
            class="header-selector"
            v-model="selQuarter"
            :items="quarter"
            item-title="name"
            item-value="id"
            label="Select Quarter"
          />
        </v-col>
         <v-col cols="auto">
          <v-select
            class="header-selector"
            :items="reportYear"
            item-title="name"
            item-value="id"
            label="Year"
            v-model="selectedYear"
          />
            </v-col>
            <v-col cols="auto">
            <v-btn
            class="my-1 header-button"
           prepend-icon="mdi-file-chart"
            @click="generateTable"
            color="green-darken-1"
            >
            Generate Table
            </v-btn>
        </v-col>
        <v-col cols="auto">
            <v-btn
            class="my-1 header-button"
           prepend-icon="mdi-printer"
            @click="printSection"
            color="blue-darken-1"
            >
            Download
            </v-btn>
          </v-col>
      </v-row>

  </v-container>
 <div id="printSection">
    <v-container>
        <v-row>
            <v-col>
                 <div><span class = "header-name">Department of Budget and Management RO XIII</span></div>
                  <div><span class = "header-title1">List of requests received and acted transaction</span></div>
                <div><span class = "header-title2">For the Period Covered <span id = "sel-quarter">{{ dateRange }}</span>, <span id="sel-year">{{ selectedYearName }}</span></span></div>
            </v-col>
        </v-row>
    </v-container>
 <v-data-table  :items="scoreboardData"
                :search="search"
                class="elevation-1 styled-scoreboard-table"
                hide-default-footer
                :items-per-page="-1"  
                >
                <template v-slot:headers>
                    <tr>
                        <th>No</th>
                        <th>DMS No.</th>
                        <th>Agency</th>
                         <th>Nature of Transaction</th>
                        <th>Date Received</th>
                        <th>Date Released</th>
                        <th>No. of working hours/days/calendar days acted upon</th>
                        <th>
                        Remarks<br/>
                        <small>(will also show the remarks and downtime of individual/sr/svbms and division chief)</small>
                        </th>
                        <th>Released Documents</th>
                    </tr>
                </template>
                <template v-slot:body="{ items }">
                    <tr v-for="(item, index) in items" :key="item.dms_reference_number">
                        <td contenteditable="true" >{{ index + 1 }}</td>
                        <td contenteditable="true">{{ item.dms_reference_number }}</td>
                        <td contenteditable="true">{{ item.agency_name }}</td>   
                        <td contenteditable="true">{{ item.not_name }}</td>  
                        <td contenteditable="true">{{ item.date_received }}</td>
                        <td contenteditable="true">{{ item.date_released }}</td>
                        <td contenteditable="true">{{ item.number_days_work }}</td>
                        <td contenteditable="true">{{ item.downtime_remarks }}</td>
                        <td contenteditable="true">{{ item.released_document }}</td>
                       
                    </tr>
                    </template>
              </v-data-table>
        <v-container class="signatory-container">
          <v-row>
            <v-col>
              <div class="signatory-block"><strong>Prepared by:</strong></div>
              <div class="signatory-name">Judi D. Acdal</div>
              <div>P.R.I.M.E. Officer Designate</div>
            </v-col>

            <v-col>
              <div class="signatory-block ard"><strong>Reviewed by:</strong></div>
              <div class="signatory-name ard">{{ ARD_name }}</div>
              <div class = "ard ">{{ ARD_pos }}</div>
            </v-col>
            <v-col>
              <div class="signatory-block rd"><strong>Approved by:</strong></div>
              <div class="signatory-name rd">{{ RD_name }}<span>, {{ ExtensionName }}</span></div>
              <div class ="rd">{{ RD_pos }}</div>
            </v-col>
          </v-row>
        </v-container>
    </div>
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