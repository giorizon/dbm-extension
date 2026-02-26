<script setup>
const props = defineProps({
  modelValue: Boolean,
  message: String
})
const emit = defineEmits(['update:modelValue'])
</script>

<template>
  <v-dialog :model-value="modelValue" width="600">
    <v-card>
      <v-card-text class="text-center py-8">
        <v-icon color="red" icon="mdi-alert-circle-outline" size="120" />
        <div class="text-h5 font-weight-bold">Delete Failed</div>
        <div class="text-body-1 mt-3">{{ message }}</div> 
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
