<script setup>
import monitoring from '@/components/system/accomplishments/monitoring-tool/monitoring-tool-two.vue'

import SideNavigation from '@/components/layout/navigation/SideNavigation.vue'
import AppLayout from '@/components/layout/AppLayout.vue'

//import { useDisplay } from 'vuetify'
import { ref} from 'vue'


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
              <v-breadcrumbs :items="['Monitoring', 'Monitoring Tool 2']">
                <template #prepend>
                  <v-icon icon="mdi-account-multiple" size="small" class="me-1"></v-icon>
                </template>
              </v-breadcrumbs>
            </span>
          </template>

          <template #subtitle>
            <p class="ms-4 text-wrap">Monitoring Tool</p>
          </template>
        </v-card>
        <v-row>
          <v-col cols="12">
            <v-card>
              <v-card-text>
                <monitoring/>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
        
      </v-container>
    </template>
  </AppLayout>
</template>
