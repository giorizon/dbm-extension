import { ref, onMounted } from 'vue'
import supabase from './supabase'

import { useScoreboardData, useScoreboardForm } from '@/composables/scoreboard/scoreboard'
import { requiredValidator } from '@/utils/validators'

export function useScoreboardLogic() {
 const { handleDialogFormSubmit, handleFormSubmit, formData, formAction, isSuccess, refVForm } = useScoreboardForm()
  const { options, prescribedPeriodValues } = useScoreboardData(formData)

  
  const type_of_transaction = ref([])
  const userUUID = ref(null)
  const userDivisionId = ref(null)
  const nature_of_transaction = ref([])
  
const assignableUsers = ref([]);
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

const typeOfDowntime = ref(null)

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
  const fetchToTDowntime = async (totId) => {
    console.log("type of transaction id:", totId)
    try {
      const { data: viewData, error: viewError } = await supabase
        .from('view_tot_downtime')
        .select('downtime_id')
        .eq('type_id', totId)  // ✅ fixed here

      if (viewError) {
        console.error('❌ Error fetching downtime_id:', viewError)
        return
      }

      if (!viewData || viewData.length === 0) {
        typeOfDowntime.value = ""
        return
      }

      typeOfDowntime.value = viewData[0].downtime_id
      console.log("✅ The downtime_id for ToT is", typeOfDowntime.value)
    } catch (err) {
      console.error('❌ Unexpected error fetching ToT downtime:', err)
    }
    


  }
  const fetchLoggedInUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    console.error("Error fetching user:", error);
    return;
  }
  userUUID.value = data?.user?.id;
  console.log("✅ User UUID:", userUUID.value);
};

const fetchUserDivisionId = async () => {
  if (!userUUID.value) {
    console.error("User UUID is not available.");
    return;
  }

  const { data, error } = await supabase
    .from('technical_division_user')
    .select('td_id') // Replace 'td_id' with the actual column name if different
    .eq('user_id', userUUID.value)
    .single(); // Use .single() if each user has only one role/row

  if (error) {
    console.error("Error fetching division ID:", error);
    return;
  }

  userDivisionId.value = data?.td_id;
  console.log("✅ Retrieved User Division ID:", userDivisionId.value);
};
const fetchUsersByDivision = async () => {
  if (!userDivisionId.value) {
    console.error("No division ID available");
    return;
  }

  const { data, error } = await supabase
    .from('technical_division_user_roles') // your view or table
    .select('user_id, supervisor, user_role')
    .eq('division_id', userDivisionId.value);

  if (error) {
    console.error("Error fetching users:", error);
    return;
  }

  assignableUsers.value = data
  .filter(user => user.user_id !== userUUID.value)
  .map(user => ({
    title: `[${user.user_role}] - ${user.supervisor}`,
    value: user.user_id,
    role: user.user_role  // <-- Add this line
  }));
};
const staffList = ref([]);

// ✅ Fetch Staff from Supabase
const fetchStaff = async () => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, firstname, lastname')
      .order('lastname', { ascending: true }); 

    if (error) {
      console.error('Error fetching staff:', error);
      return;
    }

    staffList.value = data.map(user => ({
      id: user.id,
      name: `${user.lastname || ''}, ${user.firstname || ''}`.trim() || 'No Name'
    }));
  } catch (err) {
    console.error('Unexpected error fetching staff:', err);
  }
};
  onMounted(() => {
    fetchUserDivisionId()
    fetchLoggedInUser()
    fetchTypeOfTransaction()
    fetchNatureOfTransaction()
    fetchUsersByDivision()
    fetchStaff()
    //fetchTypeOfDowntime()
  })

  return {
    handleDialogFormSubmit,
    fetchUserDivisionId,
    fetchLoggedInUser,
    assignableUsers,
    handleFormSubmit,
    formData,
    formAction,
    isSuccess,
    refVForm,
    options,
    prescribedPeriodValues,
     type_of_transaction,
    nature_of_transaction,
    dateForwarded: null,
    fetchToTDowntime,
    typeOfDowntime,
    fetchPAP,
    papData,
    fetchUsersByDivision,
    staffList,
    requiredValidator
  }
}
