<script setup>
import { ref, watch, computed, onMounted } from 'vue'
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

const divisionlist = ref([])
const userlist = ref([])

// Pinia store
const dbStore = usedbStore()
// Default form values
const formDataDefault = {
  id: null,
  user_id: null,
  td_id: null
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
        id: newData.id,         
        user_id: newData.user_id,
        td_id: newData.td_id
      }
    } else {
      formData.value = {
        id: null,
        user_id: null,
        td_id: null
      }
    }
  },
  { immediate: true }
)
//Fetch User names
const fetchUser = async () => {
  try {
    const { data, error } = await supabase
      .from('view_user_division')
      .select('user_id, firstname, middlename, lastname, user_role')
      .neq('user_role', 'FAD')
      .neq('user_role', 'Administrator')
      .order('firstname', { ascending: true })

    if (error) {
      console.error('Error fetching user', error)
      return
    }
    userlist.value = data.map(user => {
      const fullname = [
        user.firstname,
        user.middlename,
        user.lastname
      ]
        .filter(Boolean)      
        .join(' ')          
      return {
        id: user.user_id,
        firstname: user.firstname,
        middlename: user.middlename,
        lastname: user.lastname,
        name: fullname
      }
    })
  } catch (err) {
    console.error('Unexpected error fetching user:', err)
  }
}

//Fetch Division
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

    console.log('division data:', data)
    console.log('division error:', error)
  } catch (err) {
    console.error('Unexpected error fetching division:', err)
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
  if (!formData.value.user_id) {
    formAction.value.formErrorMessage = 'Username is required.'
    formAction.value.formProcess = false
    return
  }

  if (!formData.value.td_id) {
    formAction.value.formErrorMessage = 'Division is required'
    formAction.value.formProcess = false
    return
  }
  formAction.value = { ...formActionDefault, formProcess: true }

  const DivData = {
    id: formData.value.id,
    user_id: formData.value.user_id,
    td_id: formData.value.td_id
  }
  try {
    const response = isUpdate.value
      ? await dbStore.updateDivision(DivData)
      : await dbStore.addUserDivision(DivData, props.tableOptions)

    if (response?.error) throw new Error(response.error.message)

    formAction.value.formSuccessMessage = isUpdate.value
      ? 'Division successfully updated.'
      : 'Successfully assigned user a division.'

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
    alert("Here");
  const { valid } = await refVForm.value?.validate()
  if (!valid) return

  await onSubmit()
}
// Form Reset
const onFormReset = () => {
  formData.value = { ...formDataDefault }
  formAction.value = { ...formActionDefault }
  dialogVisible.value = false
}
onMounted(() => {
  fetchDivision()
  fetchUser()
})

</script>

<template>
  <v-dialog max-width="800" v-model="dialogVisible" persistent>
    <v-card prepend-icon="mdi-office-building-cog" title="Assign user to a Division">
      <AlertNotification
        :form-success-message="formAction.formSuccessMessage"
        :form-error-message="formAction.formErrorMessage"
      />

      <v-form ref="refVForm" @submit.prevent="onFormSubmit">
        <v-card-text>
          <v-row class="pa-4">
            <!-- Type of transaction-->
            <v-col>
               <v-select
                label="User"
                :items="userlist"
                item-title="name"  
                item-value="id"
                outlined
                v-model="formData.user_id"
                :rules="[requiredValidator]"
                />
            </v-col>
            <v-col>
              <v-select
                label="Division"
                :items="divisionlist"
                item-title="name"
                item-value="id"
                outlined
                v-model="formData.td_id"
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
            {{ isUpdate ? 'Update Division' : 'Assign User' }}
          </v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
</template>
