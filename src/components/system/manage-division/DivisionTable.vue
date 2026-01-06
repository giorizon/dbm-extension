<script setup>
import { usedbStore } from '@/stores/division'
import AlertNotification from '@/components/common/AlertNotification.vue'
import FormDialog from './DivisionFormDialog.vue'
import FormDialog2 from './UserDivisionDialog.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import { formActionDefault } from '@/utils/supabase'
import { tableHeaders } from './divisionTableUtils'
import { onMounted } from 'vue'
import { ref } from 'vue'

// Use Pinia Store
const divisionStore = usedbStore()

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
  const { td_id, name, short_name } = item
  itemData.value = {
    id: td_id,   // ✅ map td_id → id
    name,
    short_name
  }
  isDialogVisible.value = true
}

// Trigger Add Btn
const onAdd = () => {
  itemData.value = null
  isDialogVisible.value = true
}


// Trigger Assign user to a division
const assignUser = () => {
  itemData.value = null
  isDialogVisible2.value = true
}
// Trigger Delete Btn
const onDelete = (id) => {
  alert(id);
  deleteId.value = id
  isConfirmDeleteDialog.value = true
}

// Confirm Delete
const onConfirmDelete = async () => {
  // Reset Form Action utils
  formAction.value = { ...formActionDefault, formProcess: true }

  const { error } = await divisionStore.deleteDivision(deleteId.value)

  // Turn off processing
  formAction.value.formProcess = false

  if (error) {
    // Add Error Message and Status Code
    formAction.value.formErrorMessage = error.message
    formAction.value.formStatus = error.status

    return
  }

  // Add Success Message
  formAction.value.formSuccessMessage = 'Successfully Deleted Division.'

  // Retrieve Data
  onLoadItems(tableOptions.value)
}


onMounted(() => {
  onLoadItems(tableOptions.value)
})

// Load Tables Data
const onLoadItems = async ({ page, itemsPerPage, sortBy }) => {
  // Trigger Loading
  tableOptions.value.isLoading = true

  await divisionStore.getDivisionTable({ page, itemsPerPage, sortBy })

  // Trigger Loading
  tableOptions.value.isLoading = false
}
</script>

<template>
  <AlertNotification :form-success-message="formAction.formSuccessMessage"
    :form-error-message="formAction.formErrorMessage"></AlertNotification>

  <v-row>
    <v-col cols="12">
      <!-- eslint-disable vue/valid-v-slot -->
      <v-data-table-server v-model:items-per-page="tableOptions.itemsPerPage" v-model:page="tableOptions.page"
        v-model:sort-by="tableOptions.sortBy" :loading="tableOptions.isLoading" :headers="tableHeaders"
       :items="divisionStore.divisionTable" :items-length="divisionStore.divisionTotal" @update:options="onLoadItems">
        <template #top>
          <v-row dense>
            <v-spacer></v-spacer>
             <v-col cols="12" md="3">
                <v-btn class="my-1" prepend-icon="mdi-plus" color="blue-darken-4" block @click="assignUser">
                Assign User to Division
              </v-btn>
            </v-col>
            <v-col cols="12" md="3">
              <v-btn class="my-1" prepend-icon="mdi-plus" color="red-darken-4" block @click="onAdd">
                Create new Division
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
        <template #item.name="{ item }">
          <span class="font-weight-bold">
            {{ item.name }}
          </span>
        </template>

        <template #item.short_name="{ item }">
          {{ item.short_name }}
        </template>

        <template #item.division_chief="{ item }">
          {{ item.division_chief }}
        </template>
        <template #item.actions="{ item }">
          <div class="d-flex align-center justify-center">
            <v-btn variant="text" density="comfortable" @click="onUpdate(item)" icon>
              <v-icon icon="mdi-pencil"></v-icon>
              <v-tooltip activator="parent" location="top">Edit Division</v-tooltip>
            </v-btn>
            <v-btn variant="text" density="comfortable"
              @click="onDelete(item.td_id)" icon>
              <v-icon icon="mdi-trash-can" color="red-darken-4"></v-icon>
              <v-tooltip activator="parent" location="top">Delete Division</v-tooltip>
            </v-btn>
          </div>
        </template>
      </v-data-table-server>
    </v-col>
  </v-row>

  <FormDialog v-model:is-dialog-visible="isDialogVisible" :item-data="itemData" :table-options="tableOptions">
  </FormDialog>
    <FormDialog2 v-model:is-dialog-visible="isDialogVisible2" :item-data="itemData" :table-options="tableOptions">
  </FormDialog2>

  <ConfirmDialog v-model:is-dialog-visible="isConfirmDeleteDialog" title="Confirm Delete"
    text="Are you sure you want to delete this Division?" @confirm="onConfirmDelete"></ConfirmDialog>
</template>
