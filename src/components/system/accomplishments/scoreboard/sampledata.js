import { defineStore } from 'pinia'

export const useScoreboardStore = defineStore('scoreboard', {
  state: () => ({
    scoreboardTable: [
      { number: 1, dms_reference_number: 'DMS-001', date_time_received: '2024-02-01 10:00 AM', assigned_to: 'John Doe', status: 'Pending' },
      { number: 2, dms_reference_number: 'DMS-002', date_time_received: '2024-02-02 11:30 AM', assigned_to: 'Jane Smith', status: 'Approved' },
      { number: 3, dms_reference_number: 'DMS-003', date_time_received: '2024-02-03 02:15 PM', assigned_to: 'Alice Johnson', status: 'Rejected' },
      { number: 4, dms_reference_number: 'DMS-004', date_time_received: '2024-02-04 04:45 PM', assigned_to: 'Michael Brown', status: 'Processing' }
    ],
    scoreboardTotal: 4, // Update total count
  }),
})