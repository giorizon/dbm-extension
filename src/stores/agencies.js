import { ref } from 'vue'
import { defineStore } from 'pinia'
import { supabaseAdmin } from '@/utils/supabase'

export const useAgenciesStore = defineStore('agencies', () => {
  // States
  const agenciesTable = ref([])
  const agenciesTotal = ref(0)

  // Reset State Action
  function $reset() {
    agenciesTable.value = []
    agenciesTotal.value = 0
  }

  // Retrieve Agencies
  async function getAgenciesTable({ page, itemsPerPage }) {
    const { data: agencies, error } = await supabaseAdmin
      .from('agency')
      .select('*, user_profiles(*)')
      .order('created_at', { ascending: false })
      .range((page - 1) * itemsPerPage, page * itemsPerPage - 1)

    if (error) {
      console.error('Error fetching agencies:', error.message)
      return
    }

    const { count, error: countError } = await supabaseAdmin
      .from('agency')
      .select('*', { count: 'exact' })

    if (countError) {
      console.error('Error fetching agency count:', countError.message)
      return
    }

    agenciesTotal.value = count || 0

    // Map over agencies to get the staff name
    agenciesTable.value = agencies.map((agency) => ({
      ...agency,
      staff_name: agency.user_profiles
        ? `${agency.user_profiles.lastname}, ${agency.user_profiles.firstname}`
        : 'No staff assigned'
    }))
  }

  // Add Agency
  async function addAgency(formData) {
    const { agency_name, user_id } = formData

    const { data, error } = await supabaseAdmin.from('agency').insert([{ agency_name, user_id }])

    if (error) {
      console.error('Error adding agency:', error.message)
      return
    }

    // Refresh the agencies table with updated data
    await getAgenciesTable({ page: 1, itemsPerPage: 10 }) // Adjust as needed for pagination

    return data
  }

  // Update Agency
  async function updateAgency(formData) {
    const { id, agency_name, user_id } = formData

    const { data, error } = await supabaseAdmin
      .from('agency')
      .update({ agency_name, user_id })
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error updating agency:', error.message)
      return
    }

    // Refresh the agencies table with updated data
    await getAgenciesTable({ page: 1, itemsPerPage: 10 }) // Adjust as needed for pagination

    return data
  }

  // Delete Agency
  async function deleteAgency(id) {
    // Perform the delete operation and return the result
    return await supabaseAdmin.from('agency').delete().eq('id', id)
  }

  return {
    agenciesTable,
    agenciesTotal,
    $reset,
    getAgenciesTable,
    addAgency,
    updateAgency,
    deleteAgency
  }
})
