import { useScoreboardData, useScoreboardForm } from '@/composables/scoreboard/scoreboard';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gfjfvrlngnfljewcnscn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmamZ2cmxuZ25mbGpld2Nuc2NuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjc1MzQ1NzIsImV4cCI6MjA0MzExMDU3Mn0.UvsN5whiZqCNErZ9bFtOSQ-dKIaWFN-5eyy7o2iJGus';
const supabase = createClient(supabaseUrl, supabaseKey);

const { handleDialogFormSubmit, handleFormSubmit, formData, formAction, isSuccess, refVForm } = useScoreboardForm();
const { prescribedPeriodValues } = useScoreboardData(formData);
const timeMenu = ref();
const agencies = ref([]);

// ✅ Fetch Agencies from Supabase
const fetchAgencies = async () => {
  try {
    const { data, error } = await supabase.from('agency').select('id, agency_name');

    if (error) {
      console.error('Error fetching agencies:', error);
      return;
    }

    console.log('Fetched Agencies:', data); // Debugging: Check if data is received
    agencies.value = data; // ✅ Store fetched data in `agencies`
  } catch (err) {
    console.error('Unexpected error fetching agencies:', err);
  }
};

