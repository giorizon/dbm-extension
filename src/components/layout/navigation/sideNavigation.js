// 👉 Main Navigation; Title, Icon
export const mainNav = [
  ['Monitoring  Scoreboard', 'mdi-account-box-multiple'],
  ['Accomplishments', 'mdi-account'],
  ['Report', 'mdi-file-chart'],
  ['Administrator Panel', 'mdi-cog'] 
]

// 👉 Sub Navigations; Title, Icon, Subtitle, Redirect Path
export const menuItemsNav1 = [
   ['Scoreboard Monitoring', 'mdi-developer-board', 'PMS Report', '/scoreboard-monitoring'],
   ['Monitoring tool 1', 'mdi-developer-board', 'LGU Budget Review', '/monitoring-tool-one'],
   ['Monitoring tool 2', 'mdi-developer-board', 'Requests for Budget Authorization and Variation', '/monitoring-tool-two'],
   ['Monitoring tool 3', 'mdi-developer-board', 'Agency Performance Review', '/monitoring-tool-three']
 // ['Agency Name', 'mdi-office-building-cog', '', '/manage/agencies']
]
export const menuItemsNav2 = [
  ['My DMS', 'mdi-note-edit', 'Add DMS | Update DMS', '/scoreboard'],
  ['DMS Tracker', 'mdi-file-search', 'Add DMS | Update DMS', '/track-scoreboard'],
]
export const menuItemsNav3 = [
  ['Audit Trail', 'mdi-list-box', 'Record Keeping and Logging', '/report/ipcr'],
]
export const menuItemsNav4 = [
  ['Agency Management', 'mdi-office-building', '', '/manage/agencies'],
  ['Division Management', 'mdi-account-multiple', '', '/manage/division'],
  ['Position', 'mdi-file-tree-outline', '', '/manage/position'],
  ['Transcation Type Management', 'mdi-shape-outline', '', '/manage/type-of-transaction'],
  ['Transcation Nature Management', 'mdi-clover-outline', '', '/manage/nature-of-transaction'],
  ['User Roles', 'mdi-tag-multiple', '', '/manage/user/roles'],
  ['Users Management', 'mdi-account-multiple', '', '/manage/users'],
]
