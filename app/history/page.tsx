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
import { ArrowLeft, Search, FileText, Download, Trash2, BarChart3, Filter, X, Loader2, Users, Database } from "lucide-react"
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
  const teens = ["Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"]
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
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedVoucher, setSelectedVoucher] = useState<VoucherData | null>(null)
  const [userRole, setUserRole] = useState("")
  const [username, setUsername] = useState("")
  const [showFullDetails, setShowFullDetails] = useState(false)

  // Refs to manage fetch flow without extra re-renders
  const hasLoadedRef = useRef(false)
  const skipNextFetchRef = useRef(false)
  const filterSignatureRef = useRef("")

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
  // Uses a filter-signature ref to distinguish filter-change vs page-change
  useEffect(() => {
    const sig = [
      debouncedSearchTerm, selectedCompany, selectedProject, selectedPurpose,
      selectedTransactionType, selectedName, dateFrom, dateTo,
      debouncedAmountFrom, debouncedAmountTo
    ].join("|")

    const filterChanged = sig !== filterSignatureRef.current
    if (filterChanged) {
      filterSignatureRef.current = sig
      if (currentPage !== 1) {
        // Mark next effect fire (triggered by setCurrentPage) as a skip
        skipNextFetchRef.current = true
        setCurrentPage(1)
      }
      // Fetch page 1 immediately — no need to wait for state update
      fetchRealHistoryData(1)
      return
    }

    // This fire was caused by setCurrentPage(1) from a filter change — skip it
    if (skipNextFetchRef.current) {
      skipNextFetchRef.current = false
      return
    }

    // Normal page navigation
    fetchRealHistoryData(currentPage)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, debouncedSearchTerm, selectedCompany, selectedProject, selectedPurpose, selectedTransactionType, selectedName, dateFrom, dateTo, debouncedAmountFrom, debouncedAmountTo])

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
        companyNames:     [...new Set(masterDataArr.map(i => i.company_name).filter(Boolean))].sort() as string[],
        transactionTypes: [...new Set(masterDataArr.map(i => i.transaction_type).filter(Boolean))] as string[],
        projects:         [...new Set(masterDataArr.map(i => i.project).filter(Boolean))].sort() as string[],
        bankAccounts:     [...new Set(masterDataArr.map(i => i.bank_ac_from).filter(Boolean))] as string[],
        purposes:         [...new Set(historyDataArr.map(i => i.purpose_of_payment).filter(Boolean))].sort() as string[],
        uniqueNames:      [...new Set(historyDataArr.map(i => i.beneficiary_name).filter(Boolean))].sort() as string[],
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

  const fetchRealHistoryData = async (page: number = currentPage) => {
    // First load → show full-page spinner; subsequent → subtle refetch indicator
    if (!hasLoadedRef.current) {
      setLoading(true)
    } else {
      setIsRefetching(true)
    }

    try {
      const searchFilter = debouncedSearchTerm
        ? `voucher_no.ilike.%${debouncedSearchTerm}%,beneficiary_name.ilike.%${debouncedSearchTerm}%,project.ilike.%${debouncedSearchTerm}%,purpose_of_payment.ilike.%${debouncedSearchTerm}%,company_name.ilike.%${debouncedSearchTerm}%`
        : null

      // Only fetch columns actually used in the UI — avoids transferring large unused fields
      const COLUMNS = [
        'id','voucher_no','created_date','date_of_payment','company_name',
        'beneficiary_name','purpose_of_payment','project','amount','transaction_type',
        'name','pdf_link','bank_ac_from','po_number','beneficiary_ac_name',
        'beneficiary_ac_number','beneficiary_bank_name','beneficiary_bank_ifsc',
        'particulars','amount_in_words','entry_done_by','checked_by','approved_by'
      ].join(',')

      // Build the main paginated query
      let mainQuery = supabase.from("History").select(COLUMNS, { count: "exact" })
      let amountQuery = supabase.from("History").select("amount")

      // Apply identical filters to both queries
      const applyFilters = (q: any) => {
        if (searchFilter) q = q.or(searchFilter)
        if (selectedCompany !== "all") q = q.eq("company_name", selectedCompany)
        if (selectedProject !== "all") q = q.eq("project", selectedProject)
        if (selectedPurpose !== "all") q = q.eq("purpose_of_payment", selectedPurpose)
        if (selectedTransactionType !== "all") q = q.eq("transaction_type", selectedTransactionType)
        if (selectedName !== "all") q = q.eq("beneficiary_name", selectedName)
        if (dateFrom) q = q.gte("created_date", dateFrom)
        if (dateTo)   q = q.lte("created_date", dateTo)
        if (debouncedAmountFrom) q = q.gte("amount", debouncedAmountFrom)
        if (debouncedAmountTo)   q = q.lte("amount", debouncedAmountTo)
        return q
      }

      mainQuery   = applyFilters(mainQuery)
      amountQuery = applyFilters(amountQuery)

      // Run both queries in parallel — cuts wait time in half vs sequential
      const [mainResult, amountResult] = await Promise.all([
        mainQuery.order("created_date", { ascending: false }).range((page - 1) * pageSize, page * pageSize - 1),
        amountQuery
      ])

      if (mainResult.error) throw mainResult.error

      if (mainResult.data) {
        processRealSupabaseData(mainResult.data)
        setTotalCount(mainResult.count || 0)
      }

      if (!amountResult.error && amountResult.data) {
        const total = amountResult.data.reduce((sum, row) => sum + (Number.parseFloat(row.amount) || 0), 0)
        setServerTotalAmount(total)
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

  const processRealSupabaseData = useCallback((data: any[]) => {
    console.log("Processing data from Supabase...")
    
    if (!Array.isArray(data) || data.length === 0) {
      setVouchers([])
      return
    }

    const mappedVouchers = data
      .map((row: any) => {
        if (!row.voucher_no) return null

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
          beneficiaryName: row.beneficiary_name || "",
          poNumber: row.po_number || "",
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
        } as VoucherData
      })
      .filter((voucher): voucher is VoucherData => Boolean(voucher))

    setVouchers(mappedVouchers)
    console.log(`✅ Successfully loaded ${mappedVouchers.length} vouchers from History table!`)
  }, [])

  const updateVoucherInSupabase = async (voucher: VoucherData) => {
    try {
      console.log("Attempting to update voucher:", voucher.voucherNo)

      const { error } = await supabase
        .from('History')
        .update({
          bank_ac_from: voucher.bankAcFrom || null,
          company_name: voucher.companyName || null,
          date_of_payment: voucher.dateOfPaymentProcess || null,
          purpose_of_payment: voucher.purposeOfPayment || null,
          transaction_type: voucher.transactionType || null,
          project: voucher.project || null,
          beneficiary_name: voucher.beneficiaryName || null,
          po_number: voucher.poNumber || null,
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
      const colors = {
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

      // Voucher Title
      doc.setFontSize(12)
      doc.setTextColor(...colors.secondary)
      doc.text("BANK PAYMENT VOUCHER", pageWidth / 2, currentY + 16, { align: "center" })

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

      console.log("PDF uploaded successfully:", pdfUrl)

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
    if (!confirm("Are you sure you want to permanently delete this voucher?")) {
      return
    }

    try {
      setDeletingVoucherId(voucherId)
      setLoading(true)

      // Delete from Supabase
      const { error } = await supabase
        .from('History')
        .delete()
        .eq('id', voucherId)

      if (error) {
        throw new Error(error.message || "Delete operation failed")
      }

      // Update local state
      setVouchers((prev) => prev.filter((v) => v.id !== voucherId))
      
      // Refresh counts and pagination from backend
      fetchRealHistoryData()

      alert(`Voucher deleted successfully`)
    } catch (error) {
      console.error("Voucher deletion failed:", error)
      alert(`Delete failed: ${error instanceof Error ? error.message : "Unknown error"}`)
      fetchRealHistoryData()
    } finally {
      setDeletingVoucherId(null)
      setLoading(false)
    }
  }

  // Memoized filter options for performance


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
          console.log("Direct download failed, opening in new tab:", fetchError)
          // Fallback: Open in new tab for user to download manually
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

        doc.setFont("helvetica")
        doc.setFontSize(16)
        doc.setTextColor(0, 0, 0)
        doc.text(voucher.companyName || "COMPANY NAME", 105, 20, { align: "center" })

        doc.setFontSize(12)
        doc.text("Bank Payment Voucher - Complete Details", 105, 30, { align: "center" })

        doc.rect(10, 35, 190, 250)

        let yPosition = 50

        const addSection = (title: string, fields: Array<{ label: string; value: string }>) => {
          doc.setFontSize(10)
          doc.setFont("helvetica", "bold")

          doc.setFillColor(230, 230, 230)
          doc.rect(15, yPosition - 5, 180, 8, "F")
          doc.text(title, 20, yPosition)

          yPosition += 12

          doc.setFont("helvetica", "normal")
          doc.setFontSize(8)

          fields.forEach((field) => {
            if (yPosition > 270) {
              doc.addPage()
              yPosition = 20
            }

            doc.setFont("helvetica", "bold")
            doc.text(field.label + ":", 20, yPosition)

            doc.setFont("helvetica", "normal")
            const lines = doc.splitTextToSize(field.value || "N/A", 120)
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
          { label: "Voucher Number", value: voucher.voucherNo },
          { label: "Transaction Type", value: voucher.transactionType },
          { label: "Purpose", value: voucher.purposeOfPayment },
          { label: "Project", value: voucher.project },
        ])

        addSection("BANK INFORMATION", [
          { label: "Bank AC From", value: voucher.bankAcFrom },
          { label: "Date", value: voucher.dateOfPaymentProcess },
        ])

        addSection("BENEFICIARY INFORMATION", [
          { label: "Beneficiary Name (Paid To)", value: voucher.beneficiaryName },
          { label: "PO Number", value: voucher.poNumber },
          { label: "Beneficiary A/C Name", value: voucher.beneficiaryAcName },
          { label: "Beneficiary A/C Number", value: voucher.beneficiaryAcNumber },
          { label: "Beneficiary Bank Name", value: voucher.beneficiaryBankName },
        ])

        addSection("FINANCIAL INFORMATION", [
          { label: "Particulars", value: voucher.particulars },
          { label: "Amount", value: `₹${Number.parseFloat(voucher.amount).toLocaleString("en-IN")}` },
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

        doc.save(`Payment_Voucher_${voucher.voucherNo}_${Date.now()}.pdf`)
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
      pdfLink: "PDF Link",
      name: "Name",
    }

    return (
      <div className="mt-4 sm:mt-6 bg-gray-50 p-3 sm:p-4 rounded-lg">
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
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <Button
                onClick={() => router.push("/voucher")}
                variant="outline"
                size="sm"
                className="bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100 text-xs sm:text-sm"
              >
                <ArrowLeft className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                Back to Voucher
              </Button>
              {userRole.toLowerCase() === "admin" && (
                <>
                  <Button
                    onClick={() => router.push("/dashboard")}
                    variant="outline"
                    size="sm"
                    className="bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100 text-xs sm:text-sm"
                  >
                    <BarChart3 className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                    Dashboard
                  </Button>
                  <Button
                    onClick={() => router.push("/master")}
                    variant="outline"
                    size="sm"
                    className="bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 text-xs sm:text-sm"
                  >
                    <Database className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                    Master
                  </Button>
                  <Button
                    onClick={() => router.push("/users")}
                    variant="outline"
                    size="sm"
                    className="bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100 text-xs sm:text-sm"
                  >
                    <Users className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                    Users
                  </Button>
               </>
              )}
              {isRefetching && (
                <div className="flex items-center gap-2 px-2 py-1 bg-blue-50 text-blue-600 rounded-md text-xs font-medium animate-pulse">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Refreshing...
                </div>
              )}
              <Badge variant="secondary" className="bg-green-100 text-green-800 px-2 sm:px-3 py-1 text-xs">
                {totalCount} Total Vouchers
              </Badge>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 px-2 sm:px-3 py-1 text-xs">
                Total Amount: ₹{serverTotalAmount.toLocaleString("en-IN")}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className=" mx-auto px-4 sm:px-4 py-8 sm:py-8 space-y-4 sm:space-y-6">
        {/* Search and Filters */}
        <VoucherFilters
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

        {/* Pagination Controls */}
        <div className="flex items-center justify-between bg-white p-3 rounded-lg border shadow-sm">
          <div className="text-sm text-gray-500">
            Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> to{" "}
            <span className="font-medium">{Math.min(currentPage * pageSize, totalCount)}</span> of{" "}
            <span className="font-medium">{totalCount}</span> results
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1 || loading}
            >
              Previous
            </Button>
            <div className="flex items-center px-2 text-sm font-medium">
              Page {currentPage} of {Math.ceil(totalCount / pageSize) || 1}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => p + 1)}
              disabled={currentPage >= Math.ceil(totalCount / pageSize) || loading}
            >
              Next
            </Button>
          </div>
        </div>

        {/* Vouchers Table */}
        {filteredVouchers.length === 0 ? (
          <Card className="text-center p-6 sm:p-12">
            <CardContent>
              <FileText className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg sm:text-xl font-semibold text-gray-600 mb-2">
                {vouchers.length === 0 ? "No Vouchers Found" : "No Matching Vouchers"}
              </h3>
              <p className="text-sm sm:text-base text-gray-500 mb-4">
                {vouchers.length === 0
                  ? "No payment vouchers found in the History database."
                  : "Try adjusting your search criteria or filters."}
              </p>
              {vouchers.length === 0 ? (
                <Button
                  onClick={() => router.push("/voucher")}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm"
                >
                  Create First Voucher
                </Button>
              ) : (
                <Button
                  onClick={clearAllFilters}
                  variant="outline"
                  className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 text-sm"
                >
                  Clear All Filters
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <CardTitle className="flex items-center text-sm sm:text-base">
                <FileText className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                Payment Vouchers ({filteredVouchers.length})
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-2 bg-orange-100 text-orange-800 text-xs">
                    Filtered
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {/* Mobile Card View for small screens with scrollable frame */}
              <div className="block sm:hidden">
                <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
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
              <div className="hidden sm:block">
                <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="sticky top-0 bg-gray-50 z-10">
                        <TableRow>
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
                          <TableHead className="font-semibold text-center text-xs lg:text-sm">Download</TableHead>
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
                            <TableCell className="max-w-[80px] lg:max-w-[100px] truncate text-xs lg:text-sm">
                              {voucher.purposeOfPayment}
                            </TableCell>
                            <TableCell className="max-w-[80px] lg:max-w-[100px] truncate text-xs lg:text-sm">
                              {voucher.project}
                            </TableCell>
                            <TableCell className="text-right font-semibold text-green-600 text-xs lg:text-sm">
                              ₹{Number.parseFloat(voucher.amount).toLocaleString("en-IN")}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={voucher.transactionType === "PAYMENT" ? "default" : "secondary"}
                                className={`text-xs ${voucher.transactionType === "PAYMENT"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-blue-100 text-blue-800"
                                  }`}
                              >
                                {voucher.transactionType}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center text-xs lg:text-sm">
                              <Badge variant="outline" className="text-xs">
                                {voucher.name || "N/A"}
                              </Badge>
                            </TableCell>
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
                    </Table>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Modal */}
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