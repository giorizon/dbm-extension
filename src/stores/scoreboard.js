import { ref } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '@/utils/supabase.js'
import { combineDateTime } from '@/utils/helpers'
export const useScoreboardStore = defineStore('scoreboard', () => {
  const scoreboardTable = ref([])
  const scoreboardTotal = ref(0)

  function $reset() {
    scoreboardTable.value = []
    scoreboardTotal.value = 0
  }
  async function deleteScoreboardRecord(scoreboardId) {
    const { data, error, status } = await supabase
      .from('scoreboard_records')
      .delete()
      .eq('scoreboard_id', scoreboardId)
    if (error) return { error }

    return { message: 'Item has been deleted', status }
  }
  async function getScoreboardPaginated({ currentPage, perPage, column }) {
    //calculate range first

    const rangeStart = (currentPage - 1) * perPage
    const rangeEnd = rangeStart + perPage - 1

    const { data, error, _, count } = await supabase
      .from('scoreboard_records')
      .select(
        'scoreboard_id, agency_name, css_submission_date, date_time_received,dms_reference_number, output_released_documents,remarks, pap:pap(code), ts:ts_in_charge(name), transaction_type:type_of_transactions(transaction_type), report_records:report_records(reviewed_by, date_time_forwarded, num_working_time, prescribed_period:prescribed_periods(prescribed_period_value), report:reports(report_name)), status:status(status_name)',
        { count: 'exact' }
      )
      .range(rangeStart, rangeEnd)
    if (error) {
      return { error }
    }
    //data transformation to fit into table
    const scoreboardData = data.map((scoreboardData) => {
      let reportsObj = {}
      scoreboardData.report_records.forEach((reportData) => {
        if (reportData.report.report_name === 'Asst. DC/Sr. BMS') {
          reportsObj = {
            ...reportsObj,
            date_time_forwarded_bms: reportData.date_time_forwarded,
            num_working_days_bms: reportData.num_working_time,
            reviewed_by_bms: reportData.reviewed_by,
            prescribed_period_bms: reportData.prescribed_period?.prescribed_period_value
          }
          return
        }
        const lowerReportName = reportData.report.report_name.toLowerCase()
        reportsObj = {
          ...reportsObj,
          [`date_time_forwarded_${lowerReportName}`]: reportData.date_time_forwarded,
          [`num_working_days_${lowerReportName}`]: reportData.num_working_time,
          [`prescribed_period_${lowerReportName}`]:
            reportData.prescribed_period?.prescribed_period_value
        }
      })
      const transformedData = {
        ...scoreboardData,
        pap: scoreboardData.pap.code,
        status: scoreboardData.status?.status_name,
        transaction_type: scoreboardData.transaction_type.transaction_type,
        ts: scoreboardData.ts.name,
        ...reportsObj
      }
      return transformedData
    })
    scoreboardTotal.value = count
    scoreboardTable.value = scoreboardData
  }
  async function fetchPaps() {
    const { data: papResults, error } = await supabase.from('pap').select('id, code')
    if (error) {
      throw new Error(error)
    }
    return papResults
  }
  async function fetchTypeOfTransactionList(prescribedPeriod = false) {
    //fetch transactions with its associated prescribed period value and the report it belongs

    if (prescribedPeriod) {
      const { data: typeOfTransactionResult, error } = await supabase
        .from('type_of_transactions')
        .select(
          'transaction_type, prescribed_periods(prescribed_periods_id, prescribed_period_value, report:reports(report_id, report_name, date_time_forwarded_to))'
        )
      if (error) {
        throw new Error(error)
      }
      return typeOfTransactionResult
    }

    const { data: typeOfTransactionResult, error } = await supabase
      .from('type_of_transactions')
      .select('transaction_type')
    if (error) {
      throw new Error(error)
    }
    return typeOfTransactionResult.map((transaction) => transaction.transaction_type)
  }
  async function fetchTs() {
    const { data: tsResults, error } = await supabase.from('ts_in_charge').select('tic_id, name')
    if (error) {
      throw new Error(error)
    }
    return tsResults
  }

  async function fetchNatureOfRequest() {
    const { data: norList, error } = await supabase.from('nature_of_transaction').select('noq_name')
    if (error) {
      throw new Error(error)
    }
    return norList.map((ts) => ts.noq_name)
  }
  async function fetchStatuses() {
    const { data, error } = await supabase.from('status').select('id, status_name')
    if (error) {
      throw new Error(error)
    }
    return data
  }
  async function fetchScoreboardOptions() {
    try {
      return await Promise.all([
        fetchNatureOfRequest(),
        fetchTs(),
        fetchPaps(),
        fetchTypeOfTransactionList(true),
        fetchStatuses()
      ])
    } catch (error) {
      return { error }
    }
  }
  //this calls a lot of supabase trip bc I did not store the ids of these foreign values for scoreboard
  async function insertScoreboardData(formData) {
    //testing the loading and disabling
    await new Promise((resolve) => {
      setTimeout(resolve, 1000)
    })
    const { reportsData, ...extractedFormData } = formData

    //setting timestamp, combining selected date and time
    const combinedDateTime = combineDateTime(
      extractedFormData.dateReceivedRecordSection,
      extractedFormData.timeReceivedRecordSection
    )

    const { data, error } = await supabase
      .from('scoreboard_records')
      .insert({
        pap_id: extractedFormData.particulars.pap,
        ts_in_charge_id: extractedFormData.particulars.ts,
        transaction_type: extractedFormData.typeOfTransaction,
        agency_name: extractedFormData.particulars.agency,
        dms_reference_number: extractedFormData.dmsReferenceNumber,
        date_time_received: combinedDateTime,
        remarks: extractedFormData.remarks,
        status_id: extractedFormData.status,
        output_released_documents: extractedFormData.outputReleasedDocuments,
        css_submission_date: new Date(Date.now())
      })
      .select('scoreboard_id')
    if (error) {
      return { error: error }
    }
    //add reviewed by here only on ASST. DC
    const transformedReportData = reportsData.map((reportItem) => {
      const combinedDateTime = combineDateTime(reportItem.dateForwarded, reportItem.timeForwarded)
      return {
        report_id: reportItem.report.report_id,
        scoreboard_id: data[0].scoreboard_id,
        date_time_forwarded: combinedDateTime,
        num_working_time: reportItem.numWorkingDays,
        prescribed_period_id: reportItem.prescribed_period_id,
        reviewed_by: reportItem.reviewedBy
      }
    })
    const { reportError } = await supabase.from('report_records').insert(transformedReportData)
    if (reportError) {
      return { error: reportError }
    }
    return { data: `Succesfully inserted with scoreboard id ${data[0].scoreboard_id}` }
  }
  return {
    scoreboardTotal,
    scoreboardTable,
    getScoreboardPaginated,
    insertScoreboardData,
    fetchScoreboardOptions,
    deleteScoreboardRecord,
    $reset
  }
})
