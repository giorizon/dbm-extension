<script setup>
import AppLayout from '@/components/layout/AppLayout.vue'
import { ref } from "vue"
import SideNavigation from '@/components/layout/navigation/SideNavigation.vue'
import ScoreboardForm from '@/components/system/scoreboard/ScoreboardForm.vue'

const isDrawerVisible = ref(true)
</script>

<template>
  <AppLayout :is-with-app-bar-nav-icon="true" @is-drawer-visible="isDrawerVisible = !isDrawerVisible">
    <template #navigation>
      <SideNavigation :is-drawer-visible="isDrawerVisible"></SideNavigation>
    </template>
    <template #content>
      <v-container>
        <v-card class="mb-7">
          <template #title>
            <span class="text-h6 font-weight-bold">
              <v-breadcrumbs :items="['User Management', 'List of Users']">
                <template #prepend>
                  <v-icon icon="mdi-account-multiple" size="small" class="me-1"></v-icon>
                </template>
              </v-breadcrumbs>
            </span>
          </template>

          <template #subtitle>
            <p class="ms-4 text-wrap">Add Report Record for Scoreboard. Records will be displayed as tables</p>
          </template>
        </v-card>
        <ScoreboardForm />
      </v-container>
    </template>
  </AppLayout>
</template>
