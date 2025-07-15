<script setup>
import ScoreboardForm_fadcitizencharter from '@/components/system/accomplishments/scoreboard/ScoreboardForm_fadcitizencharter.vue'
import SideNavigation from '@/components/layout/navigation/SideNavigation.vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import { useRoute } from 'vue-router';
import { ref, computed } from 'vue'


const route = useRoute();
const dmsReferenceNumber = ref(route.query.dms_reference_number || '');
const dateReceived = ref(route.query.date_received || '');
const report = ref(route.query.report || '');
const subunit = ref(route.query.sub_unit || '');
const scoreboardId = ref(route.query.scoreboard_id || '');
const processId = ref(route.query.process_id || '');
console.log("✅ Received query parameters:", route.query);

const isDrawerVisible = ref(true)

const formProps = computed(() => ({
  dmsReferenceNumber: dmsReferenceNumber.value,
  dateReceived: dateReceived.value,
  report: report.value,
  subunit: subunit.value,
  scoreboardId: scoreboardId,
  processId: processId 
}));
console.log("PROCESS ID: ", processId.value);
console.log("Scoreboard ID: ", scoreboardId.value);
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
              <v-breadcrumbs :items="['Scoreboard', 'Citizen Charter Transaction']">
                <template #prepend>
                  <v-icon icon="mdi-account-multiple" size="small" class="me-1"></v-icon>
                </template>
              </v-breadcrumbs>
            </span>
          </template>
        </v-card>
        <ScoreboardForm_fadcitizencharter v-bind="formProps" />

      </v-container>
    
    </template>
  </AppLayout>
</template>
