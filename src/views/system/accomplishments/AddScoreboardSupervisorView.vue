<script setup>
import ScoreboardForm_supervisor from '@/components/system/accomplishments/scoreboard/ScoreboardForm_supervisor.vue'
import SideNavigation from '@/components/layout/navigation/SideNavigation.vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import { useRoute } from 'vue-router';
import { ref, computed } from 'vue'


const route = useRoute();
const dmsReferenceNumber = ref(route.query.dms_reference_number || '');
const dateReceived = ref(route.query.date_received || '');
const agencyName = ref(route.query.agency_name || '');
const scoreboardId = ref(route.query.scoreboard_supervising_id || '');
console.log("✅ Received query parameters:", route.query);

const isDrawerVisible = ref(true)

const formProps = computed(() => ({
  dmsReferenceNumber: dmsReferenceNumber.value,
  dateReceived: dateReceived.value,
  agencyName: agencyName.value,
  scoreboardId: scoreboardId
}));

</script>

<template>
  <AppLayout
    :is-with-app-bar-nav-icon="true"
    @is-drawer-visible="isDrawerVisible = !isDrawerVisible"
  >
    <template #navigation>
      <SideNavigation :is-drawer-visible="isDrawerVisible"></SideNavigation>
    </template>
    <template #content>
      <v-container>
        <v-card class="mb-7">
          <template #title>
            <span class="text-h6 font-weight-bold">
              <v-breadcrumbs :items="['Scoreboard', 'Supervisor Level']">
                <template #prepend>
                  <v-icon icon="mdi-account-multiple" size="small" class="me-1"></v-icon>
                </template>
              </v-breadcrumbs>
            </span>
          </template>
        </v-card>

        <!-- Pass the extracted data as props -->
        <ScoreboardForm_supervisor v-bind="formProps" />
        <!-- Render the selected form dynamically -->
          <!-- 
      <ScoreboardForm_receiving /> -->
     
      </v-container>
    
    </template>
  </AppLayout>
</template>
