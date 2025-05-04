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
    try {
      const { data: agencies, error } = await supabaseAdmin
        .from('agency')
        .select('*, user_profiles(*)')
        .order('created_at', { ascending: false })
        .range((page - 1) * itemsPerPage, page * itemsPerPage - 1)

      if (error) {
        console.error('Error fetching agencies:', error.message)
        return
      }

      if (!agencies) {
        console.error('No agencies data found')
        return
      }

      const { count } = await supabaseAdmin.from('agency').select('*', { count: 'exact' })

      // Map over agencies to get the staff name
      agenciesTable.value = agencies.map((agency) => ({
        ...agency,
        staff_name: agency.user_profiles
          ? `${agency.user_profiles.lastname}, ${agency.user_profiles.firstname}`
          : 'No staff assigned'
      }))
      agenciesTotal.value = count
    } catch (err) {
      console.error('Error in getAgenciesTable:', err.message)
    }
  }

  // Add Agency
  async function addAgency(formData, tableOptions) {
    const { agency_name, user_id } = formData
    const { data, error } = await supabaseAdmin.from('agency').insert([{ agency_name, user_id }])

    if (error) {
      console.error('Error adding agency:', error.message)
      return
    }

    // After adding, refresh the agencies table with updated data
    await getAgenciesTable(tableOptions)
    return data
  }

  // Update Agency
  async function updateAgency(formData, tableOptions) {
    const { id, agency_name, user_id } = formData
    const { data, error } = await supabaseAdmin
      .from('agency')
      .update({ agency_name, user_id })
      .eq('id', id)
      .single() // Make sure it returns the updated data

    if (error) {
      console.error('Error updating agency:', error.message)
      return
    }

    // Refresh the table after the update
    await getAgenciesTable(tableOptions)

    // Update the store directly with the updated data
    const index = agenciesTable.value.findIndex((agency) => agency.id === id)
    if (index !== -1) {
      agenciesTable.value[index] = { ...agenciesTable.value[index], agency_name, user_id }
    }

    return data
  }

  // Delete Agency
  async function deleteAgency(id) {
    try {
      const { error } = await supabaseAdmin.from('agency').delete().eq('id', id)
      if (error) {
        console.error('Error deleting agency:', error.message)
        return
      }

      // Refresh the table after the delete
      await getAgenciesTable({ page: 1, itemsPerPage: agenciesTotal.value })
    } catch (err) {
      console.error('Error in deleteAgency:', err.message)
    }
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
