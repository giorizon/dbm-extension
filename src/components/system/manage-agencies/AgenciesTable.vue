<script setup>
import { ref } from 'vue'

// Reactive state
const isDialogVisible = ref(false)
const itemData = ref(null)

// Trigger Add Btn
const onAdd = () => {
  itemData.value = null
  isDialogVisible.value = true
}
</script>

<template>
  <v-row justify="end">
    <v-col cols="12" md="3">
      <v-btn
        class="my-1"
        prepend-icon="mdi-office-building-plus"
        color="red-darken-4"
        block
        @click="onAdd"
      >
        Add Agency
      </v-btn>
    </v-col>
  </v-row>

  <UsersFormDialog v-model:is-dialog-visible="isDialogVisible" :item-data="itemData" />
</template>
