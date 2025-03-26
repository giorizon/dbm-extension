<script setup>
import { ref } from "vue";
import { scoreboardTableHeaders } from "@/components/system/accomplishments/scoreboard/scoreboardTableUtils";
import ConfirmDialog from "@/components/common/ConfirmDialog.vue";
import AlertNotification from "@/components/common/AlertNotification.vue";
import { useScoreboardTable } from "@/composables/scoreboard/scoreboardTable";
import { useScoreboardStore } from "@/stores/scoreboard";

const scoreboardStore = useScoreboardStore();
const { onLoadItems, tableOptions, formAction } = useScoreboardTable();
const dialog = ref(false);
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
    hover
    @update:options="onLoadItems"
  >
    <template #top>
      <v-row dense>
        <v-spacer></v-spacer>
        <v-col cols="12" md="3">
          <v-btn class="my-1" prepend-icon="mdi-account-plus" color="green-darken-1" @click="dialog = true">
            Add Received DMS
          </v-btn>
        </v-col>
      </v-row>
      <v-divider class="my-5"></v-divider>
    </template>
    <template #item.action="{ item }">
      <v-btn size="small" color="lime-darken-1" class="mr-2" @click="editItem(item)">
        <v-icon left>mdi-pencil</v-icon> Edit
      </v-btn>
      <v-btn size="small" color="red-lighten-1" @click="deleteItem(item)">
        <v-icon left>mdi-delete</v-icon> Delete
      </v-btn>
    </template>
  </v-data-table-server>

  <!-- Add Dialog -->
  <v-dialog v-model="dialog" max-width="500px">
      <v-card 
          prepend-icon="mdi-account-multiple-plus" 
          title=" Add Scoreboard Record"
          class ="pt-3"
          subtitle="Please select a user category to add a scoreboard record. ">
          <v-container class="d-flex justify-center ">
          <v-row justify="center" dense style="max-width: 400px;">
            <v-col cols="6">
              <v-btn color="blue-darken-4" block to="/add-scoreboard-fad">
                FAD
              </v-btn>
            </v-col>
            <v-col cols="6">
              <v-btn class="mb-6" color="red-darken-4" block to="/add-scoreboard">
                Technical
              </v-btn>
            </v-col>
          </v-row>
        </v-container>
        <v-divider></v-divider>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn class="mr-5 my-2" text="Close" variant="plain" prepend-icon="mdi-close" @click="dialog = false"></v-btn>
        </v-card-actions>
      </v-card>
     </v-dialog>

  <ConfirmDialog v-model:is-dialog-visible="isDialogVisible"
    text="Are you sure you want to delete scoreboard record?" title="Delete Scoreboard"
    @confirm="onConfirmDelete"></ConfirmDialog>
</template>