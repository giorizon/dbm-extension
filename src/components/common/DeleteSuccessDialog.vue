<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: Boolean
})

const emit = defineEmits(['update:modelValue', 'after-close'])

// v-model proxy
const dialog = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const closeDialog = () => {
  dialog.value = false
  emit('after-close')
}
</script>

<template>
  <v-dialog v-model="dialog" width="600">
    <v-card>
      <v-card-text class="text-center py-8">
        <v-icon color="success" icon="mdi-check-circle-outline" size="128" />
        <div class="text-h4 font-weight-bold">
          Scoreboard Successfully Deleted
        </div>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn color="red-darken-4" variant="elevated" @click="closeDialog">
          Close Now
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
