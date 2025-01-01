import { ref, computed } from 'vue'
import { formActionDefault } from '@/utils/supabase.js'
import { fetchScoreboardOptions } from './scoreboardApi'
import { insertScoreboardData } from './scoreboardApi'
import { onMounted } from 'vue'
//fetching functionality for scoreboard related data
export const useScoreboardForm = () => {
  const formDataDefault = {
    particulars: {
      pap: '',
      ts: '',
      agencyName: '',
      natureOfRequest: ''
    },
    dmsReferenceNumber: '',
    dateReceivedRecordSection: new Date(Date.now()),
    timeReceivedRecordSection: '',
    typeOfTransaction: '',
    reportsData: [],
    status: '',
    remarks: '',
    outputReleasedDocuments: '',
    cssSubmissionDate: ''
  }
  const isSuccess = ref(false)
  const formAction = ref({ ...formActionDefault })
  const formData = ref({
    ...formDataDefault
  })
  const refVForm = ref()

  //computes the prescribed period values for each report type
  const handleDialogFormSubmit = (formDialogData) => {
    //update if already exists
    const reportsData = formData.value.reportsData.filter(
      (reportData) => reportData.report.report_id !== formDialogData.report.report_id
    )
    formData.value.reportsData = [...reportsData, formDialogData]
  }

  const handleFormSubmit = async () => {
    formAction.value.formProcess = true

    //i have to manually unwraped the proxied nested objects in these ref (will ask for suggestions)
    const { error } = await insertScoreboardData({
      ...formData.value,
      particulars: { ...formData.value.particulars },
      reportsData: [...formData.value.reportsData]
    })
    if (error) {
      console.error('Error inserting data into scoreboard')
      formAction.value.formErrorMessage = error
    }

    formAction.value.formProcess = false
    isSuccess.value = true
    refVForm.value?.reset()
  }

  return {
    handleFormSubmit,
    handleDialogFormSubmit,
    formData,
    formAction,
    isSuccess
  }
}
export const useScoreboardData = (formData) => {
  const optionsDefault = {
    natureOfRequest: [],
    tsInCharge: [],
    pap: [],
    statuses: []
  }
  const options = ref({ ...optionsDefault })
  const typesOfTransaction = ref([])
  const fetchData = async () => {
    const [natureOfRequestData, tsInChargeData, papData, typeOfTransactionData, statuses] =
      await fetchScoreboardOptions()
    options.value = {
      natureOfRequest: natureOfRequestData,
      tsInCharge: tsInChargeData,
      pap: papData,
      statuses: statuses
    }
    typesOfTransaction.value = typeOfTransactionData
  }
  const prescribedPeriodValues = computed(() => {
    //iterate each reports and create prescribed value for each reports based on the selected type of transaction
    if (
      Array.isArray(typesOfTransaction.value) &&
      formData.value.typeOfTransaction?.length !== 0 &&
      formData.value.typeOfTransaction !== null
    ) {
      const prescribedPeriodsResult = typesOfTransaction.value.find(
        (transaction) => transaction.transaction_type === formData.value.typeOfTransaction
      ).prescribed_periods
      return prescribedPeriodsResult
    }
    return []
  })
  onMounted(async () => {
    await fetchData()
  })
  return {
    options,
    prescribedPeriodValues,
    typesOfTransaction
  }
}
