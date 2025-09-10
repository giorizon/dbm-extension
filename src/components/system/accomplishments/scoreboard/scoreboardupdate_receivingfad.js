import supabase from '@/components/system/accomplishments/scoreboard/supabase'
import { format } from 'date-fns'

export async function scoreboardUpdate_receivingfad({ 
 process_id, scoreboard_id, dms_reference_number, dmstitle, datepartforwarded, 
 datepartreceived, timepartforwarded, timepartreceived, assignto_id,
 internal_id, external_id, cc_id, sub_unit_id, item_id, transactioncheckerFlag, servicecheckerFlag,
 transaction_id, subType_id, others
}) {
  const df_dateformatted = format(new Date(datepartforwarded), 'yyyy-MM-dd')
  const df_combinedDate = new Date(`${df_dateformatted}T${timepartforwarded}:00`);
  const df_timestamp = format(df_combinedDate, 'yyyy-MM-dd HH:mm:ss');

  const dr_dateformatted = format(new Date(datepartreceived), 'yyyy-MM-dd')
  const dr_combinedDate = new Date(`${dr_dateformatted}T${timepartreceived}:00`);
  const dr_timestamp = format(dr_combinedDate, 'yyyy-MM-dd HH:mm:ss');
  let tableName = ' ';
  let colId = ' ';
    console.log("DMS Reference Number: ", dms_reference_number );
    console.log("DMS Title: ", dmstitle );
    console.log("process_id: ", process_id );
    console.log("scoreboard_id: ", scoreboard_id );
    console.log("Datepartforwarded: ",datepartforwarded);
    console.log("Datepartreceiving: ", datepartreceived);
    console.log("Timeforwarded: ", timepartforwarded );
    console.log("Timereceived: ", timepartreceived);
    console.log("internal_id: ", internal_id );
    console.log("external_id: ", external_id );
    console.log("cc_id: ", cc_id );
    console.log("Combined Timestamp for date forwarded: ", df_timestamp);
    console.log("Combined Timestamp for date received: ", dr_timestamp);
    console.log("assign to: ", assignto_id );
    console.log("item_id: ", item_id );
    console.log("sub_unit_id: ", sub_unit_id );
    console.log("transaction_id: ", transaction_id );
    console.log("subType_id: ", subType_id );
  try{
    const { error: updateError1 } = await supabase
      .from('scoreboard_receiving_fad')
      .update({
        date_forwarded: df_timestamp,
        date_received: dr_timestamp,
        sub_unit_id: sub_unit_id,
        owner_id: assignto_id,
        dms_reference_number: dms_reference_number,
        dms_title: dmstitle
      })
      .eq('id', scoreboard_id)
    if (updateError1) throw updateError1

    const { error: updateError2 } = await supabase
      .from('scoreboard_fad_process')
      .update({
        owner_id: assignto_id,
        date_received: df_timestamp,
          sub_unit_id: sub_unit_id
      })
      .eq('id', scoreboard_id)

    if (updateError2) throw updateError2
  

    if(transactioncheckerFlag === 1)
    {
       
        if(internal_id != null){
            tableName = 'internal_report_received';
            alert(tableName);
        }
        else if(external_id != null){
            tableName = 'external_report_received';
             alert(tableName);
        }
        else if(cc_id != null){
            tableName = 'citizen_charter_received';
             alert(tableName);
        }
        else{
            console.log("No type of transaction was selected");
        }
     
        const { data, error } = await supabase
        .from(tableName)
        .delete()
        .eq('scoreboard_id', scoreboard_id);

        if (error) {
            console.error('Delete failed:', error.message);
        } else {
            console.log('Delete successful:', data);
            if(transaction_id===1){
                tableName = 'citizen_charter_received';   
                colId = 'cc_id';
            }
            else if(transaction_id ===2){
                tableName = 'internal_report_received';
                colId = 'internal_id';
            }
            else if(transaction_id === 3){
                tableName = 'external_report_received';
                colId = 'external_id';
            }
            else{
                console.log("No type of transaction was selected");
                return;
            }
            const insertData = {
            scoreboard_id: scoreboard_id,
            [colId]: subType_id  // use square brackets to inject colId as key
            };

            const { error: transactionError } = await supabase
                .from(tableName)
                .insert([insertData]);

            if (transactionError) {
                console.error('🚨 Insert Error (FAD Process table):', transactionError.message);
                alert('❌ Failed to save data in scoreboard_fad_process! Error: ' + transactionError.message);
                return;
            }
        }
    }
    if(servicecheckerFlag === 1){
     console.log("Checking if scoreboard_id exists...");

      const { data: existingRows, error: selectError } = await supabase
        .from('scoreboard_support_services')
        .select('id') // You can select any column; we just need to know if it exists
        .eq('scoreboard_id', scoreboard_id);

      if (selectError) {
        console.error('Error checking existing scoreboard_id:', selectError.message);
        return;
      }

      const payload = {
        item_id: item_id,
        scoreboard_id: scoreboard_id,
        others: others
      };

      if (existingRows && existingRows.length > 0) {
        alert("Here");
        // 🔄 Update existing row
        const { data: updateData, error: updateError } = await supabase
          .from('scoreboard_support_services')
          .update(payload)
          .eq('scoreboard_id', scoreboard_id);

        if (updateError) {
          console.error('Updating Service Support failed:', updateError.message);
        } else {
          console.log('Update successful:', updateData);
        }
      } else {
        // ➕ Insert new row
        const { data: insertData, error: insertError } = await supabase
          .from('scoreboard_support_services')
          .insert(payload);

        if (insertError) {
          console.error('Inserting Service Support failed:', insertError.message);
        } else {
          console.log('Insert successful:', insertData);
        }
      }
     
    }
    return { success: true }
  } catch (err) {
    console.error("❌ Error updating scoreboard record:", err)
    return { success: false, error: err }
  }
}