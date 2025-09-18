<script setup>

import SideNavigation from '@/components/layout/navigation/SideNavigation.vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import { useRoute } from 'vue-router';
import { ref, computed } from 'vue'
import ScoreboardForm_releasing from '@/components/system/accomplishments/scoreboard/ScoreboardForm_releasingFAD.vue';


const route = useRoute();
const dmsReferenceNumber = ref(route.query.dms_reference_number || '');
const dateReceived = ref(route.query.date_received || '');
const unformattedDate = ref(route.query.unformatted_date || '');
const name = ref(route.query.name || '');
const scoreboardId = ref(route.query.scoreboard_id || '');
const TypeofTransactionId = ref(route.query.type_of_transaction || '');
const dmsTitle = ref(route.query.dms_title || 'N/A');
console.log("✅ Received query parameters:", route.query);

const isDrawerVisible = ref(true)

const formProps = computed(() => ({
  dmsReferenceNumber: dmsReferenceNumber.value,
  dateReceived: dateReceived.value,
  unformatted_date: unformattedDate.value,
  dmsName: name.value,
  scoreboardId: scoreboardId.value,
  type_of_transaction: TypeofTransactionId.value,
  dmsTitle: dmsTitle.value 
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
              <v-breadcrumbs :items="['Scoreboard', 'Releasing Level']">
                <template #prepend>
                  <v-icon icon="mdi-account-multiple" size="small" class="me-1"></v-icon>
                </template>
              </v-breadcrumbs>
            </span>
          </template>
        </v-card>

        <!-- Pass the extracted data as props -->
        <ScoreboardForm_releasing v-bind="formProps" />

      </v-container>
    
    </template>
  </AppLayout>
</template>
