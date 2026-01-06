<script setup>
import { useUserRolesStore } from '@/stores/userRoles'
import AlertNotification from '@/components/common/AlertNotification.vue'
import {  requiredValidator } from '@/utils/validators'
import { formActionDefault } from '@/utils/supabase.js'
import { supabase } from '@/utils/supabase'
import { onMounted, ref, watch } from 'vue'

const props = defineProps({
  isDialogVisible: {
    type: Boolean,
    required: true
  },
  itemData: {
    type: Object,
    required: true
  }
})

const formDataDefault = {
  user_id: null,
  td_id: null
}


const emit = defineEmits(['update:isDialogVisible', 'assigned'])

// Use Pinia Store
const userRolesStore = useUserRolesStore()
const divisionlist = ref([])
// Load Variables


const fetchDivision = async () => {
  try {
    const { data, error } = await supabase.from('technical_division').select('id, name, short_name')

    if (error) {
      console.error('Error fetching division:', error)
      return
    }

    divisionlist.value = data.map((TechDiv) => ({
      id: TechDiv.id,
      name: TechDiv.name
    }))
  } catch (err) { 
    console.error('Unexpected error fetching division:', err)
  }
}

const formData = ref({
  ...formDataDefault
})
const formAction = ref({
  ...formActionDefault
})
watch(
  () => [props.isDialogVisible, props.itemData],
  ([visible, itemData]) => {
    if (visible) {
      // Reset form alerts every time dialog opens
      formAction.value.formSuccessMessage = null
      formAction.value.formErrorMessage = null

      // Populate form data if itemData is provided
      if (itemData) {
        formData.value.user_id = itemData.user_id
        formData.value.td_id = itemData.td_id
      }
    }
  },
  { immediate: true }
)
const refVForm = ref()

// Submit Functionality
const onSubmit = async () => {
  formAction.value.formProcess = true
  formAction.value.formErrorMessage = null
  formAction.value.formSuccessMessage = null

  try {
    let response

    if (!props.itemData?.td_id) {
      response = await supabase
        .from('technical_division_user')
        .insert({
          user_id: formData.value.user_id,
          td_id: formData.value.td_id
        })
    } else {
      response = await supabase
        .from('technical_division_user')
        .update({
          td_id: formData.value.td_id
        })
        .eq('user_id', formData.value.user_id)
    }

    if (response.error) throw response.error

    formAction.value.formSuccessMessage =
      !props.itemData?.td_id
        ? 'Division assigned successfully.'
        : 'Division updated successfully.'

    // keep dialog open for 2 seconds to show the alert
    setTimeout(() => {
      emit('update:isDialogVisible', false)
    }, 3000)

  } catch (error) {
    formAction.value.formErrorMessage = error.message
  } finally {
    formAction.value.formProcess = false
  }
}
// Trigger Validators
const onFormSubmit = () => {
  refVForm.value?.validate().then(({ valid }) => {
    if (valid) onSubmit()
  })
}

// Form Reset
const onFormReset = () => {
  formAction.value = { ...formActionDefault }
  emit('update:isDialogVisible', false)
}

// Load Functions during component rendering
onMounted(async () => {
     await fetchDivision()
  if (userRolesStore.userRoles.length == 0) await userRolesStore.getUserRoles()
})
</script>

<template>
  <v-dialog max-width="400" :model-value="props.isDialogVisible" persistent>
    <v-card prepend-icon="mdi-account" title="User Information">
      <AlertNotification
        :form-success-message="formAction.formSuccessMessage"
        :form-error-message="formAction.formErrorMessage"
      ></AlertNotification>

      <v-form ref="refVForm" @submit.prevent="onFormSubmit">
        <v-card-text>
          <v-row>
            <v-col>
             <v-select
              label="Division"
              :items="divisionlist"
              item-title="name"
              item-value="id"
              v-model="formData.td_id"
              :rules="[requiredValidator]"
              persistent-hint
              hint="Current assigned division"
            />
            </v-col>
          </v-row>
        </v-card-text>

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
            Assign User
          </v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
</template>
