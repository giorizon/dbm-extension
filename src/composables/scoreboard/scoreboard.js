import { ref, computed } from 'vue'
import { formActionDefault } from '@/utils/supabase.js'
import { useScoreboardStore } from '@/stores/scoreboard'
import { onMounted } from 'vue'
//fetching functionality for scoreboard related data
export const useScoreboardForm = () => {
  const scoreboardStore = useScoreboardStore()
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
    cssSubmissionDate: '',
    downtime: '',
    typeDowntime:''
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
    formAction.value.formProcess = true;
  
    refVForm.value?.validate().then(async ({ valid }) => {
      alert("Hello");
      if (valid) {
        // Insert the new scoreboard data first
       /* const { error } = await scoreboardStore.insertScoreboardData({
          ...formData.value,
          particulars: { ...formData.value.particulars },
          reportsData: [...formData.value.reportsData]
        });
  
        if (error) {
          formAction.value.formErrorMessage = error;
          formAction.value.formProcess = false;
          return;
        } */
  
        // **Update the status of the scoreboard to "accepted"**
        const { error: updateError } = await supabase
          .from('scoreboard_technical')
          .update({ status: 'accepted' })
          .eq('scoreboard_id', formData.value.scoreboardId);
  
        if (updateError) {
          formAction.value.formErrorMessage = updateError.message;
          formAction.value.formProcess = false;
          return;
        }
  
        // Success handling
        formAction.value.formProcess = false;
        formAction.value.formSuccessMessage = 'Record has been successfully inserted and status updated';
        isSuccess.value = true;
        refVForm.value?.reset();
      } else {
        formAction.value.formProcess = false;
      }
    });
  };

  return {
    handleFormSubmit,
    handleDialogFormSubmit,
    formData,
    formAction,
    isSuccess,
    refVForm
  }
}
export const useScoreboardData = (formData) => {
  const scoreboardStore = useScoreboardStore()
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
      await scoreboardStore.fetchScoreboardOptions()
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
