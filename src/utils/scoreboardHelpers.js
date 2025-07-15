// src/utils/scoreboardHelpers.js

import { ref, computed } from "vue";
import supabase from '@/components/system/accomplishments/scoreboard/supabase';

export const userUUID = ref(null);
export const userRole = ref(null);
export const scoreboardData = ref([]);
export const individual_name = ref(null);
export const userDivisionId = ref(null);
export const divisionChief = ref(null);
export const ARD_name = ref(null);
export const ARD_pos = ref(null);
export const RD_name = ref(null);
export const RD_pos = ref(null);
export const ExtensionName = ref(null);
export const reportYear = ref([]);
export const selQuarter = ref([]);

export const quarter = ref([
  { id: 1, name: 'January 1 to March 31' },
  { id: 2, name: 'April 1 to June 30' },
  { id: 3, name: 'July 1 to September 30' },
  { id: 4, name: 'October 1 to December 31' }
]);

export const formatDate = (timestamp) => {
  if (!timestamp) return "N/A";
  const date = new Date(timestamp);
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  }).format(date);
};

export const formatTime = (timestamp) => {
  if (!timestamp) return "N/A";
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return "N/A";
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  }).format(date);
};

export const fetchLoggedInUser = async () => {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) return console.error("Error fetching user:", userError);
  userUUID.value = userData?.user?.id;

  if (userUUID.value) {
    const { data: profileData, error: profileError } = await supabase
      .from('user_profile_role')
      .select('user_role')
      .eq('user_id', userUUID.value)
      .single();

    if (profileError) return console.error("Error fetching role:", profileError);
    userRole.value = profileData.user_role;
    await fetchScoreboardDataBasedOnRole();
  }
};

export const fetchScoreboardDataBasedOnRole = async () => {
  const { data, error } = await supabase
    .from('view_scoreboard_individual')
    .select('*')
    .eq('owner_id', userUUID.value);

  if (error) return console.error("Error fetching data:", error);
  scoreboardData.value = data.map(row => ({
    dms_reference_number: row.dms_reference_number ?? '—',
    agency_name: row.agency_name ?? '—',
    date_received: formatDate(row.date_received),
    date_forwarded: formatDate(row.date_forwarded),
    not_name: row.not_name ?? '—',
    prescribed_period: row.prescribed_period ?? '—',
    date_released: formatDate(row.date_released),
    time_released: formatTime(row.date_released)
  }));
};

export const fetchIndividual = async () => {
  const { data, error } = await supabase
    .from('view_signatory_role')
    .select('*')
    .eq('user_id', userUUID.value);

  if (error || !data?.length) return console.error("Error fetching individual name", error);
  individual_name.value = data[0].name;
};

export const fetchUserDivisionId = async () => {
  const { data, error } = await supabase
    .from('technical_division_user')
    .select('td_id')
    .eq('user_id', userUUID.value)
    .single();

  if (error) return console.error("Error fetching division ID:", error);
  userDivisionId.value = data?.td_id;
};

export const fetchDivisionChief = async () => {
  const { data, error } = await supabase
    .from('technical_division_user_roles')
    .select('supervisor')
    .eq('division_id', userDivisionId.value)
    .eq('user_role', 'Division Chief');

  if (error || !data?.length) return console.error("Error fetching division chief:", error);
  divisionChief.value = data[0].supervisor;
};

export const fetchARD = async () => {
  const { data, error } = await supabase
    .from('view_signatory')
    .select('*')
    .eq('pos_id', '4');

  if (error || !data?.length) return console.error("Error fetching ARD:", error);
  ARD_name.value = data[0].name;
  ARD_pos.value = data[0].position;
};

export const fetchRD = async () => {
  const { data, error } = await supabase
    .from('view_signatory')
    .select('*')
    .eq('pos_id', '5');

  if (error || !data?.length) return console.error("Error fetching RD:", error);
  RD_name.value = data[0].name;
  RD_pos.value = data[0].position;
   ExtensionName.value = data[0].extension;
};


export const fetchYear = async () => {
  const { data, error } = await supabase.rpc('get_unique_years');
  if (error) return console.error('Error fetching Years:', error);

  reportYear.value = data.map((item) => ({
    name: item.year.toString(),
    id: item.year
  }));
};

export const printSection = () => {
  const printContents = document.getElementById('printSection').innerHTML;
  const originalContents = document.body.innerHTML;
  document.body.innerHTML = printContents;
  window.print();
  document.body.innerHTML = originalContents;
  window.location.reload();
};

export const useSelectedLabels = (selectedUser, selectedYear) => {
  const dateRange = computed(() => {
    const q = quarter.value.find(q => q.id === selectedUser.value);
    return q ? q.name : '--';
  });

  const selectedYearName = computed(() => {
    const y = reportYear.value.find(y => y.id === selectedYear.value);
    return y ? y.name : '--';
  });

  return { dateRange, selectedYearName };
};
