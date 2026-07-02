<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useAuthUserStore } from '@/stores/authUser'
import supabase from '@/components/system/accomplishments/scoreboard/supabase';
import "@/assets/css/scoreboardMonitoring.css";
import {
  //formatDate,
 // formatTime,
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
  //scoreboardData,
  useSelectedLabels,
  reportYear,
  quarter,
  ARD_name,
  ARD_pos,
  RD_name,
  RD_pos,
  divisionChief,
  ExtensionName,
  role_select
} from '@/utils/scoreboardHelpers';
const authStore = useAuthUserStore()
const userRole = computed(() => authStore.userRole);

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
const from_date = ref('');
const to_date = ref('');
const scoreboardData = ref([]);
const selectedQuarters = ref([]);
const prescribedDay = ref(null);
const PMS_level = ref('');
const assign_level = ref('');
const totalRowsProcessed = ref(0);
const tot_ids = ['4', '5','24','25'];
const mt2Counts = ref({
  '1': {},
  '2': {},
  '3': {},
  '4': {}
});
const temp1 = ref(null);
const temp2 = ref(null);
const temp3 = ref(null);
const temp4 = ref(null);
const table2Smp = ref({ '1': '', '2': '', '3': '', '4': '' });
const tempSemVal = ref({'1': '', '2': ' ', '3':''});

watch(userRole, (newRole) => {
  if (newRole) {
    PMS_level.value = newRole === 'Technical' ? 'Individual' : newRole;
    

    console.log('User Level initialized as:', PMS_level.value);
  }
}, { immediate: true });

assign_level.value = 'ipcr';
const processQuarterData = async (quarter) => {
  console.log(`Running logic dynamically for: ${quarter}`);
  console.log("level", assign_level.value);

  try {
    // 1. Map the tot_ids array into individual Supabase query promises
    const specificQueries = tot_ids.map(id => 
      supabase
        .from('view_mt2')
        .select('*', { count: 'exact', head: true }) 
        .eq('quarter', quarter)
        .eq('owner_id', userUUID.value)
        .eq('level', assign_level.value)
        .eq('year', selectedYear.value)
        .eq('is_within_prescribed', true)
        .eq('tot_id', id) // 🌟 Targets each specific ID in the loop
    );

    // 2. Combine the overall query with the array of specific queries
    const [allQueryResult, ...specificQueryResults] = await Promise.all([
      supabase
        .from('view_mt2')
        .select('*', { count: 'exact', head: true }) 
        .eq('quarter', quarter)
        .eq('owner_id', userUUID.value)
        .eq('level', assign_level.value)
        .eq('year', selectedYear.value)
        .eq('is_within_prescribed', true),
      
      ...specificQueries 
    ]);

    // 3. Error Check: Guard overall query
    if (allQueryResult.error) throw allQueryResult.error;

    // 4. Error Check: Loop through and verify no specific query failed
    for (const res of specificQueryResults) {
      if (res.error) throw res.error;
    }

    const overallCount = allQueryResult.count ?? 0;

    // 5. Build an internal key-value map for this specific quarter
    const quarterBreakdown = {};
    tot_ids.forEach((id, index) => {
      // The index matches perfectly with specificQueryResults array order
      quarterBreakdown[id] = specificQueryResults[index].count ?? 0;
    });

    // 6. Save the breakdown to the reactive state
    mt2Counts.value[quarter] = quarterBreakdown;

    console.log(`[Quarter ${quarter}] Overall: ${overallCount}`, quarterBreakdown);

    return overallCount;

  } catch (error) {
    console.error(`Error fetching data for Quarter ${quarter}:`, error);
    return 0;
  }
};
const processQuarterData2 = async (quarter) => {  //function for less than and greater than 35
  console.log(`Running logic dynamically for: ${quarter}`);
  
 const { data, error, count } = await supabase
    .from('view_mt2')
    .select('*', { count: 'exact' }) 
    .eq('quarter', quarter)
    .eq('owner_id', userUUID.value)
    .eq('level', assign_level.value)
    .eq('year', selectedYear.value);

  if (error) {
    console.error(`Error fetching data for ${quarter}:`, error);
    return 0; 
  }
  
  console.log(`Total rows found for ${quarter}:`, count);
  return count; 
};
const displayValue = (val) => {
  // Checks if the value is NaN, zero, null, or undefined to keep the table clean
  if (val === 0 || Number.isNaN(val) || val === null || val === undefined || val === '') {
    return '';
  }
  return val;
};
const generateTable = async (isRecursive = false) => {
 
  // 2. Identify if this is a true recursive loop or a fresh button click
  const isActualRecursive = isRecursive === true;

  // 3. ONLY validate and reset data on the very first execution
  if (!isActualRecursive) {
    if (!selectedYear.value && (!selectedQuarters.value || selectedQuarters.value.length === 0)) {
      alert("Please select a Year and check at least one Quarter before generating the table.");
      return; 
    } 
    if (!selectedYear.value) {
      alert("Please select a Year");
      return;
    }
    if (!selectedQuarters.value || selectedQuarters.value.length === 0) {
      alert("Please select at least one Quarter checkbox.");
      return;
    }

    // Reset layout arrays only on start
    totalRowsProcessed.value = 0;
    scoreboardData.value = [];
  }
    
  console.log("User selected these quarters:", selectedQuarters.value);
  
  // 5. Process Queries
  const quarterCounts = { '1': 0, '2': 0, '3': 0, '4': 0 };
  const quarterCounts2 = { '1': 0, '2': 0, '3': 0, '4': 0 };
  
  for (const quarter of selectedQuarters.value) {
    const within_prescribed = await processQuarterData(quarter);
    const all_PMS = await processQuarterData2(quarter);

    console.log(" HERE:  ", mt2Counts.value);
    
    quarterCounts[quarter] = within_prescribed; 
    quarterCounts2[quarter] = all_PMS; 

    totalRowsProcessed.value += all_PMS; // Accumulates nicely across calls now!
  }

  const metrics = {};

['1', '2', '3', '4'].forEach(q => {
  const within = quarterCounts[q];
  const total = quarterCounts2[q];

  if (!total || total === 0) {
    metrics[q] = { efficiency: '', smp: '' };
  } else {
    // 1. Calculate the raw percentage
    const eff = (within / total) * 100;
    
    let smpScore = 1;
    
    if (eff >= 99) {
      smpScore = 5;       
    } else if (eff >= 98) {
      smpScore = 4;       
    } else if (eff >= 97) {
      smpScore = 3;      
    } else if (eff >= 50) {
      smpScore = 2;      
    } else {
      smpScore = 1;       
    }

    
    metrics[q] = {
      efficiency: eff, 
      smp: smpScore 
    };
  }
});

  const calculateAverage = (valuesArray) => {
    const validValues = valuesArray.filter(v => typeof v === 'number');
    if (validValues.length === 0) return '';
    const sum = validValues.reduce((a, b) => a + b, 0);
    return sum / validValues.length;
  };

  const allQuartersSelected = selectedQuarters.value && selectedQuarters.value.length === 4;
  const first_sem_ave = calculateAverage([metrics['1'].smp, metrics['2'].smp]);
  const second_sem_ave = calculateAverage([metrics['3'].smp, metrics['4'].smp]);
  const year_ave = allQuartersSelected 
    ? calculateAverage([metrics['1'].smp, metrics['2'].smp, metrics['3'].smp, metrics['4'].smp])
    : '';

  // 7. Update Period Coverage text
  if (selectedQuarters.value.includes('1')) from_date.value = 'January 1';
  else if (selectedQuarters.value.includes('2')) from_date.value = 'April 1';
  else if (selectedQuarters.value.includes('3')) from_date.value = 'July 1';
  else if (selectedQuarters.value.includes('4')) from_date.value = 'October 1';

  if (selectedQuarters.value.includes('4')) to_date.value = 'December 31';
  else if (selectedQuarters.value.includes('3')) to_date.value = 'September 30';
  else if (selectedQuarters.value.includes('2')) to_date.value = 'June 30';
  else if (selectedQuarters.value.includes('1')) to_date.value = 'March 31';

  console.log('Prescribed Day', prescribedDay.value);

  // 8. Gather calculations payload 
  const computedPayload = {
    quarterCounts,
    quarterCounts2,
    metrics,
    first_sem_ave,
    second_sem_ave,
    year_ave
  };

  if (PMS_level.value === 'Senior BMS' || PMS_level.value === 'Supervising BMS') {
    if (assign_level.value === 'ipcr') {
      tableContent2(computedPayload); 
      assign_level.value = 'spcr'; 
      await generateTable(true); 
    }
    else {
       tableContent3(computedPayload); 
    }
  } else {
    tableContent(computedPayload);
  }
};
const tableContent = (dataPayload) => {
  const { quarterCounts, quarterCounts2, metrics, first_sem_ave, second_sem_ave, year_ave } = dataPayload;

  scoreboardData.value.push(
    {
      particular: 'Dimension: Efficiency',
      isBold: true 
    },
    {
      particular: `Number of requests with complete documents and comprehensive releases acted upon within the prescribed period`,
      q1_basis: quarterCounts['1'], q1_spms: '',
      q2_basis: quarterCounts['2'], q2_spms: '', 
      sem1_spms: '',
      q3_basis: quarterCounts['3'], q3_spms: '',
      q4_basis: quarterCounts['4'], q4_spms:'',
      sem2_spms: '', year_end_spms:'',
      allowEdit: true 
    },
    {
      particular: `<strong>9 working days</strong> shall be the prescribed period for highly technical transactions`,
      q1_basis: mt2Counts.value['1']['4'], q1_spms: '',
      q2_basis: mt2Counts.value['2']['4'], q2_spms: '', 
      sem1_spms: '',
      q3_basis: mt2Counts.value['3']['4'], q3_spms: '',
      q4_basis: mt2Counts.value['4']['4'], q4_spms:'',
      sem2_spms: '', year_end_spms:'',
      allowEdit: true 
    },
    {
      particular: ` <strong>4 calendar days</strong> for payment for retirement and terminal leave benefits `,
      q1_basis: mt2Counts.value['1']['5'], q1_spms: '',
      q2_basis: mt2Counts.value['2']['5'], q2_spms: '', 
      sem1_spms: '',
      q3_basis: mt2Counts.value['3']['5'], q3_spms: '',
      q4_basis: mt2Counts.value['4']['5'], q4_spms:'',
      sem2_spms: '', year_end_spms:'',
      allowEdit: true 
    },
     {
      particular: ` <strong>Comprehensive releases</strong>  acted upon within the prescribed period  `,
      q1_basis: mt2Counts.value['1']['24'], q1_spms: '',
      q2_basis: mt2Counts.value['2']['24'], q2_spms: '', 
      sem1_spms: '',
      q3_basis: mt2Counts.value['3']['24'], q3_spms: '',
      q4_basis: mt2Counts.value['4']['24'], q4_spms:'',
      sem2_spms: '', year_end_spms:'',
      allowEdit: true 
    },
    {
      particular: `Number of requests with complete documents received and comprehensive releases due for the quarter`,
      q1_basis: quarterCounts2['1'], q1_spms: '',
      q2_basis: quarterCounts2['2'], q2_spms: '',
      sem1_spms: '',
      q3_basis: quarterCounts2['3'], q3_spms: '',
      q4_basis: quarterCounts2['4'], q4_spms: '',
      sem2_spms: '', year_end_spms: '',
      allowEdit: true 
    },
    {
      particular: '',
      customHeight: '20px' 
    },
    {
      particular: '',
      customHeight: '20px' 
    },
    {
      particular: 'Rating on efficiency',
      q1_basis: metrics['1'].efficiency+'%', q1_spms: metrics['1'].smp,
      q2_basis: metrics['2'].efficiency+'%', q2_spms: metrics['2'].smp,
      sem1_spms: first_sem_ave,
      q3_basis: metrics['3'].efficiency+'%', q3_spms: metrics['3'].smp,
      q4_basis: metrics['4'].efficiency+'%', q4_spms: metrics['4'].smp,
      sem2_spms: second_sem_ave, year_end_spms: year_ave,
      isBold: true,
      isLarge: true,
    }
  );
};

const tableContent2 = (dataPayload) => {
  const { quarterCounts, quarterCounts2, metrics, first_sem_ave, second_sem_ave, year_ave } = dataPayload;

  scoreboardData.value.push(
    {
      particular: 'As Technical Staff',
      isBold: true ,
      isItalic: true
    },
    {
      particular: 'Dimension: Efficiency',
      isBold: true 
    },
   {
      particular: `Number of requests with complete documents and comprehensive releases acted upon within the prescribed period`,
      q1_basis: quarterCounts['1'], q1_spms: '',
      q2_basis: quarterCounts['2'], q2_spms: '', 
      sem1_spms: '',
      q3_basis: quarterCounts['3'], q3_spms: '',
      q4_basis: quarterCounts['4'], q4_spms:'',
      sem2_spms: '', year_end_spms:'',
      allowEdit: true 
    },
    {
      particular: `<strong>9 working days</strong> shall be the prescribed period for highly technical transactions`,
      q1_basis: mt2Counts.value['1']['4'], q1_spms: '',
      q2_basis: mt2Counts.value['2']['4'], q2_spms: '', 
      sem1_spms: '',
      q3_basis: mt2Counts.value['3']['4'], q3_spms: '',
      q4_basis: mt2Counts.value['4']['4'], q4_spms:'',
      sem2_spms: '', year_end_spms:'',
      allowEdit: true 
    },
    {
      particular: ` <strong>4 calendar days</strong> for payment for retirement and terminal leave benefits `,
      q1_basis: mt2Counts.value['1']['5'], q1_spms: '',
      q2_basis: mt2Counts.value['2']['5'], q2_spms: '', 
      sem1_spms: '',
      q3_basis: mt2Counts.value['3']['5'], q3_spms: '',
      q4_basis: mt2Counts.value['4']['5'], q4_spms:'',
      sem2_spms: '', year_end_spms:'',
      allowEdit: true 
    },
    {
      particular: ` <strong>Comprehensive releases</strong>  acted upon within the prescribed period  `,
      q1_basis: mt2Counts.value['1']['24'], q1_spms: '',
      q2_basis: mt2Counts.value['2']['24'], q2_spms: '', 
      sem1_spms: '',
      q3_basis: mt2Counts.value['3']['24'], q3_spms: '',
      q4_basis: mt2Counts.value['4']['24'], q4_spms:'',
      sem2_spms: '', year_end_spms:'',
      allowEdit: true 
    },
    {
      particular: `Number of requests with complete documents received and comprehensive releases due for the quarter`,
      q1_basis: quarterCounts2['1'], q1_spms: '',
      q2_basis: quarterCounts2['2'], q2_spms: '',
      sem1_spms: '',
      q3_basis: quarterCounts2['3'], q3_spms: '',
      q4_basis: quarterCounts2['4'], q4_spms: '',
      sem2_spms: '', year_end_spms: '',
      allowEdit: true 
    },
    {
      particular: 'Rating on efficiency(as specialist)',
      q1_basis: metrics['1'].efficiency, q1_spms: metrics['1'].smp,
      q2_basis: metrics['2'].efficiency, q2_spms: metrics['2'].smp,
      sem1_spms: first_sem_ave,
      q3_basis: metrics['3'].efficiency, q3_spms: metrics['3'].smp,
      q4_basis: metrics['4'].efficiency, q4_spms: metrics['4'].smp,
      sem2_spms: second_sem_ave, year_end_spms: year_ave,
      isBold: true
    },
    {
      particular: '',
      customHeight: '20px' 
    },
    
    {
      particular: '',
      customHeight: '20px' 
    },
  );
  temp1.value = metrics['1'].efficiency;
  temp2.value = metrics['2'].efficiency;
  temp3.value = metrics['3'].efficiency;
  temp4.value = metrics['4'].efficiency;  
  table2Smp.value['1'] = metrics['1'].smp;
  table2Smp.value['2'] = metrics['2'].smp;
  table2Smp.value['3'] = metrics['3'].smp;
  table2Smp.value['4'] = metrics['4'].smp;
  tempSemVal.value['1'] = first_sem_ave;
  tempSemVal.value['2'] = second_sem_ave;
  tempSemVal.value['3'] = year_ave;

};

const tableContent3 = (dataPayload) => {
  const { quarterCounts, quarterCounts2, metrics, first_sem_ave, second_sem_ave, year_ave } = dataPayload;
  const getSafeAverage = (val1, val2) => {
      const num1 = val1 === '' || val1 === null ? 0 : Number(val1);
      const num2 = val2 === '' || val2 === null ? 0 : Number(val2);
      
      // If both tables are empty for this quarter, return an empty string
      if (val1 === '' && val2 === '') return ''; 
      
      // If one table is empty, don't divide by 2, just return the active table's value
      if (val1 === '') return num2;
      if (val2 === '') return num1;

      // Standard Average formula: (A + B) / 2
      return (num1 + num2) / 2;
    };

    // 📊 Calculate the true, safe averages across both tables
    const aveQ1basis = getSafeAverage(temp1.value, metrics['1'].efficiency);
    const aveQ2basis = getSafeAverage(temp2.value, metrics['2'].efficiency);
    const aveQ3basis = getSafeAverage(temp3.value, metrics['3'].efficiency);
    const aveQ4basis = getSafeAverage(temp4.value, metrics['4'].efficiency);

    
    const aveQ1smps = getSafeAverage(table2Smp.value['1'], metrics['1'].smp);
    const aveQ2smps = getSafeAverage(table2Smp.value['2'], metrics['2'].smp);
    const aveQ3smps = getSafeAverage(table2Smp.value['3'], metrics['3'].smp);
    const aveQ4smps = getSafeAverage(table2Smp.value['4'], metrics['4'].smp);

    const ave1stSem = getSafeAverage(first_sem_ave, tempSemVal.value['1']);
    const ave2ndSem = getSafeAverage(second_sem_ave, tempSemVal.value['2']);
    const aveYear = getSafeAverage(year_ave, tempSemVal.value['3']);
  scoreboardData.value.push(
    {
      particular: 'Review Function as ' + PMS_level.value + '',
      isBold: true ,
      isItalic: true
    },
    {
      particular: 'Dimension: Efficiency',
      isBold: true 
    },
   {
      particular: `Number of requests with complete documents and comprehensive releases acted upon within the prescribed period`,
      q1_basis: quarterCounts['1'], q1_spms: '',
      q2_basis: quarterCounts['2'], q2_spms: '', 
      sem1_spms: '',
      q3_basis: quarterCounts['3'], q3_spms: '',
      q4_basis: quarterCounts['4'], q4_spms:'',
      sem2_spms: '', year_end_spms:'',
      allowEdit: true 
    },
    {
      particular: `<strong>11 working days</strong> shall be the prescribed period for highly technical transactions`,
      q1_basis: mt2Counts.value['1']['4'], q1_spms: '',
      q2_basis: mt2Counts.value['2']['4'], q2_spms: '', 
      sem1_spms: '',
      q3_basis: mt2Counts.value['3']['4'], q3_spms: '',
      q4_basis: mt2Counts.value['4']['4'], q4_spms:'',
      sem2_spms: '', year_end_spms:'',
      allowEdit: true 
    },
    {
      particular: ` <strong>5 calendar days</strong> for payment for retirement and terminal leave benefits `,
      q1_basis: mt2Counts.value['1']['5'], q1_spms: '',
      q2_basis: mt2Counts.value['2']['5'], q2_spms: '', 
      sem1_spms: '',
      q3_basis: mt2Counts.value['3']['5'], q3_spms: '',
      q4_basis: mt2Counts.value['4']['5'], q4_spms:'',
      sem2_spms: '', year_end_spms:'',
      allowEdit: true 
    },
    {
      particular: ` <strong>Comprehensive releases</strong>  acted upon within the prescribed period  `,
      q1_basis: mt2Counts.value['1']['24'], q1_spms: '',
      q2_basis: mt2Counts.value['2']['24'], q2_spms: '', 
      sem1_spms: '',
      q3_basis: mt2Counts.value['3']['24'], q3_spms: '',
      q4_basis: mt2Counts.value['4']['24'], q4_spms:'',
      sem2_spms: '', year_end_spms:'',
      allowEdit: true 
    },
    {
      particular: `Number of requests with complete documents received and comprehensive releases due for the quarter`,
      q1_basis: quarterCounts2['1'], q1_spms: '',
      q2_basis: quarterCounts2['2'], q2_spms: '',
      sem1_spms: '',
      q3_basis: quarterCounts2['3'], q3_spms: '',
      q4_basis: quarterCounts2['4'], q4_spms: '',
      sem2_spms: '', year_end_spms: '',
      allowEdit: true 
    },
    {
     particular: 'Rating on Efficiency (as ' + PMS_level.value + ')',
      q1_basis: metrics['1'].efficiency, q1_spms: metrics['1'].smp,
      q2_basis: metrics['2'].efficiency, q2_spms: metrics['2'].smp,
      sem1_spms: first_sem_ave,
      q3_basis: metrics['3'].efficiency, q3_spms: metrics['3'].smp,
      q4_basis: metrics['4'].efficiency, q4_spms: metrics['4'].smp,
      sem2_spms: second_sem_ave, year_end_spms: year_ave,
      isBold: true
    },
    {
      particular: '',
      customHeight: '20px' 
    },
    {
      particular: 'AVERAGE RATING',
      q1_basis: aveQ1basis , q1_spms: aveQ1smps,
      q2_basis: aveQ2basis , q2_spms: aveQ2smps,
      sem1_spms:ave1stSem,
      q3_basis: aveQ3basis , q3_spms: aveQ3smps,
      q4_basis: aveQ4basis, q4_spms: aveQ4smps,
      sem2_spms: ave2ndSem, year_end_spms: aveYear,
      isBold: true,
      isLarge: true,
      allowEdit: true 
    }
  );
};
// Composition API implementation of the Search Filter
const filteredScoreboardData = computed(() => {
  if (!search.value) return scoreboardData.value;
  
  const query = search.value.toLowerCase();
  
  return scoreboardData.value.filter(row => {
    return Object.values(row).some(value => 
      String(value).toLowerCase().includes(query)
    );
  });
});
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
  <v-container>  
<v-row align="center" no-gutters>
  <v-col cols="auto" class="pe-4">
    <v-checkbox 
      v-model="selectedQuarters" 
      value="1" 
      label="First Quarter" 
      hide-details 
      density="compact"
    ></v-checkbox>
  </v-col>
  
  <v-col cols="auto" class="pe-4">
    <v-checkbox 
      v-model="selectedQuarters" 
      value="2" 
      label="Second Quarter" 
      hide-details 
      density="compact"
    ></v-checkbox>
  </v-col>
  
  <v-col cols="auto" class="pe-4">
    <v-checkbox 
      v-model="selectedQuarters" 
      value="3" 
      label="Third Quarter" 
      hide-details 
      density="compact"
    ></v-checkbox>
  </v-col>
  
  <v-col cols="auto">
    <v-checkbox 
      v-model="selectedQuarters" 
      value="4" 
      label="Fourth Quarter" 
      hide-details 
      density="compact"
    ></v-checkbox>
  </v-col>
</v-row>
<v-row>
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
</v-row>
<v-row no-gutters class="mt-2">
  <v-col cols="auto" class="pe-2">
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
                 <div><span class = "header-name">MONITORING TOOL 2: REQUESTS FOR BUDGET AUTHORIZATION AND VARIATION</span></div>
                <div><span class = "header-title2">FOR THE PEROIOD COVERED <span id = "sel-quarter">{{ from_date }}</span> to <span id = "sel-quarter">{{ to_date }}</span>, <span id="sel-year">{{ selectedYearName }}</span></span></div>
            </v-col>
        </v-row>
    </v-container>
        <div class="table-container">
      <table class="scoreboard-native-table">
  <thead>
    <tr>
      <th rowspan="2">PARTICULARS</th>
      <th colspan="2">1st Quarter</th>
      <th colspan="2">2nd Quarter</th>
      <th rowspan="2">1st Semester<br>SPMS Rating</th>
      <th colspan="2">3rd Quarter</th>
      <th colspan="2">4th Quarter</th>
      <th rowspan="2">2nd Semester<br>SPMS Rating</th>
      <th rowspan="2">Year-End<br>SPMS Rating</th>
    </tr>
    <tr>
      <th>Basis</th>
      <th>SMPs</th>
      <th>Basis</th>
      <th>SMPs</th>
      <th>Basis</th>
      <th>SMPs</th>
      <th>Basis</th>
      <th>SMPs</th>
    </tr>
  </thead>
  <tbody>
    <tr v-for="(row, index) in filteredScoreboardData" 
        :key="index"
        :style="{ height: row.customHeight }"
        :class="{ 'text-bold': row.isBold, 'text-large': row.isLarge, 'text-italic': row.isItalic }"> 
        
    <td :contenteditable="row.allowEdit" 
        @blur="row.particular = $event.target.innerHTML" 
        class="text-left"
        v-html="row.particular">
    </td>
      <td :contenteditable="row.allowEdit" @blur="row.q1_basis = $event.target.innerText">
        {{ displayValue(row.q1_basis) }}
      </td>
      <td :contenteditable="row.allowEdit" @blur="row.q1_spms = $event.target.innerText">
        {{ displayValue(row.q1_spms) }}
      </td>

      <td :contenteditable="row.allowEdit" @blur="row.q2_basis = $event.target.innerText">
        {{ displayValue(row.q2_basis) }}
      </td>
      <td :contenteditable="row.allowEdit" @blur="row.q2_spms = $event.target.innerText">
        {{ displayValue(row.q2_spms) }}
      </td>

      <td :contenteditable="row.allowEdit" @blur="row.sem1_spms = $event.target.innerText">
        {{ displayValue(row.sem1_spms) }}
      </td> 

      <td :contenteditable="row.allowEdit" @blur="row.q3_basis = $event.target.innerText">
        {{ displayValue(row.q3_basis) }}
      </td>
      <td :contenteditable="row.allowEdit" @blur="row.q3_spms = $event.target.innerText">
        {{ displayValue(row.q3_spms) }}
      </td>

      <td :contenteditable="row.allowEdit" @blur="row.q4_basis = $event.target.innerText">
        {{ displayValue(row.q4_basis) }}
      </td>
      <td :contenteditable="row.allowEdit" @blur="row.q4_spms = $event.target.innerText">
        {{ displayValue(row.q4_spms) }}
      </td>

      <td :contenteditable="row.allowEdit" @blur="row.sem2_spms = $event.target.innerText">
        {{ displayValue(row.sem2_spms) }}
      </td> 

      <td :contenteditable="row.allowEdit" @blur="row.year_end_spms = $event.target.innerText">
        {{ displayValue(row.year_end_spms) }}
      </td> 
    </tr>
  </tbody>
</table>
    </div>
        <v-container fluid class="signatory-container print-container">
        <v-row class="print-row">
          <v-col class="individual-one">
            <div class="signatory-block"><strong>Prepared by:</strong></div>
            <div class="signatory-name">{{ individual_name }}</div>
            <div>{{ PMS_level }}</div>
          </v-col>
          <v-col class="individual-two">
            <div class="signatory-block"><strong>Reviewed by:</strong></div>
            <div class="signatory-name">{{ divisionChief }}</div>
            <div>Division Chief</div>
          </v-col>
          <v-col class="individual-three">
              <div class="signatory-block"><strong>Approved by:</strong></div>
            <div class="signatory-name">{{ ARD_name }}</div>
            <div>{{ ARD_pos }}</div>
          </v-col>
          <v-col class="individual-four">
            <div class="signatory-block"><strong></strong></div>
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