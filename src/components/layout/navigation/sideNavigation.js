// 👉 Main Navigation; Title, Icon
export const mainNav = [
  ['User Management', 'mdi-account-box-multiple'],
  ['Accomplishments', 'mdi-account'],
  ['Reporting', 'mdi-file-chart']
]

// 👉 Sub Navigations; Title, Icon, Subtitle, Redirect Path
export const menuItemsNav1 = [
  ['User Roles', 'mdi-tag-multiple', '', '/manage/user/roles'],
  ['Users Management', 'mdi-account-multiple', '', '/manage/users'],
  ['Agency Name', 'mdi-office-building-cog', '', '/manage/agencies']
]
export const menuItemsNav2 = [
  ['Scoreboard', 'mdi-developer-board', 'Monitoring Scoreboard', '/scoreboard'],
  ['Individual Performance Accomplishment', 'mdi-list-box', 'Accomplishment Report Form', '/ipcr'],
  ['Division Performance Accomplishment', 'mdi-list-box', 'Accomplishment Report Form', '/dpcr'],
  ['Office Performance Accomplishment', 'mdi-list-box', 'Accomplishment Report Form', '/opcr']
]
export const menuItemsNav3 = [
  ['Individual Performance', 'mdi-account', 'Contract & Rating', '/report/ipcr'],
  ['Division Performance', 'mdi-domain', 'Contract & Rating', '/report/dpcr'],
  ['Office Performance', 'mdi-office-building', 'Contract & Rating', '/report/opcr']
]
