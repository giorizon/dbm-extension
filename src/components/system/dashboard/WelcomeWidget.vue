
<script setup>
//import { useAuthUserStore } from '@/stores/authUser'
import { useDisplay } from 'vuetify'
import '@/assets/dashboard.css'
import { useAuthUserStore } from '@/stores/authUser'
import receiving_dashboard from '@/components/system/dashboard/ReceivingWelcome.vue'
import technical_dashboard from '@/components/system/dashboard/TechnicalWelcome.vue'
import supervisor_dashboard from '@/components/system/dashboard/SupervisorWelcome.vue'
import division_dashboard from '@/components/system/dashboard/DivisionWelcome.vue'
import releasing_dashboard from '@/components/system/dashboard/ReleasingWelcome.vue'
import admin_dashboard from '@/components/system/dashboard/AdminWelcome.vue'
import fad_dashboard from '@/components/system/dashboard/FadWelcome.vue'
import { computed } from 'vue'
// Use Pinia Store
const authStore = useAuthUserStore()

// Utilize pre-defined vue functions
const { mobile } = useDisplay()

// Get user role
const userRole = computed(() => authStore.userRole)

const SelectedForm = computed(() => {
  if (userRole.value === 'Technical') {
    return technical_dashboard;
  } else if (userRole.value === 'Administrator') {
    return admin_dashboard;
  } else if (
    userRole.value === 'Supervising BMS' ||
    userRole.value === 'Senior BMS' ) 
  {
    return supervisor_dashboard;
  }  else if (userRole.value === 'FAD') {
    return fad_dashboard;
  }  else if (userRole.value === 'Division Chief') {
    return division_dashboard;
  }  else if (userRole.value === 'Releasing Data') {
    return releasing_dashboard;
  }else {
    return receiving_dashboard;
  }
});

</script>

<template>
  <v-card>
    <v-card-text>
      <v-row>
        <v-col cols="12" md="4">
          <v-img class="mx-auto" src="/images/logo-dbm.png" :width="mobile ? '80%' : '40%'"></v-img>
        </v-col>

        <v-col cols="12" md="8">
          <h2 class="mb-5">
            Welcome Aboard,
            <span class="font-weight-black">
              {{ authStore.userData.firstname + ' ' + authStore.userData.lastname }}!
            </span>
          </h2>
          <p class="text-justify">
            Welcome to the DBM HRPMS System! Lorem ipsum dolor, sit amet consectetur adipisicing
            elit. Rem minima quam nobis. Rem quibusdam, laudantium veniam aliquid repudiandae
            temporibus, cupiditate eos officiis dolorem suscipit repellendus doloribus ipsum iste
            placeat odit!
          </p>
        </v-col>
      </v-row>
    </v-card-text>
    <hr>
    <component :is="SelectedForm" />
  </v-card>
</template>
