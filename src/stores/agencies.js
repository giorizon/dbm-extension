import { ref } from 'vue'
import { defineStore } from 'pinia'
import { supabaseAdmin } from '@/utils/supabase'

export const useAgenciesStore = defineStore('agencies', () => {
  const agenciesTable = ref([])
  const agenciesTotal = ref(0)

  function $reset() {
    agenciesTable.value = []
    agenciesTotal.value = 0
  }

  // Retrieve Agencies
  async function getAgenciesTable({ page, itemsPerPage }) {
    const { data: agencies, error } = await supabaseAdmin
      .from('agency')
      .select('*, user_profiles(*)')
      .range((page - 1) * itemsPerPage, page * itemsPerPage - 1)

    if (error) {
      console.error('Error fetching agencies:', error.message)
      return
    }

    const { count } = await supabaseAdmin.from('agency').select('*', { count: 'exact' })

    // Map over agencies to get the staff name
    agenciesTable.value = agencies.map((agency) => {
      return {
        ...agency,
        staff_name: agency.user_profiles
          ? `${agency.user_profiles.lastname}, ${agency.user_profiles.firstname}`
          : 'No staff assigned'
      }
    })
    agenciesTotal.value = count
  }

  // Add Agency
  async function addAgency(formData) {
    const { agency_name, user_id } = formData
    const { data, error } = await supabaseAdmin.from('agency').insert([{ agency_name, user_id }])

    if (error) {
      console.error('Error adding agency:', error.message)
      return
    }

    return data
  }

  // Update Agency
  async function updateAgency(formData) {
    const { id, agency_name, user_id } = formData
    const { data, error } = await supabaseAdmin
      .from('agency')
      .update({ agency_name, user_id })
      .eq('id', id)

    if (error) {
      console.error('Error updating agency:', error.message)
      return
    }

    return data
  }

  // Delete Agency
  async function deleteAgency(id) {
    const { data, error } = await supabaseAdmin.from('agency').delete().eq('id', id)

    if (error) {
      console.error('Error deleting agency:', error.message)
      return
    }

    return data
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
