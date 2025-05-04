<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { requiredValidator, agencyNameValidator } from '@/utils/validators'
import { formActionDefault } from '@/utils/supabase.js'
import { useAgenciesStore } from '@/stores/agencies'
import { supabase } from '@/utils/supabase'
import AlertNotification from '@/components/common/AlertNotification.vue'

// Props and emit
const props = defineProps({
  isDialogVisible: Boolean,
  itemData: Object,
  tableOptions: {
    type: Object,
    default: () => ({
      page: 1, // Start at page 1
      itemsPerPage: 10 // Show 10 items per page by default
    })
  }
})

const emit = defineEmits(['update:isDialogVisible'])

// Pinia store
const agenciesStore = useAgenciesStore()

// Default form values
const formDataDefault = {
  agencyName: '',
  particulars: {
    staffID: null
  }
}
const formData = ref({ ...formDataDefault })
const formAction = ref({ ...formActionDefault })
const refVForm = ref()
const staffList = ref([])

// Watch for itemData changes
watch(
  () => props.itemData,
  (newData) => {
    if (newData) {
      formData.value = {
        agencyName: newData.agency_name || '',
        particulars: { staffID: newData.user_id || null }
      }
    } else {
      formData.value = { ...formDataDefault }
    }
  },
  { immediate: true }
)

// Fetch staff from Supabase
const fetchStaff = async () => {
  if (staffList.value.length) return // Prevent fetching if staff list already populated

  try {
    const { data, error } = await supabase.from('user_profiles').select('id, firstname, lastname')
    if (error) throw new Error(error.message)

    staffList.value = data.map((user) => ({
      id: user.id,
      name: [user.lastname, user.firstname].filter(Boolean).join(', ') || 'No Name'
    }))
  } catch (err) {
    formAction.value.formErrorMessage = `Error fetching staff: ${err.message}`
  }
}

onMounted(() => fetchStaff())

// Computed for handling form state
const isUpdate = computed(() => Boolean(props.itemData))

// Computed for controlling dialog visibility
const dialogVisible = computed({
  get: () => props.isDialogVisible,
  set: (val) => emit('update:isDialogVisible', val)
})

// Submit Functionality
const onSubmit = async () => {
  if (!formData.value.particulars.staffID) {
    formAction.value.formErrorMessage = 'Staff ID is required.'
    formAction.value.formProcess = false
    return
  }

  if (!formData.value.agencyName) {
    formAction.value.formErrorMessage = 'Agency name is required.'
    formAction.value.formProcess = false
    return
  }

  formAction.value = { ...formActionDefault, formProcess: true }

  const agencyData = {
    id: props.itemData?.id, // Include ID only if updating
    agency_name: formData.value.agencyName,
    user_id: formData.value.particulars.staffID
  }

  try {
    const response = isUpdate.value
      ? await agenciesStore.updateAgency(agencyData)
      : await agenciesStore.addAgency(agencyData, props.tableOptions) // Pass tableOptions here

    if (response?.error) throw new Error(response.error.message)

    formAction.value.formSuccessMessage = isUpdate.value
      ? 'Agency successfully updated.'
      : 'Agency successfully added.'

    setTimeout(() => {
      onFormReset()
      dialogVisible.value = false // Close the dialog after success
    }, 2500)
  } catch (err) {
    formAction.value.formErrorMessage = err.message
  } finally {
    formAction.value.formProcess = false
  }
}

// Trigger Validators
const onFormSubmit = async () => {
  const { valid } = await refVForm.value?.validate()
  if (!valid) return

  // Manually run agencyNameValidator
  const agencyNameValidation = await agencyNameValidator(formData.value.agencyName)
  if (agencyNameValidation !== true) {
    formAction.value.formErrorMessage = agencyNameValidation
    return
  }

  await onSubmit()
}

// Form Reset
const onFormReset = () => {
  formData.value = { ...formDataDefault }
  formAction.value = { ...formActionDefault }
  dialogVisible.value = false // Close the dialog when resetting the form
}
</script>

<template>
  <v-dialog max-width="800" v-model="dialogVisible" persistent>
    <v-card prepend-icon="mdi-office-building-cog" title="Agency Information">
      <AlertNotification
        :form-success-message="formAction.formSuccessMessage"
        :form-error-message="formAction.formErrorMessage"
      />

      <v-form ref="refVForm" @submit.prevent="onFormSubmit">
        <v-card-text>
          <v-row class="pa-4">
            <!-- Agency Name -->
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
          >
            {{ isUpdate ? 'Update Agency' : 'Add Agency' }}
          </v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
</template>
