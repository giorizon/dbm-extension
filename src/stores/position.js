import { ref } from 'vue'
import { defineStore } from 'pinia'
import { supabaseAdmin } from '@/utils/supabase'

export const usedbStore = defineStore('position', () => {
  // States
  const positionTable = ref([])
  const positionTotal = ref(0)

  // Reset State Action
  function $reset() {
    positionTable.value = []
    positionTotal.value = 0
  }

  // Retrieve Position
  async function getPositionTable({ page, itemsPerPage }) { 
    const from = (page - 1) * itemsPerPage
    const to = page * itemsPerPage - 1

    const { data, error, count } = await supabaseAdmin
      .from('view_position')
      .select('*', { count: 'exact' })
      .order('pos_name', { ascending: true })
      .range(from, to)

    if (error) {
      console.error('Error fetching division:', error.message)
      return
    }

    positionTable.value = data
    positionTotal.value = count
  }

  // Add Agency
 async function addPosition({ positionName }) {
  const { data, error } = await supabaseAdmin
    .from('position')
    .insert([{ name: positionName }])

  if (!error) {
    await getPositionTable({ page: 1, itemsPerPage: 10 })
  }

  return { data, error }
}

  // Update Position
async function updatePosition({ id, positionName }) {
  if (!id) {
    return { error: { message: 'ID is required.' } }
  }
  return await supabaseAdmin
    .from('position')
    .update({ name: positionName }) // DB column
    .eq('id', id)
    .single()
  
}
  // Update Position Personnel link
async function updateUserPosition({ id, pos_id, user_id }) {
  if (!id) {
    return { error: { message: 'Missing ID.' } }
  }

  return await supabaseAdmin
    .from('position')
    .update({ pos_id, user_id })
    .eq('id', id)
    .single()
}
  // Delete Position
  async function deletePosition(id) {
    return await supabaseAdmin.from('position').delete().eq('id', id)
  }


    //Assign Personnel to a position
    async function addUserPosition(formData) {
    const { pos_id, user_id } = formData
    const { data, error } = await supabaseAdmin.from('pos_user_profile').insert([{ pos_id, user_id }])

    if (error) {
      console.error('Error assigning  Position to Personnel:', error.message)
      return
    }

    // Refresh the agencies table with updated data

    return data
  }

  
  //Assign User to Division
    async function assignUserPosition(formData) {
    const { pos_id, user_id } = formData
    const { data, error } = await supabaseAdmin.from('pos_user_profile').insert([{ pos_id, user_id }])

    if (error) {
      console.error('Error assigning position to personnel:', error.message)
      return
    }

    // Refresh the agencies table with updated data

    return data
  }

  return {
    positionTable,
    positionTotal,
    $reset,
    getPositionTable,
    addPosition,
    updatePosition,
    deletePosition,
    addUserPosition,
    updateUserPosition,
    assignUserPosition
  }
})
