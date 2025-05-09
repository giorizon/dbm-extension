<script setup>
import { ref, onMounted } from 'vue'
import { requiredValidator } from '@/utils/validators'
import { supabase } from '@/utils/supabase'

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
    alert('❌ Please provide both agency name and staff selection!')
    return
  }

  try {
    // Insert into the agencies table
    const { data, error } = await supabase.from('agencies').insert([
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
</script>

<template>
  <v-card>
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
          v-model="formData.particulars.staffID"
          :rules="[requiredValidator]"
        />
      </v-col>
    </v-row>

    <v-row dense>
      <v-spacer></v-spacer>
      <v-btn class="mr-4 mb-6 pt-2" type="submit" color="red-darken-4" @click="submitForm">
        Submit Form
      </v-btn>
    </v-row>
  </v-card>
</template>
