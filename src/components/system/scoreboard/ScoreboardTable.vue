<script setup>
import { useScoreboardStore } from '@/stores/scoreboard';
import { useDate } from 'vuetify'
import { scoreboardTableHeaders } from "@/components/system/scoreboard/scoreboardTableUtils"
import { ref } from 'vue';
const date = useDate()
const scoreboardStore = useScoreboardStore()
const tableOptions = ref({
    page: 1,
    itemsPerPage: 10,
    sortBy: [],
    isLoading: false
})

const onLoadItems = async ({ page, itemsPerPage, sortBy }) => {


    tableOptions.value.isLoading = true

    //load the items here by calling the api
    await scoreboardStore.getScoreboardPaginated({ currentPage: page, perPage: itemsPerPage, column: "" })

    tableOptions.value.isLoading = false
}
</script>

<template>
    <v-data-table-server v-model:items-per-page="tableOptions.itemsPerPage" v-model:page="tableOptions.page"
        v-model:sort-by="tableOptions.sortBy" :loading="tableOptions.isLoading" :headers="scoreboardTableHeaders"
        :items="scoreboardStore.scoreboardTable" :items-length="scoreboardStore.scoreboardTotal" :hover="true"
        @update:options="onLoadItems">
        <template #top>
            <v-row dense>
                <v-spacer></v-spacer>

                <v-col cols="12" md="3">
                    <v-btn class="my-1" prepend-icon="mdi-account-plus" color="red-darken-4" block
                        @click="() => { console.log('Will navigate to scoreboard form') }">
                        Add Scoreboard Record
                    </v-btn>
                </v-col>
            </v-row>
            <v-divider class="my-5"></v-divider>
        </template>

        <template #header.pap="{ column: { title } }">
            <span class="font-weight-bold w-75 ">
                {{ title }}
            </span>
        </template>
        <template #header.ipar="{ column: { title } }">
            <span class="font-weight-bold w-75 text-h5 mx-4">
                {{ title }}
            </span>
        </template><template #header.particulars="{ column: { title } }">
            <span class="font-weight-bold w-75 text-h5">
                {{ title }}
            </span>
        </template>
        <template #header.asst_dc_sr_bms="{ column: { title } }">
            <span class="font-weight-bold w-75 text-h5">
                {{ title }}
            </span>
        </template>

        <template #header.opar="{ column: { title } }">
            <span class="font-weight-bold w-75 text-h5">
                {{ title }}
            </span>
        </template>
        <template #header.dpar="{ column: { title } }">
            <span class="font-weight-bold w-75 text-h5">
                {{ title }}
            </span>
        </template>
        <template #item.date_time_received="{ item }">
            <span class="font-weight-bold ">
                {{ date.format(item.date_time_received, 'fullDateTime') }}
            </span>
        </template>
        <template #item.date_time_forwarded_ipar="{ item }">
            <span class="font-weight-bold ">
                {{ date.format(item.date_time_forwarded_ipar, 'fullDateTime') }}
            </span>
        </template>
        <template #item.date_time_forwarded_bms="{ item }">
            <span class="font-weight-bold">
                {{ date.format(item.date_time_forwarded_bms, 'fullDateTime') }}
            </span>
        </template>
        <template #item.date_time_forwarded_dpar="{ item }">
            <span class="font-weight-bold">
                {{ date.format(item.date_time_forwarded_dpar, 'fullDateTime') }}
            </span>
        </template>
        <template #item.date_time_forwarded_opar="{ item }">
            <span class="font-weight-bold">
                {{ date.format(item.date_time_forwarded_opar, 'fullDateTime') }}
            </span>
        </template>
    </v-data-table-server>
</template>
