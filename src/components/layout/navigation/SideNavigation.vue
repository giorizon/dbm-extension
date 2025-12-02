<script setup>
import {
  mainNav,
  menuItemsNav1,
  menuItemsNav2,
  menuItemsNav3,
  menuItemsNav4,
} from './sideNavigation'
import { onMounted, ref, watch, computed } from 'vue'
import { useDisplay } from 'vuetify'
import { useAuthUserStore } from '@/stores/authUser'

// Props
const props = defineProps(['isDrawerVisible'])

// Vuetify helper
const { mobile } = useDisplay()

// Pinia store
const authStore = useAuthUserStore()

// Drawer visibility
const isDrawerVisible = ref(props.isDrawerVisible)
watch(
  () => props.isDrawerVisible,
  () => (isDrawerVisible.value = props.isDrawerVisible)
)

// Editable menu navigation items
const editableMenuItemsNav1 = ref([...menuItemsNav1])
const editableMenuItemsNav2 = ref([...menuItemsNav2])
const editableMenuItemsNav3 = ref([...menuItemsNav3])
const editableMenuItemsNav4 = ref([...menuItemsNav4])

const noAccessPages = ref([])

// ----------------------------------------------
// ✅ CHECK IF USER IS ADMIN OR SUPER ADMIN
// ----------------------------------------------
const isAdmin = computed(() => {
  const role = authStore.userRole?.toLowerCase()
  return ['administrator', 'super administrator'].includes(role)
})

// ----------------------------------------------
// ✅ FILTER PAGES BASED ON ACCESS
// ----------------------------------------------
const onFilterPages = () => {
  console.log('User Role:', authStore.userRole)

  // Super Admin → full access
  if (authStore.userRole === 'Super Administrator') return

  const menuItems = [
    { items: editableMenuItemsNav1, title: mainNav[0][0] },
    { items: editableMenuItemsNav2, title: mainNav[1][0] },
    { items: editableMenuItemsNav3, title: mainNav[2][0] },
    { items: editableMenuItemsNav4, title: mainNav[3][0] }, // ✔ Correct (Nav4)
  ]

  // Only keep pages user has permission for
  menuItems.forEach(({ items, title }) => {
    items.value = items.value.filter((item) =>
      authStore.authPages.includes(item[3])
    )

    if (items.value.length === 0) noAccessPages.value.push(title)
  })
}

// ----------------------------------------------
// ✅ FILTER NAVIGATION GROUPS
// ----------------------------------------------
const filteredMainNav = computed(() => {
  return isAdmin.value ? mainNav : mainNav.slice(0, 3)
})

// ----------------------------------------------
// ON MOUNT
// ----------------------------------------------
onMounted(() => {
  onFilterPages()
})
</script>

<template>
  <v-navigation-drawer
    v-model="isDrawerVisible"
    :temporary="mobile"
    :permanent="!mobile"
    theme="light"
    image="/images/nav-dbm-caraga.png"
    width="350"
  >
    <v-list density="compact" nav>
      <!-- Dashboard -->
      <v-list-item
        prepend-icon="mdi-view-dashboard"
        title="Dashboard"
        to="/dashboard"
      />

      <v-divider />

      <!-- Main Navigation Groups -->
      <v-list-group
        v-for="([title, icon], i) in filteredMainNav"
        :key="i"
      >
        <template #activator="{ props }">
          <v-list-item
            v-bind="props"
            :prepend-icon="icon"
            :title="title"
          />
        </template>

        <!-- Scoreboard -->
        <template v-if="title === mainNav[0][0]">
          <v-list-item
            v-for="([t, ic, sub, to], j) in editableMenuItemsNav1"
            :key="j"
            :prepend-icon="ic"
            :title="t"
            :subtitle="sub || undefined"
            :to="to"
          />
        </template>

        <!-- Accomplishments -->
        <template v-if="title === mainNav[1][0]">
          <v-list-item
            v-for="([t, ic, sub, to], j) in editableMenuItemsNav2"
            :key="j"
            :prepend-icon="ic"
            :title="t"
            :subtitle="sub || undefined"
            :to="to"
          />
        </template>

        <!-- Reports -->
        <template v-if="title === mainNav[2][0]">
          <v-list-item
            v-for="([t, ic, sub, to], j) in editableMenuItemsNav3"
            :key="j"
            :prepend-icon="ic"
            :title="t"
            :subtitle="sub || undefined"
            :to="to"
          />
        </template>

        <!-- Administrator Panel -->
        <template v-if="title === mainNav[3][0] && isAdmin">
          <v-list-item
            v-for="([t, ic, sub, to], j) in editableMenuItemsNav4"
            :key="j"
            :prepend-icon="ic"
            :title="t"
            :subtitle="sub || undefined"
            :to="to"
          />
        </template>
      </v-list-group>

      <v-divider />

      <!-- Account Settings -->
      <v-list-item
        prepend-icon="mdi-wrench"
        title="Account Settings"
        to="/account/settings"
      />
    </v-list>
  </v-navigation-drawer>
</template>
