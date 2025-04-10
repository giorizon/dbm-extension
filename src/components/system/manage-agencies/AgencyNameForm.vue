<script setup>
import { ref } from 'vue'
import { requiredValidator } from '@/utils/validators'

const agencyName = ref('')
const assignTo = ref('')
const staffList = ref([
  // Example staff list
  { id: 1, name: 'John Doe' },
  { id: 2, name: 'Jane Smith' }
])

const formData = ref({
  particulars: {
    staffID: null // Initialize with a default value
  }
})

const formAction = ref({
  formProcess: false
})
</script>

<template>
  <v-card>
    <v-row>
      <v-col>
        <v-text-field
          v-model="agencyName"
          label="Agency Name"
          outlined
          clearable
          :rules="[requiredValidator]"
        />
      </v-col>

      <v-col>
        <v-select
          label="Assign to"
          :items="staffList"
          item-title="name"
          item-value="id"
          outlined
          :rules="[requiredValidator]"
        />
      </v-col>
    </v-row>

    <v-row dense>
      <v-spacer></v-spacer>
      <v-btn
        class="mr-4 mb-6 pt-2"
        type="submit"
        color="red-darken-4"
        :loading="formAction.formProcess"
        :disabled="formAction.formProcess"
        :rules="[requiredValidator]"
      >
        Submit Form
      </v-btn>
    </v-row>
  </v-card>
</template>
