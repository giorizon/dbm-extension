import { ref } from 'vue'
import { defineStore } from 'pinia'
import { supabaseAdmin } from '@/utils/supabase'

export const useStore = defineStore('natureoftransaction', () => {
  // States
  const NoTTable = ref([])
  const NoTTotal = ref(0)

  // Reset State Action
  function $reset() {
    NoTTable.value = []
    NoTTotal.value = 0
  }

  // Retrieve Nature of Transaction
async function getNoTTable({ page, itemsPerPage, search = '' }) {
  try {
    // 1. Start with the base query
    let query = supabaseAdmin
      .from('view_not_pap')
      .select('*', { count: 'exact' })
      .eq('remark', 'active')
      .order('noq_name', { ascending: true })

    // 2. APPLY SEARCH FILTER IF A SEARCH TERM IS PRESENT
    if (search.trim()) {
      const searchTerm = `%${search.trim()}%`
      
      query = query.or(
        `noq_name.ilike.${searchTerm},description.ilike.${searchTerm}`
      )
    }

    // 3. Apply pagination/range
    const { data, count, error } = await query
      .range((page - 1) * itemsPerPage, page * itemsPerPage - 1)

    if (error) throw error

    // 4. Assign both values to your state
    NoTTable.value = data
    NoTTotal.value = count || 0

  } catch (error) {
    // If you see a generic 404/400 now, log the full message here
    console.error('Error fetching Nature of Transaction:', error.message)
  }
}

  // Add Transaction Type
async function addTransactionNature(formData) {
  const {
    noq_name,
    pap_id
  } = formData
  if (!pap_id) {
    console.error("PAP is empty!");
    return;
  }
  // 1️⃣ Insert into nature_of_transaction
  alert(noq_name);
  alert(pap_id)
const { data, error } = await supabaseAdmin
  .from('nature_of_transaction')
  .insert(
    [{
      noq_name,
      remark: 'active'
    }]
  )
  .select('noq_id')   // ✔ Forces return of ID
  .single()
  console.log("DATA RETURNED BY SUPABASE:", data);
  if (error) {
    console.error('Error adding Transaction Nature:', error.message)
    return
  }

  const newId = data.noq_id;
  console.log("Newly created ID: ", newId)


  const { error: secondError } = await supabaseAdmin
    .from('not_pap')
    .insert([
      {
        not_id: newId,
        pap_id: pap_id
      }
    ])

  if (secondError) {
    console.error("Error inserting NOT_PAP record:", secondError.message)
    return
  }

  // 3️⃣ Refresh UI
  await getNoTTable({ page: 1, itemsPerPage: 10 })

  return { success: true, id: newId }
}
  // Update Agency
  async function updateTransactionNature(formData) {
    const { noq_id, noq_name, pap_id } = formData
    console.log("Top ID: ",noq_id)
    if (!noq_id) {
      console.error('Cannot update Transaction Nature: ID is missing.')
      return { error: { message: 'ID is required to update Nature of Transaction.' } }
    }

    const { data, error } = await supabaseAdmin
      .from('nature_of_transaction')
      .update({ noq_name})
      .eq('noq_id', noq_id)
      .single()

    if (error) {
      console.error('Error updating agency:', error.message)
      return { error }
    }
      // 2️⃣ SECOND UPDATE (example — different table)
    const { data: papData, error: papError } = await supabaseAdmin
      .from('not_pap')
      .update({ pap_id })
      .eq('not_id', noq_id)

    if (papError) {
      console.error('Error updating PAP:', papError.message)
      return { error: papError }
    }
    return { data, papData }
  }

  async function deleteTransactionNature(id) {
    return await supabaseAdmin.from('nature_of_transaction').update({remark: 'not active'}).eq('noq_id', id)
  }

  return {
    NoTTable,
    NoTTotal,
    $reset,
    getNoTTable,
    addTransactionNature,
    updateTransactionNature,
    deleteTransactionNature
  }
})
