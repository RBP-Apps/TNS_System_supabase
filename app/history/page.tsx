"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import type React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { LogOut, History, Save, Building2, DollarSign, ArrowLeft, RefreshCw, X, ArrowUpRight, ArrowDownLeft } from "lucide-react"

import {
  FileText,
  Download,
  Search,
  Filter,
  Calendar,
  IndianRupee,
  ChevronDown,
  Loader2,
  BarChart3,
  Database,
  Users,
  ChevronRight,
  FileSpreadsheet,
  Trash2,
} from "lucide-react"
import * as XLSX from "xlsx"
import supabase from "@/lib/supabase"
import EditVoucherModal from "@/components/history/EditVoucherModal"
import VoucherFilters from "@/components/history/VoucherFilters"


interface VoucherData {
  id: string
  voucherNo: string
  dateOfPayment: string
  companyName: string
  beneficiaryName: string
  purposeOfPayment: string
  project: string
  amount: string
  transactionType: string
  timestamp: string
  bankAcFrom: string
  dateOfPaymentProcess: string
  poNumber: string
  beneficiaryAcName: string
  beneficiaryAcNumber: string
  beneficiaryBankName: string
  beneficiaryBankIfsc: string
  particulars: string
  amountInWords: string
  entryDoneBy: string
  checkedBy: string
  approvedBy: string
  pdfLink: string
  name: string
  originalRowIndex?: number
  [key: string]: any
}

interface MasterData {
  companyNames: string[]
  transactionTypes: string[]
  projects: string[]
  bankAccounts: string[]
  uniqueNames: string[]
  purposes: string[]
}

// Pure helper — outside component so it is never re-created on each render
const convertNumberToWords = (num: number): string => {
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"]
  const teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"]
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]
  if (num === 0) return "Zero"
  if (num < 10) return ones[num]
  if (num < 20) return teens[num - 10]
  if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? " " + ones[num % 10] : "")
  if (num < 1000) return ones[Math.floor(num / 100)] + " Hundred" + (num % 100 ? " " + convertNumberToWords(num % 100) : "")
  if (num < 100000) return convertNumberToWords(Math.floor(num / 1000)) + " Thousand" + (num % 1000 ? " " + convertNumberToWords(num % 1000) : "")
  if (num < 10000000) return convertNumberToWords(Math.floor(num / 100000)) + " Lakh" + (num % 100000 ? " " + convertNumberToWords(num % 100000) : "")
  return convertNumberToWords(Math.floor(num / 10000000)) + " Crore" + (num % 10000000 ? " " + convertNumberToWords(num % 10000000) : "")
}

export default function HistoryPage() {
  const router = useRouter()
  const [vouchers, setVouchers] = useState<VoucherData[]>([])
  const [loading, setLoading] = useState(true)       // true only on first load
  const [isRefetching, setIsRefetching] = useState(false) // true on subsequent fetches
  const [isExporting, setIsExporting] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedVoucher, setSelectedVoucher] = useState<VoucherData | null>(null)
  const [userRole, setUserRole] = useState("")
  const [username, setUsername] = useState("")
  const [showFullDetails, setShowFullDetails] = useState(false)
  const [recordType, setRecordType] = useState<"Debit" | "Credit" | "Transfer">("Debit")

  // Refs to manage fetch flow without extra re-renders
  const hasLoadedRef = useRef(false)
  const skipNextFetchRef = useRef(false)
  const filterSignatureRef = useRef("")
  const fetchIdRef = useRef(0)

  // Master data state for dropdowns
  const [masterData, setMasterData] = useState<MasterData>({
    companyNames: [],
    transactionTypes: [],
    projects: [],
    bankAccounts: [],
    uniqueNames: [],
    purposes: []
  })
  const [loadingMasterData, setLoadingMasterData] = useState(false)

  // Filter states
  const [selectedCompany, setSelectedCompany] = useState("all")
  const [selectedProject, setSelectedProject] = useState("all")
  const [selectedPurpose, setSelectedPurpose] = useState("all")
  const [selectedTransactionType, setSelectedTransactionType] = useState("all")
  const [selectedName, setSelectedName] = useState("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [amountFrom, setAmountFrom] = useState("")
  const [amountTo, setAmountTo] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(50)
  const [totalCount, setTotalCount] = useState(0)
  const [serverTotalAmount, setServerTotalAmount] = useState(0)
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
  const [debouncedAmountFrom, setDebouncedAmountFrom] = useState("")
  const [debouncedAmountTo, setDebouncedAmountTo] = useState("")

  // Debounce search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 600)
    return () => clearTimeout(timer)
  }, [searchTerm])

  // Debounce amountFrom filter
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedAmountFrom(amountFrom)
    }, 600)
    return () => clearTimeout(timer)
  }, [amountFrom])

  // Debounce amountTo filter
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedAmountTo(amountTo)
    }, 600)
    return () => clearTimeout(timer)
  }, [amountTo])

  // Single merged effect: prevents double-fetch when filters change
  useEffect(() => {
    fetchRealHistoryData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchTerm, selectedCompany, selectedProject, selectedPurpose, selectedTransactionType, selectedName, dateFrom, dateTo, debouncedAmountFrom, debouncedAmountTo, recordType])

  // Edit modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editVoucher, setEditVoucher] = useState<VoucherData | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [deletingVoucherId, setDeletingVoucherId] = useState<string | null>(null)

  // handleAmountChange function (uses module-level convertNumberToWords)
  const handleAmountChange = (value: string) => {
    if (!editVoucher) return

    setEditVoucher(prev => prev ? { ...prev, amount: value } : null)

    const numValue = Number.parseFloat(value)
    if (!isNaN(numValue) && numValue > 0) {
      const words = convertNumberToWords(numValue) + " Rupees Only"
      setEditVoucher(prev => prev ? { ...prev, amountInWords: words } : null)
    } else {
      setEditVoucher(prev => prev ? { ...prev, amountInWords: "" } : null)
    }
  }

  // Function to fetch master data from Supabase (runs once on mount)
  const fetchMasterData = async () => {
    try {
      setLoadingMasterData(true)

      // Run both queries in parallel — select only the columns we need
      const [masterResult, historyResult] = await Promise.all([
        supabase
          .from('master')
          .select('company_name,transaction_type,project,bank_ac_from'),
        supabase
          .from('History')
          .select('beneficiary_name,purpose_of_payment')
      ])

      if (masterResult.error) throw new Error(masterResult.error.message)

      const masterDataArr = masterResult.data ?? []
      const historyDataArr = historyResult.data ?? []

      setMasterData({
        companyNames: [...new Set(masterDataArr.map(i => i.company_name).filter(Boolean))].sort() as string[],
        transactionTypes: [...new Set(masterDataArr.map(i => i.transaction_type).filter(Boolean))] as string[],
        projects: [...new Set(masterDataArr.map(i => i.project).filter(Boolean))].sort() as string[],
        bankAccounts: [...new Set(masterDataArr.map(i => i.bank_ac_from).filter(Boolean))] as string[],
        purposes: [...new Set(historyDataArr.map(i => i.purpose_of_payment).filter(Boolean))].sort() as string[],
        uniqueNames: [...new Set(historyDataArr.map(i => i.beneficiary_name).filter(Boolean))].sort() as string[],
      })
    } catch (error) {
      console.error("Failed to fetch master data:", error)
      setMasterData({
        companyNames: [], transactionTypes: [], projects: [],
        bankAccounts: [], uniqueNames: [], purposes: []
      })
    } finally {
      setLoadingMasterData(false)
    }
  }

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("tns_logged_in")
    const storedUserRole = localStorage.getItem("tns_user_role")
    const storedUsername = localStorage.getItem("tns_username")

    if (isLoggedIn !== "true") {
      router.push("/")
      return
    }

    setUserRole(storedUserRole || "user")
    setUsername(storedUsername || "User")
    fetchMasterData()
  }, [router])



  const formatDateForInput = (dateString: string) => {
    if (!dateString) return "";
    try {
      // Try to parse as ISO date string first
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        // If not valid ISO, try parsing as DD/MM/YYYY
        const parts = dateString.split("/");
        if (parts.length === 3) {
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1; // months are 0-indexed
          const year = parseInt(parts[2], 10);
          return new Date(year, month, day).toISOString().split("T")[0];
        }
        return "";
      }
      return date.toISOString().split("T")[0];
    } catch {
      return "";
    }
  }

  const fetchRealHistoryData = async () => {
    // First load → show full-page spinner; subsequent → subtle refetch indicator
    if (!hasLoadedRef.current) {
      setLoading(true)
    } else {
      setIsRefetching(true)
    }

    try {
      let searchFilter = null
      if (debouncedSearchTerm) {
        if (recordType === "Debit") {
          searchFilter = `voucher_no.ilike.%${debouncedSearchTerm}%,beneficiary_name.ilike.%${debouncedSearchTerm}%,project.ilike.%${debouncedSearchTerm}%,purpose_of_payment.ilike.%${debouncedSearchTerm}%,company_name.ilike.%${debouncedSearchTerm}%`
        } else if (recordType === "Credit") {
          searchFilter = `beneficiary_name.ilike.%${debouncedSearchTerm}%,company_name.ilike.%${debouncedSearchTerm}%`
        } else {
          // Transfer search
          searchFilter = `beneficiary_ac_name.ilike.%${debouncedSearchTerm}%,company_name.ilike.%${debouncedSearchTerm}%`
        }
      }

      // Only fetch columns actually used in the UI — avoids transferring large unused fields
      let COLUMNS = ""
      if (recordType === "Debit") {
        COLUMNS = [
          'id', 'voucher_no', 'created_date', 'date_of_payment', 'company_name',
          'beneficiary_name', 'purpose_of_payment', 'project', 'amount', 'transaction_type',
          'name', 'pdf_link', 'bank_ac_from', 'po_number', 'beneficiary_ac_name',
          'beneficiary_ac_number', 'beneficiary_bank_name', 'beneficiary_bank_ifsc',
          'particulars', 'amount_in_words', 'entry_done_by', 'checked_by', 'approved_by'
        ].join(',')
      } else if (recordType === "Credit") {
        COLUMNS = [
          'id', 'created_date', 'date_of_payment', 'company_name',
          'beneficiary_name', 'amount', 'amount_in_words', 'bank_ac_from',
          'purpose_of_payment', 'transaction_type', 'project', 'utr_number',
          'particulars', 'entry_done_by', 'checked_by', 'pdf_link'
        ].join(',')
      } else if (recordType === "Transfer") {
        COLUMNS = [
          'id', 'created_date', 'date_of_payment', 'company_name',
          'amount', 'amount_in_words', 'bank_ac_from', 'purpose_of_payment',
          'transaction_type', 'po_number', 'utr_number', 'beneficiary_ac_name',
          'beneficiary_ac_number', 'beneficiary_bank_name', 'beneficiary_bank_ifsc',
          'particulars', 'entry_done_by', 'approved_by', 'pdf_link'
        ].join(',')
      }

      // Using double quotes for the table name is sometimes required for case-sensitive names in Supabase
      let actualTableName = "History"
      if (recordType === "Credit") actualTableName = "Credit"
      else if (recordType === "Transfer") actualTableName = "SelfTransfer"

      let mainQuery = supabase.from(actualTableName).select(COLUMNS, { count: "exact" })

      // Apply filters
      const applyFilters = (q: any) => {
        if (searchFilter) {
          q = q.or(searchFilter)
        }

        if (selectedCompany !== "all") {
          q = q.eq("company_name", selectedCompany)
        }

        // These columns only exist in the Debit (History) and Credit tables
        if (recordType === "Debit") {
          if (selectedProject !== "all") q = q.eq("project", selectedProject)
          if (selectedPurpose !== "all") q = q.eq("purpose_of_payment", selectedPurpose)
          if (selectedTransactionType !== "all") q = q.eq("transaction_type", selectedTransactionType)
        }

        if (selectedName !== "all") {
          if (recordType === "Transfer") {
            q = q.eq("beneficiary_ac_name", selectedName)
          } else {
            q = q.eq("beneficiary_name", selectedName)
          }
        }

        // Filter by date_of_payment (Voucher Date)
        if (dateFrom) q = q.gte("date_of_payment", dateFrom)
        if (dateTo) q = q.lte("date_of_payment", dateTo)

        return q
      }

      mainQuery = applyFilters(mainQuery)

      // Track fetch task ID to avoid race conditions on tabs change / filters update
      const currentFetchId = ++fetchIdRef.current

      // Fetch first chunk (1000 records) to load the tab instantly
      let start = 0
      const CHUNK_SIZE = 1000

      mainQuery = mainQuery.order("created_date", { ascending: false }).range(start, start + CHUNK_SIZE - 1)
      const mainResult = await mainQuery

      if (mainResult.error) throw mainResult.error

      if (currentFetchId !== fetchIdRef.current) return

      let loadedRecords = mainResult.data || []
      processRealSupabaseData(loadedRecords, recordType)
      setTotalCount(mainResult.count || loadedRecords.length)
      
      // Calculate sum locally to optimize database response time
      let currentTotalAmount = loadedRecords.reduce((sum, row) => sum + (Number.parseFloat(row.amount) || 0), 0)
      setServerTotalAmount(currentTotalAmount)

      // If there are more records, fetch the rest in the background to keep tab switching fast
      if (loadedRecords.length === CHUNK_SIZE) {
        (async () => {
          let hasMore = true
          let currentStart = start + CHUNK_SIZE
          
          while (hasMore) {
            if (currentFetchId !== fetchIdRef.current) {
              break // Tab or filter changed, cancel background fetch
            }

            // Build fresh query builder
            let bgQuery = supabase.from(actualTableName).select(COLUMNS)
            bgQuery = applyFilters(bgQuery)
            
            const nextResult = await bgQuery
              .order("created_date", { ascending: false })
              .range(currentStart, currentStart + CHUNK_SIZE - 1)

            if (nextResult.error) {
              console.error("Background fetch error:", nextResult.error)
              break
            }

            if (currentFetchId !== fetchIdRef.current) {
              break // Tab or filter changed
            }

            const nextData = nextResult.data || []
            if (nextData.length === 0) {
              hasMore = false
              break
            }

            loadedRecords = [...loadedRecords, ...nextData]
            processRealSupabaseData(loadedRecords, recordType)
            
            currentTotalAmount += nextData.reduce((sum, row) => sum + (Number.parseFloat(row.amount) || 0), 0)
            setServerTotalAmount(currentTotalAmount)

            if (nextData.length < CHUNK_SIZE) {
              hasMore = false
            } else {
              currentStart += CHUNK_SIZE
            }
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
  }

  const processRealSupabaseData = useCallback((data: any[], currentRecordType: string) => {

    if (!Array.isArray(data) || data.length === 0) {
      setVouchers([])
      return
    }

    const mappedVouchers = data
      .map((row: any) => {
        if (currentRecordType === "Debit" && !row.voucher_no) return null

        return {
          id: row.id ? row.id.toString() : '',
          timestamp: row.created_date || "",
          voucherNo: row.voucher_no || "",
          bankAcFrom: row.bank_ac_from || "",
          companyName: row.company_name || "",
          dateOfPaymentProcess: row.date_of_payment || "",
          purposeOfPayment: row.purpose_of_payment || "",
          transactionType: row.transaction_type || "",
          project: row.project || "",
          beneficiaryName: row.beneficiary_name || row.beneficiary_ac_name || "",
          poNumber: row.po_number || "",
          utrNumber: row.utr_number || "", // Added UTR for Credit
          beneficiaryAcName: row.beneficiary_ac_name || "",
          beneficiaryAcNumber: row.beneficiary_ac_number || "",
          beneficiaryBankName: row.beneficiary_bank_name || "",
          beneficiaryBankIfsc: row.beneficiary_bank_ifsc || "",
          particulars: row.particulars || "",
          amount: row.amount ? String(row.amount) : "0",
          amountInWords: row.amount_in_words || "",
          entryDoneBy: row.entry_done_by || "",
          checkedBy: row.checked_by || "",
          approvedBy: row.approved_by || "",
          pdfLink: row.pdf_link || "",
          name: row.name || "",
          dateOfPayment: row.created_date || "",
          originalRowIndex: row.id, // Using DB id for updates
          recordType: currentRecordType // Helper to know which table to update
        } as VoucherData
      })
      .filter((voucher): voucher is VoucherData => Boolean(voucher))

    setVouchers(mappedVouchers)
  }, [])

  const updateVoucherInSupabase = async (voucher: VoucherData) => {
    try {
      let tableName = "History"
      if (voucher.recordType === "Credit") tableName = "Credit"
      else if (voucher.recordType === "Transfer") tableName = "SelfTransfer"

      const { error } = await supabase
        .from(tableName)
        .update({
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
          ...(voucher.recordType === "Debit" ? { name: voucher.name || null } : {})
        })
        .eq('id', voucher.id)

      if (error) {
        throw new Error(error.message || "Update failed")
      }
      return true
    } catch (error) {
      console.error("Update error:", error)
      throw error
    }
  }

  // Open edit modal — master data already loaded on mount, skip redundant refetch
  const openEditModal = async (voucher: VoucherData) => {
    setEditVoucher({ ...voucher })
    setIsEditModalOpen(true)
    setSelectedVoucher(null)
    // Only fetch master data if it wasn't loaded yet (edge case)
    if (masterData.companyNames.length === 0) {
      await fetchMasterData()
    }
  }

  // Close edit modal
  const closeEditModal = () => {
    setIsEditModalOpen(false)
    setEditVoucher(null)
  }

  // Handle form submission for editing with COLORED PDF generation
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editVoucher) return

    try {
      setIsUpdating(true)

      // Generate new PDF with updated voucher data and professional table layout
      const { jsPDF } = await import("jspdf")
      const { default: autoTable } = await import("jspdf-autotable")

      const doc = new jsPDF("p", "mm", "a4")
      const pageWidth = 210 // A4 Portrait width
      const pageHeight = 297 // A4 Portrait height
      const margin = 10
      let currentY = 15

      // Professional color palette
      const isCredit = editVoucher.recordType === "Credit"
      const isTransfer = editVoucher.recordType === "Transfer"

      let colors = {
        primary: [28, 48, 80] as [number, number, number], // Dark Blue
        secondary: [90, 120, 150] as [number, number, number], // Muted Blue
        accent: [200, 50, 50] as [number, number, number], // Muted Red
        success: [40, 140, 80] as [number, number, number], // Green
        background: {
          light: [248, 248, 248] as [number, number, number], // Light Gray
          blue: [235, 245, 255] as [number, number, number], // Very Light Blue
          green: [240, 255, 240] as [number, number, number], // Very Light Green
          yellow: [255, 252, 220] as [number, number, number], // Pale Yellow
          amount: [230, 255, 230] as [number, number, number], // Light Green for amount
        },
        text: {
          primary: [20, 20, 20] as [number, number, number], // Very Dark Gray
          secondary: [60, 60, 60] as [number, number, number], // Dark Gray
          muted: [120, 120, 120] as [number, number, number], // Medium Gray
        },
        border: {
          primary: [80, 80, 80] as [number, number, number], // Dark Gray
          secondary: [150, 150, 150] as [number, number, number], // Medium Gray
        },
      }

      if (isCredit) {
        colors = {
          primary: [180, 80, 0] as [number, number, number], // Orange
          secondary: [200, 120, 50] as [number, number, number],
          accent: [220, 100, 0] as [number, number, number],
          success: [150, 70, 0] as [number, number, number],
          background: {
            light: [255, 245, 235] as [number, number, number],
            blue: [255, 240, 220] as [number, number, number],
            green: [255, 248, 230] as [number, number, number],
            yellow: [255, 240, 210] as [number, number, number],
            amount: [255, 235, 210] as [number, number, number],
          },
          text: {
            primary: [20, 20, 20] as [number, number, number],
            secondary: [60, 60, 60] as [number, number, number],
            muted: [120, 120, 120] as [number, number, number],
          },
          border: {
            primary: [180, 80, 0] as [number, number, number],
            secondary: [200, 120, 50] as [number, number, number],
          },
        }
      } else if (isTransfer) {
        colors = {
          primary: [0, 128, 128] as [number, number, number], // Teal
          secondary: [0, 150, 150] as [number, number, number],
          accent: [0, 100, 100] as [number, number, number],
          success: [0, 120, 120] as [number, number, number],
          background: {
            light: [240, 255, 255] as [number, number, number],
            blue: [224, 255, 255] as [number, number, number],
            green: [230, 255, 255] as [number, number, number],
            yellow: [240, 255, 255] as [number, number, number],
            amount: [220, 255, 255] as [number, number, number],
          },
          text: {
            primary: [20, 20, 20] as [number, number, number],
            secondary: [60, 60, 60] as [number, number, number],
            muted: [120, 120, 120] as [number, number, number],
          },
          border: {
            primary: [0, 128, 128] as [number, number, number],
            secondary: [0, 150, 150] as [number, number, number],
          },
        }
      }

      const formatCurrency = (value: string) => {
        const numValue = Number.parseFloat(value) || 0
        return (
          "Rs. " +
          numValue.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })
        )
      }

      const formatDate = (dateString: string | number | Date) => {
        return new Date(dateString).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      }

      // Main container border
      doc.setDrawColor(...colors.border.primary)
      doc.setLineWidth(2)
      doc.rect(margin, margin, pageWidth - 2 * margin, pageHeight - 2 * margin)

      // Header Section
      doc.setFillColor(...colors.background.blue)
      doc.setDrawColor(...colors.border.primary)
      doc.setLineWidth(1)
      doc.rect(margin + 3, currentY, pageWidth - 2 * margin - 6, 22, "FD")

      // Company Name
      doc.setFont("helvetica", "bold")
      doc.setFontSize(18)
      doc.setTextColor(...colors.primary)
      doc.text(editVoucher.companyName || "COMPANY NAME", pageWidth / 2, currentY + 8, { align: "center" })

      let voucherTitle = "BANK PAYMENT VOUCHER"
      if (isCredit) voucherTitle = "RECEIPT VOUCHER"
      else if (isTransfer) voucherTitle = "CONTRA VOUCHER"

      doc.setFontSize(12)
      doc.setTextColor(...colors.secondary)
      doc.text(voucherTitle, pageWidth / 2, currentY + 16, { align: "center" })

      currentY += 28

      // Voucher Information Table - Colorful rows with different backgrounds
      const voucherInfoData = [
        // Row 1 - Basic Info with light blue background
        [
          {
            content: "VOUCHER NO:",
            styles: { fontStyle: 'bold' as import('jspdf-autotable').FontStyle, fillColor: colors.background.blue, textColor: colors.primary },
          },
          { content: editVoucher.voucherNo || "", styles: { fillColor: colors.background.blue } },
          {
            content: "DATE OF PAYMENT:",
            styles: { fontStyle: 'bold' as import('jspdf-autotable').FontStyle, fillColor: colors.background.blue, textColor: colors.primary },
          },
          { content: formatDate(editVoucher.dateOfPaymentProcess), styles: { fillColor: colors.background.blue } },
          {
            content: "TRANSACTION TYPE:",
            styles: { fontStyle: "bold" as import("jspdf-autotable").FontStyle, fillColor: colors.background.blue, textColor: colors.primary },
          },
          {
            content: editVoucher.transactionType || "",
            styles: { fillColor: colors.background.blue, textColor: colors.accent, fontStyle: "bold" as import("jspdf-autotable").FontStyle },
          },
        ],
        // Row 2 - Bank & Company with yellow background
        [
          {
            content: "BANK A/C FROM:",
            styles: { fontStyle: 'bold' as import('jspdf-autotable').FontStyle, fillColor: colors.background.yellow, textColor: colors.primary },
          },
          { content: editVoucher.bankAcFrom || "", styles: { fillColor: colors.background.yellow } },
          {
            content: "COMPANY:",
            styles: { fontStyle: 'bold' as import('jspdf-autotable').FontStyle, fillColor: colors.background.yellow, textColor: colors.primary },
          },
          { content: editVoucher.companyName || "", styles: { fillColor: colors.background.yellow } },
          {
            content: "PURPOSE:",
            styles: { fontStyle: "bold" as import("jspdf-autotable").FontStyle, fillColor: colors.background.yellow, textColor: colors.primary },
          },
          { content: editVoucher.purposeOfPayment || "", styles: { fillColor: colors.background.yellow } },
        ],
        // Row 3 - Project & Beneficiary with green background
        [
          {
            content: "PROJECT:",
            styles: { fontStyle: 'bold' as import('jspdf-autotable').FontStyle, fillColor: colors.background.green, textColor: colors.primary },
          },
          {
            content: editVoucher.project || "",
            styles: { fillColor: colors.background.green, textColor: colors.success, fontStyle: 'bold' as import('jspdf-autotable').FontStyle },
          },
          {
            content: "BENEFICIARY NAME (PAID TO):",
            styles: { fontStyle: "bold" as import("jspdf-autotable").FontStyle, fillColor: colors.background.green, textColor: colors.primary },
          },
          {
            content: editVoucher.beneficiaryName || "",
            styles: { fillColor: colors.background.green, colSpan: 3, fontStyle: "bold" as import("jspdf-autotable").FontStyle },
          },
          "",
          "",
        ],
        // Row 4 - Account Details with light blue background
        [
          {
            content: "PO NUMBER:",
            styles: { fontStyle: "bold", fillColor: colors.background.blue, textColor: colors.primary },
          },
          { content: editVoucher.poNumber || "N/A", styles: { fillColor: colors.background.blue } },
          {
            content: "BENEFICIARY A/C NAME:",
            styles: { fontStyle: "bold", fillColor: colors.background.blue, textColor: colors.primary },
          },
          { content: editVoucher.beneficiaryAcName || "", styles: { fillColor: colors.background.blue } },
          {
            content: "BENEFICIARY A/C NUMBER:",
            styles: { fontStyle: "bold", fillColor: colors.background.blue, textColor: colors.primary },
          },
          { content: editVoucher.beneficiaryAcNumber || "", styles: { fillColor: colors.background.blue } },
        ],
        // Row 5 - Bank Details with light gray background
        [
          {
            content: "BENEFICIARY BANK NAME:",
            styles: { fontStyle: 'bold' as import('jspdf-autotable').FontStyle, fillColor: colors.background.light, textColor: colors.primary },
          },
          { content: editVoucher.beneficiaryBankName || "", styles: { fillColor: colors.background.light } },
          {
            content: "BENEFICIARY BANK IFSC:",
            styles: { fontStyle: 'bold' as import('jspdf-autotable').FontStyle, fillColor: colors.background.light, textColor: colors.primary },
          },
          {
            content: editVoucher.beneficiaryBankIfsc || "",
            styles: { fillColor: colors.background.light, colSpan: 3 },
          },
          "",
          "",
        ],
      ]

      autoTable(doc, {
        startY: currentY,
        body: voucherInfoData,
        margin: { left: margin + 3, right: margin + 3 },
        tableWidth: pageWidth - 2 * margin - 6,
        styles: {
          cellPadding: 4,
          lineColor: colors.border.primary,
          lineWidth: 0.8,
          textColor: colors.text.primary,
          font: "helvetica",
          fontSize: 9,
          overflow: "linebreak",
        },
        columnStyles: {
          0: { cellWidth: 30, fontSize: 8 },
          1: { cellWidth: 30 },
          2: { cellWidth: 30, fontSize: 8 },
          3: { cellWidth: 30 },
          4: { cellWidth: 30, fontSize: 8 },
          5: { cellWidth: 30 },
        },
        didDrawPage: (data) => {
          if (data.cursor && typeof data.cursor.y === "number") {
            currentY = data.cursor.y
          }
        },
      })

      currentY += 8

      // Particulars and Amount Section - Colorful with different backgrounds
      const particularsAmountData = [
        // Header row with distinct colors
        [
          {
            content: "PARTICULARS:",
            styles: {
              fontStyle: "bold",
              fontSize: 10,
              fillColor: colors.background.light,
              textColor: colors.primary,
              halign: "center",
              cellPadding: 5,
            },
          },
          {
            content: "AMOUNT:",
            styles: {
              fontStyle: "bold",
              fontSize: 10,
              fillColor: colors.background.yellow,
              textColor: colors.primary,
              halign: "center",
              cellPadding: 5,
            },
          },
        ],
        // Content row with vibrant amount highlight
        [
          {
            content: editVoucher.particulars || "",
            styles: {
              fontSize: 10,
              minCellHeight: 20,
              valign: "top",
              cellPadding: 6,
              fillColor: [255, 255, 255], // White background for particulars
            },
          },
          {
            content: formatCurrency(editVoucher.amount),
            styles: {
              fontSize: 14,
              fontStyle: "bold",
              fillColor: colors.background.amount,
              textColor: colors.success,
              halign: "center",
              valign: "middle",
              minCellHeight: 20,
              cellPadding: 8,
            },
          },
        ],
      ]

      autoTable(doc, {
        startY: currentY,
        body: particularsAmountData,
        margin: { left: margin + 3, right: margin + 3 },
        tableWidth: pageWidth - 2 * margin - 6,
        styles: {
          cellPadding: 4,
          lineColor: colors.border.primary,
          lineWidth: 0.8,
          textColor: colors.text.primary,
          font: "helvetica",
          overflow: "linebreak",
        },
        columnStyles: {
          0: { cellWidth: (pageWidth - 2 * margin - 6) * 0.7 },
          1: { cellWidth: (pageWidth - 2 * margin - 6) * 0.3 },
        },
        didDrawPage: (data) => {
          if (data.cursor) {
            currentY = data.cursor.y
          }
        },
      })

      currentY += 3

      // Amount in Words Section - Vibrant blue background
      const amountWordsData = [
        [
          {
            content: `AMOUNT IN WORDS: ${editVoucher.amountInWords || ""}`,
            styles: {
              fontSize: 11,
              fontStyle: "bold",
              fillColor: colors.background.blue,
              textColor: colors.primary,
              cellPadding: 8,
            },
          },
        ],
      ]

      autoTable(doc, {
        startY: currentY,
        body: amountWordsData,
        margin: { left: margin + 3, right: margin + 3 },
        tableWidth: pageWidth - 2 * margin - 6,
        styles: {
          cellPadding: 4,
          lineColor: colors.border.primary,
          lineWidth: 0.8,
          textColor: colors.text.primary,
          font: "helvetica",
        },
        didDrawPage: (data) => {
          if (data.cursor) {
            currentY = data.cursor.y
          }
        },
      })

      currentY += 15

      // Signature Section - Colorful with different backgrounds for each column
      const signatureData = [
        // Header row with distinct colors for each approval level
        [
          {
            content: "ENTRY DONE BY",
            styles: {
              fontStyle: "bold",
              fontSize: 10,
              fillColor: colors.background.blue,
              textColor: colors.primary,
              halign: "center",
              cellPadding: 5,
            },
          },
          {
            content: "CHECKED BY",
            styles: {
              fontStyle: "bold",
              fontSize: 10,
              fillColor: colors.background.yellow,
              textColor: colors.primary,
              halign: "center",
              cellPadding: 5,
            },
          },
          {
            content: "APPROVED BY",
            styles: {
              fontStyle: "bold",
              fontSize: 10,
              fillColor: colors.background.green,
              textColor: colors.primary,
              halign: "center",
              cellPadding: 5,
            },
          },
        ],
        // Empty signature space with light backgrounds
        [
          { content: "", styles: { minCellHeight: 15, fillColor: [250, 250, 255] } },
          { content: "", styles: { minCellHeight: 15, fillColor: [255, 255, 240] } },
          { content: "", styles: { minCellHeight: 15, fillColor: [245, 255, 245] } },
        ],
        // Names row with matching background colors
        [
          {
            content: editVoucher.entryDoneBy || "",
            styles: {
              fontStyle: "bold",
              fontSize: 9,
              halign: "center",
              fillColor: colors.background.blue,
              textColor: colors.primary,
              cellPadding: 4,
            },
          },
          {
            content: editVoucher.checkedBy || "",
            styles: {
              fontStyle: "bold",
              fontSize: 9,
              halign: "center",
              fillColor: colors.background.yellow,
              textColor: colors.primary,
              cellPadding: 4,
            },
          },
          {
            content: editVoucher.approvedBy || "",
            styles: {
              fontStyle: "bold",
              fontSize: 9,
              halign: "center",
              fillColor: colors.background.green,
              textColor: colors.primary,
              cellPadding: 4,
            },
          },
        ],
      ]

      autoTable(doc, {
        startY: currentY,
        body: signatureData,
        margin: { left: margin + 3, right: margin + 3 },
        tableWidth: pageWidth - 2 * margin - 6,
        styles: {
          cellPadding: 3,
          lineColor: colors.border.primary,
          lineWidth: 0.8,
          textColor: colors.text.primary,
          font: "helvetica",
        },
        columnStyles: {
          0: { cellWidth: (pageWidth - 2 * margin - 6) / 3 },
          1: { cellWidth: (pageWidth - 2 * margin - 6) / 3 },
          2: { cellWidth: (pageWidth - 2 * margin - 6) / 3 },
        },
        didDrawCell: (data) => {
          // Draw signature line in the middle row
          if (data.row.index === 1) {
            const cellX = data.cell.x
            const cellY = data.cell.y + data.cell.height - 4
            const cellWidth = data.cell.width
            doc.setDrawColor(...colors.border.primary)
            doc.setLineWidth(0.3)
            doc.line(cellX + 8, cellY, cellX + cellWidth - 8, cellY)
          }
        },
        didDrawPage: (data) => {
          currentY = data.cursor.y
        },
      })

      currentY += 15

      // Footer with colorful background
      doc.setFillColor(...colors.background.light)
      doc.setDrawColor(...colors.accent)
      doc.setLineWidth(0.5)
      doc.rect(margin + 3, currentY, pageWidth - 2 * margin - 6, 12, "FD")

      doc.setFont("helvetica", "bold")
      doc.setFontSize(8)
      doc.setTextColor(...colors.primary)
      doc.text(`Generated on: ${new Date().toLocaleString("en-IN")}`, pageWidth / 2, currentY + 5, { align: "center" })

      doc.setFont("helvetica", "normal")
      doc.setFontSize(7)
      doc.setTextColor(...colors.secondary)
      doc.text("This is a computer generated voucher", pageWidth / 2, currentY + 9, { align: "center" })

      // Add colorful accent line at the bottom
      doc.setDrawColor(...colors.accent)
      doc.setLineWidth(2)
      doc.line(margin + 8, currentY + 11, pageWidth - margin - 8, currentY + 11)

      // Convert to base64 and create blob
      const pdfOutput = doc.output("datauristring")
      const pdfBase64 = pdfOutput.split(",")[1]

      const fileName = `Voucher_${editVoucher.voucherNo}_${Date.now()}.pdf`

      const byteCharacters = atob(pdfBase64)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const pdfBlob = new Blob([byteArray], { type: 'application/pdf' })

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('vouchers')
        .upload(fileName, pdfBlob, {
          contentType: 'application/pdf',
          upsert: true
        })

      if (uploadError) {
        throw new Error("PDF upload failed: " + uploadError.message)
      }

      const { data: publicUrlData } = supabase.storage
        .from('vouchers')
        .getPublicUrl(fileName)

      const pdfUrl = publicUrlData.publicUrl


      // Update voucher with new PDF link
      const updatedVoucher = {
        ...editVoucher,
        pdfLink: pdfUrl,
      }

      // Update the database
      await updateVoucherInSupabase(updatedVoucher)

      // Update local state
      setVouchers((prev) => prev.map((v) => (v.id === editVoucher.id ? updatedVoucher : v)))

      // Refresh totals from backend
      fetchRealHistoryData()

      // Close modal and show success
      closeEditModal()
      alert("Voucher updated successfully with colorful professional layout!")
    } catch (error) {
      console.error("Update failed:", error)
      alert(`Update failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsUpdating(false)
    }
  }

  const deleteVoucher = async (voucherId: string) => {
    const recordLabel = recordType === "Debit" ? "voucher" : "credit record"
    if (!confirm(`Are you sure you want to permanently delete this ${recordLabel}?`)) {
      return
    }

    try {
      setDeletingVoucherId(voucherId)
      setLoading(true)

      // Delete from Supabase
      let tableName = "History"
      if (recordType === "Credit") tableName = "Credit"
      else if (recordType === "Transfer") tableName = "SelfTransfer"

      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', voucherId)

      if (error) {
        throw new Error(error.message || "Delete operation failed")
      }

      // Update local state
      setVouchers((prev) => prev.filter((v) => v.id !== voucherId))

      // Refresh counts and pagination from backend
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
  }

  // Use master data for filter options (all fetched once on mount)
  const uniqueCompanies = masterData.companyNames
  const uniqueProjects = masterData.projects
  const uniquePurposes = masterData.purposes
  const uniqueTransactionTypes = masterData.transactionTypes
  const uniqueNames = masterData.uniqueNames

  // Since we filter on server, filteredVouchers is now just vouchers
  const filteredVouchers = vouchers

  // Backend total amount from state
  const getTotalAmount = serverTotalAmount

  const clearAllFilters = useCallback(() => {
    setSearchTerm("")
    setDebouncedSearchTerm("")
    setSelectedCompany("all")
    setSelectedProject("all")
    setSelectedPurpose("all")
    setSelectedTransactionType("all")
    setSelectedName("all")
    setDateFrom("")
    setDateTo("")
    setAmountFrom("")
    setAmountTo("")
    setDebouncedAmountFrom("")
    setDebouncedAmountTo("")
    setRecordType("Debit")
    setCurrentPage(1)
  }, [])

  const downloadPDF = async (voucher: VoucherData) => {
    try {
      if (voucher.pdfLink && voucher.pdfLink.includes("http")) {
        // Convert Google Drive link to direct download link if needed
        let downloadUrl = voucher.pdfLink
        // Check if it's a Google Drive link and convert to direct download
        if (voucher.pdfLink.includes("drive.google.com")) {
          const fileIdMatch = voucher.pdfLink.match(/\/d\/([a-zA-Z0-9-_]+)/)
          if (fileIdMatch) {
            downloadUrl = `https://drive.google.com/uc?export=download&id=${fileIdMatch[1]}`
          }
        }

        try {
          // Try to fetch and download the PDF
          const response = await fetch(downloadUrl, {
            method: "GET",
            mode: "no-cors", // This helps with CORS issues
          })

          // If fetch with no-cors fails, fallback to opening in new tab
          if (!response.ok) {
            throw new Error("Fetch failed")
          }

          const blob = await response.blob()
          const url = window.URL.createObjectURL(blob)
          const link = document.createElement("a")
          link.href = url
          link.download = `Voucher_${voucher.voucherNo}.pdf`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          window.URL.revokeObjectURL(url)
        } catch (fetchError) {
        
          const link = document.createElement("a")
          link.href = downloadUrl
          link.target = "_blank"
          link.rel = "noopener noreferrer"
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
        }
      } else {
        // Generate PDF if no link exists (keep existing code)
        const { jsPDF } = await import("jspdf")
        const doc = new jsPDF()

        let titleHeader = "Bank Payment Voucher"
        let filenamePrefix = "Payment_Voucher"
        let voucherNumLabel = "Voucher Number"
        let voucherNumValue = voucher.voucherNo

        if (voucher.recordType === "Credit") {
          titleHeader = "Receipt Voucher"
          filenamePrefix = "Receipt_Voucher"
          voucherNumLabel = "Voucher ID"
          voucherNumValue = voucher.id
        } else if (voucher.recordType === "Transfer") {
          titleHeader = "Contra Voucher"
          filenamePrefix = "Contra_Voucher"
          voucherNumLabel = "Voucher ID"
          voucherNumValue = voucher.id
        }

        doc.setFont("helvetica")
        doc.setFontSize(16)
        doc.setTextColor(0, 0, 0)
        doc.text(voucher.companyName || "COMPANY NAME", 105, 20, { align: "center" })

        doc.setFontSize(12)
        doc.text(`${titleHeader} - Complete Details`, 105, 30, { align: "center" })

        doc.rect(10, 35, 190, 250)

        let yPosition = 50

        const addSection = (title: string, fields: Array<{ label: string; value: any }>) => {
          // Filter out fields that are empty or not applicable
          const validFields = fields.filter((field) => {
            if (!field.value) return false
            const strVal = String(field.value).trim()
            return strVal !== "" && strVal !== "N/A" && strVal !== "₹0" && strVal !== "₹NaN"
          })

          if (validFields.length === 0) return // Skip empty sections

          doc.setFontSize(10)
          doc.setFont("helvetica", "bold")

          doc.setFillColor(230, 230, 230)
          doc.rect(15, yPosition - 5, 180, 8, "F")
          doc.text(title, 20, yPosition)

          yPosition += 12

          doc.setFont("helvetica", "normal")
          doc.setFontSize(8)

          validFields.forEach((field) => {
            if (yPosition > 270) {
              doc.addPage()
              yPosition = 20
            }

            doc.setFont("helvetica", "bold")
            doc.text(field.label + ":", 20, yPosition)

            doc.setFont("helvetica", "normal")
            const lines = doc.splitTextToSize(String(field.value), 120)
            doc.text(lines, 80, yPosition)

            yPosition += Math.max(6, lines.length * 4)
          })

          yPosition += 5
        }

        addSection("BASIC VOUCHER INFORMATION", [
          {
            label: "Timestamp",
            value: voucher.timestamp ? new Date(voucher.timestamp).toLocaleString("en-IN") : "N/A",
          },
          { label: voucherNumLabel, value: voucherNumValue },
          { label: "Transaction Type", value: voucher.transactionType },
          { label: "Purpose", value: voucher.purposeOfPayment },
          { label: "Project", value: voucher.project },
        ])

        addSection("BANK INFORMATION", [
          { label: "Bank AC From", value: voucher.bankAcFrom },
          { label: "Date", value: voucher.dateOfPaymentProcess },
        ])

        addSection("BENEFICIARY INFORMATION", [
          {
            label: voucher.recordType === "Credit" ? "Payer Name" : "Beneficiary Name",
            value: voucher.beneficiaryName,
          },
          { label: "PO Number", value: voucher.poNumber },
          { label: "Beneficiary A/C Name", value: voucher.beneficiaryAcName },
          { label: "Beneficiary A/C Number", value: voucher.beneficiaryAcNumber },
          { label: "Beneficiary Bank Name", value: voucher.beneficiaryBankName },
          { label: "Beneficiary Bank IFSC", value: voucher.beneficiaryBankIfsc },
        ])

        addSection("FINANCIAL INFORMATION", [
          { label: "Particulars", value: voucher.particulars },
          { label: "Amount", value: voucher.amount ? `₹${Number.parseFloat(voucher.amount).toLocaleString("en-IN")}` : "" },
          { label: "Amount in Words", value: voucher.amountInWords },
        ])

        addSection("APPROVAL INFORMATION", [
          { label: "Entry Done By", value: voucher.entryDoneBy },
          { label: "Checked By", value: voucher.checkedBy },
          { label: "Approved By", value: voucher.approvedBy },
          { label: "Name", value: voucher.name },
          { label: "PDF Link", value: voucher.pdfLink },
        ])

        doc.setFontSize(8)
        doc.setFont("helvetica", "italic")
        doc.text(`Generated: ${new Date().toLocaleString("en-IN")}`, 20, doc.internal.pageSize.height - 20)
        doc.text(`Voucher ID: ${voucher.id}`, 20, doc.internal.pageSize.height - 15)
        doc.text("Complete History Database Export", 20, doc.internal.pageSize.height - 10)

        doc.save(`${filenamePrefix}_${voucherNumValue}_${Date.now()}.pdf`)
      }
    } catch (error) {
      console.error("Error downloading PDF:", error)
      alert("Error downloading PDF. The file may be corrupted or inaccessible. Please try again or contact support.")
    }
  }

  const activeFiltersCount = useMemo(() => {
    return [
      selectedCompany !== "all",
      selectedProject !== "all",
      selectedPurpose !== "all",
      selectedTransactionType !== "all",
      selectedName !== "all",
      dateFrom,
      dateTo,
      debouncedAmountFrom,
      debouncedAmountTo,
    ].filter(Boolean).length
  }, [
    selectedCompany, selectedProject, selectedPurpose,
    selectedTransactionType, selectedName,
    dateFrom, dateTo, debouncedAmountFrom, debouncedAmountTo,
  ])

  const renderAllDetails = (voucher: VoucherData) => {
    const columnMapping = {
      timestamp: "TIMESTAMP",
      voucherNo: "Voucher No.",
      bankAcFrom: "BANK AC FROM",
      companyName: "COMPANY NAME",
      dateOfPaymentProcess: "DATE",
      purposeOfPayment: "PURPOSE",
      transactionType: "TRANSACTION TYPE",
      project: "PROJECT",
      beneficiaryName: "BENEFICIARY NAME (PAYER TO)",
      poNumber: "PO. NUMBER",
      beneficiaryAcName: "(NAME OF AC HOLDER) BENEFICIARY A/C NAME",
      beneficiaryAcNumber: "BENEFICIARY A/C NUMBER",
      beneficiaryBankName: "BENEFICIARY BANK NAME",
      beneficiaryBankIfsc: "BENEFICIARY BANK IFSC",
      particulars: "PARTICULARS",
      amount: "AMOUNT",
      amountInWords: "AMOUNT IN WORDS",
      entryDoneBy: "ENTRY DONE BY",
      checkedBy: "CHECKED BY",
      approvedBy: "APPROVED BY",
      utrNumber: "UTR NUMBER",
      pdfLink: "PDF Link",
      name: "Name",
    }

    return (
      <div className=" bg-gray-50  sm:p-4 rounded-lg">
        <h4 className="font-semibold text-gray-800 mb-3 text-sm sm:text-base">All Details from History Database</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 text-xs sm:text-sm">
          {Object.entries(columnMapping).map(([key, label]) => (
            <div key={key} className="bg-white p-2 sm:p-3 rounded border">
              <p className="text-gray-600 font-medium text-xs">{label}</p>
              <p className="text-gray-800 break-words mt-1">
                {voucher[key] === null || voucher[key] === undefined || voucher[key] === "" ? (
                  "N/A"
                ) : key === "timestamp" && voucher[key] ? (
                  (() => {
                    try {
                      return new Date(voucher[key]).toLocaleString("en-IN")
                    } catch {
                      return String(voucher[key])
                    }
                  })()
                ) : key === "amount" && voucher[key] ? (
                  (() => {
                    try {
                      return `₹${Number.parseFloat(voucher[key]).toLocaleString("en-IN")}`
                    } catch {
                      return String(voucher[key])
                    }
                  })()
                ) : key === "pdfLink" && voucher[key] && voucher[key].includes("http") ? (
                  <a
                    href={voucher[key]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    View PDF
                  </a>
                ) : (
                  String(voucher[key])
                )}
              </p>
            </div>
          ))}
        </div>

        {/* Summary section showing the main fields mapping */}
        <div className="mt-4 sm:mt-6 bg-blue-50 p-3 sm:p-4 rounded-lg">
          <h5 className="font-semibold text-gray-800 mb-3 text-sm sm:text-base">
            Main Fields Summary (as shown in table)
          </h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
            <div className="space-y-2">
              <p>
                <strong>Voucher No:</strong> {voucher.voucherNo}
              </p>
              <p>
                <strong>Date:</strong>{" "}
                {voucher.timestamp
                  ? (() => {
                    try {
                      return new Date(voucher.timestamp).toLocaleDateString("en-IN")
                    } catch {
                      return voucher.timestamp
                    }
                  })()
                  : "N/A"}
              </p>
              <p>
                <strong>Company:</strong> {voucher.companyName}
              </p>
              <p>
                <strong>Beneficiary:</strong> {voucher.beneficiaryName}
              </p>
            </div>
            <div className="space-y-2">
              <p>
                <strong>Purpose:</strong> {voucher.purposeOfPayment}
              </p>
              <p>
                <strong>Project:</strong> {voucher.project}
              </p>
              <p>
                <strong>Amount:</strong> ₹{Number.parseFloat(voucher.amount || "0").toLocaleString("en-IN")}
              </p>
              <p>
                <strong>Type:</strong> {voucher.transactionType}
              </p>
              <p>
                <strong>Name:</strong> {voucher.name}
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const handleExportToExcel = async () => {
    try {
      setIsExporting(true)

      let searchFilter = null
      if (debouncedSearchTerm) {
        if (recordType === "Debit") {
          searchFilter = `voucher_no.ilike.%${debouncedSearchTerm}%,beneficiary_name.ilike.%${debouncedSearchTerm}%,project.ilike.%${debouncedSearchTerm}%,purpose_of_payment.ilike.%${debouncedSearchTerm}%,company_name.ilike.%${debouncedSearchTerm}%`
        } else {
          searchFilter = `beneficiary_name.ilike.%${debouncedSearchTerm}%,company_name.ilike.%${debouncedSearchTerm}%`
        }
      }

      let COLUMNS = ""
      if (recordType === "Debit") {
        COLUMNS = [
          'id', 'voucher_no', 'created_date', 'date_of_payment', 'company_name',
          'beneficiary_name', 'purpose_of_payment', 'project', 'amount', 'transaction_type',
          'name', 'pdf_link', 'bank_ac_from', 'po_number', 'beneficiary_ac_name',
          'beneficiary_ac_number', 'beneficiary_bank_name', 'beneficiary_bank_ifsc',
          'particulars', 'amount_in_words', 'entry_done_by', 'checked_by', 'approved_by'
        ].join(',')
      } else {
        COLUMNS = [
          'id', 'created_date', 'date_of_payment', 'company_name',
          'beneficiary_name', 'amount', 'amount_in_words'
        ].join(',')
      }

      let allData: any[] = []
      let from = 0
      const limit = 1000
      let hasMore = true


      while (hasMore) {
        const tableName = recordType === "Debit" ? "History" : "Credit"
        let query = supabase.from(tableName).select(COLUMNS)

        // Apply identical filters to the export query
        if (searchFilter) query = query.or(searchFilter)
        if (selectedCompany !== "all") query = query.eq("company_name", selectedCompany)
        if (recordType === "Debit") {
          if (selectedProject !== "all") query = query.eq("project", selectedProject)
          if (selectedPurpose !== "all") query = query.eq("purpose_of_payment", selectedPurpose)
          if (selectedTransactionType !== "all") query = query.eq("transaction_type", selectedTransactionType)
        }
        if (selectedName !== "all") query = query.eq("beneficiary_name", selectedName)
        if (dateFrom) query = query.gte("date_of_payment", dateFrom)
        if (dateTo) query = query.lte("date_of_payment", dateTo)
        if (debouncedAmountFrom) query = query.gte("amount", debouncedAmountFrom)
        if (debouncedAmountTo) query = query.lte("amount", debouncedAmountTo)

        const { data, error } = await query
          .order("created_date", { ascending: false })
          .range(from, from + limit - 1)

        if (error) throw error

        if (data && data.length > 0) {
          allData = [...allData, ...data]
          if (data.length < limit) {
            hasMore = false
          } else {
            from += limit
          }
        } else {
          hasMore = false
        }
      }

      if (allData.length === 0) {
        alert("No data to export")
        setIsExporting(false)
        return
      }

      const columnMapping = recordType === "Debit" ? {
        created_date: "TIMESTAMP",
        voucher_no: "Voucher No.",
        bank_ac_from: "BANK AC FROM",
        company_name: "COMPANY NAME",
        date_of_payment: "DATE",
        purpose_of_payment: "PURPOSE",
        transaction_type: "TRANSACTION TYPE",
        project: "PROJECT",
        beneficiary_name: "BENEFICIARY NAME (PAYER TO)",
        po_number: "PO. NUMBER",
        beneficiary_ac_name: "(NAME OF AC HOLDER) BENEFICIARY A/C NAME",
        beneficiary_ac_number: "BENEFICIARY A/C NUMBER",
        beneficiary_bank_name: "BENEFICIARY BANK NAME",
        beneficiary_bank_ifsc: "BENEFICIARY BANK IFSC",
        particulars: "PARTICULARS",
        amount: "AMOUNT",
        amount_in_words: "AMOUNT IN WORDS",
        entry_done_by: "ENTRY DONE BY",
        checked_by: "CHECKED BY",
        approved_by: "APPROVED BY",
        pdf_link: "PDF Link",
        name: "Name",
      } : {
        created_date: "CREATED DATE",
        date_of_payment: "PAYMENT DATE",
        company_name: "COMPANY NAME",
        beneficiary_name: "PAYER NAME",
        amount: "AMOUNT",
        amount_in_words: "AMOUNT IN WORDS",
      }

      const dataToExport = allData.map((voucher) => {
        const row: any = {}
        Object.entries(columnMapping).forEach(([key, label]) => {
          let value = voucher[key]
          if (key === "created_date" && value) {
            try {
              value = new Date(value).toLocaleString("en-IN")
            } catch {
              // keep as is
            }
          }
          row[label] = value || "N/A"
        })
        return row
      })

      const worksheet = XLSX.utils.json_to_sheet(dataToExport)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, "Vouchers")

      // Auto-size columns
      const maxWidths = dataToExport.reduce((acc: any, row: any) => {
        Object.keys(row).forEach((key, i) => {
          const value = String(row[key])
          acc[i] = Math.max(acc[i] || 0, value.length, key.length)
        })
        return acc
      }, [])
      worksheet["!cols"] = maxWidths.map((w: number) => ({ w: w + 2 }))

      XLSX.writeFile(workbook, `Vouchers_Full_History_${new Date().toISOString().split('T')[0]}.xlsx`)
    } catch (error) {
      console.error("Excel Export Error:", error)
      alert("Failed to export Excel file")
    } finally {
      setIsExporting(false)
    }
  }

  const generateSummaryPDF = async () => {
    try {
      setIsRefetching(true)
      const { jsPDF } = await import("jspdf")
      const { default: autoTable } = await import("jspdf-autotable")

      // Fetch ALL matching data for both tables
      const fetchAllData = async (table: "History" | "Credit") => {
        let searchFilter = null
        if (debouncedSearchTerm) {
          if (table === "History") {
            searchFilter = `voucher_no.ilike.%${debouncedSearchTerm}%,beneficiary_name.ilike.%${debouncedSearchTerm}%,project.ilike.%${debouncedSearchTerm}%,purpose_of_payment.ilike.%${debouncedSearchTerm}%,company_name.ilike.%${debouncedSearchTerm}%`
          } else {
            searchFilter = `beneficiary_name.ilike.%${debouncedSearchTerm}%,company_name.ilike.%${debouncedSearchTerm}%`
          }
        }

        let query = supabase.from(table).select("*")
        if (searchFilter) query = query.or(searchFilter)
        if (selectedCompany !== "all") query = query.eq("company_name", selectedCompany)
        if (table === "History") {
          if (selectedProject !== "all") query = query.eq("project", selectedProject)
          if (selectedPurpose !== "all") query = query.eq("purpose_of_payment", selectedPurpose)
          if (selectedTransactionType !== "all") query = query.eq("transaction_type", selectedTransactionType)
        }
        if (selectedName !== "all") query = query.eq("beneficiary_name", selectedName)
        if (dateFrom) query = query.gte("date_of_payment", dateFrom)
        if (dateTo) query = query.lte("date_of_payment", dateTo)
        if (debouncedAmountFrom) query = query.gte("amount", debouncedAmountFrom)
        if (debouncedAmountTo) query = query.lte("amount", debouncedAmountTo)

        const { data, error } = await query.order("created_date", { ascending: false })
        if (error) throw error
        return data || []
      }

      const [debitData, creditData] = await Promise.all([
        fetchAllData("History"),
        fetchAllData("Credit")
      ])

      const doc = new jsPDF("l", "mm", "a4")
      const pageWidth = 297
      const pageHeight = 210

      // Pagination setup
      const rowsPerPage = 28
      const totalPages = Math.max(
        Math.ceil(debitData.length / rowsPerPage),
        Math.ceil(creditData.length / rowsPerPage),
        1
      )

      // Calculate totals for the full dataset
      const debitTotal = debitData.reduce((sum, d) => sum + (Number(d.amount) || 0), 0)
      const creditTotal = creditData.reduce((sum, d) => sum + (Number(d.amount) || 0), 0)

      const formatDate = (dateString: string) => {
        if (!dateString) return ""
        try {
          return new Date(dateString).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" })
        } catch {
          return dateString
        }
      }

      for (let p = 0; p < totalPages; p++) {
        if (p > 0) doc.addPage()

        // Page Header
        doc.setFont("helvetica", "bold")
        doc.setFontSize(18)
        doc.setTextColor(0, 0, 0)
        doc.text("VOUCHER SUMMARY REPORT", pageWidth / 2, 12, { align: "center" })
        doc.setFontSize(10)
        doc.text(`Page ${p + 1} of ${totalPages}`, pageWidth - 20, 10, { align: "right" })

        // Date Range Subtitle
        const fromDateStr = dateFrom ? formatDate(dateFrom) : "Start"
        const toDateStr = dateTo ? formatDate(dateTo) : "End"
        const dateHeaderRange = `From Date: ${fromDateStr}     To Date: ${toDateStr}`
        
        doc.setFont("helvetica", "normal")
        doc.setFontSize(10)
        doc.text(dateHeaderRange, pageWidth / 2, 19, { align: "center" })

        const debitSlice = debitData.slice(p * rowsPerPage, (p + 1) * rowsPerPage)
        const creditSlice = creditData.slice(p * rowsPerPage, (p + 1) * rowsPerPage)
        const isLastPage = p === totalPages - 1

        // Debit Table (Left)
        const debitBody: any[] = debitSlice.map((d, i) => [
          p * rowsPerPage + i + 1,
          d.beneficiary_name || "",
          // d.company_name || "",
          (d.company_name || "").split(" ").slice(0, 2).join(" "),
          formatDate(d.date_of_payment || d.created_date || ""),
          { content: Number(d.amount).toLocaleString("en-IN"), styles: { halign: 'right' } }
        ])

        // Add total row on the last page
        if (isLastPage) {
          debitBody.push([
            { content: "TOTAL", colSpan: 4, styles: { fontStyle: 'bold', fillColor: [219, 234, 254], textColor: [30, 58, 138] } },
            { content: debitTotal.toLocaleString("en-IN"), styles: { fontStyle: 'bold', halign: 'right', fillColor: [219, 234, 254], textColor: [30, 58, 138] } }
          ])
        }

        autoTable(doc, {
          startY: 30,
          head: [['S.N.', 'Beneficiary Name (Debit)', 'Company Name', 'Date', 'Amount']],
          body: debitBody,

          // margin: { left: 8, right: 152 },
          // tableWidth: 135,
          margin: { left: 6, right: 150 },
tableWidth: 141,
theme: 'grid',
          styles: { fontSize: 6, cellPadding: 1.5, lineWidth: 0.1 },
          headStyles: { fillColor: [59, 130, 246], textColor: 255 },

          // columnStyles: {
          //   0: { cellWidth: 8 },
          //   1: { cellWidth: 42 },
          //   2: { cellWidth: 18 },
          //   3: { cellWidth: 18 },
          //   4: { cellWidth: 22, halign: 'right' }
          // },
          columnStyles: {
  0: { cellWidth: 10 },
  1: { cellWidth: 55 },
  2: { cellWidth: 30 },
  3: { cellWidth: 20 },
  4: { cellWidth: 26, halign: 'right' }
},
          didDrawPage: (data) => {
            doc.setFontSize(11)
            doc.setTextColor(59, 130, 246)
            doc.text("Debit Vouchers", data.settings.margin.left, 28)
          }
        })

        // Credit Table (Right)
        const creditBody: any[] = creditSlice.map((d, i) => [
          p * rowsPerPage + i + 1,
          d.beneficiary_name || "",
          // d.company_name || "",
          (d.company_name || "").split(" ").slice(0, 2).join(" "),
          formatDate(d.date_of_payment || d.created_date || ""),
          { content: Number(d.amount).toLocaleString("en-IN"), styles: { halign: 'right' } }
        ])

        // Add total row on the last page
        if (isLastPage) {
          creditBody.push([
            { content: "TOTAL", colSpan: 4, styles: { fontStyle: 'bold', fillColor: [254, 215, 170], textColor: [120, 53, 15] } },
            { content: creditTotal.toLocaleString("en-IN"), styles: { fontStyle: 'bold', halign: 'right', fillColor: [254, 215, 170], textColor: [120, 53, 15] } }
          ])
        }

        autoTable(doc, {
          startY: 30,
          head: [['S.N.', 'Beneficiary Name (Credit)', 'Company Name', 'Date', 'Amount']],
          body: creditBody,
          // margin: { left: pageWidth / 2 + 5, right: 10 },
          // styles: { fontSize: 7, cellPadding: 2, lineWidth: 0.1 },
          // margin: { left: 154, right: 8 },
          // tableWidth: 135,
          margin: { left: 150, right: 6 },
tableWidth: 141,
theme: 'grid',
          styles: { fontSize: 6, cellPadding: 1.5, lineWidth: 0.1 },
          headStyles: { fillColor: [249, 115, 22], textColor: 255 },

          // columnStyles: {
          //   0: { cellWidth: 8 },
          //   1: { cellWidth: 42 },
          //   2: { cellWidth: 18 },
          //   3: { cellWidth: 18 },
          //   4: { cellWidth: 22, halign: 'right' }
          // },
          columnStyles: {
  0: { cellWidth: 10 },
  1: { cellWidth: 55 },
  2: { cellWidth: 30 },
  3: { cellWidth: 20 },
  4: { cellWidth: 26, halign: 'right' }
},
          didDrawPage: (data) => {
            doc.setFontSize(11)
            doc.setTextColor(249, 115, 22)
            doc.text("Credit Vouchers", data.settings.margin.left, 28)
          }
        })
      }

      doc.save(`Voucher_Summary_${new Date().toISOString().split('T')[0]}.pdf`)
    } catch (error) {
      console.error("PDF Generation Error:", error)
      alert("Failed to generate PDF report")
    } finally {
      setIsRefetching(false)
    }
  }

  // Full-page spinner only on very first load; subsequent fetches use inline indicator
  if (loading && !hasLoadedRef.current) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-50 flex items-center justify-center p-4">
        <Card className="p-6 sm:p-8 text-center w-full max-w-md">
          <CardContent>
            <Loader2 className="h-8 w-8 sm:h-12 sm:w-12 animate-spin text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold text-gray-600 mb-2">Loading Payment History</h3>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Filters Card */}
      <VoucherFilters
        recordType={recordType}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedName={selectedName}
        setSelectedName={setSelectedName}
        selectedCompany={selectedCompany}
        setSelectedCompany={setSelectedCompany}
        selectedProject={selectedProject}
        setSelectedProject={setSelectedProject}
        selectedPurpose={selectedPurpose}
        setSelectedPurpose={setSelectedPurpose}
        selectedTransactionType={selectedTransactionType}
        setSelectedTransactionType={setSelectedTransactionType}
        dateFrom={dateFrom}
        setDateFrom={setDateFrom}
        dateTo={dateTo}
        setDateTo={setDateTo}
        amountFrom={amountFrom}
        setAmountFrom={setAmountFrom}
        amountTo={amountTo}
        setAmountTo={setAmountTo}
        activeFiltersCount={activeFiltersCount}
        clearAllFilters={clearAllFilters}
        uniqueNames={uniqueNames}
        uniqueCompanies={uniqueCompanies}
        uniqueProjects={uniqueProjects}
        uniquePurposes={uniquePurposes}
        uniqueTransactionTypes={uniqueTransactionTypes}
      />

      {/* Top Tabs & Actions Toolbar */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
        {/* Left: Tab selectors */}
        <div className="flex flex-wrap bg-slate-100/80 p-1 rounded-xl gap-1 w-full xl:w-auto">
          <button
            onClick={() => setRecordType("Debit")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all duration-200 flex-1 sm:flex-initial justify-center ${
              recordType === "Debit"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/40"
            }`}
          >
            <ArrowUpRight className="h-4 w-4 text-red-500" />
            <span>Payment Vouchers</span>
          </button>
          <button
            onClick={() => setRecordType("Credit")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all duration-200 flex-1 sm:flex-initial justify-center ${
              recordType === "Credit"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/40"
            }`}
          >
            <ArrowDownLeft className="h-4 w-4 text-emerald-500" />
            <span>Receipt Vouchers</span>
          </button>
          <button
            onClick={() => setRecordType("Transfer")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all duration-200 flex-1 sm:flex-initial justify-center ${
              recordType === "Transfer"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/40"
            }`}
          >
            <RefreshCw className="h-4 w-4 text-blue-500" />
            <span>Contra</span>
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3 w-full xl:w-auto justify-end">
          <Button
            onClick={generateSummaryPDF}
            variant="outline"
            size="sm"
            className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100 h-10 px-4 rounded-xl font-bold flex items-center gap-2 transition-all duration-200"
          >
            <FileText className="h-4 w-4" />
            <span>PDF Download</span>
          </Button>
          <Button
            onClick={handleExportToExcel}
            disabled={isExporting}
            size="sm"
            className="
              relative overflow-hidden
              bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600
              hover:from-emerald-600 hover:via-green-600 hover:to-emerald-700
              text-white font-bold
              border border-emerald-400/30
              shadow-sm hover:shadow-md
              transition-all duration-200
              rounded-xl px-4 h-10
              text-sm
              flex items-center gap-2
            "
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="h-4 w-4" />
            )}
            <span>{isExporting ? "Exporting..." : "Export Excel"}</span>
          </Button>
        </div>
      </div>

      {/* Vouchers Table */}
      {filteredVouchers.length === 0 ? (
        <Card className="text-center p-6 sm:p-12 border border-slate-100 rounded-2xl shadow-sm">
          <CardContent>
            <FileText className="h-12 w-12 sm:h-16 sm:w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg sm:text-xl font-bold text-slate-700 mb-2">
              {vouchers.length === 0 ? "No Vouchers Found" : "No Matching Vouchers"}
            </h3>
            <p className="text-sm sm:text-base text-slate-500 mb-6">
              {vouchers.length === 0
                ? "No payment vouchers found in the History database."
                : "Try adjusting your search criteria or filters."}
            </p>
            {vouchers.length === 0 ? (
              <Button
                onClick={() => router.push("/voucher")}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl px-5 py-2.5 shadow-sm text-sm"
              >
                Create First Voucher
              </Button>
            ) : (
              <Button
                onClick={clearAllFilters}
                variant="outline"
                className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100/60 font-bold rounded-xl px-5 py-2.5 text-sm"
              >
                Clear All Filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-md border border-slate-100 rounded-2xl overflow-hidden">
          {/* <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100/50 py-4 px-5 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4.5 w-4.5 text-blue-600" />
                <CardTitle className="text-sm sm:text-base font-bold text-slate-800">
                  {recordType === "Debit"
                    ? "Payment Vouchers"
                    : recordType === "Credit"
                    ? "Receipt Vouchers"
                    : "Contra Vouchers"}{" "}
                  <span className="text-xs text-slate-500 font-normal ml-1">
                    ({filteredVouchers.length} records)
                  </span>
                </CardTitle>
              </div>
            </div>
          </CardHeader> */}

          <CardContent className="p-0">
              {/* Mobile Card View for small screens with scrollable frame */}
              <div className="block sm:hidden">
                <div className="h-[500px] max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  <div className="space-y-3 p-3">
                    {filteredVouchers.map((voucher, index) => (
                      <Card key={voucher.id} className="p-4 shadow-sm border hover:bg-gray-50 transition-colors">
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-blue-600 text-sm">{voucher.voucherNo}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(voucher.timestamp).toLocaleDateString("en-IN")}
                              </p>
                            </div>
                            <Badge
                              variant={voucher.transactionType === "PAYMENT" ? "default" : "secondary"}
                              className={`text-xs ${voucher.transactionType === "PAYMENT"
                                ? "bg-green-100 text-green-800"
                                : "bg-blue-100 text-blue-800"
                                }`}
                            >
                              {voucher.transactionType}
                            </Badge>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm">
                              <strong>Company:</strong> <span className="text-xs">{voucher.companyName}</span>
                            </p>
                            <p className="text-sm">
                              <strong>Beneficiary:</strong> <span className="text-xs">{voucher.beneficiaryName}</span>
                            </p>
                            <p className="text-sm">
                              <strong>Purpose:</strong> <span className="text-xs">{voucher.purposeOfPayment}</span>
                            </p>
                            <p className="text-sm">
                              <strong>Project:</strong> <span className="text-xs">{voucher.project}</span>
                            </p>
                            <p className="text-sm">
                              <strong>Name:</strong> <span className="text-xs">{voucher.name}</span>
                            </p>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t">
                            <p className="font-semibold text-green-600 text-sm">
                              ₹{Number.parseFloat(voucher.amount).toLocaleString("en-IN")}
                            </p>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => downloadPDF(voucher)}
                                className="bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200 text-xs px-2 py-1"
                              >
                                <Download className="h-3 w-3 mr-1" />
                                Download
                              </Button>
                              {userRole === "admin" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openEditModal(voucher)}
                                  className="bg-green-50 hover:bg-green-100 text-green-600 border-green-200 text-xs px-2 py-1"
                                >
                                  Edit
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                    {filteredVouchers.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No vouchers to display</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Desktop Table View for larger screens with scrollable frame */}
              <div className="hidden sm:block w-full">
                <div className="overflow-x-auto w-full border rounded-lg">
                  <div className="h-[500px] max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                    <table className="w-full caption-bottom text-sm border-collapse relative">
                      <TableHeader className="sticky top-0 bg-slate-100 z-10">
                        <TableRow>
                          {recordType === "Debit" ? (
                            <>
                              <TableHead className="font-semibold text-xs lg:text-sm">Voucher No.</TableHead>
                              <TableHead className="font-semibold text-xs lg:text-sm">Created Date</TableHead>
                              <TableHead className="font-semibold text-xs lg:text-sm">Voucher Date</TableHead>
                              <TableHead className="font-semibold text-xs lg:text-sm">Company</TableHead>
                              <TableHead className="font-semibold text-xs lg:text-sm">Beneficiary Name</TableHead>
                              <TableHead className="font-semibold text-xs lg:text-sm">Purpose</TableHead>
                              <TableHead className="font-semibold text-xs lg:text-sm">Project</TableHead>
                              <TableHead className="text-right font-semibold text-xs lg:text-sm">Amount</TableHead>
                              <TableHead className="font-semibold text-xs lg:text-sm">Transaction Type</TableHead>
                              <TableHead className="font-semibold text-center text-xs lg:text-sm">Name</TableHead>
                            </>
                          ) : (
                            <>
                              <TableHead className="font-semibold text-xs lg:text-sm">ID</TableHead>
                              <TableHead className="font-semibold text-xs lg:text-sm">Created Date</TableHead>
                              <TableHead className="font-semibold text-xs lg:text-sm">Payment Date</TableHead>
                              <TableHead className="font-semibold text-xs lg:text-sm">Company Name</TableHead>
                              <TableHead className="font-semibold text-xs lg:text-sm">Payer Name</TableHead>
                              <TableHead className="font-semibold text-xs lg:text-sm">Purpose</TableHead>
                              <TableHead className="font-semibold text-xs lg:text-sm">Project</TableHead>
                              <TableHead className="text-right font-semibold text-xs lg:text-sm">Amount</TableHead>
                              <TableHead className="font-semibold text-xs lg:text-sm">Transaction Type</TableHead>
                            </>
                          )}
                          <TableHead className="font-semibold text-center text-xs lg:text-sm">View</TableHead>
                          {userRole === "admin" && (
                            <TableHead className="font-semibold text-center text-xs lg:text-sm">Edit</TableHead>
                          )}
                          {userRole === "admin" && (
                            <TableHead className="font-semibold text-center text-xs lg:text-sm">Delete</TableHead>
                          )}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredVouchers.map((voucher, index) => (
                          <TableRow
                            key={voucher.id}
                            className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-blue-50 transition-colors`}
                          >
                            {recordType === "Debit" ? (
                              <>
                                <TableCell className="font-medium text-blue-600 text-xs lg:text-sm">
                                  {voucher.voucherNo}
                                </TableCell>
                                <TableCell className="text-xs lg:text-sm">
                                  {new Date(voucher.timestamp).toLocaleDateString("en-IN")}
                                </TableCell>
                                <TableCell className="text-xs lg:text-sm">
                                  {new Date(voucher.dateOfPaymentProcess).toLocaleDateString("en-IN")}
                                </TableCell>
                                <TableCell className="max-w-[100px] lg:max-w-[150px] truncate">
                                  <Badge variant="outline" className="text-xs">
                                    {voucher.companyName}
                                  </Badge>
                                </TableCell>
                                <TableCell className="max-w-[80px] lg:max-w-[120px] truncate text-xs lg:text-sm">
                                  {voucher.beneficiaryName}
                                </TableCell>
                                <TableCell className="max-w-[100px] lg:max-w-[150px] truncate text-xs lg:text-sm">
                                  {voucher.purposeOfPayment}
                                </TableCell>
                                <TableCell className="max-w-[100px] lg:max-w-[150px] truncate text-xs lg:text-sm">
                                  {voucher.project}
                                </TableCell>
                                <TableCell className="text-right font-bold text-green-600 text-xs lg:text-sm">
                                  ₹{Number.parseFloat(voucher.amount).toLocaleString("en-IN")}
                                </TableCell>
                                <TableCell className="text-xs lg:text-sm">
                                  {voucher.transactionType}
                                </TableCell>
                                <TableCell className="text-center text-xs lg:text-sm">
                                  {voucher.name}
                                </TableCell>
                              </>
                            ) : (
                              <>
                                <TableCell className="font-medium text-orange-600 text-xs lg:text-sm">
                                  {voucher.id}
                                </TableCell>
                                <TableCell className="text-xs lg:text-sm">
                                  {new Date(voucher.timestamp).toLocaleDateString("en-IN")}
                                </TableCell>
                                <TableCell className="text-xs lg:text-sm">
                                  {new Date(voucher.dateOfPaymentProcess).toLocaleDateString("en-IN")}
                                </TableCell>
                                <TableCell className="text-xs lg:text-sm font-semibold">
                                  {voucher.companyName}
                                </TableCell>
                                <TableCell className="text-xs lg:text-sm">
                                  {voucher.beneficiaryName}
                                </TableCell>
                                <TableCell className="text-xs lg:text-sm max-w-[150px] truncate">
                                  {voucher.purposeOfPayment}
                                </TableCell>
                                <TableCell className="text-xs lg:text-sm max-w-[150px] truncate">
                                  {voucher.project}
                                </TableCell>
                                <TableCell className="text-right font-bold text-green-600 text-xs lg:text-sm">
                                  ₹{Number.parseFloat(voucher.amount).toLocaleString("en-IN")}
                                </TableCell>
                                <TableCell className="text-xs lg:text-sm font-medium text-orange-600">
                                  {voucher.transactionType}
                                </TableCell>
                              </>
                            )}
                            <TableCell>
                              <div className="flex justify-center space-x-1 lg:space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => downloadPDF(voucher)}
                                  className="bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200 p-1 lg:p-2"
                                >
                                  <Download className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                            {userRole === "admin" && (
                              <TableCell>
                                <div className="flex justify-center space-x-1 lg:space-x-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openEditModal(voucher)}
                                    className="bg-green-50 hover:bg-green-100 text-green-600 border-green-200 p-1 lg:p-2"
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      className="h-3 w-3"
                                      viewBox="0 0 20 20"
                                      fill="currentColor"
                                    >
                                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                    </svg>
                                  </Button>
                                </div>
                              </TableCell>
                            )}
                            {userRole.toLowerCase() === "admin" && (
                              <TableCell>
                                <div className="flex justify-center space-x-1 lg:space-x-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={async () => {
                                      try {
                                        await deleteVoucher(voucher.id)
                                      } catch (error) {
                                        console.error("Delete failed:", error)
                                      }
                                    }}
                                    disabled={loading || deletingVoucherId === voucher.id}
                                    className="bg-red-50 hover:bg-red-100 text-red-600 border-red-200 p-1 lg:p-2 transition-colors"
                                  >
                                    {deletingVoucherId === voucher.id ? (
                                      <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                                    ) : (
                                      <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                                    )}
                                    <span className="sr-only">Delete voucher</span>
                                  </Button>
                                </div>
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                        {filteredVouchers.length === 0 && (
                          <TableRow>
                            <TableCell
                              colSpan={userRole === "admin" ? 13 : 11}
                              className="text-center py-8 text-gray-500"
                            >
                              <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                              <p>No vouchers to display</p>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </table>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}


      {/* Edit Modal */}
      <EditVoucherModal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        editVoucher={editVoucher}
        setEditVoucher={setEditVoucher}
        onSubmit={handleEditSubmit}
        isUpdating={isUpdating}
        loadingMasterData={loadingMasterData}
        masterData={masterData}
        handleAmountChange={handleAmountChange}
        formatDateForInput={formatDateForInput}
      />
    </div>
  )
}