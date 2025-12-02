<script setup>
import AppLayout from '@/components/layout/AppLayout.vue'
import SideNavigation from '@/components/layout/navigation/SideNavigation.vue'
import AgenciesTable from '@/components/system/manage-agencies/AgenciesTable.vue'
import ToTTable from '@/components/system/type-of-transaction/ToTTable.vue'
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
              <v-breadcrumbs :items="['Type of Transaction Management', 'List of Type of Transaction']">
                <template #prepend>
                  <v-icon icon="mdi-office-building-cog" size="small" class="me-1" />
                </template>
              </v-breadcrumbs>
            </span>
          </template>

          <template #subtitle>
            <p class="ms-4 text-wrap">Manage Type of Transaction.</p>
          </template>
        </v-card>
        <v-card>
          <v-card-text>
            <ToTTable></ToTTable>
          </v-card-text>
        </v-card>
      </v-container>
    </template>
  </AppLayout>
</template>
