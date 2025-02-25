import { ref } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '@/utils/supabase.js'
import { combineDateTime } from '@/utils/helpers'

export const useScoreboardStore = defineStore('scoreboard', () => {
  async function getAuthPages(name) {
    const { data } = await supabase
      .from('user_roles')
      .select('*, pages: user_role_pages (page)')
      .eq('user_role', name)

    // Set the retrieved data to state
    authPages.value = data[0].pages.map((p) => p.page)
  }
  const scoreboardTable = ref([
    {
      scoreboard_id: 1,
      agency_name: 'Department of Education',
      css_submission_date: '2024-01-15',
      date_time_received: '2024-01-16 09:30 AM',
      dms_reference_number: 'DMS-1001',
      output_released_documents: 3,
      remarks: 'Approved for processing',
      pap: 'PAP-001',
      ts: 'John Doe',
      transaction_type: 'Procurement',
      status: 'Pending',
    },
    {
      scoreboard_id: 2,
      agency_name: 'Health Department',
      css_submission_date: '2024-01-10',
      date_time_received: '2024-01-11 10:00 AM',
      dms_reference_number: 'DMS-1002',
      output_released_documents: 5,
      remarks: 'Documents incomplete',
      pap: 'PAP-002',
      ts: 'Jane Smith',
      transaction_type: 'Medical Supplies Request',
      status: 'Pending',
    },
    {
      scoreboard_id: 3,
      agency_name: 'Public Works Office',
      css_submission_date: '2024-01-18',
      date_time_received: '2024-01-19 01:45 PM',
      dms_reference_number: 'DMS-1003',
      output_released_documents: 2,
      remarks: 'Under review',
      pap: 'PAP-003',
      ts: 'Alice Johnson',
      transaction_type: 'Infrastructure Permit',
      status: 'Approved',
    },
    {
      scoreboard_id: 4,
      agency_name: 'Finance Bureau',
      css_submission_date: '2024-01-05',
      date_time_received: '2024-01-06 08:20 AM',
      dms_reference_number: 'DMS-1004',
      output_released_documents: 8,
      remarks: 'Approved with conditions',
      pap: 'PAP-004',
      ts: 'Michael Brown',
      transaction_type: 'Budget Approval',
      status: 'Approved',
    }
  ])
  
  const scoreboardTotal = ref(scoreboardTable.value.length)

  function $reset() {
    scoreboardTable.value = []
    scoreboardTotal.value = 0
  }

  async function getScoreboardPaginated({ currentPage, perPage }) {
    // Just return dummy data for now
    const rangeStart = (currentPage - 1) * perPage
    const rangeEnd = rangeStart + perPage
    scoreboardTotal.value = scoreboardTable.value.length
    return scoreboardTable.value.slice(rangeStart, rangeEnd)
  }

  return {
    scoreboardTable,
    scoreboardTotal,
    getScoreboardPaginated,
    $reset
  }
})
