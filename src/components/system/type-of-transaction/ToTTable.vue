<script setup>
import { storeToRefs } from 'pinia'
import { ref } from 'vue'
import '@/assets/css/adminPage.css'
import { useAgenciesStore } from '@/stores/agencies'
import { useToTStore } from '@/stores/typeoftransaction'
import AlertNotification from '@/components/common/AlertNotification.vue'
import AddFormDialog from './ToTFormDialog.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import { formActionDefault } from '@/utils/supabase'
import { tableHeaders } from './ToTTableUtils'
import { useDate } from 'vuetify'

// Utilize pre-defined vue functions
const date = useDate()

// Use Pinia Store for Agencies
const tblStore = useToTStore()
const deleteId = ref('')
// ADD THIS: Destructure state variables safely
const { ToTTable, ToTTotal } = storeToRefs(tblStore)

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
//const deleteId = ref('')
const formAction = ref({
  ...formActionDefault
})
// Trigger Add Btn
const onAdd = () => {
  itemData.value = null
  isDialogVisible.value = true
}
//for Update 
const onUpdate = (item) => {
  const data = item.raw || item 
  const { top_id, transaction_type, prescribed_period, pp_spcr, pp_dpcr, pp_opcr, downtime_type } = data

  itemData.value = { top_id, transaction_type, prescribed_period, pp_spcr, pp_dpcr, pp_opcr, downtime_type}
  isDialogVisible.value = true
}
//for delete
const onDelete = (id) => {
  deleteId.value = id
  console.log('Delete ID : ', deleteId.value);
  isConfirmDeleteDialog.value = true
}
const onConfirmDelete = async () => {
  formAction.value = { ...formActionDefault, formProcess: true }

  try {
    const { error } = await tblStore.deleteTransactionType(deleteId.value)

    // Turn off processing
    formAction.value.formProcess = false

    if (error) {
      // Add Error Message and Status Code
      formAction.value.formErrorMessage = error.message
      formAction.value.formStatus = error.status
      return
    }

    // Add Success Message
    formAction.value.formSuccessMessage = 'Successfully Deleted Transation Type.'

    // Retrieve Data
    onLoadItems(tableOptions.value)
  } catch (err) {
    formAction.value.formProcess = false
    formAction.value.formErrorMessage = 'Error deleting Transaction Type: ' + err.message
  }
}


// Load Tables Data
const onLoadItems = async ({ page, itemsPerPage, sortBy }) => {
  // Trigger Loading
  tableOptions.value.isLoading = true

  try {
    await tblStore.getToTTable({ page, itemsPerPage, sortBy })
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
        class="my-custom-table"
        v-model:items-per-page="tableOptions.itemsPerPage"
        v-model:page="tableOptions.page"
        v-model:sort-by="tableOptions.sortBy"
        :loading="tableOptions.isLoading"
        :headers="tableHeaders"
        :items="ToTTable"
        :items-length="ToTTotal"
        
        @update:options="onLoadItems"
      >
        <template #top>
          <v-row dense>
            <v-spacer></v-spacer>
           
            <v-col cols="10" md="3">
              <v-btn
                class="my-1"
                prepend-icon="mdi-office-building-plus"
                color="red-darken-4"
                block
                @click="onAdd"
              >
                Add Transaction Type
              </v-btn>
            </v-col>
          </v-row>

          <v-divider class="my-5"></v-divider>
        </template>

        <template #item.transaction_type="{ item }">
          <span class="font-weight-bold">{{ item.transaction_type }}</span>
        </template>

        <template #item.prescribed_period="{ item }">
          <span>
            {{ item.prescribed_period || 'No IPCR Prescribed Period' }}
          </span>
        </template>
        
        <template #item.pp_spcr="{ item }">
          <span>
            {{ item.pp_spcr || 'No SPCR Prescribed Period' }}
          </span>
        </template>
        <template #item.pp_dpcr="{ item }">
          <span>
            {{ item.pp_dpcr || 'No DPCR Prescribed Period' }}
          </span>
        </template>
        <template #item.pp_opcr="{ item }">
          <span>
            {{ item.pp_opcr || 'No OPCR Prescribed Period' }}
          </span>
        </template>
        <template #item.actions="{ item }">
          <div class="d-flex align-center justify-center">
            <v-btn variant="text" density="comfortable" @click="onUpdate(item)" icon>
              <v-icon icon="mdi-pencil"></v-icon>
              <v-tooltip activator="parent" location="top">Edit Agency</v-tooltip>
            </v-btn>

            <v-btn variant="text" density="comfortable" @click="onDelete(item.top_id)" icon>
              <v-icon icon="mdi-trash-can" color="red-darken-4"></v-icon>
              <v-tooltip activator="parent" location="top">Delete Agency</v-tooltip>
            </v-btn>
          </div>
        </template>
      </v-data-table-server>
    </v-col>
  </v-row>
  <AddFormDialog
    v-model:is-dialog-visible="isDialogVisible"
    :item-data="itemData"
    :table-options="tableOptions"
  ></AddFormDialog>

  <ConfirmDialog
    v-model:is-dialog-visible="isConfirmDeleteDialog"
    title="Confirm Delete"
    text="Are you sure you want to delete this agency?"
    @confirm="onConfirmDelete"
  ></ConfirmDialog>
</template>
