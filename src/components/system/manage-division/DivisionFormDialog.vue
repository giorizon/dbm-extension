<script setup>
import { ref, watch, computed } from 'vue'
import { requiredValidator, TransactionTypeValidator } from '@/utils/validators'
import { formActionDefault } from '@/utils/supabase.js'
import { usedbStore } from '@/stores/division'
import { supabase } from '@/utils/supabase'
import AlertNotification from '@/components/common/AlertNotification.vue'

// Props and emit
const props = defineProps({
  isDialogVisible: Boolean,
  itemData: Object,
  tableOptions: {
    type: Object,
    default: () => ({
      page: 1,
      itemsPerPage: 10
    })
  }
})

const emit = defineEmits(['update:isDialogVisible'])

// Pinia store
const dbStore = usedbStore()
// Default form values
const formDataDefault = {
  id: null,
  name: '',
  short_name: ''
}
const formData = ref({ ...formDataDefault })
const formAction = ref({ ...formActionDefault })
const refVForm = ref()

// Watch for itemData changes
watch(
  () => props.itemData,
  (newData) => {
    if (newData) {
      formData.value = {
        id: newData.id,          // ✅ KEEP ID
        name: newData.name,
        short_name: newData.short_name
      }
    } else {
      formData.value = {
        id: null,
        name: '',
        short_name: ''
      }
    }
  },
  { immediate: true }
)
//Fetch Downtime type

// Computed for handling form state
const isUpdate = computed(() => Boolean(props.itemData))

const dialogVisible = computed({
  get: () => props.isDialogVisible,
  set: (val) => emit('update:isDialogVisible', val)
})

// Submit Functionality
const onSubmit = async () => {
  if (!formData.value.name) {
    formAction.value.formErrorMessage = 'Division is required.'
    formAction.value.formProcess = false
    return
  }

  if (!formData.value.short_name) {
    formAction.value.formErrorMessage = 'Short Name is required'
    formAction.value.formProcess = false
    return
  }
  formAction.value = { ...formActionDefault, formProcess: true }

  const DivData = {
    id: formData.value.id,
    name: formData.value.name,
    short_name: formData.value.short_name
  }
  try {
    const response = isUpdate.value
      ? await dbStore.updateDivision(DivData)
      : await dbStore.addDivision(DivData, props.tableOptions)

    if (response?.error) throw new Error(response.error.message)

    formAction.value.formSuccessMessage = isUpdate.value
      ? 'Division successfully updated.'
      : 'New division successfully added.'

    setTimeout(() => {
      onFormReset()
      dialogVisible.value = false
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

  // 👉 Only validate uniqueness when ADDING
  if (!isUpdate.value) {
    const formValidation = await TransactionTypeValidator(formData.value.name)
    if (formValidation !== true) {
      formAction.value.formErrorMessage = formValidation
      return
    }
  }

  await onSubmit()
}
// Form Reset
const onFormReset = () => {
  formData.value = { ...formDataDefault }
  formAction.value = { ...formActionDefault }
  dialogVisible.value = false
}
</script>

<template>
  <v-dialog max-width="800" v-model="dialogVisible" persistent>
    <v-card prepend-icon="mdi-office-building-cog" title="Division Information">
      <AlertNotification
        :form-success-message="formAction.formSuccessMessage"
        :form-error-message="formAction.formErrorMessage"
      />

      <v-form ref="refVForm" @submit.prevent="onFormSubmit">
        <v-card-text>
          <v-row class="pa-4">
            <!-- Type of transaction-->
            <v-col>
              <v-text-field
                label="Division Name"
                outlined
                clearable
                v-model="formData.name"
                :rules="[requiredValidator]"
              />
            </v-col>
            <v-col>
              <v-text-field
                label="Shaort Name (For reporting)"
                outlined
                clearable
                v-model="formData.short_name"
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
            {{ isUpdate ? 'Update Division' : 'Add Division' }}
          </v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
</template>
