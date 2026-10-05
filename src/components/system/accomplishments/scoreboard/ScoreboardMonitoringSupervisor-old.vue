<script setup>
import { ref, onMounted } from "vue";
import { format } from 'date-fns';
import supabase from '@/components/system/accomplishments/scoreboard/supabase';
import {
  formatDate,
  formatTime,
  fetchLoggedInUser,
  fetchIndividual,
  fetchUserDivisionId,
  fetchDivisionChief,
  fetchARD,
  fetchRD,
  fetchYear,
  printSection,
  userUUID,
  individual_name,
  useSelectedLabels,
  reportYear,
  quarter,
  ARD_name,
  ARD_pos,
  RD_name,
  RD_pos,
  divisionChief,
  ExtensionName,
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
  let numberDaysWork;
  let numberDowntime;
  let SBMSDate;
  let DCDate;
  const { data, error } = await supabase
    .from('view_scoreboard_id_released')
    .select('*')
    .eq('from_id', userUUID.value)
    .gte('date_released', startDate)
    .lte('date_released', endDate);
    
  if (error) return console.error("Error fetching data:", error);
  
  // For each row, fetch related data
    const results = await Promise.all(
      data.map(async (row) => {
        const { data: processDataRaw, error: processError } = await supabase
          .from('view_scoreboard_supervisor')
          .select('*')
          .eq('scoreboard_id', row.scoreboard_id)
          .eq('current_from_id', userUUID.value);

        if (processError) {
          console.error('Process query error for row:', row, processError);
        }
      const processData = processDataRaw?.[0] || null;
      console.log("scoreboard_id", processData.scoreboard_id);
      console.log("Previous Process Id", processData.previous_process_id);
      console.log("tod_id", row.tod_id);
        //setting up downtime and workingdays
        console.log("Downtime value", processData.downtime_value);
        if(processData.downtime_value == null)
        {
          numberDowntime = 0;
        }
        else{
          numberDowntime = processData.downtime_value;
         
        }
      if (row.tod_id == 1) {
         console.log("Calndar Days  - Downtime", processData.calendar_days, numberDowntime);
          numberDaysWork = processData.calendar_days - numberDowntime + " days";
        } else if (row.tod_id == 2) {
          console.log("Working Days  - Downtime", processData.working_days, numberDowntime);
          numberDaysWork = processData.working_days - numberDowntime + " days";
        } else {
          numberDaysWork = '—';
      }
      console.log("NumberDaysWork", numberDaysWork);
      if (processData.current_level == 'Division Chief') {
          DCDate = format(new Date(processData.previous_date_forwarded), 'MMMM dd, yyyy')
          SBMSDate = null;
        } else if (processData.current_level == 'Supervising BMS') {
          DCDate = null;
          SBMSDate = format(new Date(processData.previous_date_forwarded), 'MMMM dd, yyyy');
        } 
      let modifiedProcessData = null;
         if (processData) {
          const date_received = processData.previous_date_received
            ? format(new Date(processData.previous_date_received), 'MMMM dd, yyyy')
            : 'N/A';
            modifiedProcessData = {
              ...processData,
              DC_date_forwarded: DCDate, 
              SBMS_date_forwarded: SBMSDate, 
              date_received: date_received,
              numberDaysWork: numberDaysWork             
             };
          }
      return {
        ...row,
        date_released: formatDate(row.date_released),
        time_released: formatTime(row.date_released),
        processData: modifiedProcessData, // Attach the fetched data
      };
    })
  );
  scoreboardData.value = results;
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
    <h1>Supervising Level</h1>
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
                        <th class="center-header ">No</th>
                        <th class="center-header ">DMS No.</th>
                        <th class="center-header ">Agency</th>
                         <th class="center-header ">Nature of Transaction</th>
                        <th class="center-header ">Date Received</th>
                        <th class="center-header ">Date Forwarded to SBMS</th>
                        <th class="center-header ">Date Forwarded to Division Chief</th>
                        <th class="center-header ">Prescribed Period</th>
                        <th class="center-header ">No. of working hours/days/calendar days acted upon</th>
                        <th class="center-header ">Remark (e.g. downtime)</th>
                        <th class="center-header ">Date and Time released</th>
                    </tr>
                </template>
                <template v-slot:body="{ items }">
                    <tr v-for="(item, index) in items" :key="item.dms_reference_number">
                        <td>{{ index + 1 }}</td>
                        <td contenteditable="true">{{ item.dms_reference_number }}</td>
                        <td contenteditable="true">{{ item.agency_name }}</td>   
                        <td contenteditable="true">{{ item.not_name }}</td>  
                        <td contenteditable="true">{{ item.processData?.date_received || 'N/A' }}</td>
                        <td contenteditable="true">{{ item.processData?.SBMS_date_forwarded || 'N/A' }}</td>
                        <td contenteditable="true">{{ item.processData?.DC_date_forwarded || 'N/A'  }}</td>
                         <td contenteditable="true">{{ item.prescribed_period }}</td>
                        <td contenteditable="true">{{ item.processData?.numberDaysWork || 'N/A'  }}</td>
                        <td  contenteditable="true">{{ item.processData?.downtime_remark  || 'N/A' }}</td>
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