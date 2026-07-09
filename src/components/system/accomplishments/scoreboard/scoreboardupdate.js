import supabase from '@/components/system/accomplishments/scoreboard/supabase'
import { format } from 'date-fns'

export async function scoreboardUpdate({ 
  processLevel, userUUID, process_id, scoreboard_id, nature_id, type_id,
  downtime_value, downtime_remark, datepart, timepart, assignto_id 
}) {
  const dateformatted = format(new Date(datepart), 'yyyy-MM-dd')
  const combinedDate = new Date(`${dateformatted}T${timepart}:00`);
  const timestamp = format(combinedDate, 'yyyy-MM-dd HH:mm:ss');

  try {
    // 🛑 1. CHECK IF DOWNTIME DATA ACTUALLY EXISTS
    // This checks for null, undefined, or empty strings ("")
    const hasDowntimeData = downtime_value !== undefined && downtime_value !== null && downtime_value !== '';

    if (hasDowntimeData) {
      console.log("⏳ Processing optional downtime data...");

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
    } else {
      console.log("⏩ Skipping technical_downtime: No downtime data provided.")
    }

    // 📅 2. Proceed with updating date_forwarded in scoreboard_technical_process
    const { error: dateUpdateError } = await supabase
      .from('scoreboard_technical_process')
      .update({
        date_forwarded: timestamp
      })
      .eq('id', process_id)

    if (dateUpdateError) throw dateUpdateError

    // 👤 3. Update owner_id
    const { error: ownerUpdateError } = await supabase
      .from('scoreboard_technical_process')
      .update({
        owner_id: assignto_id
      })
      .eq('scoreboard_id', scoreboard_id)
      .eq('from_id', userUUID)

    if (ownerUpdateError) throw ownerUpdateError
    
    // 📂 4. Individual Level transaction adjustments
    if (processLevel === 'Individual') {
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