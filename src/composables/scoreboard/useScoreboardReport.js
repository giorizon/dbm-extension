import { ref } from 'vue';
import supabase from '@/components/system/accomplishments/scoreboard/supabase';
import { formatDate, formatTime, reportYear } from '@/utils/scoreboardHelpers';

export function useScoreboardReport() {
  const userUUID = ref(null);
  const userRole = ref(null);
  const CBMS_name = ref(null);
  const CBMS_pos = ref(null);
  const ARD_name = ref(null);
  const ARD_pos = ref(null);
  const scoreboardData1 = ref([]);
  const individual_name = ref(null);

  // Fetch logged-in user profile & role
  const fetchLoggedInUser = async () => {
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError) {
      console.error("❌ Error fetching user:", userError);
      return;
    }

    userUUID.value = userData?.user?.id;

    if (userUUID.value) {
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('user_profile_role')
          .select('user_role')
          .eq('user_id', userUUID.value)
          .single();

        if (profileError) {
          console.error("❌ Error fetching user role:", profileError);
          return;
        }
        userRole.value = profileData.user_role;
      } catch (err) {
        console.error("❌ Unexpected error fetching user role:", err);
      }
    }
  };

  // Fetch Signatories
  const fetchCBMS = async () => {
    const { data, error } = await supabase
      .from('view_signatory')
      .select('*')
      .eq('pos_id', '16');

    if (error) {
      console.error("Error fetching CBMS name and position:", error);
      return;
    }

    if (data && data.length > 0) {
      CBMS_name.value = data[0].name;
      CBMS_pos.value = data[0].position;
    }
  };

  const fetchARD = async () => {
    const { data, error } = await supabase
      .from('view_signatory')
      .select('*')
      .eq('pos_id', '4');

    if (error) {
      console.error("Error fetching ARD name and position:", error);
      return;
    }

    if (data && data.length > 0) {
      ARD_name.value = data[0].name;
      ARD_pos.value = data[0].position;
    }
  };

  // Fetch available report years
  const fetchYear = async () => {
    try {
      const { data, error } = await supabase.rpc('get_unique_years');

      if (error) {
        console.error('Error fetching Years:', error);
        return;
      }

      reportYear.value = data.map((item) => ({
        name: item.year.toString(),
        id: item.year
      }));
    } catch (err) {
      console.error('Unexpected error fetching Years:', err);
    }
  };

  // Helper date range calculator
  function getQuarterDateRange(year, quarter) {
    const ranges = {
      1: [`${year}-01-01`, `${year}-03-31`],
      2: [`${year}-04-01`, `${year}-06-30`],
      3: [`${year}-07-01`, `${year}-09-30`],
      4: [`${year}-10-01`, `${year}-12-31`],
    };
    return ranges[quarter];
  }

  // Calculate work duration text string
  function calculateWorkDays(todId, baseVal, downtimeVal) {
    const downtime = downtimeVal == null ? 0 : downtimeVal;
    if (todId === 1) return `${baseVal - downtime} calendar days`;
    if (todId === 2) return `${baseVal - downtime} working days`;
    if (todId === 3) return `${baseVal - downtime} working hours`;
    return '—';
  }

  // Generate Table Data
  const generateTable = async (selQuarter, selectedYear, userRole) => {
    if (!selQuarter || !selectedYear) {
      alert("⚠️ Please select both a quarter and a year before generating the report.");
      return;
    } const [startDate, endDate] = getQuarterDateRange(selectedYear, selQuarter);

    const [sectionOne, sectionTwo, sectionThree, sectionFour, sectionFive] = await Promise.all([
      supabase.from('view_section_one').select('*').gte('date_released', startDate).lte('date_released', endDate),
      supabase.from('view_section_two').select('*').gte('date_released', startDate).lte('date_released', endDate),
      supabase.from('view_section_three').select('*').gte('date_released', startDate).lte('date_released', endDate),
      supabase.from('view_section_four').select('*').gte('date_released', startDate).lte('date_released', endDate),
      supabase.from('view_section_five').select('*').gte('date_released', startDate).lte('date_released', endDate)
    ]);

    if (sectionOne.error) return console.error('Error fetching section one:', sectionOne.error);
    if (sectionTwo.error) return console.error('Error fetching section two:', sectionTwo.error);
    if (sectionThree.error) return console.error('Error fetching section three:', sectionThree.error);
    if (sectionFour.error) return console.error('Error fetching section four:', sectionFour.error);
    if (sectionFive.error) return console.error('Error fetching section five:', sectionFive.error);

    const twoMap = Object.fromEntries(sectionTwo.data.map(t => [t.scoreboard_id, t]));
    const threeMap = Object.fromEntries(sectionThree.data.map(t => [t.scoreboard_id, t]));
    const fourMap = Object.fromEntries(sectionFour.data.map(t => [t.scoreboard_id, t]));
    const fiveMap = Object.fromEntries(sectionFive.data.map(t => [t.scoreboard_id, t]));

    const mergedData = sectionOne.data.map(one => ({
      ...one,
      ...twoMap[one.scoreboard_id],
      ...threeMap[one.scoreboard_id],
      ...fourMap[one.scoreboard_id],
      ...fiveMap[one.scoreboard_id],
    }));

    mergedData.sort((a, b) => a.pap_id - b.pap_id);

    const processedData = [];
    let currentPapId = null;

    for (const row of mergedData) {
      if (row.pap_id !== currentPapId) {
        currentPapId = row.pap_id;
        processedData.push({
          isHeader: true,
          pap_id: currentPapId,
          pap_label: row.pap_label,
          key: `header-${currentPapId}-${Date.now()}`
        });
      }

      processedData.push({
        scoreboard_id: row.scoreboard_id,
        dms_reference_number: row.dms_reference_number ?? '—',
        pap_label: row.pap_label ?? '-',
        agency: row.agency ?? '—',
        date_received: formatDate(row.date_received),
        date_released: formatDate(row.date_released),
        nature: row.nature ?? '—',
        time_released: formatTime(row.date_released),
        division: row.division ?? '—',
        transaction_type: row.transaction_type ?? '—',
        pp_ipar: row.pp_ipar ?? '—',
        short_name_ipar: row.short_name_ipar ?? '-',
        initials_ipar: row.initials_ipar ?? '-',
        date_forwarded_ipar: formatDate(row.date_forward_ipar) ?? '—',
        time_forwarded_ipar: formatTime(row.date_forward_ipar) ?? '—',
        pp_spar: row.pp_spar ?? '—',
        short_name_spar: row.short_name_spar ?? '-',
        initials_spar: row.initials_spar ?? '-',
        date_forwarded_spar: formatDate(row.date_forward_spar) ?? '—',
        time_forwarded_spar: formatTime(row.date_forward_spar) ?? '—',
        pp_dpar: row.pp_dpar ?? '—',
        short_name_dpar: row.short_name_dpar ?? '-',
        initials_dpar: row.initials_dpar ?? '-',
        date_forwarded_dpar: formatDate(row.date_forward_dpar) ?? '—',
        time_forwarded_dpar: formatTime(row.date_forward_dpar) ?? '—',
        pp_opar: row.pp_opar ?? '—',
        date_released_opar: formatDate(row.date_forward_opar) ?? '—',
        time_released_opar: formatTime(row.date_forward_opar) ?? '—',
        
        // Duration Calculations
        numberDaysWork_ipar: calculateWorkDays(row.tod_id, row.tod_id === 1 ? row.calendar_days_ipar : row.tod_id === 2 ? row.working_days_ipar : row.working_hours_ipar, row.downtime_ipar),
        numberDaysWork_spar: calculateWorkDays(row.tod_id, row.tod_id === 1 ? row.calendar_days_spar : row.tod_id === 2 ? row.working_days_spar : row.working_hours_spar, row.downtime_spar),
        numberDaysWork_dpar: calculateWorkDays(row.tod_id, row.tod_id === 1 ? row.calendar_days_dpar : row.tod_id === 2 ? row.working_days_dpar : row.working_hours_dpar, row.downtime_dpar),
        numberDaysWork_opar: calculateWorkDays(row.tod_id, row.tod_id === 1 ? row.calendar_days_opar : row.tod_id === 2 ? row.working_days_opar : row.working_hours_opar, row.total_downtime),

        all_remarks: row.all_remarks ?? '-',
        isHeader: false,
        key: row.dms_reference_number,
      });
    }

    scoreboardData1.value = processedData;
  };
   const generateTable2 = async (selQuarter, selectedYear, userRole) => {
   
    if (!selQuarter || !selectedYear) {
      alert("⚠️ Please select both a quarter and a year before generating the report.");
      return;
    }
    console.log('Role passed:', userRole, '| Type:', typeof userRole);
     console.log('Role passed:', userUUID.value, '| Type:', typeof userUUID.value);
    // Start-Retrieve scoreboard_id ---
   let allowedScoreboardIds = [];

    try {
      // 1. INNER SUBQUERY: select scoreboard_id from scoreboard_technical_process where date_released is not null
      const { data: subqueryData, error: subqueryError } = await supabase
        .from('scoreboard_technical_process')
        .select('scoreboard_id')
        .not('date_released', 'is', null);

      if (subqueryError) {
        console.error('Error executing subquery:', subqueryError);
        return;
      }

      // Extract the inner scoreboard_ids into a flat array
      const subqueryIds = subqueryData.map(item => item.scoreboard_id);

      // If the subquery finds no records, no need to run the outer query
      if (subqueryIds.length === 0) {
        console.warn('⚠️ Subquery returned 0 scoreboard IDs.');
        alert('No released scoreboards found.');
        return;
      }

      // 2. OUTER QUERY: select scoreboard_id, level, owner_id where owner_id = ... and level = ... and scoreboard_id in (...)
      const { data: processData, error: processError } = await supabase
        .from('scoreboard_technical_process')
        .select('scoreboard_id, level, owner_id')
        .eq('owner_id', userUUID.value)
        .eq('level', userRole)
        .in('scoreboard_id', subqueryIds); 

      if (processError) {
        console.error('Error executing outer query:', processError);
        return;
      }

      console.log('Retrieved process data:', processData);

      // Extract final selected scoreboard_ids
      allowedScoreboardIds = processData.map(item => item.scoreboard_id);

      if (allowedScoreboardIds.length === 0) {
        alert('⚠️ Query finished, but found 0 matching scoreboard IDs.');
        return;
      }

     // alert(`✅ Found ${allowedScoreboardIds.length} Scoreboard ID(s):\n${allowedScoreboardIds.join('\n')}`);

    } catch (err) {
      console.error('Unexpected error fetching process scoreboard IDs:', err);
      return;
    }
    //End 
   const [startDate, endDate] = getQuarterDateRange(selectedYear, selQuarter);

    const [sectionOne, sectionTwo, sectionThree, sectionFour, sectionFive] = await Promise.all([
      supabase
        .from('view_section_one')
        .select('*')
        .gte('date_released', startDate)
        .lte('date_released', endDate)
        .in('scoreboard_id', allowedScoreboardIds),

      supabase
        .from('view_section_two')
        .select('*')
        .gte('date_released', startDate)
        .lte('date_released', endDate)
        .in('scoreboard_id', allowedScoreboardIds),

      supabase
        .from('view_section_three')
        .select('*')
        .gte('date_released', startDate)
        .lte('date_released', endDate)
        .in('scoreboard_id', allowedScoreboardIds),

      supabase
        .from('view_section_four')
        .select('*')
        .gte('date_released', startDate)
        .lte('date_released', endDate)
        .in('scoreboard_id', allowedScoreboardIds),

      supabase
        .from('view_section_five')
        .select('*')
        .gte('date_released', startDate)
        .lte('date_released', endDate)
        .in('scoreboard_id', allowedScoreboardIds)
    ]);

    if (sectionOne.error) return console.error('Error fetching section one:', sectionOne.error);
    if (sectionTwo.error) return console.error('Error fetching section two:', sectionTwo.error);
    if (sectionThree.error) return console.error('Error fetching section three:', sectionThree.error);
    if (sectionFour.error) return console.error('Error fetching section four:', sectionFour.error);
    if (sectionFive.error) return console.error('Error fetching section five:', sectionFive.error);

    const twoMap = Object.fromEntries(sectionTwo.data.map(t => [t.scoreboard_id, t]));
    const threeMap = Object.fromEntries(sectionThree.data.map(t => [t.scoreboard_id, t]));
    const fourMap = Object.fromEntries(sectionFour.data.map(t => [t.scoreboard_id, t]));
    const fiveMap = Object.fromEntries(sectionFive.data.map(t => [t.scoreboard_id, t]));

    const mergedData = sectionOne.data.map(one => ({
      ...one,
      ...twoMap[one.scoreboard_id],
      ...threeMap[one.scoreboard_id],
      ...fourMap[one.scoreboard_id],
      ...fiveMap[one.scoreboard_id],
    }));

    mergedData.sort((a, b) => a.pap_id - b.pap_id);

    const processedData = [];
    let currentPapId = null;

    for (const row of mergedData) {
      if (row.pap_id !== currentPapId) {
        currentPapId = row.pap_id;
        processedData.push({
          isHeader: true,
          pap_id: currentPapId,
          pap_label: row.pap_label,
          key: `header-${currentPapId}-${Date.now()}`
        });
      }

      processedData.push({
        scoreboard_id: row.scoreboard_id,
        dms_reference_number: row.dms_reference_number ?? '—',
        pap_label: row.pap_label ?? '-',
        agency: row.agency ?? '—',
        date_received: formatDate(row.date_received),
        date_released: formatDate(row.date_released),
        nature: row.nature ?? '—',
        time_released: formatTime(row.date_released),
        division: row.division ?? '—',
        transaction_type: row.transaction_type ?? '—',
        pp_ipar: row.pp_ipar ?? '—',
        short_name_ipar: row.short_name_ipar ?? '-',
        initials_ipar: row.initials_ipar ?? '-',
        date_forwarded_ipar: formatDate(row.date_forward_ipar) ?? '—',
        time_forwarded_ipar: formatTime(row.date_forward_ipar) ?? '—',
        pp_spar: row.pp_spar ?? '—',
        short_name_spar: row.short_name_spar ?? '-',
        initials_spar: row.initials_spar ?? '-',
        date_forwarded_spar: formatDate(row.date_forward_spar) ?? '—',
        time_forwarded_spar: formatTime(row.date_forward_spar) ?? '—',
        pp_dpar: row.pp_dpar ?? '—',
        short_name_dpar: row.short_name_dpar ?? '-',
        initials_dpar: row.initials_dpar ?? '-',
        date_forwarded_dpar: formatDate(row.date_forward_dpar) ?? '—',
        time_forwarded_dpar: formatTime(row.date_forward_dpar) ?? '—',
        pp_opar: row.pp_opar ?? '—',
        date_released_opar: formatDate(row.date_forward_opar) ?? '—',
        time_released_opar: formatTime(row.date_forward_opar) ?? '—',
        
        // Duration Calculations
        numberDaysWork_ipar: calculateWorkDays(row.tod_id, row.tod_id === 1 ? row.calendar_days_ipar : row.tod_id === 2 ? row.working_days_ipar : row.working_hours_ipar, row.downtime_ipar),
        numberDaysWork_spar: calculateWorkDays(row.tod_id, row.tod_id === 1 ? row.calendar_days_spar : row.tod_id === 2 ? row.working_days_spar : row.working_hours_spar, row.downtime_spar),
        numberDaysWork_dpar: calculateWorkDays(row.tod_id, row.tod_id === 1 ? row.calendar_days_dpar : row.tod_id === 2 ? row.working_days_dpar : row.working_hours_dpar, row.downtime_dpar),
        numberDaysWork_opar: calculateWorkDays(row.tod_id, row.tod_id === 1 ? row.calendar_days_opar : row.tod_id === 2 ? row.working_days_opar : row.working_hours_opar, row.total_downtime),

        all_remarks: row.all_remarks ?? '-',
        isHeader: false,
        key: row.dms_reference_number,
      });
    }

    scoreboardData1.value = processedData;
  };
  const printSection = () => {
    const printContents = document.getElementById('printSection').innerHTML;
    const originalContents = document.body.innerHTML;
    document.body.innerHTML = printContents;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload();
  };
 const fetchIndividual = async () => {
  const { data, error } = await supabase
    .from('view_signatory_role')
    .select('*')
    .eq('user_id', userUUID.value);

  if (error || !data?.length) return console.error("Error fetching individual name", error);
  individual_name.value = data[0].name;
};
  return {
    userUUID,
    userRole,
    CBMS_name,
    CBMS_pos,
    ARD_name,
    ARD_pos,
    scoreboardData1,
    individual_name,
    fetchLoggedInUser,
    fetchCBMS,
    fetchARD,
    fetchYear,
    generateTable,
    generateTable2,
    printSection,
    fetchIndividual,
  };
}