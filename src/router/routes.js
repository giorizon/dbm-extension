import LoginView from '@/views/auth/LoginView.vue'
import DashboardView from '@/views/system/DashboardView.vue'
import ForbiddenView from '@/views/errors/ForbiddenView.vue'
import NotFoundView from '@/views/errors/NotFoundView.vue'
import AccountSettingsView from '@/views/system/AccountSettingsView.vue'
import UserRolesView from '@/views/system/manage-users/UserRolesView.vue'
import UsersView from '@/views/system/manage-users/UsersView.vue'
import AgenciesView from '@/views/system/manage-agencies/AgenciesView.vue'
import AddScoreBoardRecordView from '@/views/system/accomplishments/AddScoreBoardRecordView.vue'
import ScoreboardView from '@/views/system/accomplishments/ScoreboardView.vue'

// 👉 Routes
export const routes = [
  // Auth Pages
  {
    path: '/',
    name: 'home'
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { requiresAuth: false }
  },

  // System Pages
  {
    path: '/dashboard',
    name: 'dashboard',
    component: DashboardView,
    meta: { requiresAuth: true, isDefault: true }
  },
  {
    path: '/account/settings',
    name: 'account-settings',
    component: AccountSettingsView,
    meta: { requiresAuth: true, isDefault: true }
  },
  {
    path: '/add-scoreboard',
    name: 'add-scoreboard',
    component: AddScoreBoardRecordView,
    meta: { requiresAuth: true }
  },
  {
    path: '/scoreboard',
    name: 'scoreboard',
    component: ScoreboardView,
    meta: { requiresAuth: true }
  },

  // Admin Pages
  {
    path: '/manage/user/roles',
    name: 'manage-user-roles',
    component: UserRolesView,
    meta: { requiresAuth: true }
  },
  {
    path: '/manage/users',
    name: 'manage-users',
    component: UsersView,
    meta: { requiresAuth: true }
  },
  {
    path: '/manage/agencies',
    name: 'manage-agencies',
    component: AgenciesView,
    meta: { requiresAuth: true }
  },

  // Errors Pages
  {
    path: '/forbidden',
    name: 'forbidden',
    component: ForbiddenView,
    meta: { isDefault: true }
  },
  {
    path: '/:catchAll(.*)',
    name: 'not-found',
    component: NotFoundView,
    meta: { isDefault: true }
  }
]
