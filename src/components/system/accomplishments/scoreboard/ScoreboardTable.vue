<script setup>
import { ref, onMounted, watch } from "vue";
import ConfirmDialog from "@/components/common/ConfirmDialog.vue";
import AlertNotification from "@/components/common/AlertNotification.vue";
import supabase from '@/components/system/accomplishments/scoreboard/supabase'
import { useScoreboardTable } from "@/composables/scoreboard/scoreboardTable";
import { useScoreboardLogic } from './scoreboardLogic.js'
import { scoreboardUpdate } from './scoreboardupdate.js'
import { scoreboardUpdateFad } from './scoreboardupdatefad.js'
import { scoreboardUpdate_receiving } from './scoreboardupdate_receiving.js'
import { scoreboardUpdate_receivingfad } from './scoreboardupdate_receivingfad.js'
import { format } from 'date-fns'
import { useRouter } from 'vue-router';
import { useScoreboardStore } from "@/stores/scoreboard";
const router = useRouter();

const {
  type_of_transaction,
  nature_of_transaction,
  assignableUsers,
  fetchLoggedInUser: logicFetchLoggedInUser,
  fetchUserDivisionId,
  fetchUsersByDivision,
  staffList,
}= useScoreboardLogic();

const { onLoadItems, tableOptions, formAction } = useScoreboardTable();
const dialog = ref(false);
const userUUID = ref(null);
const userRole = ref(null);
const search = ref("");
const scoreboardData = ref([]);
const scoreboardDataFad = ref([]);
const showDialog1 = ref(false);
const showDialog2 = ref(false);
const showDialog3 = ref(false);
const showDialog4 = ref(false);
const isEditable = ref(false) 
const isEditable2 = ref(false) 
const isEditable2others = ref(false) 
const transactionList = ref([]); 
const subtypeList = ref([]); 
const supportservices = ref([]);
const supportservicesitems = ref([]);
const fadSubUnits = ref([]); 
const processOwners = ref([]);
const transactioncheckerFlag = ref(0); 
const servicecheckerFlag = ref(0); 

const dateForwardedDialog = ref(false);
const selectedTimeForwarded = ref('');
const ReTimeFor = ref('');
const ReTimeRec = ref('');
const ReTimeFor2 = ref('');
const ReTimeRec2 = ref('');
const DateForwarded_FAD = ref('');
const TimeForwarded_FAD = ref('');
const dmsReferenceNumber = ref('');
const dmsReferenceNumber2 = ref('');
const dmstitle = ref('');
const transactionID = ref(null);
const subTypeID = ref(null);
const ssID = ref(null);
const ssItems = ref(null);
const ownerId = ref(null);
const subunitId = ref(null);
const subunitId2 = ref(null);
const itemId = ref(null);
const internalId = ref(null);
const externalId = ref(null);
const assigntoId = ref(null);
const ccId = ref(null);
const others = ref('');
const DowntimeType = ref('');

const userId = ref(null);
const natureId = ref(null);
const typeId = ref(null);
const processId = ref(null);
const processId2 = ref(null);
const scoreboardId = ref(null);
const selDateForwarded = ref(null);
const ReDateFor = ref(null);
const ReDateRec = ref(null);
const ReDateFor2 = ref(null);
const ReDateRec2 = ref(null);
const downtimeValue = ref(null);
const downtimeRemark = ref(null);
const processlevel = ref(null);
const reassignto = ref(null);

const timeDialogForwarded = ref(false);
const RetimeDialogForwarded = ref(false);
const RetimeDialogReceived = ref(false);
const RedateForwardedDialog = ref(false);
const RedateReceivedDialog = ref(false);
const RetimeDialogForwarded2 = ref(false);
const RetimeDialogReceived2 = ref(false);
const RedateForwardedDialog2 = ref(false);
const RedateReceivedDialog2 = ref(false);
const showTransactionFields = ref(true);
const successDialog = ref(false);

const showNonReceivingTable = ref(false);
const showReceivingTable = ref(false);
const showReceivingTableFad = ref(false);
const showReceivingselector = ref(false);
const showFADTable = ref(false);
const formatDate = (timestamp) => {
  if (!timestamp) return "N/A"; // Handle empty cases

  const date = new Date(timestamp);

  return new Intl.DateTimeFormat("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric"
  }).format(date);
};


const updateTechnical = async () => {
  const result = await scoreboardUpdate({
    processLevel: processlevel.value,
    userUUID: userUUID.value,
    process_id: processId.value,
    scoreboard_id: scoreboardId.value,
    nature_id: natureId.value,
    type_id: typeId.value,
    downtime_value: downtimeValue.value,
    downtime_remark: downtimeRemark.value,
    datepart: selDateForwarded.value,
    timepart: selectedTimeForwarded.value,
    assignto_id: userId.value
  })
  if (result.success) {
    console.log("✅ Update successful")
    successDialog.value = true;
    router.push('/scoreboard');
  } else {
    console.error("❌ Update failed", result.error)
  }
};
const updateFAD = async () => {
  const result = await scoreboardUpdateFad({
    userUUID: userUUID.value,
    process_id: processId.value,
    process_id2: processId2.value,
    scoreboard_id: scoreboardId.value,
    downtime_value: downtimeValue.value,
    downtime_remark: downtimeRemark.value,
    downtime_type: DowntimeType.value,
    datepart: DateForwarded_FAD.value,
    timepart: TimeForwarded_FAD.value,
    assignto_id: assigntoId.value,
    sub_unit_id: subunitId2.value
  })
  if (result.success) {
    console.log("✅ Update successful")
    successDialog.value = true;
    router.push('/scoreboard');
  } else {
    console.error("❌ Update failed", result.error)
  }
};

function reloadPage() {
  window.location.reload();
}

watch(isEditable, (newVal) => {
  transactioncheckerFlag.value = newVal ? 1 : 0;
});

watch(isEditable2, (newVal) => {
  servicecheckerFlag.value = newVal ? 1 : 0;
});
const fetchTransactionTypes = async () => {
  try {
    const { data, error } = await supabase
      .from('type_of_transactions_fad')
      .select('id, name');

    if (error) {
      console.error('Error fetching transactions:', error);
      return;
    }

    // Map the fetched data
    transactionList.value = data.map(item => ({
      id: item.id,
      transaction_name: item.name, // Display name
    }));

  } catch (err) {
    console.error('Unexpected error fetching transaction types:', err);
  }
};
const fetchSubTypes = async () => {
  if (!transactionID.value) {
    subtypeList.value = []; // Clear sub-type list if no transaction selected
    return;
  }

  let tableName = '';

  if (transactionID.value === 1) {
    tableName = 'citizen_charter';
    
  } else if (transactionID.value === 2) {
    tableName = 'internal_reports';
  }else if (transactionID.value === 3) {
    tableName = 'external_reports';
  } else {
    subtypeList.value = []; // No valid transaction type selected
    return;
  }
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('id, name'); // Fetch sub-types

    if (error) {
      console.error(`Error fetching ${tableName}:`, error);
      return;
    }

    subtypeList.value = data.map(item => ({
      id: item.id,
      subtype: item.name,
    }));

  } catch (err) {
    console.error(`Unexpected error fetching ${tableName}:`, err);
  }
};
//Fetching support services
const fetchSupportServices = async () => {

  try {
    const { data, error } = await supabase
      .from('support_services')
      .select('id, name');

    if (error) {
      alert('Error fetching Support Servics:', error);
      return;
    }
    console.log("Support Services result:", data); // 
    // Map the fetched data
    supportservices.value = data.map(item => ({
      id: item.id,
      support_services: item.name,
    }));

  } catch (err) {
    console.error('Unexpected error fetching transaction types:', err);
  }
};
const fetchProcessOwners = async () => {
  let subunitID = subunitId2.value;
  console.log("Selected FAD Sub Units:", subunitID);
  try {
    const { data, error } = await supabase
      .from('view_fad_process_owner')
      .select('*')
      .eq('sub_unit_id',subunitID )
    console.log('Fetched process owner data:', data);
    if (error) {
      console.error('Error fetching process owners:', error);
      return;
    }

    processOwners.value = data.map(user => {
      console.log('user_id:', user.user_id); // 👈 Logs the UUID
      return {
        id: user.id,
        name: `${user.pos} - ${user.firstname} ${user.lastname}`.trim()
      };
    });

  } catch (err) {
    console.error('Unexpected error fetching process owners:', err);
  }
};
watch(() => subunitId2.value, fetchProcessOwners);
const type_of_downtime = ref([])
  // Fetch Type of Transactions from Supabase
const fetchTypeOfDowntime = async () => {
    try {
     
      const { data, error } = await supabase.from('type_of_downtime').select('id, name')
      if (error) {
        console.error('Error fetching Type of Downtime:', error)
        return
      }
      type_of_downtime.value = data.map(item => ({
        title: item.name,
        value: item.id
      }))
      console.log("Fetched Downtime Types:", data);
    } catch (err) {
      console.error('Unexpected error fetching Type of downtime:', err)
    }
  } 
const fetchSupportServicesItems = async () => {
  if (!ssID.value) {
    subtypeList.value = []; // Clear sub-type list if no transaction selected
    return;
  }
  console.log("Support Services ID", ssID.value);
  try {
    const { data, error } = await supabase
      .from('support_services_items')
      .select('id, name')
      .eq('ss_id',ssID.value );

    if (error) {
      console.error('Error fetching  support_services_items:', error);
      return;
    }
    console.log('Raw data from support_services_items:', data);
    supportservicesitems.value = data.map(item => ({
      id: item.id,
      support_services_items: item.name,
    }));

  } catch (err) {
    console.error('Unexpected error fetchingsupport_services_items:', err);
  }
};
const fetchFADSubUnits = async () => {
  try {
    const { data, error } = await supabase
      .from('fad_sub_units')
      .select('id, name'); 

    if (error) {
      console.error('Error fetching FAD Sub Units:', error);
      return;
    }

    console.log("FAD Sub Units Data:", data); // ✅ Log fetched data

    fadSubUnits.value = data.map(item => ({
      id: item.id,
      name: item.name, // Display name
    }));

  } catch (err) {
    console.error('Unexpected error fetching FAD Sub Units:', err);
  }
};
const updateReceiving = async () => {
  const result = await  scoreboardUpdate_receiving({
  
    process_id: processId.value,
    scoreboard_id: scoreboardId.value,
    dms_reference_number: dmsReferenceNumber.value,
    datepartforwarded:ReDateFor.value, 
    datepartreceived: ReDateRec.value,
    timepartforwarded: ReTimeFor.value,
    timepartreceived: ReTimeRec.value,
    assignto_id: reassignto.value
  })
  if (result.success) {
    console.log("✅ Update successful")
    successDialog.value = true;
    router.push('/scoreboard');
  } else {
    console.error("❌ Update failed", result.error)
  }
};

const updateReceivingFAD = async () => {
  console.log(" Process Id ", processId.value);
  console.log(" Scoreboard", scoreboardId.value);
  console.log("DMS Reference Number", dmsReferenceNumber2.value);
  const result = await  scoreboardUpdate_receivingfad({
    process_id: processId.value,
    scoreboard_id: scoreboardId.value,
    dms_reference_number: dmsReferenceNumber2.value,
    dmstitle: dmstitle.value,
    datepartforwarded:ReDateFor2.value, 
    datepartreceived: ReDateRec2.value,
    timepartforwarded: ReTimeFor2.value,
    timepartreceived: ReTimeRec2.value,
    assignto_id: ownerId.value,
    internal_id: internalId.value,
    external_id: externalId.value,
    cc_id: ccId.value,
    sub_unit_id: subunitId.value,
    item_id: ssItems.value,
    transactioncheckerFlag: transactioncheckerFlag.value, 
    servicecheckerFlag: servicecheckerFlag.value,
    transaction_id: transactionID.value, 
    subType_id: subTypeID.value,
    others: others.value
  })
    if (result.success) {
      console.log("✅ Update Successful")
      successDialog.value = true;
      router.push('/scoreboard');
    } else {
      console.error("❌ Update failed", result.error)
    }
};

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

     await fetchScoreboardDataBasedOnRole(); 
    }catch (err) {
       console.error("❌ Unexpected error fetching scoreboard data:", err); 
    }
  }
};
const fetchScoreboardDataBasedOnRole = async () => {
  try {
    let query;
    if (userRole.value === 'FAD') {
      showFADTable.value = true;

      query = supabase
      .from('scoreboard_monitor_fad')
      .select('*')
      .eq('owner_id', userUUID.value)
      .eq('status','Accepted')
      .order('date_forwarded', { ascending: false })

    }else if(userRole.value==='Receiving'){
      //showNonReceivingTable.value = false;
      showReceivingTable.value = true;
      showReceivingselector.value = true;

      const { data: fadData, error: fadError } = await supabase
        .from('view_scoreboard_monitoring_receiving_fad')
        .select('*')

      if (fadError) {
        console.error("❌ Error fetching for scoreboardDataFad", fadError);
        return;
      }
      console.log("✅ Content:", fadData);

      scoreboardDataFad.value = fadData.map(row => {
        return { 
          dms_reference_number: row.dms_reference_number ?? '—',
          dms_title: row.dms_title ?? '—',
          date_received: formatDate(row.date_received) ?? null,
          date_forwarded: formatDate(row.date_forwarded) ?? null,
          date_forwarded_timestamp: row.date_forwarded ?? null,
          date_received_timestamp: row.date_received ?? null,
          assignto: row.name ?? '—',
          status: row.status ?? '—',
          assignto_id: row.owner_id ?? null,
          sub_unit_id: row.sub_unit_id ?? null,
          sub_unit_name: row.sub_unit_name ?? '-',
          internal_id: row.internal_id ?? null,
          external_id: row.external_id ?? null,
          cc_id: row.cc_id ?? null,
          item_id: row.item_id ?? null,
          ss_id: row.ss_id ?? null,
          others: row.others ?? null,
          process_id: row.process_id ?? null,
          scoreboard_id: row.scoreboard_id ?? null
        };
      });
       query = supabase
      .from('view_scoreboard_monitoring_receiving')
      .select('*')
    } 
    else {
      showNonReceivingTable.value = true;
      showReceivingTable.value = false;
      showReceivingselector.value = false;
      query = supabase
      .from('scoreboad_monitor')
      .select('*')
      .eq('owner_id', userUUID.value)
      .eq('status','Accepted')
    } 
    const { data, error } = await query;

    if (error) {
      console.error(`❌ Error fetching data from :`, error);
      return;
    }
    console.log("Here");
    // 🛠 Normalize the data for consistent table rendering
    scoreboardData.value = data.map(row => {
        
      if (userRole.value === 'FAD') {
        return {
          dms_reference_number: row.dms_reference_number ?? '—',
           date_received: formatDate(row.date_forwarded) ?? null,
          date_received_timestamp: row.date_received,
          date_forwarded_timestamp: row.date_forwarded,
          sub_unit: row.sub_unit ?? '—',
          sub_unit_id: row.sub_unit_id ?? '—',
          status: row.status2 ?? '—',
          process_id: row.process_id ?? null,
          assignto_name: row.name ?? null,
          assignto_id: row.assignto_id ?? null,
          owner_id: row.owner_id ?? null, 
          scoreboard_id: row.scoreboard_id ?? null,
          downtime_value: row.downtime_value ?? null,
          downtime_remark: row.downtime_remark ?? null,
          downtime_type: row.downtime_type ?? null,
          process_id2: row.process_id2 ?? null,
        };
      } else if(userRole.value==='Receiving'){
         return {
          dms_reference_number: row.dms_reference_number ?? '—',
          date_received: formatDate(row.date_received) ?? null,
          date_forwarded: formatDate(row.date_forwarded) ?? null,
          date_forwarded_timestamp: row.date_forwarded ?? null,
          date_received_timestamp: row.date_received ?? null,
          assignto: row.name ?? '—',
          status: row.status ?? '—',
          assignto_id: row.assignto_id ?? null,
          process_id: row.process_id ?? null,
          scoreboard_id: row.scoreboard_id ?? null
        };
      }
      else {
        return {
          dms_reference_number: row.dms_reference_number ?? '—',
          date_received: formatDate(row.date_forwarded ?? row.date_received),
          name: row.name ?? '—',
          agency_name: row.agency_name ?? '—',
          level: row.level ?? '—',
          status: row.status ?? '—',
          process_id: row.process_id ?? null,
          scoreboard_id: row.scoreboard_id ?? null
        };
      }
    });

  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}
const updateScoreboard = async (item) => {
  console.log("Update Owner_id:", userUUID.value);
  console.log("update process_id", item.process_id);
  if(userRole.value === 'Receiving'){
     showDialog2.value = true;
    reassignto.value= item.assignto_id;
    console.log("Date Forwarded: ", item.date_forwarded_timestamp)
    console.log("Date Received: ", item.date_received_timestamp)
    ReDateFor.value =  new Date(item.date_forwarded_timestamp);
    ReDateRec.value =  new Date(item.date_received_timestamp);
    ReTimeFor.value = format(new Date(item.date_forwarded_timestamp), 'HH:mm');  
    ReTimeRec.value = format(new Date(item.date_received_timestamp), 'HH:mm');  
    dmsReferenceNumber.value = item.dms_reference_number;
    processId.value = item.process_id;
    scoreboardId.value = item.scoreboard_id;
  }
  else{
    if (item.level === 'Individual') {
     showTransactionFields.value = true;
    try {
      const { data: upData, error: upError } = await supabase
        .from('view_update_technical')
        .select('*')
        .eq('owner_id', userUUID.value)
        .eq('process_id', item.process_id);

      if (upError) {
        console.error("❌ Error fetching user role:", upError);
        return;
      }
      console.log("✅ Content:", upData);

      // ✅ Assign nature_id to select's v-model
      processlevel.value = item.level;
      natureId.value = upData[0]?.nature_id || null;
      typeId.value = upData[0]?.type_id || null;
      downtimeValue.value = upData[0]?.downtime || null;
      downtimeRemark.value = upData[0]?.remark || null;
      processId.value =  upData[0]?.process_id|| null;
      scoreboardId.value =  upData[0]?.scoreboard_id|| null;
     selDateForwarded.value = upData[0]?.date_forwarded
        ? new Date(upData[0].date_forwarded)
        : null;
      selectedTimeForwarded.value = upData[0]?.date_forwarded
        ? format(new Date(upData[0].date_forwarded), 'HH:mm')  //
        : '';
      const { data: userData, error: userError } = await supabase
        .from('scoreboard_technical_process')
        .select('owner_id')
        .eq('from_id', userUUID.value)
        .eq('scoreboard_id', item.scoreboard_id);

      if (userError) {
        console.error("❌ Error fetching user role:", upError);
        return;
      }
      userId.value = userData[0]?.owner_id || null;
      showDialog1.value = true;
    } catch (err) {
      console.error("❌ Unexpected error fetching scoreboard data:", err);
    }
  }
  else if (item.level === 'Senior BMS' || item.level ==='Supervising'){
     showTransactionFields.value = false;
    try {
      const { data: upData, error: upError } = await supabase
        .from('view_update_supervising')
        .select('*')
        .eq('owner_id', userUUID.value)
        .eq('process_id', item.process_id);

      if (upError) {
        console.error("❌ Error fetching user role:", upError);
        return;
      }
      console.log("✅ Content:", upData);

      // ✅ Assign nature_id to select's v-model
    processlevel.value = item.level;
      downtimeValue.value = upData[0]?.downtime || null;
      downtimeRemark.value = upData[0]?.remark || null;
      processId.value =  upData[0]?.process_id|| null;
      scoreboardId.value =  upData[0]?.scoreboard_id|| null;
     selDateForwarded.value = upData[0]?.date_forwarded
        ? new Date(upData[0].date_forwarded)
        : null;
      selectedTimeForwarded.value = upData[0]?.date_forwarded
        ? format(new Date(upData[0].date_forwarded), 'HH:mm')  //
        : '';
      const { data: userData, error: userError } = await supabase
        .from('scoreboard_technical_process')
        .select('owner_id')
        .eq('from_id', userUUID.value)
        .eq('scoreboard_id', item.scoreboard_id);

      if (userError) {
        console.error("❌ Error fetching user role:", upError);
        return;
      }
      userId.value = userData[0]?.owner_id || null;
      showDialog1.value = true;
    } catch (err) {
      console.error("❌ Unexpected error fetching scoreboard data:", err);
    }
  }

  }
  
};
const display_others = async () => {
 
  const selectedId = ssItems.value;
  const selectedItem = supportservicesitems.value.find( item => item.id === selectedId
);
  console.log("item name:",  selectedItem.support_services_items);
 
  if( selectedItem.support_services_items==='Others')
  {
     isEditable2others.value = true;
  }
  else{
     isEditable2others.value = false;
     others.value = "";
  }
}
watch(() => ssItems.value, display_others);
const updateScoreboardFAD = async (item) => {
    showDialog3.value = true;
    ownerId.value= item.assignto_id;
    console.log("Date Forwarded: ", item.date_forwarded_timestamp)
    console.log("Date Received: ", item.date_received_timestamp)

    ReDateFor2.value =  new Date(item.date_forwarded_timestamp);
    ReDateRec2.value =  new Date(item.date_received_timestamp);
    ReTimeFor2.value = format(new Date(item.date_forwarded_timestamp), 'HH:mm');  
    ReTimeRec2.value = format(new Date(item.date_received_timestamp), 'HH:mm');  
    dmsReferenceNumber2.value = item.dms_reference_number;
    dmstitle.value =item.dms_title; 
    subunitId.value = item.sub_unit_id;
    processId.value = item.process_id;
    scoreboardId.value = item.scoreboard_id;
    itemId.value = item.item_id;
    internalId.value = item.internal_id;
    externalId.value = item.external_id;
    ccId.value = item.cc_id;
    others.value = item.others;
    ssID.value = item.ss_id;
    fetchSupportServicesItems();
    
     ssItems.value = item.item_id;
    if(internalId.value != null){
        transactionID.value = 2;
        subTypeID.value = internalId.value;
    }
    else if(externalId.value != null){
        transactionID.value = 3;
        subTypeID.value = externalId.value;
    }
    else if(ccId.value != null){
       transactionID.value = 1;
       subTypeID.value = ccId.value;
    }
    else{
      console.log("No type of transaction");
    }
};staffList

const updateScoreboardFAD2 = async (item) => {
    showDialog4.value = true;
    fetchProcessOwners();
    assigntoId.value= item.assignto_id;
    console.log("Date Forwarded: ", item.date_forwarded_timestamp)
    console.log("Date Received: ", item.date_received_timestamp)
    DateForwarded_FAD.value =  new Date(item.date_forwarded_timestamp);
    TimeForwarded_FAD.value = format(new Date(item.date_forwarded_timestamp), 'HH:mm');  
    subunitId2.value = item.sub_unit_id;
    processId.value = item.process_id;
    processId2.value = item.process_id2;
    scoreboardId.value = item.scoreboard_id;
    downtimeRemark.value = item.downtime_remark;
    downtimeValue.value = item.downtime_value;
    DowntimeType.value = item.downtime_type; 
};
const handleAction = (action) => {
  switch (action) { 
    
    case 'technical':
      showReceivingTable.value = true;
      showReceivingTableFad.value = false;
      break;
    case 'fad':
      showReceivingTable.value = false;
      showReceivingTableFad.value = true;
      break;
    default:
      console.warn("Unknown action:", action);
  }
};
watch(() => transactionID.value, fetchSubTypes);
watch(() => ssID.value, fetchSupportServicesItems);
onMounted(async () => {
  await fetchLoggedInUser(); 
  await fetchTypeOfDowntime();
  await logicFetchLoggedInUser();     // get the UUID
  await fetchUserDivisionId();        // get division using UUID
  await fetchUsersByDivision();   
  await fetchTransactionTypes();
  await fetchSupportServices();
  await fetchFADSubUnits();
});
</script>

<template>
  <AlertNotification :form-success-message="formAction.formSuccessMessage"
    :form-error-message="formAction.formErrorMessage"></AlertNotification>

  <v-btn class="my-1" prepend-icon="mdi-account-plus" color="green-darken-1" @click="dialog = true">
            Add Received DMS
          </v-btn>

  <v-text-field
    v-model="search"
    label="Search"
    prepend-icon="mdi-magnify"
    clearable
    hide-details
    class="mb-4"
  />
  <v-select v-if="showReceivingselector"
          :items="[
                          { label: 'FAD', action: 'fad' },
                          { label: 'Technical', action: 'technical' }
                        ]"
                        label="Select Division"
                        item-title="label"
                        item-value="action"
                        variant="outlined"
                        density="compact"
                        hide-details
                        @update:modelValue="handleAction($event, item)"
                        max-width="200px"
                      />
 <v-data-table :items="scoreboardData"   :search="search" class="elevation-1" v-if="showNonReceivingTable">
                <template v-slot:headers>
                  <tr>
                    <th>DMS Reference Number</th>
                    <th>Date Received</th>
                    <th>Agency/Sub Unit</th>
                    <th>Level</th>
                    <th style = "text-align: center;" colspan ="2">Action</th>
                  </tr>
                </template>
                <template v-slot:body="{ items }">
                  <tr v-for="item in items" :key="item.dms_reference_number">
                    <td>{{ item.dms_reference_number }}</td>
                    <td>{{ item.date_received }}</td>
                    <td>{{ item.agency_name }}</td>
                    <td>{{ item.level }}</td>
                    <td>
                      <v-btn 
                        color="lime-darken-1" 
                        class="mr-2"
                        size="small" 
                        @click="updateScoreboard(item)"
                      >
                       <v-icon left >mdi-pencil</v-icon>
                        Edit
                      </v-btn>
                    </td>
                     <td>
                      <v-btn 
                        color="red-lighten-1" 
                        size="small" 
                        @click="goToAddScoreboard(item)"
                      ><v-icon left>mdi-delete</v-icon>
                        Delete
                      </v-btn>
                    </td>
                  </tr>
                </template>
    </v-data-table>
  <v-data-table :items="scoreboardData"   :search="search" class="elevation-1" v-if="showFADTable">
                <template v-slot:headers>
                  <tr>
                    <th>DMS Reference Number</th>
                    <th>Date Forwarded</th>
                    <th>Sub Unit</th>
                    <th>Assigned to</th>
                    <th>Status</th>
                    <th style = "text-align: center;" colspan ="2">Action</th>
                  </tr>
                </template>
                <template v-slot:body="{ items }">
                  <tr v-for="item in items" :key="item.dms_reference_number">
                    <td>{{ item.dms_reference_number }}</td>
                    <td>{{ item.date_received }}</td>
                    <td>{{ item.sub_unit }}</td>
                    <td>{{ item.assignto_name }}</td>
                     <td>{{ item.status }}</td>
                    <td>
                      <v-btn 
                        color="lime-darken-1" 
                        class="mr-2"
                        size="small" 
                        @click="updateScoreboardFAD2(item)"
                      >
                       <v-icon left >mdi-pencil</v-icon>
                        Edit
                      </v-btn>
                    </td>
                     <td>
                      <v-btn 
                        color="red-lighten-1" 
                        size="small" 
                        @click="goToAddScoreboard(item)"
                      ><v-icon left>mdi-delete</v-icon>
                        Delete
                      </v-btn>
                    </td>
                  </tr>
                </template>
    </v-data-table>
        <v-data-table :items="scoreboardData"   :search="search" class="elevation-1"  v-if="showReceivingTable">
                <template v-slot:headers>
                  <tr>
                    <th>DMS Reference Number</th>
                    <th>Date Received</th>
                    <th>Data Forwarded</th>
                    <th>Assign to</th>
                     <th>Status</th>
                    <th style = "text-align: center;" colspan ="2">Action</th>
                  </tr>
                </template>
                <template v-slot:body="{ items }">
                  <tr v-for="item in items" :key="item.dms_reference_number">
                    <td>{{ item.dms_reference_number }}</td>
                    <td>{{ item.date_received }}</td>
                    <td>{{ item.date_forwarded }}</td>
                    <td>{{ item.assignto }}</td>
                    <td>{{ item.status}}</td>
                    <td>
                      <v-btn 
                        color="lime-darken-1" 
                        class="mr-2"
                        size="small" 
                        @click="updateScoreboard(item)"
                      >
                       <v-icon left >mdi-pencil</v-icon>
                        Edit
                      </v-btn>
                    </td>
                     <td>
                      <v-btn 
                        color="red-lighten-1" 
                        size="small" 
                        @click="goToAddScoreboard(item)"
                      ><v-icon left>mdi-delete</v-icon>
                        Delete
                      </v-btn>
                    </td>
                  </tr>
                </template>
        </v-data-table>
        <v-data-table :items="scoreboardDataFad"   :search="search" class="elevation-1"  v-if="showReceivingTableFad">
                <template v-slot:headers>
                  <tr>
                    <th>DMS Reference Number</th>
                    <th>Date Received</th>
                    <th>Data Forwarded</th>
                    <th>Assign to</th>
                    <th>Transaction</th>
                     <th>Status</th>
                    <th style = "text-align: center;" colspan ="2">Action</th>
                  </tr>
                </template>
                <template v-slot:body="{ items }">
                  <tr v-for="item in items" :key="item.dms_reference_number">
                    <td>{{ item.dms_reference_number }}</td>
                    <td>{{ item.date_received }}</td>
                    <td>{{ item.date_forwarded }}</td>
                    <td>{{ item.assignto }}</td>
                    <td>{{ item.sub_unit_name }}</td>
                    <td>{{ item.status}}</td>
                    <td>
                      <v-btn 
                        color="lime-darken-1" 
                        class="mr-2"
                        size="small" 
                        @click="updateScoreboardFAD(item)"
                      >
                       <v-icon left >mdi-pencil</v-icon>
                        Edit
                      </v-btn>
                    </td>
                     <td>
                      <v-btn 
                        color="red-lighten-1" 
                        size="small" 
                        @click="goToAddScoreboard(item)"
                      ><v-icon left>mdi-delete</v-icon>
                        Delete
                      </v-btn>
                    </td>
                  </tr>
                </template>
        </v-data-table>
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
        <!-- dialog for Date forwarded-->
        <v-dialog v-model="dateForwardedDialog" max-width="400">
          <v-card>
            <v-card-title>Select Date Forwarded</v-card-title>
            <v-card-text>
              <v-date-picker 
                v-model="selDateForwarded" 
                @update:model-value="dateForwardedDialog = false"
              />
            </v-card-text>
          </v-card>
        </v-dialog>

        <v-dialog v-model="RedateForwardedDialog" max-width="400">
          <v-card>
            <v-card-title>Select Date Forwarded</v-card-title>
            <v-card-text>
              <v-date-picker 
                v-model="ReDateFor" 
                @update:model-value="RedateForwardedDialog = false"
              />
            </v-card-text>
          </v-card>
        </v-dialog>
       <!--End date modal--> 

      
        <!-- Time Picker Dialog for Date Forwarded -->
        <v-dialog v-model="timeDialogForwarded" max-width="400">
        <v-card>
          <v-card-title class="text-center">Select Time</v-card-title>
          <v-card-text>
            <v-time-picker 
              v-model="selectedTimeForwarded"
              format="ampm" 
              ampm-in-title 
              @update:model-value="timeDialogForwarded = false"
            ></v-time-picker>
          </v-card-text>
          <v-card-actions class="justify-center">
            <v-btn text="Close" @click="timeDialogForwarded = false"></v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

       <v-dialog v-model="RetimeDialogForwarded" max-width="400">
        <v-card>
          <v-card-title class="text-center">Select Time</v-card-title>
          <v-card-text>
            <v-time-picker 
              v-model="ReTimeFor"
              format="ampm" 
              ampm-in-title 
              @update:model-value="RetimeDialogForwarded = false"
            ></v-time-picker>
          </v-card-text>
          <v-card-actions class="justify-center">
            <v-btn text="Close" @click="RetimeDialogForwarded = false"></v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
      <!-- End time picker-->

       <!--Start Date Received Modal-->
        <v-dialog v-model="RedateReceivedDialog" max-width="400">
          <v-card>
            <v-card-title>Select Date Received</v-card-title>
            <v-card-text>
              <v-date-picker 
                v-model="ReDateRec" 
                @update:model-value="RedateReceivedDialog = false"
              />
            </v-card-text>
          </v-card>
        </v-dialog>
       <!--End-->
       <!--Start Time Received Modal-->
           <v-dialog v-model="RetimeDialogReceived" max-width="400">
        <v-card>
          <v-card-title class="text-center">Select Time</v-card-title>
          <v-card-text>
            <v-time-picker 
              v-model="ReTimeRec"
              format="ampm" 
              ampm-in-title 
              @update:model-value="RetimeDialogReceived = false"
            ></v-time-picker>
          </v-card-text>
          <v-card-actions class="justify-center">
            <v-btn text="Close" @click="RetimeDialogForwarded = false"></v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
       <!--End-->
     <!-- FOR update MOdals -->
      <v-dialog v-model="showDialog1" max-width="1000px">
      <v-card 
          prepend-icon="mdi-account-multiple-plus" 
          title="UPDATE"
          class ="pt-3"
          subtitle="Please select a user category to add a scoreboard record. ">
          <v-container class="justify-center ">
          <v-row gutter="0" v-if="showTransactionFields">
            <v-col >
            <v-select 
              label="Nature of Transaction" 
              :items="nature_of_transaction" 
              item-title="title" 
              item-value="value"
              :rules="[requiredValidator]" 
              outlined 
              v-model="natureId"
            ></v-select>
            </v-col>
              <v-col  >
             <v-select 
              label="Type of Transaction" 
              :items="type_of_transaction" 
              item-title="title" 
              item-value="value"
              :rules="[requiredValidator]" 
              outlined 
              v-model="typeId"
              >
            </v-select>
            </v-col>
          </v-row>
          <v-row>
              <v-col>
            <v-select 
                label="Assign to" 
                :items="assignableUsers" 
                item-title="title" 
                item-value="value"
                :rules="[requiredValidator]" 
                outlined 
                v-model="userId"
              />
          </v-col>
            <v-col>
            </v-col>
          </v-row>
          <v-row>
            <v-col>
          <v-text-field
                v-model="selDateForwarded"
                label="Date Forwarded"
                readonly
                :value="selDateForwarded ? format(selDateForwarded, 'yyyy-MM-dd') : ''"
                @click="dateForwardedDialog = true"
              />
            </v-col>
            <v-col>
           <v-text-field
              v-model="selectedTimeForwarded"
              label="Time Forwarded"
              readonly
              @click="timeDialogForwarded = true"
            ></v-text-field>
            </v-col>
          </v-row>
          <v-row>
             <v-col>
              <v-text-field
                v-model="downtimeValue"
                label="Downtime"
                type="number"
              ></v-text-field>
            </v-col>
            <v-col>
              <v-text-field
                v-model="downtimeRemark"
                label="Downtime Remark"
                type="text"
              ></v-text-field>
            </v-col>
          </v-row>
        </v-container>
        <v-divider></v-divider>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn class="mr-5 my-2" text="Update" color="Primary" prepend-icon="mdi-pencil" @click="updateTechnical"></v-btn>
          <v-btn class="mr-5 my-2" text="Close" variant="plain" prepend-icon="mdi-close" @click="showDialog1 = false"></v-btn>
        </v-card-actions>
      </v-card>
     </v-dialog>

     <!--Receiving Update dialog-->
     <v-dialog v-model="showDialog2" max-width="1000px">
      <v-card 
          prepend-icon="mdi-account-multiple-plus" 
          title="UPDATE"
          class ="pt-3"
          subtitle=" ">
          <v-container class="justify-center ">
          <v-row>
          <v-col>
            <v-text-field
                v-model="dmsReferenceNumber"
                label="DMS Reference Number"
                type="text"
              ></v-text-field>
          </v-col>
          <v-col>
               <v-select 
                label="Assign to" 
                :items="staffList" 
                item-title="name"
                item-value="id"
                :rules="[requiredValidator]" 
                outlined 
                v-model="reassignto"
              />
            </v-col>
          </v-row>
          <v-row>
            <v-col>
          <v-text-field
                v-model="ReDateFor"
                label="Date Forwarded"
                readonly
                :value="ReDateFor ? format(ReDateFor, 'yyyy-MM-dd') : ''"
                @click="RedateForwardedDialog = true"
              />
            </v-col>
            <v-col>
           <v-text-field
              v-model="ReTimeFor"
              label="Time Forwarded"
              readonly
              @click="RetimeDialogForwarded = true"
            ></v-text-field>
            </v-col>
          </v-row>
          <v-row>
            <v-col>
          <v-text-field
                v-model="ReDateRec"
                label="Date Received"
                readonly
                :value="ReDateRec ? format(ReDateRec, 'yyyy-MM-dd') : ''"
                @click="RedateReceivedDialog = true"
              />
            </v-col>
            <v-col>
           <v-text-field
              v-model="ReTimeRec"
              label="Time Received"
              readonly
              @click="RetimeDialogReceived = true"
            ></v-text-field>
            </v-col>
          </v-row>
        </v-container>
        <v-divider></v-divider>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn class="mr-5 my-2" text="Update" color="Primary" prepend-icon="mdi-pencil" @click="updateReceiving"></v-btn>
          <v-btn class="mr-5 my-2" text="Close" variant="plain" prepend-icon="mdi-close" @click="showDialog2 = false"></v-btn>
        </v-card-actions>
      </v-card>
     </v-dialog>
     <!--END UPDATE MODALs-->
      <!--Receiving Update dialog-->
     <v-dialog v-model="showDialog3" max-width="1000px">
      <v-card 
          prepend-icon="mdi-account-multiple-plus" 
          title="UPDATE"
          class ="pt-3"
          subtitle=" ">
          <v-container class="justify-center ">
          <v-row>
            <v-col>
                <v-text-field
                v-model="dmsReferenceNumber2"
                label="DMS Reference Number"
                type="text"
              ></v-text-field>
            </v-col>
            <v-col>
                <v-text-field
                  v-model="dmstitle"
                  label="DMS Title"
                  type="text"
              ></v-text-field>
            </v-col>
          </v-row>
          <v-row>
            <v-col>
              <v-checkbox
                v-model="isEditable"
                label="Edit Transaction Fields"
                class=""
              ></v-checkbox>
            </v-col>
          </v-row>
          <v-row>
             <v-col>
              <v-select
                label="Type of Transaction"
                :items="transactionList"
                item-title="transaction_name" 
                item-value="id"
                outlined
                :disabled="!isEditable"
                v-model="transactionID" 
              ></v-select>
            </v-col>
            <v-col>
              <v-select
              label="Sub-Type"
              :items="subtypeList"
              item-title="subtype"
              item-value="id"
              outlined
              :disabled="!isEditable"
              v-model="subTypeID" 
            ></v-select>
            </v-col>
          </v-row>
             <v-row>
            <v-col>
              <v-checkbox
                v-model="isEditable2"
                label="Edit Support Services"
                class=""
              ></v-checkbox>
            </v-col>
          </v-row>
          <v-row>
          <v-col>
            <v-select
              label="Support Services"
              :items="supportservices"
              item-title="support_services" 
              item-value="id"
              outlined
              :disabled="!isEditable2"
              v-model="ssID" 
            ></v-select>
          </v-col>
          <v-col>
            <v-select
            label="Support Services Items"
            :items="supportservicesitems"
            item-title="support_services_items"
            item-value="id"
            outlined
            :disabled="!isEditable2"
            v-model="ssItems" 
          ></v-select>
          </v-col>
        </v-row>
        <v-row>
           <v-col>
                <v-text-field
                  v-model="others"
                  label="Others"
                  type="text"
                 :disabled="!isEditable2others"
              ></v-text-field>
            </v-col>
            <v-col>
            </v-col>
        </v-row>
          <v-row>
          <v-col>
            <v-select
              label="FAD Sub Units"
              :items="fadSubUnits" 
              item-title="name"      
              item-value="id" 
              :rules="[requiredValidator]"
              outlined
              v-model="subunitId"   
              @update:model-value="handleSubunitChange"
            />
          </v-col>
          <v-col>
               <v-select 
                label="Process Owner" 
                :items="staffList" 
                item-title="name"
                item-value="id"
                :rules="[requiredValidator]" 
                outlined 
                v-model="ownerId"
              />
            </v-col>
          </v-row>
          <v-row>
            <v-col>
          <v-text-field
                v-model="ReDateFor2"
                label="Date Forwarded"
                readonly
                :value="ReDateFor2 ? format(ReDateFor2, 'yyyy-MM-dd') : ''"
                @click="RedateForwardedDialog2 = true"
              />
            </v-col>
            <v-col>
           <v-text-field
              v-model="ReTimeFor2"
              label="Time Forwarded"
              readonly
              @click="RetimeDialogForwarded2 = true"
            ></v-text-field>
            </v-col>
          </v-row>
          <v-row>
        <v-col>
          <v-text-field
                v-model="ReDateRec2"
                label="Date Received"
                readonly
                :value="ReDateRec2 ? format(ReDateRec2, 'yyyy-MM-dd') : ''"
                @click="RedateReceivedDialog2 = true"
              />
            </v-col>
            <v-col>
           <v-text-field
              v-model="ReTimeRec2"
              label="Time Received"
              readonly
              @click="RetimeDialogReceived2 = true"
            ></v-text-field>
            </v-col>
          </v-row>
        </v-container>
        <v-divider></v-divider>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn class="mr-5 my-2" text="Update" color="Primary" prepend-icon="mdi-pencil" @click="updateReceivingFAD"></v-btn>
          <v-btn class="mr-5 my-2" text="Close" variant="plain" prepend-icon="mdi-close" @click="showDialog3 = false"></v-btn>
        </v-card-actions>
      </v-card>
     </v-dialog>
     <!--END UPDATE MODALs-->

     <!--For FAD Update dialog-->
     <v-dialog v-model="showDialog4" max-width="1000px">
      <v-card 
          prepend-icon="mdi-account-multiple-plus" 
          title="UPDATE"
          class ="pt-3"
          subtitle=" ">
          <v-container class="justify-center ">
     
          <v-row>
          <v-col>
            <v-select
              label="FAD Sub Units"
              :items="fadSubUnits" 
              item-title="name"      
              item-value="id" 
              :rules="[requiredValidator]"
              outlined
              v-model="subunitId2"   
              @update:model-value="handleSubunitChange"
            />
          </v-col>
          <v-col>
               <v-select 
                label="Process Owner" 
                :items="processOwners.length ? processOwners : [{ id: null, name: 'No available owners' }]"
                  item-title="name"
                  item-value="id"
                  :rules="[requiredValidator]"
                  outlined
                v-model="assigntoId"
              />
            </v-col>
          </v-row>
          <v-row>
            <v-col>
          <v-text-field
                v-model="DateForwarded_FAD"
                label="Date Forwarded"
                readonly
                :value="DateForwarded_FAD ? format(DateForwarded_FAD, 'yyyy-MM-dd') : ''"
                @click="DateForwarded_FAD_Dialog = true"
              />
            </v-col>
            <v-col>
           <v-text-field
              v-model="TimeForwarded_FAD"
              label="Time Forwarded"
              readonly
              @click="RetimeDialogForwarded2 = true"
            ></v-text-field>
            </v-col>
          </v-row>
          <v-row>
             <v-col>
              <v-text-field
                v-model="downtimeValue"
                label="Downtime"
                type="number"
              ></v-text-field>
            </v-col>
            <v-col>
              <v-text-field
                v-model="downtimeRemark"
                label="Downtime Remark"
                type="text"
              ></v-text-field>
            </v-col>
          </v-row>
          <v-row>
            <v-col>
              <v-select 
                label="Type of Downtime" 
                :items="type_of_downtime" 
                item-title="title" 
                item-value="value"
                :rules="[requiredValidator]" 
                outlined 
                v-model="DowntimeType"
              ></v-select>
            </v-col>
            <v-col>

            </v-col>
          </v-row>
        </v-container>
        <v-divider></v-divider>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn class="mr-5 my-2" text="Update" color="Primary" prepend-icon="mdi-pencil" @click="updateFAD"></v-btn>
          <v-btn class="mr-5 my-2" text="Close" variant="plain" prepend-icon="mdi-close" @click="showDialog4 = false"></v-btn>
        </v-card-actions>
      </v-card>
     </v-dialog>
     <!--END UPDATE MODALs-->

     <!-- Dateforwarded dialogfor FAD-->
      <v-dialog v-model="RedateForwardedDialog2" max-width="400">
          <v-card>
            <v-card-title>Select Date Forwarded</v-card-title>
            <v-card-text>
              <v-date-picker 
                v-model="ReDateFor2" 
                @update:model-value="RedateForwardedDialog2 = false"
              />
            </v-card-text>
          </v-card>
        </v-dialog>
        <!-- Time Picker Dialog for Date Forwarded FAD -->
   <!-- Dateforwarded dialogfor FAD-->
      <v-dialog v-model="DateForwarded_FAD_Dialog" max-width="400">
          <v-card>
            <v-card-title>Select Date Forwarded</v-card-title>
            <v-card-text>
              <v-date-picker 
                v-model="DateForwarded_FAD" 
                @update:model-value="DateForwarded_FAD_Dialog = false"
              />
            </v-card-text>
          </v-card>
        </v-dialog>
    <!-- Time Picker Dialog for Date Forwarded FAD Receiving-->

       <v-dialog v-model="RetimeDialogForwarded2" max-width="400">
        <v-card>
          <v-card-title class="text-center">Select Time</v-card-title>
          <v-card-text>
            <v-time-picker 
              v-model="ReTimeFor2"
              format="ampm" 
              ampm-in-title 
              @update:model-value="RetimeDialogForwarded2 = false"
            ></v-time-picker>
          </v-card-text>
          <v-card-actions class="justify-center">
            <v-btn text="Close" @click="RetimeDialogForwarded2 = false"></v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
      <!-- End time picker-->

 <!-- Time Picker Dialog for Date Forwarded FAD Receiving-->

       <v-dialog v-model="TimeForwarded_FAD_dialog" max-width="400">
        <v-card>
          <v-card-title class="text-center">Select Time</v-card-title>
          <v-card-text>
            <v-time-picker 
              v-model="TimeForwarded_FAD"
              format="ampm" 
              ampm-in-title 
              @update:model-value="TimeForwarded_FAD_dialog = false"
            ></v-time-picker>
          </v-card-text>
          <v-card-actions class="justify-center">
            <v-btn text="Close" @click="TimeForwarded_FAD_dialog = false"></v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
<!-- End time picker-->

       <!--Start Date Received Modal-->
        <v-dialog v-model="RedateReceivedDialog2" max-width="400">
          <v-card>
            <v-card-title>Select Date Received</v-card-title>
            <v-card-text>
              <v-date-picker 
                v-model="ReDateRec2" 
                @update:model-value="RedateReceivedDialog2 = false"
              />
            </v-card-text>
          </v-card>
        </v-dialog>
       <!--End-->
       <!--Start Time Received Modal-->
           <v-dialog v-model="RetimeDialogReceived2" max-width="400">
        <v-card>
          <v-card-title class="text-center">Select Time</v-card-title>
          <v-card-text>
            <v-time-picker 
              v-model="ReTimeRec2"
              format="ampm" 
              ampm-in-title 
              @update:model-value="RetimeDialogReceived2 = false"
            ></v-time-picker>
          </v-card-text>
          <v-card-actions class="justify-center">
            <v-btn text="Close" @click="RetimeDialogForwarded2 = false"></v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
       <!--End-->
     <!-- Success Alert Modal -->
      <v-dialog v-model="successDialog" width="400">
        <v-card color="" class="pa-4">
          <v-card-title class="text-h6 text-green-darken-3">
            <v-icon left color="green-darken-2" class="mr-2">mdi-check-circle</v-icon>
            Update Successful
          </v-card-title>
          <v-card-text class="text-body-1">
            The record has been successfully updated.
          </v-card-text>
          <v-card-actions class="justify-end">
            <v-btn color="green-darken-2" variant="elevated" @click="reloadPage">
              OK
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
  <ConfirmDialog v-model:is-dialog-visible="isDialogVisible"  
    text="Are you sure you want to delete scoreboard record?" title="Delete Scoreboard"
    @confirm="onConfirmDelete"></ConfirmDialog>
</template>