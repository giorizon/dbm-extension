<script setup>
import SideNavigation from '@/components/layout/navigation/SideNavigation.vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import { useScoreboardStore } from '@/stores/scoreboard'
import { scoreboardTableHeaders } from "@/components/system/scoreboard/scoreboardTableUtils"
import { ref, onMounted } from "vue"
import { useDate } from 'vuetify'
const date = useDate()
const isDrawerVisible = ref(true)
// Load Variables
const tableOptions = ref({
  page: 1,
  itemsPerPage: 10,
  sortBy: [],
  isLoading: false
})
const scoreboardStore = useScoreboardStore()
const onLoadItems = async ({ page, itemsPerPage, sortBy }) => {

  tableOptions.value.isLoading = true

  //load the items here by calling the api
  await scoreboardStore.getScoreboardPaginated({ currentPage: tableOptions.value.page, perPage: tableOptions.value.itemsPerPage, column: "" })

  tableOptions.value.isLoading = false

}
//onMounted(async () => {
//
//  await scoreboardStore.getScoreboardPaginated({ currentPage: 1, perPage: 10, column: "" })
//})
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
              <v-breadcrumbs :items="['User Management', 'List of Users']">
                <template #prepend>
                  <v-icon icon="mdi-account-multiple" size="small" class="me-1"></v-icon>
                </template>
              </v-breadcrumbs>
            </span>
          </template>

          <template #subtitle>
            <p class="ms-4 text-wrap">Scoreboard Table for Reports.</p>
          </template>
        </v-card>
        <v-row>
          <v-col cols="12">
            <v-card>
              <v-card-text>
                <v-data-table-server v-model:items-per-page="tableOptions.itemsPerPage" v-model:page="tableOptions.page"
                  v-model:sort-by="tableOptions.sortBy" :loading="tableOptions.isLoading"
                  :headers="scoreboardTableHeaders" :items="scoreboardStore.scoreboardTable"
                  :items-length="scoreboardStore.scoreboardTotal" :hover="true" @update:options="onLoadItems">
                  <template #header.pap="{ column: { title } }">
                    <span class="font-weight-bold w-75 ">
                      {{ title }}
                    </span>
                  </template>
                  <template #header.ipar="{ column: { title } }">
                    <span class="font-weight-bold w-75 text-h5 mx-4">
                      {{ title }}
                    </span>
                  </template><template #header.particulars="{ column: { title } }">
                    <span class="font-weight-bold w-75 text-h5">
                      {{ title }}
                    </span>
                  </template>
                  <template #header.asst_dc_sr_bms="{ column: { title } }">
                    <span class="font-weight-bold w-75 text-h5">
                      {{ title }}
                    </span>
                  </template>

                  <template #header.opar="{ column: { title } }">
                    <span class="font-weight-bold w-75 text-h5">
                      {{ title }}
                    </span>
                  </template>
                  <template #header.dpar="{ column: { title } }">
                    <span class="font-weight-bold w-75 text-h5">
                      {{ title }}
                    </span>
                  </template>
                  <template #item.date_time_received="{ item }">
                    <span class="font-weight-bold ">
                      {{ date.format(item.date_time_received, 'fullDateTime') }}
                    </span>
                  </template>
                  <template #item.date_time_forwarded_ipar="{ item }">
                    <span class="font-weight-bold ">
                      {{ date.format(item.date_time_forwarded_ipar, 'fullDateTime') }}
                    </span>
                  </template>
                  <template #item.date_time_forwarded_bms="{ item }">
                    <span class="font-weight-bold">
                      {{ date.format(item.date_time_forwarded_bms, 'fullDateTime') }}
                    </span>
                  </template>
                  <template #item.date_time_forwarded_dpar="{ item }">
                    <span class="font-weight-bold">
                      {{ date.format(item.date_time_forwarded_dpar, 'fullDateTime') }}
                    </span>
                  </template>
                  <template #item.date_time_forwarded_opar="{ item }">
                    <span class="font-weight-bold">
                      {{ date.format(item.date_time_forwarded_opar, 'fullDateTime') }}
                    </span>
                  </template>
                </v-data-table-server>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </template>
  </AppLayout>

</template>
