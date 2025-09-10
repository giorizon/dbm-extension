import supabase from '@/components/system/accomplishments/scoreboard/supabase'
import { format } from 'date-fns'


export async function scoreboardUpdate({ 
  processLevel, userUUID, process_id, scoreboard_id, nature_id, type_id,
  downtime_value, downtime_remark, datepart, timepart, assignto_id 
}) {
  const dateformatted = format(new Date(datepart), 'yyyy-MM-dd')
  //const combinedDateTimeStr = `${dateformatted}T${timepart}:00`
  const combinedDate = new Date(`${dateformatted}T${timepart}:00`);
  const timestamp = format(combinedDate, 'yyyy-MM-dd HH:mm:ss');
 // const timestamp = new Date(localDateTime).toISOString()

    console.log("downtime value", downtime_value );
    console.log("downtime Remark", downtime_remark );
    console.log("process_id", process_id );
    console.log("Datepart",datepart);
    console.log("Time", timepart );
    console.log("Timestamp", timestamp);
    console.log("assign to", assignto_id );
    console.log("Owner_id : ", userUUID);
    console.log("Scoreboard_id: ", scoreboard_id);
    console.log("Nature of Transaction: ", nature_id);
    console.log("Type of Transaction: ", type_id);
  try {
    // 🔍 Check if process_id already exists in technical_downtime
    const { data: existingDowntime, error: checkError } = await supabase
      .from('technical_downtime')
      .select('id')
      .eq('process_id', process_id)
      .maybeSingle()

    if (checkError) throw checkError

    if (existingDowntime) {
      // ✅ If row exists → update it
      const { error: updateError } = await supabase
        .from('technical_downtime')
        .update({
          downtime: downtime_value,
          remark: downtime_remark
        })
        .eq('process_id', process_id)

      if (updateError) throw updateError
      console.log("✅ Updated existing technical_downtime row")
    } else {
      // 🆕 If not exists → insert new row
      const { error: insertError } = await supabase
        .from('technical_downtime')
        .insert({
          process_id: process_id,
          downtime: downtime_value,
          remark: downtime_remark
        })

      if (insertError) throw insertError
      console.log("✅ Inserted new technical_downtime row")
    }

    // 📅 Update date_forwarded in scoreboard_technical_process
    const { error: dateUpdateError } = await supabase
      .from('scoreboard_technical_process')
      .update({
        date_forwarded: timestamp
      })
      .eq('id', process_id)

    if (dateUpdateError) throw dateUpdateError

    // 👤 Update owner_id
    const { error: ownerUpdateError } = await supabase
      .from('scoreboard_technical_process')
      .update({
        owner_id: assignto_id
      })
      .eq('scoreboard_id', scoreboard_id)
      .eq('from_id', userUUID)

    if (ownerUpdateError) throw ownerUpdateError
    if(processLevel === 'Individual'){
        const { error: ntUpdateError } = await supabase
      .from('scoreboard_type_nature')
      .update({
        not_id: nature_id,
        tot_id: type_id
      })
      .eq('scoreboard_id', scoreboard_id)

    if (ntUpdateError) throw ntUpdateError
    }
    return { success: true }
  } catch (err) {
    console.error("❌ Error updating scoreboard record:", err)
    return { success: false, error: err }
  }
}