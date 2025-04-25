<script setup>
import { ref, onMounted } from 'vue'
import { requiredValidator } from '@/utils/validators'
import { supabase } from '@/utils/supabase'

const props = defineProps(['isDialogVisible', 'itemData', 'tableOptions'])

const emit = defineEmits(['update:isDialogVisible'])

const formData = ref({
  agencyName: '',
  particulars: {
    staffID: null
  }
})

const staffList = ref([])

// ✅ Fetch Staff from Supabase
const fetchStaff = async () => {
  try {
    const { data, error } = await supabase.from('user_profiles').select('id, firstname, lastname')

    if (error) {
      console.error('Error fetching staff:', error)
      return
    }

    staffList.value = data.map((user) => ({
      id: user.id,
      name: `${user.lastname || ''}, ${user.firstname || ''}`.trim() || 'No Name'
    }))
  } catch (err) {
    console.error('Unexpected error fetching staff:', err)
  }
}

onMounted(() => {
  fetchStaff()
})

const submitForm = async () => {
  if (!formData.value.agencyName || !formData.value.particulars.staffID) {
    alert('❌ Please provide both agency name and assigned staff!')
    return
  }

  try {
    // Insert into the agency table
    const { data, error } = await supabase.from('agency').insert([
      {
        agency_name: formData.value.agencyName, // Save the agency name
        user_id: formData.value.particulars.staffID // Save the selected staff ID
      }
    ])

    if (error) {
      console.error('🚨 Error inserting data into agencies:', error.message)
      alert('❌ Failed to save data! Error: ' + error.message)
      return
    }

    alert('✅ Agency successfully saved!')
  } catch (err) {
    console.error('Unexpected error:', err)
    alert('❌ Unexpected error occurred while saving to the database.')
  }
}
// Form Reset
const onFormReset = () => {
  emit('update:isDialogVisible', false)
}
</script>

<template>
  <v-dialog max-width="800" :model-value="props.isDialogVisible" persistent>
    <v-card prepend-icon="mdi-office-building-cog" title="Agency Information">
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

        <v-btn class="mr-4 mb-6 py-2" type="submit" color="red-darken-4" @click="submitForm">
          Submit Form
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
