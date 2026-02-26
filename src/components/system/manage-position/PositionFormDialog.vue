<script setup>
import { ref, watch, computed } from 'vue'
import { requiredValidator, PositionValidator } from '@/utils/validators'
import { formActionDefault } from '@/utils/supabase.js'
import { usedbStore } from '@/stores/position'
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
const PositionStore = usedbStore()

// Default form values
const formDataDefault = {
  positionName: '',
}
const formData = ref({ ...formDataDefault })
const formAction = ref({ ...formActionDefault })
const refVForm = ref()

// Computed for handling form state
const isUpdate = computed(() => Boolean(props.itemData))

const dialogVisible = computed({
  get: () => props.isDialogVisible,
  set: (val) => emit('update:isDialogVisible', val)
})

// Submit Functionality
const onSubmit = async () => {

  if (!formData.value.positionName) {
    formAction.value.formErrorMessage = 'Position name is required.'
    formAction.value.formProcess = false
    return
  }

  formAction.value = { ...formActionDefault, formProcess: true }

const positionData = {
  id: props.itemData?.id,
  positionName: formData.value.positionName
}

  try {
    const response = isUpdate.value
      ? await PositionStore.updatePosition(positionData)
      : await PositionStore.addPosition(positionData, props.tableOptions)

    if (response?.error) throw new Error(response.error.message)

    formAction.value.formSuccessMessage = isUpdate.value
      ? 'Position successfully updated.'
      : 'Position successfully added.'

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

  // Manually run PositionValidator
  const positionNameValidation = await PositionValidator(formData.value.positionName)
  if (positionNameValidation !== true) {
    formAction.value.formErrorMessage = positionNameValidation
    return
  }

  await onSubmit()
}
watch(
  () => props.itemData,
  (val) => {
    if (val) {
      formData.value.positionName = val.positionName
    } else {
      formData.value = { ...formDataDefault }
    }
  },
  { immediate: true }
)

// Form Reset
const onFormReset = () => {
  formData.value = { ...formDataDefault }
  formAction.value = { ...formActionDefault }
  dialogVisible.value = false
}
</script>

<template>
  <v-dialog max-width="800" v-model="dialogVisible" persistent>
    <v-card prepend-icon="mdi-office-building-cog" title="Enter Position Name">
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
                label="Position"
                outlined
                clearable
                v-model="formData.positionName"
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
            {{ isUpdate ? 'Update Position' : 'Add Position' }}
          </v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
</template>
