import { ref, computed } from "vue";
import supabase from '@/components/system/accomplishments/scoreboard/supabase';

export const trackProcesses = async () => {
  try {
    const { data, error } = await supabase
     .from('view_document_tracker')
      .select('*')
      .order('date_received', { ascending: false });

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error fetching system-wide tracking data:', err);
    return [];
  }
};
export const formatDate2 = (dateString) => {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
};
export const trackingHeaders = ref([
  { title: 'DMS Reference Number', key: 'dms_reference_number' },
  { title: 'Current Level', key: 'level' },
  { title: 'Status', key: 'status' },
  { title: 'Personnel', key: 'owner_name' },
  { title: 'Date Received', key: 'date_received' }
]);