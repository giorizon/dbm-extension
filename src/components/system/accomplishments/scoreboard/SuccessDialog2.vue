<script setup>
import { watch } from 'vue'

const props = defineProps({
  modelValue: Boolean
})

const emit = defineEmits(['update:modelValue', 'closed'])

watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    setTimeout(() => {
      emit('update:modelValue', false)
      emit('closed') // 🔥 tell parent dialog is done
    }, 2000)
  }
})
</script>

<template>
  <v-dialog :model-value="props.modelValue" width="600" persistent>
    <v-card>
      <v-card-text class="text-center py-8">
        <v-icon color="success" icon="mdi-check-circle-outline" size="128" />
        <div class="text-h4 font-weight-bold">Form has been submitted</div>
        <div class="text-subtitle-1 mt-2">Redirecting to dashboard...</div>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn
          color="red-darken-4"
          variant="elevated"
          @click="emit('update:modelValue', false); emit('closed')"
        >
          Close Now
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
