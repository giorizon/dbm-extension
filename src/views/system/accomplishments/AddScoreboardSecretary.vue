<script setup>
import ScoreboardForm_secretary from '@/components/system/accomplishments/scoreboard/ScoreboardForm_secretary.vue'
import SideNavigation from '@/components/layout/navigation/SideNavigation.vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import { useRoute } from 'vue-router';
import { ref, computed } from 'vue'


const route = useRoute();
const dmsReferenceNumber = ref(route.query.dms_reference_number || '');
const dateReceived = ref(route.query.date_received || '');
const unformattedDate = ref(route.query.unformatted_date || '');
const agencyName = ref(route.query.agency_name || '');
const scoreboardId = ref(route.query.scoreboard_id || '');
const processId = ref(route.query.process_id || '');
console.log("✅ Received query parameters:", route.query);

const isDrawerVisible = ref(true)

const formProps = computed(() => ({
  dmsReferenceNumber: dmsReferenceNumber.value,
  dateReceived: dateReceived.value,
  unformattedDate: unformattedDate.value,
  agencyName: agencyName.value,
  scoreboardId: scoreboardId.value,
  processId: processId.value
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
              <v-breadcrumbs :items="['Scoreboard', 'Secretary']">
                <template #prepend>
                  <v-icon icon="mdi-account-multiple" size="small" class="me-1"></v-icon>
                </template>
              </v-breadcrumbs>
            </span>
          </template>
        </v-card>
        <ScoreboardForm_secretary v-bind="formProps" />
      </v-container>
    
    </template>
  </AppLayout>
</template>
