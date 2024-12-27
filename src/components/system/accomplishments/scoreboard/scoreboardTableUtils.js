export const scoreboardTableHeaders = [
  {
    title: 'Particulars',
    key: 'particulars',
    align: 'center',
    children: [
      {
        title: 'P/A/P No.',
        key: 'pap',
        sortable: false,
        align: 'start',
        width: '50%',
        nowrap: true
      },
      {
        title: 'TS-in-Charge',
        key: 'ts',
        sortable: false,
        align: 'start',
        width: '150px',
        nowrap: true
      },
      {
        title: 'Agency Name',
        key: 'agency_name',
        sortable: false,
        align: 'center',
        width: '150px',
        nowrap: true
      }
    ]
  },
  {
    title: 'DMS Reference Number',
    key: 'dms_reference_number',
    sortable: false,
    align: 'center',
    width: '150px',
    nowrap: true
  },
  {
    title: 'Date and Time Received by the Records Section',
    key: 'date_time_received',
    sortable: false,
    align: 'end',
    width: '150px',
    nowrap: true
  },
  {
    title: 'Type of Transaction',
    key: 'transaction_type',
    sortable: false,
    align: 'start',
    nowrap: true,
    width: '150px'
  },
  {
    title: 'IPAR',
    key: 'ipar',
    align: 'center',
    nowrap: true,
    children: [
      {
        title: 'Prescribed Period',
        key: 'prescribed_period_ipar',
        sortable: false,
        align: 'center',
        width: '150px',
        nowrap: true
      },
      {
        title: 'Date and Time Forwarded to Asst. DC/Sr. BMS',
        key: 'date_time_forwarded_ipar',
        sortable: false,
        align: 'center',
        width: '150px',
        nowrap: true
      },
      {
        title: 'No. of Working Days/ Working Hours/ Calendar Days Acted Upon',
        key: 'num_working_days_ipar',
        sortable: false,
        align: 'center',
        width: '150px',
        nowrap: true
      }
    ]
  },
  {
    title: 'Asst. DC/Sr. BMS',
    align: 'center',
    key: 'asst_dc_sr_bms',
    children: [
      {
        title: 'Prescribed Period',
        key: 'prescribed_period_bms',
        sortable: false,
        align: 'center',
        width: '150px',
        nowrap: true
      },
      {
        title: 'Reviewed By',
        key: 'reviewed_by_bms',
        sortable: false,
        align: 'center',
        width: '150px',
        nowrap: true
      },
      {
        title: 'Date and Time Forwarded to DC',
        key: 'date_time_forwarded_bms',
        sortable: false,
        align: 'center',
        width: '150px',
        nowrap: true
      },
      {
        title: 'No. of Working Days/ Working Hours/ Calendar Days Acted Upon',
        key: 'num_working_days_bms',
        sortable: false,
        align: 'center',
        width: '150px',
        nowrap: true
      }
    ]
  },
  {
    title: 'DPAR',
    align: 'center',
    key: 'dpar',
    children: [
      {
        title: 'Prescribed Period',
        key: 'prescribed_period_dpar',
        sortable: false,
        align: 'center',
        width: '150px',
        nowrap: true
      },
      {
        title: 'Date and Time Forwarded to ARD/RD',
        key: 'date_time_forwarded_dpar',
        sortable: false,
        align: 'center',
        width: '150px',
        nowrap: true
      },
      {
        title: 'No. of Working Days/ Working Hours/ Calendar Days Acted Upon',
        key: 'num_working_days_dpar',
        sortable: false,
        align: 'center',
        width: '150px',
        nowrap: true
      }
    ]
  },
  {
    title: 'OPAR',
    key: 'opar',
    align: 'center',
    children: [
      {
        title: 'Prescribed Period',
        key: 'prescribed_period_opar',
        sortable: false,
        align: 'center',
        width: '150px',
        nowrap: true
      },
      {
        title: 'Date and Time Released',
        key: 'date_time_forwarded_opar',
        sortable: false,
        align: 'center',
        width: '150px',
        nowrap: true
      },
      {
        title: 'No. of Working Days/ Working Hours/ Calendar Days Acted Upon',
        key: 'num_working_days_opar',
        sortable: false,
        align: 'center',
        width: '150px',
        nowrap: true
      }
    ]
  },
  {
    title: 'Remarks',
    key: 'remarks',
    align: 'center',
    sortable: false,
    width: '150px'
  },
  {
    title: 'Status',
    key: 'status',
    align: 'center',
    sortable: false,
    width: '150px'
  },
  {
    title: 'Output/Released Documents',
    key: 'output_released_documents',
    align: 'center',
    sortable: false,
    width: '150px'
  },
  {
    title: 'CSS Submission Date',
    key: 'css_submission_date',
    align: 'center',
    sortable: false,
    width: '150px'
  }
]
