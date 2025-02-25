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


  <v-data-table-server 
    v-model:items-per-page="tableOptions.itemsPerPage" 
    v-model:page="tableOptions.page"
    v-model:sort-by="tableOptions.sortBy" 
    :loading="tableOptions.isLoading" 
    :headers="scoreboardTableHeaders"
    :items="scoreboardStore.scoreboardTable" 
    :items-length="scoreboardStore.scoreboardTotal" 
    :hover="true"
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
  <!-- Add slot for the 'Action' column -->
  <template #item.action="{ item }">
    <v-btn size="small" color="primary" class="mr-2" @click="editItem(item)">
      <v-icon left>mdi-pencil</v-icon> Edit
    </v-btn>
    <v-btn size="small" color="red" @click="deleteItem(item)">
      <v-icon left>mdi-delete</v-icon> Delete
    </v-btn>
  </template>
   </v-data-table-server>

<br><br>

  
  <ConfirmDialog v-model:is-dialog-visible="isDialogVisible"
    :text="'Are you sure you want to delete scoreboard record?'" :title="'Delete Scoreboard'"
    @confirm="onConfirmDelete"></ConfirmDialog>
</template>
