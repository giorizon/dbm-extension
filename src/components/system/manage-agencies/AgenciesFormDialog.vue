<script setup>
import { requiredValidator } from '@/utils/validators'
import { formActionDefault } from '@/utils/supabase.js'
import { useAgenciesStore } from '@/stores/agencies'
import AlertNotification from '@/components/common/AlertNotification.vue'
import { supabase } from '@/utils/supabase'
import { ref, onMounted } from 'vue'

const props = defineProps(['isDialogVisible', 'itemData', 'tableOptions'])
const emit = defineEmits(['update:isDialogVisible'])

const formAction = ref({
  ...formActionDefault
})
const formData = ref({
  agencyName: '',
  particulars: {
    staffID: null
  }
})

const staffList = ref([])

// Use Pinia store for agencies
const agenciesStore = useAgenciesStore()

// Fetch Staff from Supabase
const fetchStaff = async () => {
  try {
    const { data, error } = await supabase.from('user_profiles').select('id, firstname, lastname')

    if (error) {
      throw new Error(error.message)
    }

    staffList.value = data.map((user) => ({
      id: user.id,
      name: `${user.lastname || ''}, ${user.firstname || ''}`.trim() || 'No Name'
    }))
  } catch (err) {
    formAction.value.formErrorMessage = `Error fetching staff: ${err.message}`
  }
}

// Load existing data for editing if itemData exists
onMounted(() => {
  fetchStaff()
  if (props.itemData) {
    formData.value.agencyName = props.itemData.agency_name
    formData.value.particulars.staffID = props.itemData.user_id
  }
})

const submitForm = async () => {
  if (!formData.value.agencyName || !formData.value.particulars.staffID) {
    formAction.value.formErrorMessage = '❌ Please provide both agency name and assigned staff!'
    return
  }

  try {
    const agencyData = {
      agency_name: formData.value.agencyName,
      user_id: formData.value.particulars.staffID
    }

    let result

    if (props.itemData) {
      // Update existing agency
      result = await agenciesStore.updateAgency({ ...agencyData, id: props.itemData.id })
    } else {
      // Insert new agency
      result = await agenciesStore.addAgency(agencyData)
    }

    if (result && result.error) {
      formAction.value.formErrorMessage = `Error: ${result.error.message}`
    } else {
      formAction.value.formSuccessMessage = '✅ Agency successfully saved!'
      await agenciesStore.getAgenciesTable(props.tableOptions)

      // Reset form and close dialog after a delay
      setTimeout(() => {
        onFormReset()
      }, 2500)
    }
  } catch (err) {
    formAction.value.formErrorMessage = `Unexpected error occurred: ${err.message}`
  }
}

const onFormReset = () => {
  formAction.value = { ...formActionDefault }
  emit('update:isDialogVisible', false)
}
</script>

<template>
  <v-dialog max-width="800" :model-value="props.isDialogVisible" persistent>
    <v-card prepend-icon="mdi-office-building-cog" title="Agency Information">
      <AlertNotification
        :form-success-message="formAction.formSuccessMessage"
        :form-error-message="formAction.formErrorMessage"
      ></AlertNotification>

      <v-card-text>
        <v-row class="pa-4">
          <!-- Agency Name as Text Input -->
          <v-col>
            <v-text-field
              label="Agency Name"
              outlined
              clearable
              v-model="formData.agencyName"
              :rules="[requiredValidator]"
            />
          </v-col>

          <!-- Assign to Dropdown -->
          <v-col>
            <v-select
              label="Assign to"
              :items="staffList"
              item-title="name"
              item-value="id"
              outlined
              clearable
              v-model="formData.particulars.staffID"
              :rules="[requiredValidator]"
            />
          </v-col>
        </v-row>
      </v-card-text>
      <v-divider></v-divider>

      <v-card-actions class="pa-4">
        <v-spacer></v-spacer>
        <v-btn text="Close" variant="plain" prepend-icon="mdi-close" @click="onFormReset"></v-btn>

        <v-btn
          prepend-icon="mdi-pencil"
          color="red-darken-4"
          type="submit"
          variant="elevated"
          :disabled="formAction.formProcess"
          :loading="formAction.formProcess"
          @click="submitForm"
        >
          {{ props.itemData ? 'Update Agency' : 'Add Agency' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
