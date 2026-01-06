<script setup>
const props = defineProps({
  modelValue: Boolean
})
const emit = defineEmits(['update:modelValue'])
</script>

<template>
  <v-dialog :model-value="props.modelValue" width="600">
    <v-card>
      <v-card-text class="text-center py-8">
        <v-icon color="success" icon="mdi-check-circle-outline" size="128" />
        <div class="text-h4 font-weight-bold">Form has been submitted</div>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn
          color="red-darken-4"
          variant="elevated"
          @click="emit('update:modelValue', false)"
        >
          Close
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
