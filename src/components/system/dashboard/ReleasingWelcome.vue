<script setup>
import { ref, onMounted } from 'vue';
import supabase from '@/components/system/accomplishments/scoreboard/supabase';
import '@/assets/dashboard.css';

const validationError = ref("")
const isSuccess = ref(false)
const formErrorMessage = ref("")

const userUUID = ref(null);
const scoreboardData = ref([]);
const releasedFAD = ref([]);
const loading = ref(true);
const tdId = ref(null);

const showSeniorModal = ref(false);
const showSupervisorModal = ref(false);
const showIndividualModal = ref(false);

const seniorDate = ref(null);
const supervisorDate = ref(null);
const individualDate = ref(null);
const selectedRow = ref(null);

const returnProcess_Id =ref(null);
const returnScoreboard_Id =ref(null);
const returnLevel =ref(null);
const returnFrom_id = ref(null);
const returnDivision_id = ref(null);
const returnToUser_id = ref(null);

// ✅ Fetch the logged-in user
const fetchLoggedInUser = async () => {
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError) {
    console.error("❌ Error fetching user:", userError);
    return;
  }

  userUUID.value = userData?.user?.id;
  console.log("✅ User UUID:", userUUID.value);

  // ✅ Now query your `technical_division_user` table using the user UUID
  if (userUUID.value) {
    const { data: tdData, error: tdError } = await supabase
      .from('technical_division_user')
      .select('td_id')
      .eq('user_id', userUUID.value)
      .single(); // Use .single() if you're expecting exactly one match

    if (tdError) {
      console.error("❌ Error fetching td_id:", tdError);
      return;
    }

    tdId.value = tdData?.td_id;
    console.log("✅ Retrieved td_id:", tdId.value);

    await fetchScoreboardData();
  }
};
const formatDate = (timestamp) => {
  if (!timestamp) return "N/A"; // Handle empty cases

  const date = new Date(timestamp);

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  }).format(date);
};

// ✅ Fetch scoreboard data from Supabase
const fetchScoreboardData = async () => {
  loading.value = true;

  try {
    const { data, error } = await supabase
      .from('technical_individual_monitor')
      .select('*')
      .eq('owner_id', userUUID.value)
      .eq('level','Releasing')
      .eq('status', 'Pending')
    if (error) {
      console.error("❌ Error fetching scoreboard data:", error);
      return;
    }

    scoreboardData.value = data.map(row => ({
      dms_reference_number: row.dms_reference_number,
      date_received: formatDate(row.date_received),
      name: row.name,
      status: row.status,
      agency_name: row.agency_name,
      process_id: row.process_id, 
      scoreboard_id: row.scoreboard_id,
      level: row.level,           // Add this if needed
       from_id: row.from_id  ,
       division_id: row.division_id
    }));

    console.log("✅ Filtered scoreboardData:", JSON.stringify(scoreboardData.value, null, 2));
  } catch (err) {
    console.error("❌ Unexpected error fetching scoreboard data:", err);
  } finally {
    loading.value = false;
  }
};
const fetchreleasedFAD = async () => {
  loading.value = true;

  try {
    const { data, error } = await supabase
      .from('view_releasing_fad')
      .select('*')
      .eq('status','Pending')
    if (error) {
      console.error("❌ Error fetching fad scoreboard (internal reports):", error);
      return;
    }

    releasedFAD.value = data.map(row => ({
     dms_reference_number: row.dms_reference_number,
      date_received: formatDate(row.date_received),
      unformatted_date: row.date_received,
      name: row.name,
      type_of_transaction: row.type_of_transaction,
      dms_title: row.dms_title,
      scoreboard_id: row.scoreboard_id
    }));

   console.log("✅ Released FAD data:", JSON.stringify(releasedFAD.value, null, 2));
  } catch (err) {
    console.error("❌ Unexpected error fetching scoreboard data:", err);
  } finally {
    loading.value = false;
  }
};

console.log(scoreboardData.value);
import { useRouter } from 'vue-router';

const router = useRouter();

const goToAddScoreboard = (item) => {
 
  router.push({
    path: '/add-scoreboard-releasing',
    query: {
      dms_reference_number: item.dms_reference_number,
      date_received: item.date_received,
      agency_name: item.agency_name,
      scoreboard_id: item.scoreboard_id,
      process_id: item.process_id
    }
  });
};

const goToFadreleasing = (item) => {
 
  router.push({
    path: '/add-scoreboard-releasing-fad',
    query: {
      dms_reference_number: item.dms_reference_number,
      date_received: item.date_received,
      unformatted_date: item.unformatted_date,
      dmsName: item.dmsName,
      scoreboard_id: item.scoreboard_id,
      type_of_transaction: item.type_of_transaction,
      dms_title: item.dms_title
    }
  });
};
const setReturnData= (row) => {
 returnProcess_Id.value = row.process_id;
  returnScoreboard_Id.value = row.scoreboard_id;
  returnLevel.value = row.level;
  returnFrom_id.value = row.from_id;
  returnDivision_id.value = row.division_id;

}
const openSeniorModal = (row) => {
 
  setReturnData(row);
  selectedRow.value = row;
  showSeniorModal.value = true;
};
const openSupervisorModal = (row) => {
  setReturnData(row);
  selectedRow.value = row;
  showSupervisorModal.value = true;
};
const openIndividualModal = (row) => {
  setReturnData(row);
  selectedRow.value = row;
  showIndividualModal.value = true;
};
const confirmSenior = async () => {
  const valuesToUpdate = {
    date_forwarded: seniorDate.value,
    status: "Returned"
  };
console.log("🧪 ID being updated:", returnProcess_Id.value);
  try {
   
    const { data, error: updateError } = await supabase
      .from('scoreboard_technical_process')
      .update(valuesToUpdate)
      .eq('id', returnProcess_Id.value)
      .throwOnError();

    console.log("🔁 Updated rows:", data);

    if (updateError) {
      console.error("❌ Update error:", updateError);
      throw updateError;
    }
    console.log("📥 Retrieving user from technical_division_user_role...");
    console.log("➡️ Division ID:", returnDivision_id.value);
    console.log("➡️ Level:", returnLevel.value);

    const { data: userRoleData, error: userRoleError } = await supabase
      .from('technical_division_user_roles')
      .select('user_id')
      .eq('division_id', returnDivision_id.value)
      .eq('user_role', "Senior BMS")
      .maybeSingle(); // Use .maybeSingle() if there might not be a result

    if (userRoleError) {
      console.error("❌ Error retrieving user_id:", userRoleError);
      throw userRoleError;
    }
    if (userRoleData?.user_id) {
      returnToUser_id.value = userRoleData.user_id;
      console.log("✅ Stored user_id:", returnToUser_id.value);
    } else {
      console.warn("⚠️ No matching user_id found.");
    }
    const { error: insertError, data: insertedData } = await supabase
      .from('scoreboard_technical_process')
      .insert([{
        scoreboard_id: returnScoreboard_Id.value,
        status: 'Pending-Returned',
        owner_id: returnToUser_id.value,
        from_id: userUUID.value,
        level: "Senior BMS",
        date_received: seniorDate.value,
        date_forwarded: null
      }]);

      console.log("Insert response:", insertedData, insertError);
      if (insertError) {
        console.error("Insert error:", insertError);
          throw insertError;
      }
        
    alert("Successfully Updated");
     window.location.reload();
  } catch (err) {
    console.error("❌ Caught error:", err);
    formErrorMessage.value = err.message || "Failed to submit the form.";
  }
};

const confirmSupervisor = async () => {
  const valuesToUpdate = {
    date_forwarded: supervisorDate.value,
    status: "Returned"
  };
console.log("🧪 ID being updated:", returnProcess_Id.value);
  try {
   
    const { data, error: updateError } = await supabase
      .from('scoreboard_technical_process')
      .update(valuesToUpdate)
      .eq('id', returnProcess_Id.value)
      .throwOnError();

    console.log("🔁 Updated rows:", data);

    if (updateError) {
      console.error("❌ Update error:", updateError);
      throw updateError;
    }
    console.log("📥 Retrieving user from technical_division_user_role...");
    console.log("➡️ Division ID:", returnDivision_id.value);
    console.log("➡️ Level:", returnLevel.value);

    const { data: userRoleData, error: userRoleError } = await supabase
      .from('technical_division_user_roles')
      .select('user_id')
      .eq('division_id', returnDivision_id.value)
      .eq('user_role', "Supervising BMS")
      .maybeSingle(); 
    if (userRoleError) {
      console.error("❌ Error retrieving user_id:", userRoleError);
      throw userRoleError;
    }
    if (userRoleData?.user_id) {
      returnToUser_id.value = userRoleData.user_id;
      console.log("✅ Stored user_id:", returnToUser_id.value);
    } else {
      console.warn("⚠️ No matching user_id found.");
    }
    const { error: insertError, data: insertedData } = await supabase
      .from('scoreboard_technical_process')
      .insert([{
        scoreboard_id: returnScoreboard_Id.value,
        status: 'Pending-Returned',
        owner_id: returnToUser_id.value,
        from_id: userUUID.value,
        level: "Supervising BMS",
        date_received: supervisorDate.value,
        date_forwarded: null
      }]);

      console.log("Insert response:", insertedData, insertError);
      if (insertError) {
        console.error("Insert error:", insertError);
          throw insertError;
      }
        
    alert("Successfully Updated");
    window.location.reload();
  } catch (err) {
    console.error("❌ Caught error:", err);
    formErrorMessage.value = err.message || "Failed to submit the form.";
  }
};
const confirmIndividual = async () => {
  const valuesToUpdate = {
    date_forwarded: individualDate.value,
    status: "Returned"
  };
console.log("🧪 ID being updated:", returnProcess_Id.value);
  try {
   
    const { data, error: updateError } = await supabase
      .from('scoreboard_technical_process')
      .update(valuesToUpdate)
      .eq('id', returnProcess_Id.value)
      .throwOnError();

    console.log("🔁 Updated rows:", data);

    if (updateError) {
      console.error("❌ Update error:", updateError);
      throw updateError;
    }
    console.log("📥 Retrieving user from technical_division_user_role...");
    console.log("➡️ Scoreboard Id", returnScoreboard_Id.value);
    console.log("➡️ Level:", returnLevel.value);

    const { data: userRoleData, error: userRoleError } = await supabase
      .from('technical_individual_level')
      .select('owner_id')
      .eq('scoreboard_id', returnScoreboard_Id.value)
        .maybeSingle(); 
    if (userRoleError) {
      console.error("❌ Error retrieving user_id:", userRoleError);
      throw userRoleError;
    }
    console.log("Retrieved id ", userRoleData.owner_id)
    returnToUser_id.value = userRoleData.owner_id;
    if (userRoleData?.owner_id) {
      returnToUser_id.value = userRoleData.owner_id;
      console.log("✅ Stored user_id:", returnToUser_id.value);
    } else {
      console.warn("⚠️ No matching user_id found.");
    }
    const { error: insertError, data: insertedData } = await supabase
      .from('scoreboard_technical_process')
      .insert([{
        scoreboard_id: returnScoreboard_Id.value,
        status: 'Pending-Returned',
        owner_id: returnToUser_id.value,
        from_id: userUUID.value,
        level: "Individual",
        date_received: individualDate.value,
        date_forwarded: null
      }]);

      console.log("Insert response:", insertedData, insertError);
      if (insertError) {
        console.error("Insert error:", insertError);
          throw insertError;
      }
        
    alert("Successfully Updated");
    //window.location.reload();
  } catch (err) {
    console.error("❌ Caught error:", err);
    formErrorMessage.value = err.message || "Failed to submit the form.";
  }
};
const handleAction = (action, row) => {
  switch (action) {
    
    case 'individual':
      openIndividualModal(row);
      break;
    case 'senior':
      openSeniorModal(row);
      break;
    case 'supervising':
      openSupervisorModal(row);
      break;
    default:
      console.warn("Unknown action:", action);
  }
};
onMounted(async () => {
  await fetchLoggedInUser();
  await fetchScoreboardData();
  await fetchreleasedFAD();
});

// Track which row is currently visible
const activeRow = ref('row1') // default to row 1
</script>

<template>
  
 <v-card-text>
        <v-row>
              <!-- Control Buttons -->
            <v-btn @click="activeRow = 'row1'" :color="activeRow === 'row1' ? 'primary' : 'default'" class="me-2">
              Technical
            </v-btn>
            <v-btn @click="activeRow = 'row2'" :color="activeRow === 'row2' ? 'primary' : 'default'">
              FAD
            </v-btn>
    </v-row>
       <v-row  v-if="activeRow === 'row1'" class="mt-4">
        <v-col>
            <v-container>
                <v-card>
                <v-card-title>Pending Technical DMS:</v-card-title>
                <v-card-text>
                  <v-data-table :items="scoreboardData" class="elevation-1">
                <template v-slot:headers>
                  <tr>
                    <th>DMS Reference Number</th>
                    <th>Date Received</th>
                    <th>Name</th>
                    <th>Agency</th>
                    <th>Action</th>
                    <th><b>Return for Review</b></th>
                  </tr>
                </template>
                <template v-slot:body="{ items }">
                  <tr v-for="item in items" :key="item.dms_reference_number">
                    <td>{{ item.dms_reference_number }}</td>
                    <td>{{ item.date_received }}</td>
                    <td>{{ item.name }}</td>
                    <td>{{ item.agency_name }}</td>
                    <td>
                      <v-btn 
                        color="primary" 
                        size="small" 
                        class="me-2" 
                        @click="goToAddScoreboard(item)"
                      >
                        Accept
                      </v-btn>
                      </td>
                      <td>
                      <v-select
                        :items="[
                          { label: 'To Individual', action: 'individual' },
                          { label: 'To Senior BMS', action: 'senior' },
                          { label: 'To Supervising BMS', action: 'supervising' }
                        ]"
                        label="Select Level"
                        item-title="label"
                        item-value="action"
                        variant="outlined"
                        density="compact"
                        hide-details
                        @update:modelValue="handleAction($event, item)"
                      />
                    </td>
                  </tr>
                </template>
              </v-data-table>
                </v-card-text>
                <!-- Senior Modal -->
                  <v-dialog v-model="showSeniorModal" max-width="400px">
                    <v-card>
                      <v-card-title>Select Return Date for Senior BMS</v-card-title>
                      <v-card-text>
                        <v-date-picker v-model="seniorDate" :max="new Date().toISOString().substr(0, 10)" />
                      </v-card-text>
                      <v-card-actions>
                        <v-spacer></v-spacer>
                        <v-btn text @click="showSeniorModal = false">Cancel</v-btn>
                        <v-btn color="green" text @click="confirmSenior()">Confirm</v-btn>
                      </v-card-actions>
                    </v-card>
                  </v-dialog>

                  <!-- Supervising Modal -->
                  <v-dialog v-model="showSupervisorModal" max-width="400px">
                    <v-card>
                      <v-card-title>Select Return Date for Supervising BMS</v-card-title>
                      <v-card-text>
                        <v-date-picker v-model="supervisorDate" :max="new Date().toISOString().substr(0, 10)" />
                      </v-card-text>
                      <v-card-actions>
                        <v-spacer></v-spacer>
                        <v-btn text @click="showSupervisorModal = false">Cancel</v-btn>
                        <v-btn color="teal" text @click="confirmSupervisor()">Confirm</v-btn>
                      </v-card-actions>
                    </v-card>
                  </v-dialog>
                  <!-- Individual Modal -->
                  <v-dialog v-model="showIndividualModal" max-width="400px">
                    <v-card>
                      <v-card-title>Select Return Date for Individual</v-card-title>
                      <v-card-text>
                        <v-date-picker v-model="individualDate" :max="new Date().toISOString().substr(0, 10)" />
                      </v-card-text>
                      <v-card-actions>
                        <v-spacer></v-spacer>
                        <v-btn text @click="showIndividualModal = false">Cancel</v-btn>
                        <v-btn color="teal" text @click="confirmIndividual(item)">Confirm</v-btn>
                      </v-card-actions>
                    </v-card>
                  </v-dialog>
                  
                </v-card>
            </v-container>
        </v-col>
       
      </v-row>

      <!-- Start For FAD section -->

      <v-row v-if="activeRow === 'row2'" class="mt-4">
        <v-col>
            <v-container>
                <v-card>
                <v-card-title>PENDING FAD DMS:</v-card-title>
                <v-card-text>
                  <v-data-table :items="releasedFAD" class="elevation-1">
                <template v-slot:headers>
                  <tr>
                    <th>DMS Reference Number</th>
                    <th>Date Received</th>
                    <th>Name</th>
                    <th>Type of Transaction</th>
                    <th>DMS Title</th>
                    <th>Action</th>
                  </tr>
                </template>
                <template v-slot:body="{ items }">
                  <tr v-for="item in items" :key="item.scoreboard_id">
                    <td>{{ item.dms_reference_number }}</td>
                    <td>{{ item.date_received }}</td>
                    <td>{{ item.name }}</td>
                    <td>{{ item.type_of_transaction }}</td>
                    <td>{{ item.dms_title }}</td>
                    <td>
                      <v-btn 
                        color="primary" 
                        size="small" 
                        class="me-2" 
                        @click="goToFadreleasing(item)"
                      >
                        Accept
                      </v-btn>
                      </td>
                  </tr>
                </template>
              </v-data-table>
                </v-card-text>
                </v-card>
            </v-container>
        </v-col>
       
      </v-row>
       <!-- End For FAD section -->
    </v-card-text>
</template>