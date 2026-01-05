<script setup>
import { storeToRefs } from 'pinia'
import { ref } from 'vue'
import '@/assets/css/adminPage.css'
import { useStore } from '@/stores/natureoftransaction'
import AlertNotification from '@/components/common/AlertNotification.vue'
import AddFormDialog from './NoTFormDialog.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import { formActionDefault } from '@/utils/supabase'
import { tableHeaders } from './NoTTableUtils'
import { useDate } from 'vuetify'

// Utilize pre-defined vue functions
const date = useDate()

// Use Pinia Store for Agencies
const tblStore = useStore()
const deleteId = ref('')
// ADD THIS: Destructure state variables safely
const { NoTTable, NoTTotal } = storeToRefs(tblStore)

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
  const { noq_id, noq_name, pap_id} = data

  itemData.value = {  noq_id, noq_name, pap_id}
  isDialogVisible.value = true
}
//for search input
let searchTimer = null
const debounce = (callback, delay) => {
  if (searchTimer) {
    clearTimeout(searchTimer)
  }
  searchTimer = setTimeout(callback, delay)
}
const onSearch = () => {
    // Reset to page 1 when searching
    tableOptions.value.page = 1
    // Debounce the actual data loading
    debounce(() => {
        onLoadItems(tableOptions.value)
    }, 500) // Adjust delay as needed (e.g., 500ms)
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
    const { error } = await tblStore.deleteTransactionNature(deleteId.value)

    // Turn off processing
    formAction.value.formProcess = false
    if (error) {
      // Add Error Message and Status Code
      formAction.value.formErrorMessage = error.message
      formAction.value.formStatus = error.status
      return
    }
    // Add Success Message
    formAction.value.formSuccessMessage = 'Successfully Archived Transation Nature.'

    // Retrieve Data
    onLoadItems(tableOptions.value)
  } catch (err) {
    formAction.value.formProcess = false
    formAction.value.formErrorMessage = 'Error deleting Transaction Type: ' + err.message
  }
}

const onLoadItems = async ({ page, itemsPerPage, sortBy, search }) => {
  // Trigger Loading
  tableOptions.value.isLoading = true

  try {
    await tblStore.getNoTTable({ page, itemsPerPage, sortBy, search })
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
        :items="NoTTable"
        :items-length="NoTTotal"
        
        @update:options="onLoadItems"
      >
        <template #top>
          <v-row dense>
             <v-col cols="12" md="4">
              <v-text-field
                v-model="tableOptions.search"
                label="Search…"
                prepend-inner-icon="mdi-magnify"
                clearable
                variant="outlined"
                density="compact"
                @input="onSearch"
              />
            </v-col>
            <v-spacer></v-spacer>
           
            <v-col cols="10" md="3">
              <v-btn
                class="my-1"
                prepend-icon="mdi-office-building-plus"
                color="red-darken-4"
                block
                @click="onAdd"
              >
                Add Transaction Nature
              </v-btn>
            </v-col>
          </v-row>

          <v-divider class="my-5"></v-divider>
        </template>

        <template #item.noq_name="{ item }">
          <span class="font-weight-bold">{{ item.noq_name }}</span>
        </template>

        <template #item.pap_id="{ item }">
          <span>
            {{ item.pap_id|| 'No PAP' }}
          </span>
        </template>
        
        <template #item.description="{ item }">
          <span>
            {{ item.description || 'No SPCR Prescribed Period' }}
          </span>
        </template>
        <template #item.actions="{ item }">
          <div class="d-flex align-center justify-center">
            <v-btn variant="text" density="comfortable" @click="onUpdate(item)" icon>
              <v-icon icon="mdi-pencil"></v-icon>
              <v-tooltip activator="parent" location="top">Edit Agency</v-tooltip>
            </v-btn>

            <v-btn variant="text" density="comfortable" @click="onDelete(item.noq_id)" icon>
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
