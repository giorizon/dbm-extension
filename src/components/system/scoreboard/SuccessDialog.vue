<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()
const props = defineProps(['isActive'])
const emit = defineEmits(['closeDialog'])

</script>
<template>
    <v-dialog :model-value="isActive" width="600">
        <v-card>
            <v-divider></v-divider>
            <v-card-text>
                <div class="text-center py-8">
                    <v-icon color="success" icon="mdi-check-circle-outline" size="128">
                    </v-icon>
                    <div class="text-h4 font-weight-bold">Form has been submitted</div>

                </div>
                <v-divider></v-divider>
                <v-card-actions class="mt-2">
                    <v-spacer></v-spacer>
                    <v-btn color="indigo-darken-2" variant="elevated"
                        @click="() => { router.replace('/scoreboard') }">View
                        Scoreboard</v-btn>
                    <v-btn color="red-darken-4" variant="elevated" @click="() => { emit('closeDialog') }">Close</v-btn>
                </v-card-actions>

            </v-card-text>
        </v-card>
    </v-dialog>
</template>
