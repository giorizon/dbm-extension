import { defineStore } from 'pinia'
import { supabaseAdmin } from '@/utils/supabase'

export const useScoreboardStore = defineStore('scoreboard2', () => {

  // Delete Agency
  async function deleteScoreboardrow(scoreboardId, processId, userRole) {
    if(userRole==='Receiving'){
       return await supabaseAdmin
      .from('scoreboard_receiving')
      .delete()
      .eq('id', scoreboardId)
    }else if(userRole==='Technical'){
      return await supabaseAdmin.rpc('delete_scoreboard_technical', {
        p_process_id: processId,
        p_scoreboard_id: scoreboardId,
        p_level: 'Individual'
      });
    }else if(userRole==='Senior BMS'){
        return await supabaseAdmin.rpc('delete_scoreboard_technical', {
        p_process_id: processId,
        p_scoreboard_id: scoreboardId,
        p_level: 'Senior BMS'
      });
    }else if(userRole==='Supervising BMS'){
        return await supabaseAdmin.rpc('delete_scoreboard_technical', {
        p_process_id: processId,
        p_scoreboard_id: scoreboardId,
        p_level: 'Supervising BMS'
      });
    }else if(userRole==='Division Chief'){
        return await supabaseAdmin.rpc('delete_scoreboard_technical', {
        p_process_id: processId,
        p_scoreboard_id: scoreboardId,
        p_level: 'Division Chief'
      });
    }
  }
  return {
    deleteScoreboardrow
  }
})
