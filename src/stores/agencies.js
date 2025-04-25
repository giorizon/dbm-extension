// src/stores/agencies.js
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
      .from('agency') // Ensure the table name is "agency"
      .select('*')
      .range((page - 1) * itemsPerPage, page * itemsPerPage - 1)

    if (error) {
      console.error('Error fetching agencies:', error.message)
      return
    }

    // Assuming you want the total number of agencies
    const { count } = await supabaseAdmin.from('agency').select('*', { count: 'exact' }) // Get total count of agencies

    agenciesTable.value = agencies
    agenciesTotal.value = count
  }

  // Add Agency
  async function addAgency(formData) {
    const { agency_name, user_id } = formData
    const { data, error } = await supabaseAdmin
      .from('agency') // Insert into the "agency" table
      .insert([{ agency_name, user_id }])

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
      .from('agency') // Update the "agency" table
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
    const { data, error } = await supabaseAdmin
      .from('agency') // Delete from the "agency" table
      .delete()
      .eq('id', id)

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
