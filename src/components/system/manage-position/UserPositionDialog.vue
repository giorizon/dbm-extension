<script setup>
import { ref, watch, computed, onMounted } from 'vue'
import { requiredValidator} from '@/utils/validators'
import { formActionDefault } from '@/utils/supabase.js'
import { usedbStore } from '@/stores/position'
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

const positionlist = ref([])
const userlist = ref([])

// Pinia store
const dbStore = usedbStore()
// Default form values
const formDataDefault = {
  id: null,
  pup_id: null,
  user_id: null,
  pos_id: null
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
        pup_id: newData.pup_id,     
        user_id: newData.user_id,
        pos_id: newData.pos_id
      }
    } else {
      formData.value = {
        id: null,
        pup_id: null,
        user_id: null,
        pos_id: null
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
      .eq('user_role', 'FAD')
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
const fetchPosition = async () => {
  try {
    const { data, error } = await supabase.from('position').select('id, name')

    if (error) {
      console.error('Error fetching division:', error)
      return
    }

    positionlist.value = data.map((TechDiv) => ({
      id: TechDiv.id,
      name: TechDiv.name
    }))

    console.log('position data:', data)
    console.log('position error:', error)
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

  if (!formData.value.pos_id) {
    formAction.value.formErrorMessage = 'Positions is required'
    formAction.value.formProcess = false
    return
  }
  formAction.value = { ...formActionDefault, formProcess: true }

  const DivData = {
    id: formData.value.pup_id,
    user_id: formData.value.user_id,
    pos_id: formData.value.pos_id
  }
  try {
    const response = isUpdate.value
      ? await dbStore.updateUserPosition(DivData, props.tableOptions)
      : await dbStore.addUserPosition(DivData, props.tableOptions)

    if (response?.error) throw new Error(response.error.message)

    formAction.value.formSuccessMessage = isUpdate.value
      ? 'Position and Personnel successfully updated.'
      : 'Successfully assigned user a Position.'

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

  await onSubmit()
}
// Form Reset
const onFormReset = () => {
  formData.value = { ...formDataDefault }
  formAction.value = { ...formActionDefault }
  dialogVisible.value = false
}
onMounted(() => {
  fetchPosition()
  fetchUser()
})

</script>

<template>
  <v-dialog max-width="800" v-model="dialogVisible" persistent>
    <v-card prepend-icon="mdi-office-building-cog" title="Assign Positon to Personnel">
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
                label="Personnel"
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
                label="Position"
                :items="positionlist"
                item-title="name"
                item-value="id"
                outlined
                v-model="formData.pos_id"
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
            {{ isUpdate ? 'Update Position' : 'Assign Personnel' }}
          </v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
</template>
