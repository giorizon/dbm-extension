import { ref, computed } from "vue";
import supabase from '@/components/system/accomplishments/scoreboard/supabase';

export const trackProcesses = async () => {
  try {
    const { data, error } = await supabase
     .from('view_document_tracker')
      .select('*')
      .order('date_received', { ascending: false });

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error fetching system-wide tracking data:', err);
    return [];
  }
};
export const formatDate2 = (dateString) => {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
};
export const trackingHeaders = ref([
  { title: 'DMS Reference Number', key: 'dms_reference_number' },
  { title: 'Current Level', key: 'level' },
  { title: 'Status', key: 'status' },
  { title: 'Personnel', key: 'owner_name' },
  { title: 'Date Received', key: 'date_received' }
]);

export const fetchSupportServices = async (userUUID) => {
  try {
    const { data, error } = await supabase
      .from('view_support_services_received') // ✅ Matches your SQL View name
      .select('*')
      .eq('owner_id', userUUID); // ✅ Removed .value since it's already unwrapped

    if (error) {
      console.error("❌ Error fetching scoreboard data:", error);
      return [];
    }

    return data; 
  } catch (err) {
    console.error("❌ Unexpected error fetching Supporting Services data:", err);
    return [];
  } 
};export const approvalHeaders = [
  { title: 'DMS Ref No.', key: 'dms_reference_number' },
  { title: 'DMS Title', key: 'dms_title' },
  { title: 'Date Received', key: 'date_received' },
  { title: 'Actions', key: 'actions', sortable: false }
]

// 2. Export fetch function (returns data array directly)
export const fetchApprovalList = async () => {
  try {
    const { data, error } = await supabase
      .from('scoreboard_receiving_fad')
      .select('*')
      .eq('remark', 'Approval_Needed')

    if (error) {
      console.error('Error fetching approval list:', error)
      return []
    }

    return data || []
  } catch (err) {
    console.error('Unexpected error fetching approval list:', err)
    return []
  }
}
export const fetchUserPosition = async (userUUID) => {
  try {
    const { data, error } = await supabase
      .from('pos_user_profile')
      .select(`
        pos_id,
        position ( name )
      `)
      .eq('user_id', userUUID)
      .maybeSingle();

    // 1. Handle Supabase errors
    if (error) {
      console.error('Error fetching position:', error);
      return null;
    }

    // 2. Format and return the result if data exists
    if (data) {
      return {
        pos_id: data.pos_id,
        position_name: data.position?.name
      };
    }

    return null; // Return null if no user profile was found
  } catch (err) {
    console.error("❌ Unexpected error fetching user position:", err);
    return null;
  } 
};

export const insertRecord = async (rowData) => {
  try {
      console.log('Scoreboard ID: ', rowData.id);
      console.log('Status: ', 'Pending');
      console.log('Owner ID: ', rowData.owner_id);
      console.log('From ID: ', rowData.receiver_id);
      console.log('Date Received: ', rowData.date_forwarded);
      console.log('Sub Unit ID: ', rowData.sub_unit_id);
      console.log('Remark: ', rowData.dms_remark);
      console.log('Transaction type ID: ', rowData.type_id); 
      console.log('Subtype ID: ', rowData.subtype_id);
        console.log('support services others: ', rowData.ss_others);
    
      const insertedScoreboardID = rowData.id;
      const { error: fadprocessInsertError } = await supabase
        .from('scoreboard_fad_process')
        .insert([
          {
            scoreboard_id: insertedScoreboardID,
            status: 'Pending',
            sub_unit_id: rowData.sub_unit_id,
            owner_id: rowData.owner_id,
            date_received: rowData.date_forwarded,
            from_id:  rowData.receiver_id,
            remark: rowData.dms_remark
           }
        ]);
      if (fadprocessInsertError) {
        console.error('🚨 Insert Error (FAD Process table):', fadprocessInsertError.message);
        alert('❌ Failed to save data in scoreboard_fad_process! Error: ' + fadprocessInsertError.message);
        return;
      }
      console.log("✅ Data saved in internal_report_received");
    // 2️⃣ If "Internal Reports" selected (transactionID === 2), insert into internal_report_received
    if(rowData.type_id === 1){
      const { error: internalCitizenCharterError } = await supabase
          .from('citizen_charter_received')
          .insert([
            {
              scoreboard_id: insertedScoreboardID,
              cc_id: rowData.subtype_id,
            }
          ]);
        if (internalCitizenCharterError) {
          console.error('🚨 Insert Error (Citizen Charter Report):', internalCitizenCharterError.message);
          alert('❌ Failed to save data in citizen_charter_received! Error: ' + internalCitizenCharterError.message);
          return;
        }

        console.log("✅ Data saved in internal_report_received");
    }
    else if (rowData.type_id === 2) {
      const { error: internalInsertError } = await supabase
        .from('internal_report_received')
        .insert([
          {
            scoreboard_id: insertedScoreboardID,
            internal_id: rowData.subtype_id,
          }
        ]);
      if (internalInsertError) {
        console.error('🚨 Insert Error (Internal Report):', internalInsertError.message);
        alert('❌ Failed to save data in internal_report_received! Error: ' + internalInsertError.message);
        return;
      }
      console.log("✅ Data saved in internal_report_received");
    }
    else if (rowData.type_id === 3) {
    
      const { error: externalInsertError } = await supabase
        .from('external_report_received')
        .insert([
          {
            scoreboard_id: insertedScoreboardID,
            external_id: rowData.subtype_id,
          }
        ]);
      if (externalInsertError) {
        console.error('🚨 Insert Error (External Report):', externalInsertError.message);
        alert('❌ Failed to save data in external_report_received! Error: ' + externalInsertError.message);
        return;
      }
      console.log("✅ Data saved in external_report_received");
    }
    else if (rowData.type_id === 4) {
           const { error: supportServiceInsertError } = await supabase
        .from('scoreboard_support_services')
        .insert([
          {
            scoreboard_id: insertedScoreboardID,
            item_id: rowData.subtype_id,
            others: rowData.ss_others || null // optional field
          }
        ]);

      if (supportServiceInsertError) {
        console.error('🚨 Insert Error (Support Services):', supportServiceInsertError.message);
        alert('❌ Failed to save data in scoreboard_support_services! Error: ' + supportServiceInsertError.message);
        return;
      }

      console.log("✅ Data saved in scoreboard_support_services");
    }
  return true;// Return null if no user profile was found
  } catch (err) {
    console.error("❌ Unexpected error inserting data to scoreboard_fad_process", err);
   return false;
  } 
};
export const updateRemark = async (id) => {
  
  try {
    const { data, error } = await supabase
      .from('scoreboard_receiving_fad')
      .update({ remark: 'Pending' })
      .eq('id', id.id)
      .select()

    console.log('Updated Data:', data) // If empty [], no row matched ID 90
    console.log('Error:', error)

    if (error) {
      console.error('Failed to update remark:', error.message)
      return { success: false, error: error.message }
    }

    return { success: true, data: data[0] }
  } catch (err) {
    console.error('Unexpected error:', err)
    return { success: false, error: err.message }
  }
}

