<script setup>
import ScoreboardForm_receiving from '@/components/system/accomplishments/scoreboard/ScoreboardForm_fad_receiving.vue'
import SideNavigation from '@/components/layout/navigation/SideNavigation.vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import { useAuthUserStore } from '@/stores/authUser'
import { ref, computed } from 'vue'
//import { ref } from 'vue'

//const isDrawerVisible = ref(true)

// State
const isDrawerVisible = ref(true)

const SelectedForm = ScoreboardForm_receiving;

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
              <v-breadcrumbs :items="['Scoreboard', 'FAD']">
                <template #prepend>
                  <v-icon icon="mdi-account-multiple" size="small" class="me-1"></v-icon>
                </template>
              </v-breadcrumbs>
            </span>
          </template>

          <template #subtitle>
            <p class="ms-4 text-wrap">
              
            </p>
          </template>
        </v-card>
        <!-- Render the selected form dynamically -->
        <component :is="SelectedForm" />
        
      <!--  <ScoreboardForm_receiving /> -->
     
      </v-container>
    
    </template>
  </AppLayout>
</template>
