import LoginView from '@/views/auth/LoginView.vue'
import DashboardView from '@/views/system/DashboardView.vue'
import ForbiddenView from '@/views/errors/ForbiddenView.vue'
import NotFoundView from '@/views/errors/NotFoundView.vue'
import AccountSettingsView from '@/views/system/AccountSettingsView.vue'
import UserRolesView from '@/views/system/manage-users/UserRolesView.vue'
import UsersView from '@/views/system/manage-users/UsersView.vue'
import AgenciesView from '@/views/system/manage-agencies/AgenciesView.vue'
import AddScoreBoardRecordView from '@/views/system/accomplishments/AddScoreBoardRecordView.vue'
import AddScoreBoardIndividualView from '@/views/system/accomplishments/AddScoreboardIndividualView.vue'
import AddScoreBoardSuperovisorView from '@/views/system/accomplishments/AddScoreboardSupervisorView.vue'
import AddScoreBoardDivisionView from '@/views/system/accomplishments/AddScoreboardDivision.vue'
import AddScoreBoardReleasingView from '@/views/system/accomplishments/AddScoreboardReleasing.vue'
import AddScoreBoardReleasingFAD from '@/views/system/accomplishments/AddScoreboardReleasingFAD.vue'
import AddScoreBoardFAD from '@/views/system/accomplishments/AddScoreboardFAD.vue'
import ScoreboardView from '@/views/system/accomplishments/ScoreboardView.vue'
import ScoreboardMonitoringView from '@/views/system/accomplishments/ScoreboardMonitoringView.vue'
import AddScoreBoardFadInternalView from '@/views/system/accomplishments/AddScoreBoardFadInternalView.vue'
import AddScoreBoardFadExternalView from '@/views/system/accomplishments/AddScoreboardFadExternalView.vue'
import AddScoreBoardFadCitizenCharterView from '@/views/system/accomplishments/AddScoreBoardFadCitizenCharterView.vue'
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
    path: '/add-scoreboard-individual',
    name: 'add-scoreboard-individual',
    component: AddScoreBoardIndividualView,
    meta: { requiresAuth: true }
  },
  {
    path: '/add-scoreboard-supervisor',
    name: 'add-scoreboard-supervisor',
    component: AddScoreBoardSuperovisorView,
    meta: { requiresAuth: true }
  },
  {
    path: '/add-scoreboard-division',
    name: 'add-scoreboard-division',
    component: AddScoreBoardDivisionView,
    meta: { requiresAuth: true }
  },
  {
    path: '/add-scoreboard-releasing',
    name: 'add-scoreboard-releasing',
    component: AddScoreBoardReleasingView,
    meta: { requiresAuth: true }
  },
   {
    path: '/add-scoreboard-releasing-fad',
    name: 'add-scoreboard-releasing-FAD',
    component: AddScoreBoardReleasingFAD,
    meta: { requiresAuth: true }
  },
  {
    path: '/add-scoreboard-fad-internal',
    name: 'add-scoreboard-fad-internal',
    component: AddScoreBoardFadInternalView,
    meta: { requiresAuth: true }
  },
   {
    path: '/add-scoreboard-fad-external',
    name: 'add-scoreboard-fad-external',
    component: AddScoreBoardFadExternalView,
    meta: { requiresAuth: true }
  },
  {
    path: '/add-scoreboard-fad-citizen-charter',
    name: 'add-scoreboard-fad-citizen-charter',
    component: AddScoreBoardFadCitizenCharterView,
    meta: { requiresAuth: true }
  },
  {
    path: '/add-scoreboard-fad',
    name: 'add-scoreboard-fad',
    component: AddScoreBoardFAD,
    meta: { requiresAuth: true }
  },
  {
    path: '/scoreboard',
    name: 'scoreboard',
    component: ScoreboardView,
    meta: { requiresAuth: true }
  },
  {
    path: '/scoreboard-monitoring',
    name: 'scoreboard-monitoring',
    component: ScoreboardMonitoringView,
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
