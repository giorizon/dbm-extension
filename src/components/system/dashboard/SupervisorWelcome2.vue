<script>
  import '@/assets/dashboard.css';

  export default {
    data() {
      return {
        headers: [
          { title: 'DMS Number', key: 'dmsNumber' },
          { title: 'Date Received', key: 'dateReceived' },
          { title: 'Agency Name', key: 'agencyName' },
          { title: 'Nature of Transaction', key: 'natureOfTransaction' },
          { title: 'Date Forwarded', key: 'dateForwarded' },
          { title: 'Downtime', key: 'downtime' },
          { title: 'Action', key: 'action', sortable: false }
        ],
        items: [
          {
            dmsNumber: '232-12281',
            dateReceived: '2025-04-10',
            agencyName: 'Department of Education',
            natureOfTransaction: 'Issuance of Authority to Purchase Motor Vehicle',
            dateForwarded: '2025-04-11',
            downtime: '1 Working Days',
          },
          {
            dmsNumber: '888-44302',
            dateReceived: '2025-04-22',
            agencyName: 'Caraga State University',
            natureOfTransaction: 'Release from Miscellaneous Personnel Benefits Fund (MPBF) - PBB',
            dateForwarded: '2025-04-25',
            downtime: '2 Calendar Days',
          },
        ],
      };
    },
  };
</script>
<template>
    <v-card class="mx-auto my-5" max-width="1200">
      <v-card-text>
        <h1>Supervisor Table</h1>
        <v-data-table
          :headers="headers"
          :items="items"
          class="elevation-1"
        >
          <!-- Action column slot -->
          <template #item.action="{ item }">
            <v-btn color="primary" @click="handleProcess(item)">Accept</v-btn>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>
  </template>
  