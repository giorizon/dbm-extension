import { ref } from 'vue'
import { defineStore } from 'pinia'
import { supabaseAdmin } from '@/utils/supabase'

export const usedbStore = defineStore('users', () => {
  // States
  const divisionTable = ref([])
  const divisionTotal = ref(0)

  // Reset State Action
  function $reset() {
    divisionTable.value = []
    divisionTotal.value = 0
  }

  // Retrieve division
async function getDivisionTable({ page, itemsPerPage }) {
  const from = (page - 1) * itemsPerPage
  const to = page * itemsPerPage - 1

  const { data, error, count } = await supabaseAdmin
    .from('view_division_info')
    .select('*', { count: 'exact' })
    .order('td_id', { ascending: true })
    .range(from, to)

  if (error) {
    console.error('Error fetching division:', error.message)
    return
  }

  divisionTable.value = data
  divisionTotal.value = count
}

  // Add User
  async function addDivision(formData) {
    const { name, short_name } = formData
    const { data, error } = await supabaseAdmin.from('technical_division').insert([{ name, short_name }])

    if (error) {
      console.error('Error adding Division:', error.message)
      return
    }

    // Refresh the agencies table with updated data
    await getDivisionTable({ page: 1, itemsPerPage: 10 })

    return data
  }

  // Update User
  async function updateDivision(formData) {
    const { id, name, short_name } = formData

    if (!id) {
      console.error('Cannot update Division: ID is missing.')
      return { error: { message: 'ID is required to update division.' } }
    }

    const { data, error } = await supabaseAdmin
      .from('technical_division')
      .update({ name, short_name })
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error updating agency:', error.message)
    }

    return { data, error } }

  // Delete User
  async function deleteDivision(id) {
    return await supabaseAdmin.from('technical_division').delete().eq('id', id)
  }

  //Assign User to Division
    async function addUserDivision(formData) {
    const { td_id, user_id } = formData
    const { data, error } = await supabaseAdmin.from('technical_division_user').insert([{ td_id, user_id }])

    if (error) {
      console.error('Error assigning division to user:', error.message)
      return
    }

    // Refresh the agencies table with updated data

    return data
  }

  return { divisionTable, divisionTotal, $reset, getDivisionTable, addDivision, updateDivision, deleteDivision, addUserDivision }
})
