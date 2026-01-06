<script setup>
import { useUsersStore } from '@/stores/users'
import AlertNotification from '@/components/common/AlertNotification.vue'
import UsersFormDialog from './UsersFormDialog.vue'
import UserAssignDialog from './UserAssignDialog.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import { formActionDefault } from '@/utils/supabase'
import { tableHeaders } from './usersTableUtils'
import { supabase } from '@/utils/supabase'
import { useDate } from 'vuetify'
import { ref } from 'vue'

// Utilize pre-defined vue functions
const date = useDate()

// Use Pinia Store
const usersStore = useUsersStore()
const onAssigned = ({ message }) => {
  formAction.value.formSuccessMessage = message
}
const userFormData = ref(null)
const assignFormData = ref(null)
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
  const { id, email, phone, user_metadata } = item

  itemData.value = { id, email, phone, ...user_metadata }
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
  // Reset Form Action utils
  formAction.value = { ...formActionDefault, formProcess: true }

  const { error } = await usersStore.deleteUser(deleteId.value)

  // Turn off processing
  formAction.value.formProcess = false

  if (error) {
    // Add Error Message and Status Code
    formAction.value.formErrorMessage = error.message
    formAction.value.formStatus = error.status

    return
  }

  // Add Success Message
  formAction.value.formSuccessMessage = 'Successfully Deleted User.'

  // Retrieve Data
  onLoadItems(tableOptions.value)
}

// Assign User
const assignDiv = async (item) => {
  try {
    const userId = item.id

    const { data, error } = await supabase
      .from('technical_division_user')
      .select('td_id')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      console.error('Error fetching division:', error)
      return
    }

    assignFormData.value = {
      user_id: userId,
      td_id: data?.td_id ?? null
    }

    isDialogVisible2.value = true
  } catch (err) {
    console.error('Unexpected error:', err)
  }
}
// Load Tables Data
const onLoadItems = async ({ page, itemsPerPage, sortBy }) => {
  // Trigger Loading
  tableOptions.value.isLoading = true

  await usersStore.getUsersTable({ page, itemsPerPage, sortBy })

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
        :items="usersStore.usersTable" :items-length="usersStore.usersTotal" @update:options="onLoadItems">
        <template #top>
          <v-row dense>
            <v-spacer></v-spacer>

            <v-col cols="12" md="3">
              <v-btn class="my-1" prepend-icon="mdi-account-plus" color="red-darken-4" block @click="onAdd">
                Add User
              </v-btn>
            </v-col>
          </v-row>

          <v-divider class="my-5"></v-divider>
        </template>

        <template #item.lastname="{ item }">
          <span class="font-weight-bold">
            {{ item.user_metadata.lastname }}, {{ item.user_metadata.firstname }}
          </span>
        </template>

        <template #item.phone="{ item }">
          {{ item.user_metadata.phone }}
        </template>

        <template #item.user_role="{ item }">
          {{ item.user_metadata.user_role }}
        </template>

        <template #item.created_at="{ item }">
          <span class="font-weight-bold">
            {{ date.format(item.created_at, 'fullDateTime') }}
          </span>
        </template>

        <template #item.actions="{ item }">
          <div class="d-flex align-center justify-center">
            <v-btn variant="text" density="comfortable" @click="onUpdate(item)" icon>
              <v-icon icon="mdi-pencil"></v-icon>
              <v-tooltip activator="parent" location="top">Edit User</v-tooltip>
            </v-btn>
            <v-btn variant="text" density="comfortable" @click="assignDiv(item)" icon>
              <v-icon icon="mdi-clipboard-account"></v-icon>
              <v-tooltip activator="parent" location="top">Assign Division</v-tooltip>
            </v-btn> 
            <v-btn variant="text" density="comfortable" :disabled="item.user_metadata.is_admin"
              @click="onDelete(item.id)" icon>
              <v-icon icon="mdi-trash-can" color="red-darken-4"></v-icon>
              <v-tooltip activator="parent" location="top">Delete User</v-tooltip>
            </v-btn>
          </div>
        </template>
      </v-data-table-server>
    </v-col>
  </v-row>

<UsersFormDialog
  v-if="isDialogVisible"
  v-model:is-dialog-visible="isDialogVisible"
  :item-data="userFormData"
  :table-options="tableOptions"
/>

<UserAssignDialog
  v-show="isDialogVisible2"
  v-model:is-dialog-visible="isDialogVisible2"
  :item-data="assignFormData"
/>
  <ConfirmDialog v-model:is-dialog-visible="isConfirmDeleteDialog" title="Confirm Delete"
    text="Are you sure you want to delete user?" @confirm="onConfirmDelete"></ConfirmDialog>
</template>
