import { useScoreboardStore } from '@/stores/scoreboard'
import { ref } from 'vue'
import { formActionDefault } from '@/utils/supabase'

export const useScoreboardTable = () => {
  const scoreboardStore = useScoreboardStore()
  const isDialogVisible = ref(false)
  const selectedScoreboardId = ref('')
  const formAction = ref({ ...formActionDefault })
  const tableOptions = ref({
    page: 1,
    itemsPerPage: 10,
    sortBy: [],
    isLoading: false
  })

  const onLoadItems = async ({ page, itemsPerPage }) => {
    tableOptions.value.isLoading = true

    //load the items here by calling the api
    await scoreboardStore.getScoreboardPaginated({
      currentPage: page,
      perPage: itemsPerPage,
      column: ''
    })

    tableOptions.value.isLoading = false
  }
  const onDelete = (scoreboardId) => {
    isDialogVisible.value = true
    selectedScoreboardId.value = scoreboardId
  }
  const onConfirmDelete = async () => {
    formAction.value.formProcess = true
    if (selectedScoreboardId.value === '') {
      formAction.value = {
        ...formActionDefault,
        formErrorMessage: 'Cannot delete without selecting a record',
        formProcess: false
      }
      return
    }
    const { error, message, status } = await scoreboardStore.deleteScoreboardRecord(
      selectedScoreboardId.value
    )
    if (error) {
      formAction.value = { formErrorMessage: error, formStatus: status, formProcess: false }
      return
    }

    formAction.value = { formSuccessMessage: message, formStatus: status, formProcess: false }

    onLoadItems(tableOptions.value)
  }
  return { onDelete, onConfirmDelete, onLoadItems, isDialogVisible, formAction, tableOptions }
}
