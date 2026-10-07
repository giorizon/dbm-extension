<script setup>
import { ref, computed, onMounted } from "vue";

import ConfirmDialog from "@/components/common/ConfirmDialog.vue";
import AlertNotification from "@/components/common/AlertNotification.vue";
import { useScoreboardTable } from "@/composables/scoreboard/scoreboardTable";
import { useScoreboardStore } from "@/stores/scoreboard";
import { useScoreboardReport } from "@/composables/scoreboard/useScoreboardReport";
import "@/assets/css/scoreboardMonitoring.css";

import {
  quarter,
  reportYear,
  fetchRD,
  ExtensionName,
  RD_name,
  RD_pos,
  useSelectedLabels
} from '@/utils/scoreboardHelpers';
import { useAuthUserStore } from '@/stores/authUser'
const authStore = useAuthUserStore()
const userRole = computed(() => authStore.userRole)
// Local UI state
const dialog = ref(false);
const search = ref("");
const selQuarter = ref(null);
const selectedYear = ref(null);

const scoreboardStore = useScoreboardStore();
const { onLoadItems, tableOptions, formAction, isDialogVisible, onConfirmDelete } = useScoreboardTable();
const { dateRange, selectedYearName } = useSelectedLabels(selQuarter, selectedYear);

const selectedRole = ref(null)

const roles = ref([
  { id: "Individual", name: 'As Individual' },
  { id: "Supervising BMS", name: 'As Supervising' }
])
const { 
  fetchIndividual,
  individual_name,
  ARD_name,
  ARD_pos,
  scoreboardData1,
  fetchLoggedInUser,
  fetchCBMS,
  fetchARD,
  fetchYear,
  generateTable2: executeGenerateTable,
  exportToExcel,
  //printSection
} = useScoreboardReport();

const printSection = () => {
  window.print();
};
const handleExportToExcel = () => {
  exportToExcel(dateRange.value, selectedYearName.value, {
    rdName: RD_name.value,
    rdPos: RD_pos.value,
    extensionName: ExtensionName.value
  });
};

const generateTable2 = () => executeGenerateTable(selQuarter.value, selectedYear.value, selectedRole.value);
onMounted(async () => {
  await fetchLoggedInUser();
  await fetchIndividual();
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
    <v-row align = "left">
      <v-col>
      <v-select
        v-model="selectedRole"
        :items="roles"
        item-title="name"
        item-value="id"
        label="Select User Role"
      />
      <v-col>
      </v-col>
      </v-col>
      <v-col>
      </v-col>
    </v-row>
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
            @click="generateTable2"
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
          <v-col>
          <v-btn class="my-1 header-button"
             prepend-icon="mdi-printer" 
             color="success" 
             @click="handleExportToExcel">Export to Excel
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
              <div class="signatory-name">{{individual_name}}</div>
              <div>{{ userRole }}</div>
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