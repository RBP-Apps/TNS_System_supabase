import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import supabase from "@/lib/supabase"
import { formatDateForInput, convertNumberToWords } from "@/lib/history-utils"
import { VoucherData, generateColoredVoucherPDF } from "@/lib/voucher-exports"

export interface MasterData {
  companyNames: string[]
  transactionTypes: string[]
  projects: string[]
  bankAccounts: string[]
  uniqueNames: string[]
  purposes: string[]
}

export const useHistoryData = () => {
  // Authentication & roles info (to be synchronized with page)
  const [userRole, setUserRole] = useState("user")
  const [username, setUsername] = useState("User")

  // Master options data
  const [masterData, setMasterData] = useState<MasterData>({
    companyNames: [],
    transactionTypes: [],
    projects: [],
    bankAccounts: [],
    uniqueNames: [],
    purposes: [],
  })
  const [loadingMasterData, setLoadingMasterData] = useState(true)

  // Vouchers state
  const [vouchers, setVouchers] = useState<VoucherData[]>([])
  const [loading, setLoading] = useState(true)
  const [isRefetching, setIsRefetching] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  // Tab state
  const [recordType, setRecordType] = useState<"Debit" | "Credit" | "Transfer">("Debit")

  // Search & Filters state
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
  const [selectedCompany, setSelectedCompany] = useState("all")
  const [selectedProject, setSelectedProject] = useState("all")
  const [selectedPurpose, setSelectedPurpose] = useState("all")
  const [selectedTransactionType, setSelectedTransactionType] = useState("all")
  const [selectedName, setSelectedName] = useState("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  // Amount Filters
  const [amountFrom, setAmountFrom] = useState("")
  const [debouncedAmountFrom, setDebouncedAmountFrom] = useState("")
  const [amountTo, setAmountTo] = useState("")
  const [debouncedAmountTo, setDebouncedAmountTo] = useState("")

  // Edit / View modal state
  const [selectedVoucher, setSelectedVoucher] = useState<VoucherData | null>(null)
  const [showFullDetails, setShowFullDetails] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editVoucher, setEditVoucher] = useState<VoucherData | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [deletingVoucherId, setDeletingVoucherId] = useState<string | null>(null)

  const fetchIdRef = useRef(0)
  const hasLoadedRef = useRef(false)

  // Debouncing Search Term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchTerm])

  // Debouncing Amounts
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedAmountFrom(amountFrom)
    }, 500)
    return () => clearTimeout(timer)
  }, [amountFrom])

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedAmountTo(amountTo)
    }, 500)
    return () => clearTimeout(timer)
  }, [amountTo])

  // Fetch Master Dropdown Options
  const fetchMasterData = useCallback(async () => {
    try {
      setLoadingMasterData(true)

      const companies = new Set<string>()
      const transactionTypes = new Set<string>()
      const projects = new Set<string>()
      const bankAccounts = new Set<string>()
      const names = new Set<string>()
      const purposes = new Set<string>()

      if (recordType === "Debit") {
        const [masterRes, contraMasterRes, beneficiaryRes, historyRes] = await Promise.all([
          supabase.from("master").select("company_name, project, bank_ac_from"),
          supabase.from("contra_master").select("company_name, bank_name, account_no"),
          supabase.from("tns_master").select("beneficiary_name"),
          supabase.from("History").select("transaction_type, purpose_of_payment, bank_ac_from").order("created_date", { ascending: false }).limit(200)
        ])

        if (masterRes.data) {
          masterRes.data.forEach((row) => {
            if (row.company_name) companies.add(row.company_name)
            if (row.project) projects.add(row.project)
            if (row.bank_ac_from) bankAccounts.add(row.bank_ac_from)
          })
        }
        if (contraMasterRes.data) {
          contraMasterRes.data.forEach((row) => {
            if (row.company_name) companies.add(row.company_name)
            if (row.bank_name && row.account_no) {
              const last4 = row.account_no.slice(-4)
              bankAccounts.add(`${row.bank_name} - ${last4}`)
              bankAccounts.add(`${row.bank_name} - ${row.account_no}`)
            }
          })
        }
        if (beneficiaryRes.data) {
          beneficiaryRes.data.forEach((row) => {
            if (row.beneficiary_name) names.add(row.beneficiary_name)
          })
        }
        if (historyRes.data) {
          historyRes.data.forEach((row) => {
            if (row.transaction_type) transactionTypes.add(row.transaction_type)
            if (row.purpose_of_payment) purposes.add(row.purpose_of_payment)
            if (row.bank_ac_from) bankAccounts.add(row.bank_ac_from)
          })
        }
      } else if (recordType === "Credit") {
        const [masterRes, contraMasterRes, beneficiaryRes, creditRes] = await Promise.all([
          supabase.from("master").select("company_name, project, bank_ac_from"),
          supabase.from("contra_master").select("company_name, bank_name, account_no"),
          supabase.from("tns_master").select("beneficiary_name"),
          supabase.from("Credit").select("transaction_type, purpose_of_payment, bank_ac_from").order("created_date", { ascending: false }).limit(200)
        ])

        if (masterRes.data) {
          masterRes.data.forEach((row) => {
            if (row.company_name) companies.add(row.company_name)
            if (row.project) projects.add(row.project)
            if (row.bank_ac_from) bankAccounts.add(row.bank_ac_from)
          })
        }
        if (contraMasterRes.data) {
          contraMasterRes.data.forEach((row) => {
            if (row.company_name) companies.add(row.company_name)
            if (row.bank_name && row.account_no) {
              const last4 = row.account_no.slice(-4)
              bankAccounts.add(`${row.bank_name} - ${last4}`)
              bankAccounts.add(`${row.bank_name} - ${row.account_no}`)
            }
          })
        }
        if (beneficiaryRes.data) {
          beneficiaryRes.data.forEach((row) => {
            if (row.beneficiary_name) names.add(row.beneficiary_name)
          })
        }
        if (creditRes.data) {
          creditRes.data.forEach((row) => {
            if (row.transaction_type) transactionTypes.add(row.transaction_type)
            if (row.purpose_of_payment) purposes.add(row.purpose_of_payment)
            if (row.bank_ac_from) bankAccounts.add(row.bank_ac_from)
          })
        }
      } else if (recordType === "Transfer") {
        const [masterRes, contraMasterRes, contraRes] = await Promise.all([
          supabase.from("master").select("company_name, project, bank_ac_from"),
          supabase.from("contra_master").select("company_name, bank_name, account_no"),
          supabase.from("Contra").select("transaction_type, purpose, bank_ac_from").order("created_at", { ascending: false }).limit(200)
        ])

        if (masterRes.data) {
          masterRes.data.forEach((row) => {
            if (row.company_name) companies.add(row.company_name)
            if (row.bank_ac_from) bankAccounts.add(row.bank_ac_from)
          })
        }
        if (contraMasterRes.data) {
          contraMasterRes.data.forEach((row) => {
            if (row.company_name) companies.add(row.company_name)
            if (row.bank_name && row.account_no) {
              const last4 = row.account_no.slice(-4)
              bankAccounts.add(`${row.bank_name} - ${last4}`)
              bankAccounts.add(`${row.bank_name} - ${row.account_no}`)
            }
          })
        }
        if (contraRes.data) {
          contraRes.data.forEach((row) => {
            if (row.transaction_type) transactionTypes.add(row.transaction_type)
            if (row.purpose) purposes.add(row.purpose)
            if (row.bank_ac_from) bankAccounts.add(row.bank_ac_from)
          })
        }
      }

      setMasterData({
        companyNames: Array.from(companies).sort(),
        transactionTypes: Array.from(transactionTypes).sort(),
        projects: Array.from(projects).sort(),
        bankAccounts: Array.from(bankAccounts).sort(),
        uniqueNames: Array.from(names).sort(),
        purposes: Array.from(purposes).sort(),
      })
    } catch (error) {
      console.error("Failed to fetch master filter options:", error)
    } finally {
      setLoadingMasterData(false)
    }
  }, [recordType])

  // Process Real data into React structures
  const processRealSupabaseData = useCallback((data: any[], currentRecordType: typeof recordType) => {
    if (!data) {
      setVouchers([])
      return
    }

    const mappedVouchers = data
      .map((row: any) => {
        if (currentRecordType === "Debit" && !row.voucher_no) return null

        return {
          id: row.id ? row.id.toString() : "",
          timestamp: row.created_date || row.created_at || "",
          voucherNo: row.voucher_no || "",
          bankAcFrom: row.bank_ac_from || "",
          companyName: row.company_name || "",
          dateOfPaymentProcess: row.date_of_payment || "",
          purposeOfPayment: row.purpose_of_payment || row.purpose || "",
          transactionType: row.transaction_type || "",
          project: row.project || "",
          beneficiaryName: row.beneficiary_name || row.beneficiary_ac_name || row.bank_ac_to || "",
          poNumber: row.po_number || "",
          utrNumber: row.utr_number || "",
          beneficiaryAcName: row.beneficiary_ac_name || row.bank_ac_to || "",
          beneficiaryAcNumber: row.beneficiary_ac_number || row.bank_ac_number_to || "",
          beneficiaryBankName: row.beneficiary_bank_name || row.bank_name_to || "",
          beneficiaryBankIfsc: row.beneficiary_bank_ifsc || row.ifsc_to || "",
          particulars: row.particulars || "",
          amount: row.amount ? String(row.amount) : "0",
          amountInWords: row.amount_in_words || "",
          entryDoneBy: row.entry_done_by || "",
          checkedBy: row.checked_by || "",
          approvedBy: row.approved_by || "",
          pdfLink: row.pdf_link || "",
          name: row.name || "",
          dateOfPayment: row.created_date || row.created_at || "",
          originalRowIndex: row.id,
          recordType: currentRecordType,
        } as VoucherData
      })
      .filter((voucher): voucher is VoucherData => Boolean(voucher))

    setVouchers(mappedVouchers)
  }, [])

  // Fetch Logic with automatic background loop
  const fetchRealHistoryData = useCallback(async () => {
    try {
      setLoading(true)

      let searchFilter = null
      if (debouncedSearchTerm) {
        if (recordType === "Debit") {
          searchFilter = [
            `voucher_no.ilike.%${debouncedSearchTerm}%`,
            `beneficiary_name.ilike.%${debouncedSearchTerm}%`,
            `project.ilike.%${debouncedSearchTerm}%`,
            `purpose_of_payment.ilike.%${debouncedSearchTerm}%`,
            `company_name.ilike.%${debouncedSearchTerm}%`,
            `bank_ac_from.ilike.%${debouncedSearchTerm}%`,
            `transaction_type.ilike.%${debouncedSearchTerm}%`,
            `name.ilike.%${debouncedSearchTerm}%`,
            `po_number.ilike.%${debouncedSearchTerm}%`,
            `utr_number.ilike.%${debouncedSearchTerm}%`,
            `beneficiary_ac_name.ilike.%${debouncedSearchTerm}%`,
            `beneficiary_ac_number.ilike.%${debouncedSearchTerm}%`,
            `beneficiary_bank_name.ilike.%${debouncedSearchTerm}%`,
            `beneficiary_bank_ifsc.ilike.%${debouncedSearchTerm}%`,
            `particulars.ilike.%${debouncedSearchTerm}%`,
            `amount_in_words.ilike.%${debouncedSearchTerm}%`,
            `entry_done_by.ilike.%${debouncedSearchTerm}%`,
            `checked_by.ilike.%${debouncedSearchTerm}%`,
            `approved_by.ilike.%${debouncedSearchTerm}%`
          ].join(",")
        } else if (recordType === "Credit") {
          searchFilter = [
            `beneficiary_name.ilike.%${debouncedSearchTerm}%`,
            `company_name.ilike.%${debouncedSearchTerm}%`,
            `bank_ac_from.ilike.%${debouncedSearchTerm}%`,
            `purpose_of_payment.ilike.%${debouncedSearchTerm}%`,
            `transaction_type.ilike.%${debouncedSearchTerm}%`,
            `project.ilike.%${debouncedSearchTerm}%`,
            `utr_number.ilike.%${debouncedSearchTerm}%`,
            `particulars.ilike.%${debouncedSearchTerm}%`,
            `amount_in_words.ilike.%${debouncedSearchTerm}%`,
            `entry_done_by.ilike.%${debouncedSearchTerm}%`,
            `checked_by.ilike.%${debouncedSearchTerm}%`
          ].join(",")
        } else if (recordType === "Transfer") {
          searchFilter = [
            `company_name.ilike.%${debouncedSearchTerm}%`,
            `bank_ac_from.ilike.%${debouncedSearchTerm}%`,
            `purpose.ilike.%${debouncedSearchTerm}%`,
            `transaction_type.ilike.%${debouncedSearchTerm}%`,
            `utr_number.ilike.%${debouncedSearchTerm}%`,
            `bank_ac_to.ilike.%${debouncedSearchTerm}%`,
            `bank_ac_number_to.ilike.%${debouncedSearchTerm}%`,
            `bank_name_to.ilike.%${debouncedSearchTerm}%`,
            `ifsc_to.ilike.%${debouncedSearchTerm}%`,
            `particulars.ilike.%${debouncedSearchTerm}%`,
            `amount_in_words.ilike.%${debouncedSearchTerm}%`,
            `approved_by.ilike.%${debouncedSearchTerm}%`
          ].join(",")
        }
      }

      let COLUMNS = ""
      if (recordType === "Debit") {
        COLUMNS = [
          "id", "voucher_no", "created_date", "date_of_payment", "company_name",
          "beneficiary_name", "purpose_of_payment", "project", "amount", "transaction_type",
          "name", "pdf_link", "bank_ac_from", "po_number", "utr_number", "beneficiary_ac_name",
          "beneficiary_ac_number", "beneficiary_bank_name", "beneficiary_bank_ifsc",
          "particulars", "amount_in_words", "entry_done_by", "checked_by", "approved_by"
        ].join(",")
      } else if (recordType === "Credit") {
        COLUMNS = [
          "id", "created_date", "date_of_payment", "company_name",
          "beneficiary_name", "amount", "amount_in_words", "bank_ac_from",
          "purpose_of_payment", "transaction_type", "project", "utr_number",
          "particulars", "entry_done_by", "checked_by", "pdf_link"
        ].join(",")
      } else if (recordType === "Transfer") {
        COLUMNS = [
          "id", "created_at", "date_of_payment", "company_name",
          "bank_ac_from", "purpose", "transaction_type", "utr_number",
          "bank_ac_to", "bank_ac_number_to", "bank_name_to", "ifsc_to",
          "particulars", "amount", "amount_in_words", "approved_by", "pdf_link"
        ].join(",")
      }

      let actualTableName = "History"
      if (recordType === "Credit") actualTableName = "Credit"
      else if (recordType === "Transfer") actualTableName = "Contra"

      let mainQuery = supabase.from(actualTableName).select(COLUMNS, { count: "exact" })

      const applyFilters = (q: any) => {
        if (searchFilter) {
          q = q.or(searchFilter)
        }
        if (selectedCompany !== "all") {
          q = q.eq("company_name", selectedCompany)
        }
        if (selectedProject !== "all" && recordType !== "Transfer") {
          q = q.eq("project", selectedProject)
        }
        if (selectedPurpose !== "all") {
          if (recordType === "Transfer") {
            q = q.eq("purpose", selectedPurpose)
          } else {
            q = q.eq("purpose_of_payment", selectedPurpose)
          }
        }
        if (selectedTransactionType !== "all") {
          q = q.eq("transaction_type", selectedTransactionType)
        }
        if (selectedName !== "all") {
          if (recordType === "Transfer") {
            q = q.eq("bank_ac_to", selectedName)
          } else {
            q = q.eq("beneficiary_name", selectedName)
          }
        }
        if (dateFrom) q = q.gte("date_of_payment", dateFrom)
        if (dateTo) q = q.lte("date_of_payment", dateTo)
        if (debouncedAmountFrom) q = q.gte("amount", debouncedAmountFrom)
        if (debouncedAmountTo) q = q.lte("amount", debouncedAmountTo)
        return q
      }

      mainQuery = applyFilters(mainQuery)

      const currentFetchId = ++fetchIdRef.current
      let start = 0
      const orderColumn = (recordType === "Transfer") ? "created_at" : "created_date"

      const INITIAL_PAGE_SIZE = 100
      const BG_CHUNK_SIZE = 1000

      mainQuery = mainQuery.order(orderColumn, { ascending: false }).range(start, start + INITIAL_PAGE_SIZE - 1)
      const mainResult = await mainQuery

      if (mainResult.error) throw mainResult.error

      if (currentFetchId !== fetchIdRef.current) return

      let loadedRecords = mainResult.data || []
      processRealSupabaseData(loadedRecords, recordType)

      if (loadedRecords.length === INITIAL_PAGE_SIZE) {
        ;(async () => {
          let hasMore = true
          let currentStart = start + INITIAL_PAGE_SIZE

          while (hasMore) {
            if (currentFetchId !== fetchIdRef.current) break

            let bgQuery = supabase.from(actualTableName).select(COLUMNS)
            bgQuery = applyFilters(bgQuery)

            const nextResult = await bgQuery
              .order(orderColumn, { ascending: false })
              .range(currentStart, currentStart + BG_CHUNK_SIZE - 1)

            if (nextResult.error) {
              console.error("Background fetch error:", nextResult.error)
              break
            }

            if (currentFetchId !== fetchIdRef.current) break

            const nextData = nextResult.data || []
            if (nextData.length === 0) {
              hasMore = false
              break
            }

            loadedRecords = [...loadedRecords, ...nextData]

            if (nextData.length < BG_CHUNK_SIZE) {
              hasMore = false
            } else {
              currentStart += BG_CHUNK_SIZE
            }
          }

          if (currentFetchId === fetchIdRef.current) {
            processRealSupabaseData(loadedRecords, recordType)
          }
        })()
      }

      hasLoadedRef.current = true
    } catch (error) {
      console.error("Failed to fetch real data:", error)
      alert("Error fetching data. Please check filters and try again.")
    } finally {
      setLoading(false)
      setIsRefetching(false)
    }
  }, [
    recordType,
    debouncedSearchTerm,
    selectedCompany,
    selectedProject,
    selectedPurpose,
    selectedTransactionType,
    selectedName,
    dateFrom,
    dateTo,
    debouncedAmountFrom,
    debouncedAmountTo,
    processRealSupabaseData,
  ])

  // Triggers reload on filter or tab changes
  useEffect(() => {
    fetchRealHistoryData()
  }, [fetchRealHistoryData])

  // Triggers reload of master filter dropdowns on tab changes
  useEffect(() => {
    fetchMasterData()
  }, [fetchMasterData])

  // Amount inputs handling
  const handleAmountChange = useCallback((type: "From" | "To", val: string) => {
    if (type === "From") {
      setAmountFrom(val)
    } else {
      setAmountTo(val)
    }
  }, [])

  // Master Clear Filters
  const clearAllFilters = useCallback(() => {
    setSearchTerm("")
    setSelectedCompany("all")
    setSelectedProject("all")
    setSelectedPurpose("all")
    setSelectedTransactionType("all")
    setSelectedName("all")
    setDateFrom("")
    setDateTo("")
    setAmountFrom("")
    setAmountTo("")
  }, [])

  // Modals operations
  const openEditModal = useCallback((voucher: VoucherData) => {
    setEditVoucher({
      ...voucher,
      dateOfPaymentProcess: formatDateForInput(voucher.dateOfPaymentProcess || voucher.timestamp),
    })
    setIsEditModalOpen(true)
  }, [])

  const closeEditModal = useCallback(() => {
    setIsEditModalOpen(false)
    setEditVoucher(null)
  }, [])

  const handleInputChange = useCallback((field: string, value: any) => {
    setEditVoucher((prev) => {
      if (!prev) return null
      return {
        ...prev,
        [field]: value,
      }
    })
  }, [])

  const handleEditAmountChange = useCallback((value: string) => {
    if (!editVoucher) return

    setEditVoucher((prev) => (prev ? { ...prev, amount: value } : null))

    const numValue = Number.parseFloat(value)
    if (!isNaN(numValue) && numValue > 0) {
      const words = convertNumberToWords(numValue) + " Rupees Only"
      setEditVoucher((prev) => (prev ? { ...prev, amountInWords: words } : null))
    } else {
      setEditVoucher((prev) => (prev ? { ...prev, amountInWords: "" } : null))
    }
  }, [editVoucher])

  const updateVoucherInSupabase = async (voucher: VoucherData) => {
    let tableName = "History"
    if (voucher.recordType === "Credit") tableName = "Credit"
    else if (voucher.recordType === "Transfer") tableName = "Contra"

    let payload: any = {}
    if (voucher.recordType === "Transfer") {
      payload = {
        bank_ac_from: voucher.bankAcFrom || null,
        company_name: voucher.companyName || null,
        date_of_payment: voucher.dateOfPaymentProcess || null,
        purpose: voucher.purposeOfPayment || null,
        transaction_type: voucher.transactionType || null,
        utr_number: voucher.utrNumber || null,
        bank_ac_to: voucher.beneficiaryAcName || voucher.beneficiaryName || null,
        bank_ac_number_to: voucher.beneficiaryAcNumber || null,
        bank_name_to: voucher.beneficiaryBankName || null,
        ifsc_to: voucher.beneficiaryBankIfsc || null,
        particulars: voucher.particulars || null,
        amount: parseFloat(voucher.amount) || 0,
        amount_in_words: voucher.amountInWords || null,
        approved_by: voucher.approvedBy || null,
        pdf_link: voucher.pdfLink || null,
      }
    } else if (voucher.recordType === "Credit") {
      payload = {
        bank_ac_from: voucher.bankAcFrom || null,
        company_name: voucher.companyName || null,
        date_of_payment: voucher.dateOfPaymentProcess || null,
        purpose_of_payment: voucher.purposeOfPayment || null,
        transaction_type: voucher.transactionType || null,
        project: voucher.project || null,
        beneficiary_name: voucher.beneficiaryName || null,
        utr_number: voucher.utrNumber || null,
        particulars: voucher.particulars || null,
        amount: parseFloat(voucher.amount) || 0,
        amount_in_words: voucher.amountInWords || null,
        entry_done_by: voucher.entryDoneBy || null,
        checked_by: voucher.checkedBy || null,
        pdf_link: voucher.pdfLink || null,
      }
    } else {
      payload = {
        bank_ac_from: voucher.bankAcFrom || null,
        company_name: voucher.companyName || null,
        date_of_payment: voucher.dateOfPaymentProcess || null,
        purpose_of_payment: voucher.purposeOfPayment || null,
        transaction_type: voucher.transactionType || null,
        project: voucher.project || null,
        beneficiary_name: voucher.beneficiaryName || null,
        po_number: voucher.poNumber || null,
        utr_number: voucher.utrNumber || null,
        beneficiary_ac_name: voucher.beneficiaryAcName || null,
        beneficiary_ac_number: voucher.beneficiaryAcNumber || null,
        beneficiary_bank_name: voucher.beneficiaryBankName || null,
        beneficiary_bank_ifsc: voucher.beneficiaryBankIfsc || null,
        particulars: voucher.particulars || null,
        amount: parseFloat(voucher.amount) || 0,
        amount_in_words: voucher.amountInWords || null,
        entry_done_by: voucher.entryDoneBy || null,
        checked_by: voucher.checkedBy || null,
        approved_by: voucher.approvedBy || null,
        pdf_link: voucher.pdfLink || null,
        name: voucher.name || null,
      }
    }

    const { error } = await supabase
      .from(tableName)
      .update(payload)
      .eq("id", voucher.id)

    if (error) throw new Error(error.message || "Update failed")
    return true
  }

  // Edit Modal form submit
  const handleEditSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editVoucher) return

    try {
      setIsUpdating(true)

      // Generate colored professional PDF blob
      const { pdfBlob, fileName } = await generateColoredVoucherPDF(editVoucher)

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("vouchers")
        .upload(fileName, pdfBlob, {
          contentType: "application/pdf",
          upsert: true,
        })

      if (uploadError) {
        throw new Error("PDF upload failed: " + uploadError.message)
      }

      const { data: publicUrlData } = supabase.storage
        .from("vouchers")
        .getPublicUrl(fileName)

      const pdfUrl = publicUrlData.publicUrl

      const updatedVoucher = {
        ...editVoucher,
        pdfLink: pdfUrl,
      }

      // Update database row
      await updateVoucherInSupabase(updatedVoucher)

      // Update local state array
      setVouchers((prev) => prev.map((v) => (v.id === editVoucher.id ? updatedVoucher : v)))

      // Reload
      fetchRealHistoryData()

      closeEditModal()
      alert("Voucher updated successfully with colorful professional layout!")
    } catch (error) {
      console.error("Update failed:", error)
      alert(`Update failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsUpdating(false)
    }
  }, [editVoucher, fetchRealHistoryData, closeEditModal])

  // Delete operation
  const deleteVoucher = useCallback(async (voucherId: string) => {
    const recordLabel = recordType === "Debit" ? "voucher" : "credit record"
    if (!confirm(`Are you sure you want to permanently delete this ${recordLabel}?`)) {
      return
    }

    try {
      setDeletingVoucherId(voucherId)
      setLoading(true)

      let tableName = "History"
      if (recordType === "Credit") tableName = "Credit"
      else if (recordType === "Transfer") tableName = "Contra"

      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq("id", voucherId)

      if (error) {
        throw new Error(error.message || "Delete operation failed")
      }

      setVouchers((prev) => prev.filter((v) => v.id !== voucherId))
      fetchRealHistoryData()

      alert(`${recordLabel.charAt(0).toUpperCase() + recordLabel.slice(1)} deleted successfully`)
    } catch (error) {
      console.error("Voucher deletion failed:", error)
      alert(`Delete failed: ${error instanceof Error ? error.message : "Unknown error"}`)
      fetchRealHistoryData()
    } finally {
      setDeletingVoucherId(null)
      setLoading(false)
    }
  }, [recordType, fetchRealHistoryData])

  return {
    userRole,
    setUserRole,
    username,
    setUsername,
    masterData,
    loadingMasterData,
    vouchers,
    loading,
    isRefetching,
    isExporting,
    setIsExporting,
    setIsRefetching,
    recordType,
    setRecordType,
    searchTerm,
    setSearchTerm,
    debouncedSearchTerm,
    selectedCompany,
    setSelectedCompany,
    selectedProject,
    setSelectedProject,
    selectedPurpose,
    setSelectedPurpose,
    selectedTransactionType,
    setSelectedTransactionType,
    selectedName,
    setSelectedName,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    amountFrom,
    handleAmountChange,
    amountTo,
    debouncedAmountFrom,
    debouncedAmountTo,
    selectedVoucher,
    setSelectedVoucher,
    showFullDetails,
    setShowFullDetails,
    isEditModalOpen,
    editVoucher,
    setEditVoucher,
    isUpdating,
    deletingVoucherId,
    openEditModal,
    closeEditModal,
    handleInputChange,
    handleEditSubmit,
    handleEditAmountChange,
    deleteVoucher,
    clearAllFilters,
    fetchRealHistoryData,
  }
}

