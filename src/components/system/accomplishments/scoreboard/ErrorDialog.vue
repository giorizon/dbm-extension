<script setup>
const props = defineProps(['isOpen', 'errorMessage'])
const emit = defineEmits(['onClose'])
</script>

<template>
  <v-dialog :model-value="props.isOpen" width="600">
    <v-card>
      <v-divider></v-divider>
      <v-card-text>
        <div class="text-center py-8">
          <v-icon color="red-darken-1" icon="mdi-alert-circle-outline" size="128"> </v-icon>
          <div class="text-h4 font-weight-bold">Something went wrong</div>
        </div>
        <v-divider></v-divider>
        <v-card-actions class="mt-2">
          <v-spacer></v-spacer>
          <v-btn color="red-darken-4" variant="elevated" @click="() => {
            emit('onClose')
          }">Close</v-btn>
        </v-card-actions>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
