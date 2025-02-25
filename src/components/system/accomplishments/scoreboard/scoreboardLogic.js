import { ref, onMounted } from 'vue'
import { format } from 'date-fns'
import supabase from './supabase'
import { useScoreboardData, useScoreboardForm } from '@/composables/scoreboard/scoreboard'
import { requiredValidator } from '@/utils/validators'

export function useScoreboardLogic() {
  const { handleDialogFormSubmit, handleFormSubmit, formData, formAction, isSuccess, refVForm } = useScoreboardForm()
  const { options, prescribedPeriodValues } = useScoreboardData(formData)

  // Time Picker
  const selectedTime = ref(format(new Date(), 'HH:mm'))
  const timeDialog = ref(false)

  const type_of_transaction = ref([])
  const nature_of_transaction = ref([])
  
  // Fetch Type of Transactions from Supabase
  const fetchTypeOfTransaction = async () => {
    try {
      const { data, error } = await supabase.from('type_of_transactions').select('top_id, transaction_type')
      if (error) {
        console.error('Error fetching Type of Transaction:', error)
        return
      }
      type_of_transaction.value = data.map(item => ({
        title: item.transaction_type,
        value: item.top_id
      }))
    } catch (err) {
      console.error('Unexpected error fetching Type of Transaction:', err)
    }
  }

  // Fetch Nature of Transaction
  const fetchNatureOfTransaction = async () => {
    try {
      const { data, error } = await supabase.from('nature_of_transaction').select('noq_id, noq_name')
      if (error) {
        console.error('Error fetching Nature of Transaction:', error)
        return
      }
      nature_of_transaction.value = data.map(item => ({
        title: item.noq_name,
        value: item.noq_id
      }))
    } catch (err) {
      console.error('Unexpected error fetching Nature of Transaction:', err)
    }
  }

  const papData = ref("")

  // Fetch PAP Data
  const fetchPAP = async (natureId) => {
    try {
      const { data: notPapData, error: notPapError } = await supabase
        .from('not_pap')
        .select('pap_id')
        .eq('not_id', natureId)

      if (notPapError) {
        console.error('Error fetching not_pap:', notPapError)
        return
      }

      if (notPapData.length === 0) {
        papData.value = ""
        return
      }

      const papIds = notPapData.map(item => item.pap_id)

      const { data: papInfo, error: papError } = await supabase
        .from('pap')
        .select('code, description')
        .in('id', papIds)

      if (papError) {
        console.error('Error fetching PAP data:', papError)
        return
      }

      if (papInfo.length > 0) {
        papData.value = `${papInfo[0].code} - ${papInfo[0].description}`
      }
    } catch (err) {
      console.error('Unexpected error fetching PAP:', err)
    }
  }

  onMounted(() => {
    fetchTypeOfTransaction()
    fetchNatureOfTransaction()
  })

  return {
    handleDialogFormSubmit,
    handleFormSubmit,
    formData,
    formAction,
    isSuccess,
    refVForm,
    options,
    prescribedPeriodValues,
    selectedTime,
    timeDialog,
    type_of_transaction,
    nature_of_transaction,
    fetchPAP,
    papData,
    requiredValidator
  }
}