<script setup>
import { ref } from 'vue'
import { usePositionStore } from '@/stores/position'
import AlertNotification from '@/components/common/AlertNotification.vue'
import PositionFormDialog from './PositionFormDialog.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import { formActionDefault } from '@/utils/supabase'
import { tableHeaders } from './positionTableUtils'
import { useDate } from 'vuetify'

// Utilize pre-defined vue functions
const date = useDate()

// Use Pinia Store for Agencies
const positionStore = usePositionStore()

// Load Variables
const tableOptions = ref({
  page: 1,
  itemsPerPage: 10,
  sortBy: [],
  isLoading: false
})

const isDialogVisible = ref(false)
const isConfirmDeleteDialog = ref(false)
const itemData = ref(null)
const deleteId = ref('')
const formAction = ref({
  ...formActionDefault
})

// Trigger Update Btn
const onUpdate = (item) => {
  const { id, agency_name, user_id } = item

  itemData.value = { id, agency_name, user_id }
  isDialogVisible.value = true
}

// Trigger Add Btn
const onAdd = () => {
  itemData.value = null
  isDialogVisible.value = true
}

// Trigger Delete Btn
const onDelete = (id) => {
  deleteId.value = id
  isConfirmDeleteDialog.value = true
}

// Confirm Delete
const onConfirmDelete = async () => {
  formAction.value = { ...formActionDefault, formProcess: true }

  try {
    const { error } = await positionStore.deleteAgency(deleteId.value)

    // Turn off processing
    formAction.value.formProcess = false

    if (error) {
      // Add Error Message and Status Code
      formAction.value.formErrorMessage = error.message
      formAction.value.formStatus = error.status
      return
    }

    // Add Success Message
    formAction.value.formSuccessMessage = 'Successfully Deleted Agency.'

    // Retrieve Data
    onLoadItems(tableOptions.value)
  } catch (err) {
    formAction.value.formProcess = false
    formAction.value.formErrorMessage = 'Error deleting agency: ' + err.message
  }
}

// Load Tables Data
const onLoadItems = async ({ page, itemsPerPage, sortBy }) => {
  // Trigger Loading
  tableOptions.value.isLoading = true

  try {
    await positionStore.getAgenciesTable({ page, itemsPerPage, sortBy })
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
        :items="positionStore.agenciesTable"
        :items-length="positionStore.agenciesTotal"
        @update:options="onLoadItems"
      >
        <template #top>
          <v-row dense>
            <v-spacer></v-spacer>

            <v-col cols="12" md="3">
              <v-btn
                class="my-1"
                prepend-icon="mdi-office-building-plus"
                color="red-darken-4"
                block
                @click="onAdd"
              >
                Add Agency
              </v-btn>
            </v-col>
          </v-row>

          <v-divider class="my-5"></v-divider>
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
              <v-tooltip activator="parent" location="top">Edit Agency</v-tooltip>
            </v-btn>

            <v-btn variant="text" density="comfortable" @click="onDelete(item.id)" icon>
              <v-icon icon="mdi-trash-can" color="red-darken-4"></v-icon>
              <v-tooltip activator="parent" location="top">Delete Agency</v-tooltip>
            </v-btn>
          </div>
        </template>
      </v-data-table-server>
    </v-col>
  </v-row>

  <PositionFormDialog
    v-model:is-dialog-visible="isDialogVisible"
    :item-data="itemData"
    :table-options="tableOptions"
  ></PositionFormDialog>

  <ConfirmDialog
    v-model:is-dialog-visible="isConfirmDeleteDialog"
    title="Confirm Delete"
    text="Are you sure you want to delete this agency?"
    @confirm="onConfirmDelete"
  ></ConfirmDialog>
</template>
