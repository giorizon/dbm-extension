import supabase from '@/components/system/accomplishments/scoreboard/supabase'
import { format } from 'date-fns'


export async function scoreboardUpdateFad({ 
  userUUID, process_id, process_id2 ,scoreboard_id, datepart, timepart, assignto_id, 
  sub_unit_id, downtime_value, downtime_remark,  downtime_type 
}) {
  const dateformatted = format(new Date(datepart), 'yyyy-MM-dd')
  const combinedDate = new Date(`${dateformatted}T${timepart}:00`);
  const timestamp = format(combinedDate, 'yyyy-MM-dd HH:mm:ss');

    console.log("downtime value: ", downtime_value );
    console.log("downtime Remark: ", downtime_remark );
    console.log("downtime Type: ", downtime_type )
    console.log("process_id: ", process_id );
    console.log("Datepart: ",datepart);
    console.log("Time: ", timepart );
    console.log("Timestamp: ", timestamp);
    console.log("assign to: ", assignto_id );
    console.log("Owner_id : ", userUUID);
    console.log("Scoreboard_id: ", scoreboard_id);
    console.log("Process_id: ", process_id);
    console.log("Process_id2: ", process_id2);
    console.log("Sub_unit_id: ", sub_unit_id);
    try { 
      // 🔎 Check if downtime exists
      const { data: existingDowntime, error: checkError } = await supabase
        .from('fad_downtime')
        .select('id')
        .eq('process_id', process_id)
        .maybeSingle()

      if (checkError) throw { step: "Check existing downtime", error: checkError }

      if (existingDowntime) {
        // ✅ If row exists → update it
        const { error: updateError } = await supabase
          .from('fad_downtime')
          .update({
            downtime: downtime_value,
            remark: downtime_remark,
            downtime_id: downtime_type,
          })
          .eq('process_id', process_id)

        if (updateError) throw { step: "Update downtime", error: updateError }

        console.log("✅ Updated existing technical_downtime row")
      } else {
        // 🆕 If not exists → insert new row
        const { error: insertError } = await supabase
          .from('fad_downtime')
          .insert({
            process_id: process_id,
            downtime_id: downtime_type,
            downtime: downtime_value,
            remark: downtime_remark
          })

        if (insertError) throw { step: "Insert downtime", error: insertError }

        console.log("✅ Inserted new technical_downtime row")
      }

      // 📅 Update date_forwarded in scoreboard_fad_process
      const { error: dateUpdateError } = await supabase
        .from('scoreboard_fad_process')
        .update({
          date_forwarded: timestamp
        })
        .eq('id', process_id)

      if (dateUpdateError) throw { step: "Update date_forwarded", error: dateUpdateError }

      // 👤 Update owner_id
      const { error: ownerUpdateError } = await supabase
        .from('scoreboard_fad_process')
        .update({
          owner_id: assignto_id,
          sub_unit_id: sub_unit_id
        })
        .eq('id', process_id2)

      if (ownerUpdateError) throw { step: "Update owner_id", error: ownerUpdateError }

      return { success: true }
    } catch (err) {
      console.error(`❌ Error at step: ${err.step || "Unknown"}`, err.error || err)
      return { success: false, step: err.step, error: err.error || err }
    }
  }