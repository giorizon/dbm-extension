import { ref, computed } from 'vue'
import { formActionDefault } from '@/utils/supabase.js'
import { useScoreboardStore } from '@/stores/scoreboard'
import { supabase } from '@/utils/supabase.js'
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
    formAction.value.formProcess = true;
  
    refVForm.value?.validate().then(async ({ valid }) => {
      if (valid) {
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
