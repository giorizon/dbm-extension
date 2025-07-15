<script setup>
import { ref, onMounted } from "vue";
import supabase from '@/components/system/accomplishments/scoreboard/supabase';
import {
  formatDate,
  formatTime,
  fetchLoggedInUser,
  fetchScoreboardDataBasedOnRole,
  fetchIndividual,
  fetchUserDivisionId,
  fetchDivisionChief,
  fetchARD,
  fetchRD,
  fetchYear,
  printSection,
  userUUID,
  userRole,
  individual_name,
  //scoreboardData,
  useSelectedLabels,
  reportYear,
  quarter,
  ARD_name,
  ARD_pos,
  RD_name,
  RD_pos,
  divisionChief,
} from '@/utils/scoreboardHelpers';

const dialog = ref(false);
const search = ref('');
const formAction = ref({
  formSuccessMessage: '',
  formErrorMessage: ''
});
const isDialogVisible = ref(false);
const selQuarter = ref(null);
const selectedYear = ref(null);
const { dateRange, selectedYearName } = useSelectedLabels(selQuarter, selectedYear);
const scoreboardData = ref([]);

function getQuarterDateRange(year, quarter) {
  const ranges = {
    1: [`${year}-01-01`, `${year}-03-31`],
    2: [`${year}-04-01`, `${year}-06-30`],
    3: [`${year}-07-01`, `${year}-09-30`],
    4: [`${year}-10-01`, `${year}-12-31`],
  };
  return ranges[quarter];
}

const generateTable = async () => {
  if (!selQuarter.value || !selectedYear.value) {
      alert("⚠️ Please select both a quarter and a year before generating the report.");
    return;
  }

  const [startDate, endDate] = getQuarterDateRange(selectedYear.value, selQuarter.value );

  const { data, error } = await supabase
    .from('view_scoreboard_individual')
    .select('*')
    .eq('owner_id', userUUID.value)
    .gte('date_released', startDate)
    .lte('date_released', endDate);
    
  if (error) return console.error("Error fetching data:", error);
  scoreboardData.value = data.map(row => {
  let numberDaysWork;
  let numberDowntime;
  if(row.downtime == null)
  {
    numberDowntime = 0;
  }
  else{
    numberDowntime = row.downtime;
  }

  if (row.tod_id == 1) {
    numberDaysWork = row.calendar_days - numberDowntime + " days";
  } else if (row.tod_id == 2) {
    numberDaysWork = row.working_days - numberDowntime + " days";
  } else {
    numberDaysWork = '—';
  }

  console.log("Number of calendar days:", row.calendar_days);
  console.log("Number of working days:", row.working_days);

  return {
    dms_reference_number: row.dms_reference_number ?? '—',
    agency_name: row.agency_name ?? '—',
    date_received: formatDate(row.date_received),
    date_forwarded: formatDate(row.date_forwarded),
    not_name: row.not_name ?? '—',
    prescribed_period: row.prescribed_period ?? '—',
    number_days_work: numberDaysWork,
    date_released: formatDate(row.date_released),
    time_released: formatTime(row.date_released),
    downtime_remark: row.downtime_remark ?? 'N/A'
  };
});
    
};
onMounted(async () => {
  await fetchLoggedInUser();
  await fetchIndividual();
  await fetchUserDivisionId();
  await fetchDivisionChief();
  await fetchARD();
  await fetchRD();
  await fetchYear();
});
</script>

<template>
  <AlertNotification :form-success-message="formAction.formSuccessMessage"
    :form-error-message="formAction.formErrorMessage"></AlertNotification>
    <h1>Individual Level</h1>
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
                 <div><span class = "header-name">{{individual_name}}</span></div>
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
                        <th>Date Forwarded</th>
                        <th>Prescribed Period</th>
                        <th>No. of working hours/days/calendar days acted upon</th>
                        <th>Remark (e.g. downtime)</th>
                        <th>Date and Time released</th>
                    </tr>
                </template>
                <template v-slot:body="{ items }">
                    <tr v-for="(item, index) in items" :key="item.dms_reference_number">
                        <td>{{ index + 1 }}</td>
                        <td contenteditable="true">{{ item.dms_reference_number }}</td>
                        <td contenteditable="true">{{ item.agency_name }}</td>   
                        <td contenteditable="true">{{ item.not_name }}</td>  
                        <td contenteditable="true">{{ item.date_received }}</td>
                        <td contenteditable="true">{{ item.date_forwarded }}</td>
                         <td contenteditable="true">{{ item.prescribed_period }}</td>
                        <td contenteditable="true">{{ item.number_days_work }}</td>
                        <td  contenteditable="true">{{ item.downtime_remark }}</td>
                        <td contenteditable="true" >{{ item.date_released }} - {{ item.time_released }} </td>
                       
                    </tr>
                    </template>
              </v-data-table>
        <v-container fluid class="signatory-container print-container">
        <v-row class="print-row">
          <v-col class="individual-one">
            <div class="signatory-block"><strong>Prepared by:</strong></div>
            <div class="signatory-name">{{ individual_name }}</div>
            <div>Individual</div>
          </v-col>
          <v-col class="individual-two">
            <div class="signatory-block"><strong>Reviewed by:</strong></div>
            <div class="signatory-name">{{ divisionChief }}</div>
            <div>Division Chief</div>
          </v-col>
          <v-col class="individual-three">
            <div class="signatory-block"><strong>Recommending Approval:</strong></div>
            <div class="signatory-name">{{ ARD_name }}</div>
            <div>{{ ARD_pos }}</div>
          </v-col>
          <v-col class="individual-four">
            <div class="signatory-block"><strong>Approved by:</strong></div>
            <div class="signatory-name">{{ RD_name }}<span>, {{ ExtensionName }}</span></div>
            <div>{{ RD_pos }}</div>
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