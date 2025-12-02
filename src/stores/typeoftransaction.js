import { ref } from 'vue'
import { defineStore } from 'pinia'
import { supabaseAdmin } from '@/utils/supabase'

export const useToTStore = defineStore('typeoftransaction', () => {
  // States
  const ToTTable = ref([])
  const ToTTotal = ref(0)

  // Reset State Action
  function $reset() {
    ToTTable.value = []
    ToTTotal.value = 0
  }

  // Retrieve Type of Transaction
 async function getToTTable({ page, itemsPerPage }) {
  try {
    // 1. Get Data AND Count in one request
    const { data, count, error } = await supabaseAdmin
      .from('type_of_transactions')
      // { count: 'exact' } tells Supabase to return the total rows too
      .select('*', { count: 'exact' }) 
      .eq('remark','active')
      .order('transaction_type', { ascending: true })
      .range((page - 1) * itemsPerPage, page * itemsPerPage - 1)

    if (error) throw error

    // 2. Assign both values to your state
    ToTTable.value = data
    ToTTotal.value = count || 0

  } catch (error) {
    console.error('Error fetching Type of Transaction:', error.message)
  }
}

  // Add Transaction Type
async function addTransactionType(formData) {
  const {
    transaction_type,
    prescribed_period,
    pp_spcr,
    pp_dpcr,
    pp_opcr,
    downtime_type
  } = formData
  if (!downtime_type) {
    console.error("downtime_type is empty!");
    return;
  }
  // 1️⃣ Insert into type_of_transactions
const { data, error } = await supabaseAdmin
  .from('type_of_transactions')
  .insert(
    [{
      transaction_type,
      prescribed_period,
      pp_spcr,
      pp_dpcr,
      pp_opcr,
      remark: 'active'
    }]
  )
  .select('top_id')   // ✔ Forces return of ID
  .single()
  console.log("DATA RETURNED BY SUPABASE:", data);
  if (error) {
    console.error('Error adding Transaction Type:', error.message)
    return
  }

  const newId = data.top_id;
  console.log("Newly created ID: ", newId)


  const { error: secondError } = await supabaseAdmin
    .from('type_of_transaction_downtime')
    .insert([
      {
        tot_id: newId,
        tod_id: downtime_type
      }
    ])

  if (secondError) {
    console.error("Error inserting downtime record:", secondError.message)
    return
  }

  // 3️⃣ Refresh UI
  await getToTTable({ page: 1, itemsPerPage: 10 })

  return { success: true, id: newId }
}
  // Update Agency
  async function updateTransactionType(formData) {
    const { top_id, transaction_type, prescribed_period, pp_spcr, pp_dpcr, pp_opcr } = formData
    console.log("Top ID: ",top_id)
    if (!top_id) {
      console.error('Cannot update Transaction Type: ID is missing.')
      return { error: { message: 'ID is required to update transaction_type.' } }
    }

    const { data, error } = await supabaseAdmin
      .from('type_of_transactions')
      .update({ transaction_type, prescribed_period, pp_spcr, pp_dpcr, pp_opcr })
      .eq('top_id', top_id)
      .single()

    if (error) {
      console.error('Error updating agency:', error.message)
    }

    return { data, error }
  }

  // Delete Agency
  async function deleteTransactionType(id) {
    return await supabaseAdmin.from('type_of_transactions').update({remark: 'not active'}).eq('top_id', id)
  }

  return {
    ToTTable,
    ToTTotal,
    $reset,
    getToTTable,
    addTransactionType,
    updateTransactionType,
    deleteTransactionType
  }
})
