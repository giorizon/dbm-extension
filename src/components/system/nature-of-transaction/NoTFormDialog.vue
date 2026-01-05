<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { requiredValidator, TransactionTypeValidator } from '@/utils/validators'
import { formActionDefault } from '@/utils/supabase.js'
import { useStore } from '@/stores/natureoftransaction'
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
const dbStore = useStore()
const papList = ref([])
// Default form values
const formDataDefault = {
  noq_id: null,
  noq_name: '',
  prescribed_period: '',
  pp_spcr: '',
  pp_dpcr: '',
  pp_opcr: '',
  pap_id: ''
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
        noq_id: newData.noq_id,
        noq_name: newData.noq_name,
        pap_id: newData.pap_id
      }
    } else {
      formData.value = { ...formDataDefault }
    }
  },
  { immediate: true }
)
//Fetch Downtime type
// ✅ Fetch Staff from Supabase
const fetchDowntimeType = async () => {
  try {
    const { data, error } = await supabase.from('pap').select('id, description')

    if (error) {
      console.error('Error fetching PAP:', error)
      return
    }

    papList.value = data.map((pap_des) => ({
      id: pap_des.id,
      name: pap_des.description
    }))
  } catch (err) {
    console.error('Unexpected error fetching PAP:', err)
  }
}
// Computed for handling form state
const isUpdate = computed(() => Boolean(props.itemData))

const dialogVisible = computed({
  get: () => props.isDialogVisible,
  set: (val) => emit('update:isDialogVisible', val)
})

// Submit Functionality
const onSubmit = async () => {
  if (!formData.value.noq_name) {
    formAction.value.formErrorMessage = 'Type of Transaction is required.'
    formAction.value.formProcess = false
    return
  }

  if (!formData.value.pap_id) {
    formAction.value.formErrorMessage = 'PAP is required'
    formAction.value.formProcess = false
    return
  }
  formAction.value = { ...formActionDefault, formProcess: true }

  const NoTData = {
    noq_id: formData.value.noq_id,
    noq_name: formData.value.noq_name,
    pap_id: formData.value.pap_id
  }
  try {
    const response = isUpdate.value
      ? await dbStore.updateTransactionNature(NoTData)
      : await dbStore.addTransactionNature(NoTData, props.tableOptions)

    if (response?.error) throw new Error(response.error.message)

    formAction.value.formSuccessMessage = isUpdate.value
      ? 'Transaction Type successfully updated.'
      : 'Transaction Type successfully added.'

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
    const formValidation = await TransactionTypeValidator(formData.value.noq_name)
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

onMounted(() => {
  fetchDowntimeType()
})

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
            <!-- Type of transaction-->
            <v-col>
              <v-text-field
                label="Nature of Transaction"
                outlined
                clearable
                v-model="formData.noq_name"
                :rules="[requiredValidator]"
              />
            </v-col>
          </v-row>
          <v-row>
            <!-- Assign to PAP list-->
            <v-col>
               <v-select
                label="Select P/A/P"
                :items="papList"
                item-title="name"
                item-value="id"
                outlined
                v-model="formData.pap_id"
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
            {{ isUpdate ? 'Update Transaction Nature' : 'Add Transaction Natur' }}
          </v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
</template>
