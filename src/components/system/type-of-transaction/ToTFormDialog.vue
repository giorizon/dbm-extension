<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { requiredValidator, TransactionTypeValidator } from '@/utils/validators'
import { formActionDefault } from '@/utils/supabase.js'
import { useAgenciesStore } from '@/stores/agencies'
import { useToTStore } from '@/stores/typeoftransaction'
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
const dbStore = useToTStore()
const downtimeList = ref([])
// Default form values
const formDataDefault = {
  top_id: null,
  transaction_type: '',
  prescribed_period: '',
  pp_spcr: '',
  pp_dpcr: '',
  pp_opcr: '',
  downtime_type: ''
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
        top_id: newData.top_id,
        transaction_type: newData.transaction_type,
        prescribed_period: newData.prescribed_period,
        pp_spcr: newData.pp_spcr,
        pp_dpcr: newData.pp_dpcr,
        pp_opcr: newData.pp_opcr,
        downtime_type: newData.downtime_type
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
    const { data, error } = await supabase.from('type_of_downtime').select('id, name')

    if (error) {
      console.error('Error fetching downtime type:', error)
      return
    }

    downtimeList.value = data.map((dtype) => ({
      id: dtype.id,
      name: dtype.name
    }))
  } catch (err) {
    console.error('Unexpected error fetching staff:', err)
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
  if (!formData.value.transaction_type) {
    formAction.value.formErrorMessage = 'Type of Transaction is required.'
    formAction.value.formProcess = false
    return
  }

  if (!formData.value.prescribed_period) {
    formAction.value.formErrorMessage = 'IPCR Prescribed Period name is required.'
    formAction.value.formProcess = false
    return
  }
  if (!formData.value.pp_spcr) {
    formAction.value.formErrorMessage = 'SPCR Prescribed Period name is required.'
    formAction.value.formProcess = false
    return
  }
  if (!formData.value.pp_dpcr) {
    formAction.value.formErrorMessage = 'DPCR Prescribed Period name is required.'
    formAction.value.formProcess = false
    return
  }
  if (!formData.value.pp_opcr) {
    formAction.value.formErrorMessage = 'OPCR Prescribed Period name is required.'
    formAction.value.formProcess = false
    return
  }
  if (!formData.value.downtime_type) {
    formAction.value.formErrorMessage = 'Type of Downtime is required.'
    formAction.value.formProcess = false
    return
  }
  formAction.value = { ...formActionDefault, formProcess: true }

  const ToTData = {
    top_id: formData.value.top_id,
    transaction_type: formData.value.transaction_type,
    prescribed_period: formData.value.prescribed_period,
    pp_spcr: formData.value.pp_spcr,
    pp_dpcr: formData.value.pp_dpcr,
    pp_opcr: formData.value.pp_spcr,
    downtime_type: formData.value.downtime_type
  }
  try {
    const response = isUpdate.value
      ? await dbStore.updateTransactionType(ToTData)
      : await dbStore.addTransactionType(ToTData, props.tableOptions)

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
    const formValidation = await TransactionTypeValidator(formData.value.transaction_type)
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
                label="Type of Transaction"
                outlined
                clearable
                v-model="formData.transaction_type"
                :rules="[requiredValidator]"
              />
            </v-col>
          </v-row>
          <v-row>
           
             <p><span style="padding-left: 10px; font-weight: bold;">Prescribed Period</span></p>
          </v-row>
          <v-row>
              <v-col>
              <v-text-field
                label="IPCR"
                outlined
                clearable
                v-model="formData.prescribed_period"
                :rules="[requiredValidator]"
              />
            </v-col>

            <!-- Assign to Dropdown -->
            <v-col>
              <v-text-field
                label="SPCR"
                outlined
                clearable
                v-model="formData.pp_spcr"
                :rules="[requiredValidator]"
              />
            </v-col>
          </v-row>
          <v-row>
              <v-col>
              <v-text-field
                label="DPCR"
                outlined
                clearable
                v-model="formData.pp_dpcr"
                :rules="[requiredValidator]"
              />
            </v-col>

            <!-- Assign to Dropdown -->
            <v-col>
              <v-text-field
                label="OPCR"
                outlined
                clearable
                v-model="formData.pp_opcr"
                :rules="[requiredValidator]"
              />
            </v-col>
          </v-row>
          <v-row>
             <p><span style="padding-left: 10px; font-weight: bold;">Downtime Type</span></p>
          </v-row>
          <v-row>
            <v-col>
              <v-select
                label="Downtime"
                :items="downtimeList"
                item-title="name"
                item-value="id"
                outlined
                v-model="formData.downtime_type"
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
            {{ isUpdate ? 'Update Transaction Type' : 'Add Transaction Type' }}
          </v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
</template>
