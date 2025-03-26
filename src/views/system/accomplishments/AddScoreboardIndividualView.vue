<script setup>
import ScoreboardForm_receiving from '@/components/system/accomplishments/scoreboard/ScoreboardForm_receiving.vue'
import ScoreboardForm_technical from '@/components/system/accomplishments/scoreboard/ScoreboardForm_technical.vue'
import ScoreboardForm from '@/components/system/accomplishments/scoreboard/ScoreboardForm.vue'
import SideNavigation from '@/components/layout/navigation/SideNavigation.vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import { useRoute } from 'vue-router';
import { useAuthUserStore } from '@/stores/authUser'
import { ref, computed } from 'vue'


const route = useRoute();
const dmsReferenceNumber = ref(route.query.dms_reference_number || '');
const dateReceived = ref(route.query.date_received || '');
const agencyName = ref(route.query.agency_name || '');
const scoreboardId = ref(route.query.scoreboard_individual_id || '');
console.log("✅ Received query parameters:", route.query);

const isDrawerVisible = ref(true)
const authStore = useAuthUserStore()
const userRole = computed(() => authStore.userRole)

const formProps = computed(() => ({
  dmsReferenceNumber: dmsReferenceNumber.value,
  dateReceived: dateReceived.value,
  agencyName: agencyName.value,
  scoreboardId: scoreboardId
}));

// Dynamic Component Selection
const SelectedForm = computed(() => {
  if (userRole.value === 'Technical') {
    return ScoreboardForm_technical
  } else if (userRole.value === 'Administrator') {
    return ScoreboardForm  // ✅ Show Admin Form
  } else {
    return ScoreboardForm_receiving  // Default: Receiving Form
  }
})
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
              <v-breadcrumbs :items="['Scoreboard', 'Individual Level']">
                <template #prepend>
                  <v-icon icon="mdi-account-multiple" size="small" class="me-1"></v-icon>
                </template>
              </v-breadcrumbs>
            </span>
          </template>
        </v-card>

        <!-- Pass the extracted data as props -->
        <ScoreboardForm_technical v-bind="formProps" />
        <!-- Render the selected form dynamically -->
          <!-- 
      <ScoreboardForm_receiving /> -->
     
      </v-container>
    
    </template>
  </AppLayout>
</template>
