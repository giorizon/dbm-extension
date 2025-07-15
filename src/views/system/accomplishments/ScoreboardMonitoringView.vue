<script setup>
import ScoreboardTable from '@/components/system/accomplishments/scoreboard/ScoreboardMonitoringTable.vue'
import individulLevel from '@/components/system/accomplishments/scoreboard/ScoreboardMonitoringIndividual.vue'
import supervisorLevel from '@/components/system/accomplishments/scoreboard/ScoreboardMonitoringSupervisor.vue'
import divisionLevel from '@/components/system/accomplishments/scoreboard/ScoreboardMonitoringDivision.vue'
import FadLevel from '@/components/system/accomplishments/scoreboard/ScoreboardMonitoringFad.vue'
import SideNavigation from '@/components/layout/navigation/SideNavigation.vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import { useAuthUserStore } from '@/stores/authUser'
//import { useDisplay } from 'vuetify'
import { ref, computed } from 'vue'
const authStore = useAuthUserStore()

// Utilize pre-defined vue functions
//const { mobile } = useDisplay()

// Get user role
const userRole = computed(() => authStore.userRole)
const SelectedForm = computed(() => {
  if (userRole.value === 'Releasing Data') {
    return ScoreboardTable;
  }
  else if(userRole.value === 'Technical'){
    return individulLevel;
  }
   else if(userRole.value === 'Senior BMS' || userRole.value === 'Supervising BMS' ){
    return supervisorLevel;  
  }
  else if(userRole.value === 'Division Chief'){
    return divisionLevel;
  }
   else if(userRole.value === 'FAD'){
    return FadLevel;
  }
  else{
     return ScoreboardTable;
  }
});
const isDrawerVisible = ref(true)
</script>

<template>
  <AppLayout :is-with-app-bar-nav-icon="true" @is-drawer-visible="isDrawerVisible = !isDrawerVisible">
    <template #navigation>
      <SideNavigation :is-drawer-visible="isDrawerVisible"></SideNavigation>
    </template>
    <template #content>
      <v-container>
        <v-card class="mb-5">
          <template #title>
            <span class="text-h6 font-weight-bold">
              <v-breadcrumbs :items="['Monitoring', 'Scoreboard Monitoring']">
                <template #prepend>
                  <v-icon icon="mdi-account-multiple" size="small" class="me-1"></v-icon>
                </template>
              </v-breadcrumbs>
            </span>
          </template>

          <template #subtitle>
            <p class="ms-4 text-wrap">Monitoring scoreboard records</p>
          </template>
        </v-card>
        <v-row>
          <v-col cols="12">
            <v-card>
              <v-card-text>
                <SelectedForm />
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
        
      </v-container>
    </template>
  </AppLayout>
</template>
