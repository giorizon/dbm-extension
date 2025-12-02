<script setup>
import { ref, onMounted, computed } from "vue";

import ConfirmDialog from "@/components/common/ConfirmDialog.vue";
import AlertNotification from "@/components/common/AlertNotification.vue";
import supabase from '@/components/system/accomplishments/scoreboard/supabase'
import { useScoreboardTable } from "@/composables/scoreboard/scoreboardTable";
import { useScoreboardStore } from "@/stores/scoreboard";
//import "@/assets/css/scoreboardTableStyle.css";
import "@/assets/css/scoreboardMonitoring.css";
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
const scoreboardData1 = ref([]);

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

    const [startDate, endDate] = getQuarterDateRange(selectedYear.value, selQuarter.value);
    
    // --- Data Fetching ---
    const [sectionOne, sectionTwo, sectionThree, sectionFour, sectionFive] = await Promise.all([
        supabase.from('view_section_one').select('*').gte('date_released', startDate).lte('date_released', endDate),
        supabase.from('view_section_two').select('*').gte('date_released', startDate).lte('date_released', endDate),
        supabase.from('view_section_three').select('*').gte('date_released', startDate).lte('date_released', endDate),
        supabase.from('view_section_four').select('*').gte('date_released', startDate).lte('date_released', endDate),
        supabase.from('view_section_five').select('*').gte('date_released', startDate).lte('date_released', endDate)
    ]);

    if (sectionOne.error) return console.error('Error fetching section one:', sectionOne.error);
    if (sectionTwo.error) return console.error('Error fetching section two:', sectionTwo.error);
    if (sectionThree.error) return console.error('Error fetching section three:', sectionThree.error);
    if (sectionFour.error) return console.error('Error fetching section four:', sectionFour.error);
    if (sectionFive.error) return console.error('Error fetching section five:', sectionFive.error); // Corrected 'four' to 'five' in the original code's error check

    const dataOne = sectionOne.data;
    const dataTwo = sectionTwo.data;
    const dataThree = sectionThree.data;
    const dataFour = sectionFour.data;
    const dataFive = sectionFive.data;

    // --- Data Merging and Mapping for Lookup ---
    const twoMap = Object.fromEntries(dataTwo.map(t => [t.scoreboard_id, t]));
    const threeMap = Object.fromEntries(dataThree.map(t => [t.scoreboard_id, t]));
    const fourMap = Object.fromEntries(dataFour.map(t => [t.scoreboard_id, t]));
    const fiveMap = Object.fromEntries(dataFive.map(t => [t.scoreboard_id, t]));

    const mergedData = dataOne.map(one => ({
        ...one,
        ...twoMap[one.scoreboard_id],
        ...threeMap[one.scoreboard_id],
        ...fourMap[one.scoreboard_id],
        ...fiveMap[one.scoreboard_id],
    }));

    // --- Grouping, Sorting, and Header Injection ---
    
    // 1. Sort the merged data by pap_id to ensure all rows of a PAP are together
    mergedData.sort((a, b) => a.pap_id - b.pap_id);

    const processedData = [];
    let currentPapId = null;

    for (const row of mergedData) {
        // 2. Inject a special 'header' object when the PAP ID changes
        console.log("PAP_description", row.pap_label);
        if (row.pap_id !== currentPapId) {
            currentPapId = row.pap_id;
            
            // This is the special object the HTML template will recognize as a header
            processedData.push({
                isHeader: true,
                pap_id: currentPapId, 
                pap_label: row.pap_label,
                // Using a unique key for Vuetify/Vue rendering efficiency
                // This is needed because the actual data rows are keyed by dms_reference_number
                key: `header-${currentPapId}-${Date.now()}` 
            });
        }

        // --- Calculation Logic (Your original logic moved into the loop) ---
        
        let numberDaysWork_ipar;
        let numberDaysWork_spar;
        let numberDaysWork_dpar;
        let numberDaysWork_opar;
        let numberDowntime;
        
        // Calculate IPAR number of days
        numberDowntime = row.downtime_ipar == null ? 0 : row.downtime_ipar;
        if (row.tod_id == 1) {
            numberDaysWork_ipar = (row.calendar_days_ipar - numberDowntime) + " calendar days";
        } else if (row.tod_id == 2) {
            numberDaysWork_ipar = (row.working_days_ipar - numberDowntime) + " working days";
        } else if(row.tod_id == 3) {
            // Assuming 'working_hours_ipar' is the base metric for tod_id=3
            numberDaysWork_ipar = (row.working_hours_ipar - numberDowntime) + " working hours"; 
        }

        // Calculate SPAR number of days (Asst. DC/Sr. BMS - Section 6 in HTML)
        numberDowntime = row.downtime_spar == null ? 0 : row.downtime_spar;
        if (row.tod_id == 1) {
            numberDaysWork_spar = (row.calendar_days_spar - numberDowntime) + " calendar days";
        } else if (row.tod_id == 2) {
            numberDaysWork_spar = (row.working_days_spar - numberDowntime) + " working days";
        } else if(row.tod_id == 3) {
            numberDaysWork_spar = (row.working_hours_spar - numberDowntime) + " working hours";
        }

        // Calculate DPAR number of days
        numberDowntime = row.downtime_dpar == null ? 0 : row.downtime_dpar;
        if (row.tod_id == 1) {
            numberDaysWork_dpar = (row.calendar_days_dpar - numberDowntime) + " calendar days";
        } else if (row.tod_id == 2) {
            numberDaysWork_dpar = (row.working_days_dpar - numberDowntime) + " working days";
        } else if(row.tod_id == 3) {
            numberDaysWork_dpar = (row.working_hours_dpar - numberDowntime) + " working hours";
        }

        // Calculate OPAR number of days
        numberDowntime = row.total_downtime == null ? 0 : row.total_downtime;
        if (row.tod_id == 1) {
            numberDaysWork_opar = (row.calendar_days_opar - numberDowntime) + " calendar days";
        } else if (row.tod_id == 2) {
            numberDaysWork_opar = (row.working_days_opar - numberDowntime) + " working days";
        } else if(row.tod_id == 3) {
            numberDaysWork_opar = (row.working_hours_opar - numberDowntime) + " working hours";
        }
        
        // --- 3. Push the Formatted Data Row ---
        processedData.push({
            // Data properties
            scoreboard_id: row.scoreboard_id,
            dms_reference_number: row.dms_reference_number ?? '—',
            pap_label: row.pap_label ?? '-',
            agency: row.agency ?? '—',
            date_received: formatDate(row.date_received),
            date_released: formatDate(row.date_released),
            nature: row.nature ?? '—',
            time_released: formatTime(row.date_released),
            division: row.division ?? '—',
            transaction_type: row.transaction_type ?? '—',
            pp_ipar: row.pp_ipar ?? '—',
            short_name_ipar: row.short_name_ipar ?? '-',
            initials_ipar: row.initials_ipar ?? '-',
            date_forwarded_ipar: formatDate(row.date_forward_ipar) ?? '—',
            time_forwarded_ipar: formatTime(row.date_forward_ipar) ?? '—',
            pp_spar: row.pp_spar ?? '—',
            short_name_spar: row.short_name_spar ?? '-',
            initials_spar: row.initials_spar ?? '-',
            date_forwarded_spar: formatDate(row.date_forward_spar) ?? '—',
            time_forwarded_spar: formatTime(row.date_forward_spar) ?? '—',
            pp_dpar: row.pp_dpar ?? '—',
            short_name_dpar: row.short_name_dpar ?? '-',
            initials_dpar: row.initials_dpar ?? '-',
            date_forwarded_dpar: formatDate(row.date_forward_dpar) ?? '—',
            time_forwarded_dpar: formatTime(row.date_forward_dpar) ?? '—',
            pp_opar: row.pp_opar ?? '—',
            date_released_opar: formatDate(row.date_forward_opar) ?? '—',
            time_released_opar: formatTime(row.date_forward_opar) ?? '—',
            // Calculated properties
            numberDaysWork_ipar: numberDaysWork_ipar ?? '—',
            numberDaysWork_spar: numberDaysWork_spar ?? '—',
            numberDaysWork_dpar: numberDaysWork_dpar ?? '—',
            numberDaysWork_opar: numberDaysWork_opar ?? '—',
            
            // Remarks
            all_remarks: row.all_remarks ?? '-',
            
            // Flag for the HTML template
            isHeader: false, 
            
            // Key for Vue's v-for loop
            key: row.dms_reference_number,

       
        });
    }

    // 4. Update the reactive data source
    scoreboardData1.value = processedData;
    
    // Clean up unnecessary console log (optional)
    // console.log("PAP_ID =", row.pap_id); 
    
    // pap1.value and pap2.value are no longer needed
    // if(row.pap_id == 1) { pap1.value = true; } 
    // if(row.pap_id == 2) { pap2.value = true; }
}
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
 <v-data-table  :items="scoreboardData1"
                :search="search"
                class="elevation-1 styled-scoreboard-table"
                hide-default-footer
                :items-per-page="-1"  
                >
                <template v-slot:headers>
                    <tr>                        
                      <th colspan ="4" rowspan="1"><b>Particulars(1)</b></th>
                      <th colspan ="1" rowspan="2"><b>DMS Reference Number (2)</b></th>
                      <th colspan ="1" rowspan="2"><b>Date and Time Received by the Records Section(3)</b></th>
                      <th colspan ="1" rowspan="2"><b>Type of Transaction (4)</b></th>
                      <th colspan ="3" rowspan="1"><b>IPAR (5)</b></th>
                      <th colspan ="4" rowspan="1"><b>Asst. DC/Sr. BMS (6)</b></th>
                      <th colspan ="3" rowspan="1"><b>DPAR (7)</b></th>
                      <th colspan ="3" rowspan="1"><b>OPAR (8)</b></th>
                       <th colspan ="1" rowspan="2"><b>Remarks</b>(e.g. Downtime)<b>(9)</b></th>
                    </tr>
                    <tr>
                      <th rowspan="1" colspan="1"><b>P/A/P No.(1.1)</b></th>
                      <th rowspan="1" colspan="1"><b>TS-in-Charge (1.2)</b></th>
                      <th rowspan="1" colspan="1"><b>Agency name(1.3)</b></th>
                      <th rowspan="1" colspan="1"><b>Nature of Transacation(1.4)</b></th>
                      <th rowspan="1" colspan="1"><b>Prescribed Period(5.1)</b></th>
                      <th rowspan="1" colspan="1"><b>Date and Time forwarded to Asst. DC/ Sr. BMS (5.2)</b></th>
                      <th rowspan="1" colspan="1"><b>No. of <u>Working Days/Working Hours/Calendar Days </u>Acted Upon(5.3)</b></th>
                      <th rowspan="1" colspan="1"><b>Prescribed Period(6.1)</b></th>
                      <th rowspan="1" colspan="1"><b>Reviewed by(6.2)</b></th>
                      <th rowspan="1" colspan="1"><b>Date and Time Forwaded to DC(6.3)</b></th>
                      <th rowspan="1" colspan="1"><b>No. of <u>Working Days/Working Hours/Calendar Days </u>Acted Upon(6.4)</b></th>
                      <th rowspan="1" colspan="1"><b>Prescribed Period(7.1)</b></th>
                      <th rowspan="1" colspan="1"><b>Date and Time Forwaded to ARD/RD(7.2)</b></th>
                      <th rowspan="1" colspan="1"><b>No. of <u>Working Days/Working Hours/Calendar Days </u>Acted Upon(7.3)</b></th>
                      <th rowspan="1" colspan="1"><b>Prescribed Period(8.1)</b></th>
                      <th rowspan="1" colspan="1"><b>Date and Time Released(8.2)</b></th>
                      <th rowspan="1" colspan="1"><b>No. of <u>Working Days/Working Hours/Calendar Days </u>Acted Upon(8.3)</b></th>
                   
                    </tr>
                  </template>  
              
                <template v-slot:body="{ items }">
                   <tr v-for="(item, index) in items" :key="item.dms_reference_number + '-' + index">
                   <template v-if="item.isHeader"> 
                    <td contenteditable="true" colspan="22" style="text-align:left; background-color:#e6f0ff; margin: 0; padding: 2px; height: 5px;" class ="sm-table-header" >
                       <b>PAP {{item.pap_id}} - {{item.pap_label}}</b>
                        
                    </td>
                    </template>
                    <template v-else>
                        <td contenteditable="true" >{{ index + 1 }}</td>
                        <td contenteditable="true">{{ item.short_name_ipar }}-{{ item.initials_ipar }}</td>
                        <td contenteditable="true">{{ item.agency }}</td>   
                        <td contenteditable="true">{{ item.nature }}</td>  
                        <td contenteditable="true">{{ item.dms_reference_number }}</td>  
                        <td contenteditable="true"> {{ item.date_received }} </td>
                        <td contenteditable="true">{{ item.transaction_type }}</td>
                        <td contenteditable="true">{{ item.pp_ipar }}</td>
                        <td contenteditable="true">{{ item.date_forwarded_ipar }}, {{ item.time_forwarded_ipar }}</td>
                        <td contenteditable="true">{{ item.numberDaysWork_ipar }}</td>
                        <td contenteditable="true">{{ item.pp_spar }}</td>
                        <td contenteditable="true">{{ item.short_name_spar }}-{{ item.initials_spar }}</td>
                        <td contenteditable="true">{{ item.date_forwarded_spar }}, {{ item.time_forwarded_spar }}</td>
                        <td contenteditable="true">{{ item.numberDaysWork_spar }}</td>
                        <td contenteditable="true">{{ item.pp_dpar }}</td>
                        <td contenteditable="true">{{ item.date_forwarded_dpar }}, {{ item.time_forwarded_dpar }}</td>
                        <td contenteditable="true">{{ item.numberDaysWork_dpar }}</td>
                        <td contenteditable="true">{{ item.pp_opar }}</td>
                        <td contenteditable="true">{{ item.date_released_opar }}, {{ item.time_released_opar }}</td>
                        <td contenteditable="true">{{ item.numberDaysWork_opar }}</td>
                        <td contenteditable="true">{{ item.all_remarks }}</td>
                        </template>
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