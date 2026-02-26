<script setup>
import { ref } from 'vue'
import { usedbStore } from '@/stores/position'
import AlertNotification from '@/components/common/AlertNotification.vue'
import FormDialog from './PositionFormDialog.vue'
import FormDialog2 from './UserPositionDialog.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import { formActionDefault } from '@/utils/supabase'
import { tableHeaders } from './positionTableUtils'
import { useDate } from 'vuetify'

// Utilize pre-defined vue functions
const date = useDate()

// Use Pinia Store for Agencies
const positionStore = usedbStore()

// Load Variables
const tableOptions = ref({
  page: 1,
  itemsPerPage: 10,
  sortBy: [],
  isLoading: false
})

const isDialogVisible = ref(false)
const isDialogVisible2 = ref(false)
const isConfirmDeleteDialog = ref(false)
const itemData = ref(null)
const deleteId = ref('')
const formAction = ref({
  ...formActionDefault
})

// Trigger Update Btn
const onUpdate = (item) => {
  itemData.value = {
    pup_id: item.pup_id,
    user_id: item.user_id,
    pos_id: item.pos_id
  }
  isDialogVisible2.value = true
}


// Trigger Add Btn
const onAdd = () => {
  itemData.value = null
  isDialogVisible.value = true
}

// Trigger Delete Btn
const onDelete = (item) => {
  deleteId.value = item.pos_id
  isConfirmDeleteDialog.value = true
}
// Trigger Assign user to a Position
const assignUser = () => {
  itemData.value = null
  isDialogVisible2.value = true
}
// Confirm Delete
const onConfirmDelete = async () => {
  alert(deleteId.value)
  formAction.value = { ...formActionDefault, formProcess: true }

  try {
    const { error } = await positionStore.deletePosition(deleteId.value)

    // Turn off processing
    formAction.value.formProcess = false

    if (error) {
      // Add Error Message and Status Code
      formAction.value.formErrorMessage = error.message
      formAction.value.formStatus = error.status
      return
    }

    // Add Success Message
    formAction.value.formSuccessMessage = 'Successfully Deleted Position.'

    // Retrieve Data
    onLoadItems(tableOptions.value)
  } catch (err) {
    formAction.value.formProcess = false
    formAction.value.formErrorMessage = 'Error deleting position: ' + err.message
  }
}

// Load Tables Data
const onLoadItems = async ({ page, itemsPerPage, sortBy }) => {
  // Trigger Loading
  tableOptions.value.isLoading = true

  try {
    await positionStore.getPositionTable({ page, itemsPerPage, sortBy })
  } catch (err) {
    formAction.value.formErrorMessage = 'Error loading agencies: ' + err.message
  } finally {
    // Trigger Loading
    tableOptions.value.isLoading = false
  }
}
</script>

<template>
  <AlertNotification
    :form-success-message="formAction.formSuccessMessage"
    :form-error-message="formAction.formErrorMessage"
  ></AlertNotification>

  <v-row>
    <v-col cols="12">
      <v-data-table-server
        v-model:items-per-page="tableOptions.itemsPerPage"
        v-model:page="tableOptions.page"
        v-model:sort-by="tableOptions.sortBy"
        :loading="tableOptions.isLoading"
        :headers="tableHeaders"
        :items="positionStore.positionTable"
        :items-length="positionStore.positionTotal"
        @update:options="onLoadItems"
      >
        <template #top>
          <v-row dense>
            <v-spacer></v-spacer>
            <v-col cols="12" md="3">
                <v-btn class="my-1" prepend-icon="mdi-plus" color="blue-darken-4" block @click="assignUser">
                  Assign User to Position
              </v-btn>
            </v-col>
            <v-col cols="12" md="3">
              <v-btn
                class="my-1"
                prepend-icon="mdi-office-building-plus"
                color="red-darken-4"
                block
                @click="onAdd"
              >
                Add Position
              </v-btn>
            </v-col>
          </v-row>

          <v-divider class="my-5"></v-divider>
        </template>
           <template #item.index="{ index }">
            {{
              (tableOptions.page - 1) * tableOptions.itemsPerPage + index + 1
            }}
        </template>
        <template #item.pos_name="{ item }">
          <span class="font-weight-bold">{{ item.pos_name }}</span>
        </template>

        <template #item.fullname="{ item }">
          <span>
            {{ item.fullname || 'Not assigned' }}
          </span>
        </template>

        <template #item.created_at="{ item }">
          <span class="font-weight-bold">
            {{ date.format(item.created_at, 'fullDateTime', { timeZone: 'Asia/Manila' }) }}
          </span>
        </template>

        <template #item.actions="{ item }">
          <div class="d-flex align-center justify-center">
            <v-btn variant="text" density="comfortable" @click="onUpdate(item)" icon>
              <v-icon icon="mdi-pencil"></v-icon>
              <v-tooltip activator="parent" location="top">Edit Position</v-tooltip>
            </v-btn>

            <v-btn variant="text" density="comfortable" @click="onDelete(item)" icon>
              <v-icon icon="mdi-trash-can" color="red-darken-4"></v-icon>
              <v-tooltip activator="parent" location="top">Delete Position</v-tooltip>
            </v-btn>
          </div>
        </template>
      </v-data-table-server>
    </v-col>
  </v-row>

  <FormDialog
    v-model:is-dialog-visible="isDialogVisible"
    :item-data="itemData"
    :table-options="tableOptions"
  ></FormDialog>

  <FormDialog2 v-model:is-dialog-visible="isDialogVisible2" :item-data="itemData" :table-options="tableOptions">
  </FormDialog2>
  <ConfirmDialog
    v-model:is-dialog-visible="isConfirmDeleteDialog"
    title="Confirm Delete"
    text="Are you sure you want to delete this position?"
    @confirm="onConfirmDelete"
  ></ConfirmDialog>
</template>
