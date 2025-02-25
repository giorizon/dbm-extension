import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gfjfvrlngnfljewcnscn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmamZ2cmxuZ25mbGpld2Nuc2NuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjc1MzQ1NzIsImV4cCI6MjA0MzExMDU3Mn0.UvsN5whiZqCNErZ9bFtOSQ-dKIaWFN-5eyy7o2iJGus';

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;