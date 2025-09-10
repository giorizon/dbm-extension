import supabase from '@/components/system/accomplishments/scoreboard/supabase'
import { format } from 'date-fns'

export async function scoreboardUpdate_receiving({ 
 process_id, scoreboard_id, dms_reference_number, datepartforwarded, datepartreceived, timepartforwarded, timepartreceived, assignto_id 
}) {
  const df_dateformatted = format(new Date(datepartforwarded), 'yyyy-MM-dd')
  const df_combinedDate = new Date(`${df_dateformatted}T${timepartforwarded}:00`);
  const df_timestamp = format(df_combinedDate, 'yyyy-MM-dd HH:mm:ss');

  const dr_dateformatted = format(new Date(datepartreceived), 'yyyy-MM-dd')
  const dr_combinedDate = new Date(`${dr_dateformatted}T${timepartreceived}:00`);
  const dr_timestamp = format(dr_combinedDate, 'yyyy-MM-dd HH:mm:ss');
    console.log("DMS Reference Number", dms_reference_number );
    console.log("process_id", process_id );
    console.log("scoreboard_id", scoreboard_id );
    console.log("Datepartforwarded",datepartforwarded);
     console.log("Datepartreceiving: ", datepartreceived);
    console.log("Timeforwarded", timepartforwarded );
     console.log("Timereceived: ", timepartreceived);
    console.log("Combined Timestamp for date forwarded", df_timestamp);
    console.log("Combined Timestamp for date received", dr_timestamp);
    console.log("assign to", assignto_id );
   
  try{
    const { error: updateError1 } = await supabase
      .from('scoreboard_technical_process')
      .update({
        date_received: dr_timestamp,
        owner_id: assignto_id
      })
      .eq('id', process_id)
    if (updateError1) throw updateError1

    const { error: updateError2 } = await supabase
      .from('scoreboard_receiving')
      .update({
        dms_reference_number: dms_reference_number,
        date_forwarded: df_timestamp,
        date_received: dr_timestamp
      })
      .eq('id', scoreboard_id)

    if (updateError2) throw updateError2
    return { success: true }
  } catch (err) {
    console.error("❌ Error updating scoreboard record:", err)
    return { success: false, error: err }
  }
}