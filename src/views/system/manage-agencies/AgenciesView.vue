<script setup>
import AppLayout from '@/components/layout/AppLayout.vue'
import SideNavigation from '@/components/layout/navigation/SideNavigation.vue'
import AgencyNameForm from '@/components/system/manage-agencies/AgencyNameForm.vue'
import { ref } from 'vue'

const isDrawerVisible = ref(true)
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
        <v-card class="mb-5">
          <template #title>
            <span class="text-h6 font-weight-bold">
              <v-breadcrumbs :items="['Agency Management', 'List of Agencies']">
                <template #prepend>
                  <v-icon icon="mdi-office-building-cog" size="small" class="me-1" />
                </template>
              </v-breadcrumbs>
            </span>
          </template>

          <template #subtitle>
            <p class="ms-4 text-wrap">Manage agencies and assign personnel.</p>
          </template>
        </v-card>
        <v-row>
          <v-card-text>
            <AgencyNameForm />
          </v-card-text>
        </v-row>
      </v-container>
    </template>
  </AppLayout>
</template>
