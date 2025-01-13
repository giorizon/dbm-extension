<script setup>
import { scoreboardTableHeaders } from '@/components/system/accomplishments/scoreboard/scoreboardTableUtils'
import { useDate } from 'vuetify'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import AlertNotification from '@/components/common/AlertNotification.vue'
import { useScoreboardTable } from '@/composables/scoreboard/scoreboardTable'
import { useScoreboardStore } from '@/stores/scoreboard'

const date = useDate()
const scoreboardStore = useScoreboardStore()
const { onDelete, onConfirmDelete, onLoadItems, isDialogVisible, formAction, tableOptions } = useScoreboardTable()

</script>

<template>
  <AlertNotification :form-success-message="formAction.formSuccessMessage"
    :form-error-message="formAction.formErrorMessage"></AlertNotification>
  <v-data-table-server v-model:items-per-page="tableOptions.itemsPerPage" v-model:page="tableOptions.page"
    v-model:sort-by="tableOptions.sortBy" :loading="tableOptions.isLoading" :headers="scoreboardTableHeaders"
    :items="scoreboardStore.scoreboardTable" :items-length="scoreboardStore.scoreboardTotal" :hover="true"
    @update:options="onLoadItems">
    <template #top>
      <v-row dense>
        <v-spacer></v-spacer>

        <v-col cols="12" md="3">
          <v-btn class="my-1" prepend-icon="mdi-account-plus" color="red-darken-4" block to="/add-scoreboard">
            Add Scoreboard Record
          </v-btn>
        </v-col>
      </v-row>
      <v-divider class="my-5"></v-divider>
    </template>

    <!-- eslint-disable vue/valid-v-slot -->
    <template #header.pap="{ column: { title } }">
      <span class="font-weight-bold w-75">
        {{ title }}
      </span>
    </template>
    <template #header.ipar="{ column: { title } }">
      <span class="font-weight-bold w-75 text-h5 mx-4">
        {{ title }}
      </span> </template><template #header.particulars="{ column: { title } }">
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
      <span class="font-weight-bold">
        {{ date.format(item.date_time_received, 'fullDateTime') }}
      </span>
    </template>
    <template #item.date_time_forwarded_ipar="{ item }">
      <span class="font-weight-bold">
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
    <template #item.css_submission_date="{ item }">
      <span class="font-weight-bold">
        {{ date.format(item.css_submission_date, 'fullDateTime') }}
      </span>
    </template>
    <template #item.actions="{ item }">
      <v-btn variant="text" density="comfortable" @click="onDelete(item.scoreboard_id)" icon>
        <v-icon icon="mdi-trash-can" color="red-darken-4"></v-icon>
        <v-tooltip activator="parent" location="top">Delete Scoreboard</v-tooltip>
      </v-btn>
    </template>
  </v-data-table-server>
  <ConfirmDialog v-model:is-dialog-visible="isDialogVisible"
    :text="'Are you sure you want to delete scoreboard record?'" :title="'Delete Scoreboard'"
    @confirm="onConfirmDelete"></ConfirmDialog>
</template>
