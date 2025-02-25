<script>
    import '@/assets/dashboard.css';
</script>
<template>
 <v-card-text>
       <v-row>
        <v-col cols="12" md="5">
          <h3 class = "text-center">Pending Transaction</h3>
         <table class="dashboard-table text-center">
          <tr>
            <th>No.</th>
            <th>DMS No.</th>
            <th>Data Receive</th>
            <th> Action </th>
          </tr>
          <tr>
            <td>1</td>
            <td>13-0123456</td>
            <td>02/04/2024</td>
            <td><button class="db_button">Accept</button></td>
          </tr>
          <tr>
            <td>2</td>
            <td>13-0623457</td>
            <td>02/04/2024</td>
            <td><button class="db_button">Accept</button></td>
          </tr>
         </table>
        </v-col>

        <v-col cols="12" md="5">
          <h3 class = "text-center">
            Breakdown of Transaction/Request <br>
            Acted per Nature of Transaction as of
          </h3>
          <div class="pie-chart"></div>
        </v-col>
      </v-row>
    </v-card-text>
</template>