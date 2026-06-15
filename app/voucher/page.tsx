"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LogOut, History, Save, Building2, BarChart3, Users, Database, Check, ChevronsUpDown, RefreshCw } from "lucide-react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { Loader2 , DollarSign } from "lucide-react"
import supabase from "@/lib/supabase"
import emailjs from "@emailjs/browser"
import { cn } from "@/lib/utils"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import React from "react"


interface VoucherData {
  id: string
  voucherNo: string
  dateOfPayment: string
  bankAcFrom: string
  companyName: string
  bankAccount: string
  transactionType: string
  purposeOfPayment: string
  project: string
  beneficiaryName: string
  poNumber: string
  utrNumber: string
  beneficiaryAccountName: string
  beneficiaryAccountNumber: string
  beneficiaryBankName: string
  beneficiaryBankIFSC: string
  amount: string
  amountInWords: string
  particulars: string
  entryDoneBy: string
  checkedBy: string
  vendorNumber: string
  vendorEmail: string
  submittedAt: string
}

const SearchableBeneficiarySelect = ({
  value,
  onValueChange,
  options,
  onSelect,
}: {
  value: string
  onValueChange: (v: string) => void
  options: any[]
  onSelect: (name: string) => void
}) => {
  const [open, setOpen] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const filteredOptions = React.useMemo(() => {
    if (!value) return options
    return options.filter((opt) =>
      opt.beneficiary_name.toLowerCase().includes(value.toLowerCase())
    )
  }, [value, options])

  return (
    <div className="relative w-full" ref={containerRef}>
      <Input
        value={value}
        onChange={(e) => {
          onValueChange(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        className="border-0 border-b border-gray-400 rounded-none px-1 py-0 h-8 text-sm focus:border-gray-600 pr-8 w-full"
        placeholder="Type or select beneficiary"
        required
      />
      <ChevronsUpDown
        className="absolute right-0 top-1/2 -translate-y-1/2 h-4 w-4 shrink-0 opacity-50 cursor-pointer"
        onClick={() => setOpen(!open)}
      />

      {open && filteredOptions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 max-h-60 overflow-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md outline-none">
          {filteredOptions.map((beneficiary) => (
            <div
              key={beneficiary.beneficiary_name}
              className={cn(
                "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                value === beneficiary.beneficiary_name && "bg-accent text-accent-foreground"
              )}
              onClick={() => {
                onSelect(beneficiary.beneficiary_name)
                setOpen(false)
              }}
            >
              <Check
                className={cn(
                  "mr-2 h-4 w-4",
                  value === beneficiary.beneficiary_name ? "opacity-100" : "opacity-0"
                )}
              />
              {beneficiary.beneficiary_name}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}



const extractFirstTwoWords = (text: string) => {
  if (!text) return ""
  return text.split(" ").slice(0, 2).join(" ")
}

export default function VoucherPage() {

  const router = useRouter()

  const [username, setUsername] = useState("")

  const [userRole, setUserRole] = useState("")

  const [nextVoucherNumber, setNextVoucherNumber] = useState("")

  const [paymentFromCompanies, setPaymentFromCompanies] = useState([])

  const [bankAccounts, setBankAccounts] = useState([])

  const [masterBankMappings, setMasterBankMappings] = useState<any[]>([])

  const [companyNames, setCompanyNames] = useState<string[]>([]) // New state for company names

  const [transactionTypes, setTransactionTypes] = useState([]) // New state for transaction types

  const [projects, setProjects] = useState([]) // New state for projects

  const [filteredBankAccounts, setFilteredBankAccounts] = useState<any[]>([])

  const [beneficiaries, setBeneficiaries] = useState<any[]>([])

  const [allBeneficiaryRecords, setAllBeneficiaryRecords] = useState<any[]>([])

  const [availableBeneficiaryBanks, setAvailableBeneficiaryBanks] = useState<any[]>([])

  const [isSubmitting, setIsSubmitting] = useState(false)

  const [voucherData, setVoucherData] = useState<VoucherData>({

    id: "",

    voucherNo: "",

    dateOfPayment: "",

    bankAcFrom: "",

    companyName: "",

    bankAccount: "AXIS BANK LTD- CC A/C 8711-TANAY",

    transactionType: "Payment",

    purposeOfPayment: "",

    // paymentFromCompany: "",

    project: "",

    beneficiaryName: "",

    poNumber: "",

    utrNumber: "",

    beneficiaryAccountName: "",

    beneficiaryAccountNumber: "",

    beneficiaryBankName: "",

    beneficiaryBankIFSC: "",

    amount: "",

    amountInWords: "",

    particulars: "",

    entryDoneBy: "",

    checkedBy: "",

    approvedBy: "",

    vendorNumber: "",

    vendorEmail: "",

    submittedAt: "",

  })

  // Add loading states at the top with other state declarations

  const [isLoadingDropdowns, setIsLoadingDropdowns] = useState(true)

  // Replace the existing fetch functions with these improved versions:

  const handleCompanySelection = (value: string) => {
    handleInputChange("companyName", value)

    // Add a small delay to ensure state is updated
    setTimeout(() => {
      const filtered = filterBankAccountsByCompany(value, bankAccounts)
      setFilteredBankAccounts(filtered)

      // Reset bank account selection if current selection is not in filtered list
      if (voucherData.bankAcFrom && !filtered.includes(voucherData.bankAcFrom)) {
        handleInputChange("bankAcFrom", "")
      }
    }, 100)
  }

  const filterBankAccountsByCompany = (selectedCompany: string, allBankAccounts: any[]) => {
    if (!selectedCompany || !allBankAccounts.length) {
      return allBankAccounts
    }

    // Try exact database match first
    const exactMatches = masterBankMappings
      .filter(item => 
        item.company_name && 
        item.company_name.trim().toLowerCase() === selectedCompany.trim().toLowerCase()
      )
      .map(item => item.bank_ac_from)
      .filter(Boolean)

    if (exactMatches.length > 0) {
      return [...new Set(exactMatches)]
    }

    // Fallback: Keyword-based matching
    const companyKeywords = selectedCompany.split(' ').filter(word => {
      const upperWord = word.toUpperCase()
      const isValidKeyword = word.length > 2 &&
        !['PVT', 'LTD', 'LIMITED', 'PRIVATE', 'INDIA', 'COMPANY', '(INDIA)'].includes(upperWord)
    
      return isValidKeyword
    })

    if (companyKeywords.length === 0) {
      return allBankAccounts
    }

    const strategies = [
      // Strategy 1: All keywords must be present (strict)
      (account: string) => {
        const upperAccount = account.toUpperCase()
        const allMatch = companyKeywords.every(keyword =>
          upperAccount.includes(keyword.toUpperCase())
        )
        return allMatch
      },
      // Strategy 2: At least 2 keywords must be present (moderate)
      (account: string) => {
        const upperAccount = account.toUpperCase()
        const matchCount = companyKeywords.filter(keyword =>
          upperAccount.includes(keyword.toUpperCase())
        ).length
        const matches = matchCount >= Math.min(2, companyKeywords.length)
        return matches
      },
      // Strategy 3: At least 1 keyword must be present (loose)
      (account: string) => {
        const upperAccount = account.toUpperCase()
        const anyMatch = companyKeywords.some(keyword =>
          upperAccount.includes(keyword.toUpperCase())
        )
        return anyMatch
      }
    ]

    // Try strategies in order of preference
    for (let i = 0; i < strategies.length; i++) {
      const filtered = allBankAccounts.filter(strategies[i])
      if (filtered.length > 0) {
        return filtered
      }
    }

    return allBankAccounts
  }

  const fetchCompanyNamesFromMaster = async () => {
    try {
      const { data, error } = await supabase.from('master').select('company_name')
      if (error) throw error

      if (data) {
        const uniqueCompanyNames = [...new Set(data.map(item => item.company_name).filter(Boolean))]
        setCompanyNames(uniqueCompanyNames)
      }
    } catch (error) {
      console.error("Error fetching company names from master:", error)
    }
  }

  const fetchBankAccountsFromMaster = async () => {
    try {
      const { data, error } = await supabase.from('master').select('company_name, bank_ac_from')
      if (error) throw error

      if (data) {
        setMasterBankMappings(data)
        const uniqueBankAccounts = [...new Set(data.map(item => item.bank_ac_from).filter(Boolean))]
        setBankAccounts(uniqueBankAccounts)
        setFilteredBankAccounts(uniqueBankAccounts)
      }
    } catch (error) {
      console.error("Error fetching bank accounts from master:", error)
    }
  }

  const fetchTransactionTypesFromMaster = async () => {
    try {
      // Avoid database error since transaction_type column doesn't exist in master table
      setTransactionTypes(["Payment"])
    } catch (error) {
      console.error("Error setting transaction types:", error)
    }
  }

  const fetchProjectsFromMaster = async () => {
    try {
      const { data, error } = await supabase.from('master').select('project')
      if (error) throw error

      if (data) {
        const uniqueProjects = [...new Set(data.map(item => item.project).filter(Boolean))]
        setProjects(uniqueProjects)
      }
    } catch (error) {
      console.error("Error fetching projects from master:", error)
    }
  }

  const fetchBeneficiariesFromHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('tns_master')
        .select(`
          beneficiary_name,
          beneficiary_account_number,
          beneficiary_bank_name,
          beneficiary_bank_ifsc,
          company_name,
          whatsapp_no,
          email_id,
          created_at
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      if (data) {
        // Save all records (including duplicates for multiple bank accounts)
        const mappedRecords = data.map(item => ({
          beneficiary_name: item.beneficiary_name,
          company_name: item.company_name || '',
          beneficiary_ac_name: item.beneficiary_name,
          beneficiary_ac_number: item.beneficiary_account_number,
          beneficiary_bank_name: item.beneficiary_bank_name,
          beneficiary_bank_ifsc: item.beneficiary_bank_ifsc,
          vendorNumber: item.whatsapp_no || '',
          vendorEmail: item.email_id || ''
        }))
        setAllBeneficiaryRecords(mappedRecords)

        // Use a Map to keep only the latest record for each beneficiary_name in dropdown options
        const uniqueBeneficiariesMap = new Map()
        data.forEach(item => {
          if (item.beneficiary_name) {
            const key = item.beneficiary_name.trim().toLowerCase()
            if (!uniqueBeneficiariesMap.has(key)) {
              uniqueBeneficiariesMap.set(key, {
                beneficiary_name: item.beneficiary_name,
                company_name: item.company_name || '',
                bank_ac_from: '',
                transaction_type: 'Payment',
                beneficiary_ac_name: item.beneficiary_name, // Map name to ac_name
                beneficiary_ac_number: item.beneficiary_account_number,
                beneficiary_bank_name: item.beneficiary_bank_name,
                beneficiary_bank_ifsc: item.beneficiary_bank_ifsc,
                vendorNumber: item.whatsapp_no || '',
                vendorEmail: item.email_id || ''
              })
            }
          }
        })

        const uniqueBeneficiaries = Array.from(uniqueBeneficiariesMap.values())
          .sort((a, b) => a.beneficiary_name.localeCompare(b.beneficiary_name))

        setBeneficiaries(uniqueBeneficiaries)
      }
    } catch (error) {
      console.error("Error fetching beneficiaries from tns_master:", error)
    }
  }

  const handleBeneficiarySelection = (name: string) => {
    handleInputChange("beneficiaryName", name)

    if (!name) {
      handleInputChange("companyName", "")
      handleInputChange("bankAcFrom", "")
      handleInputChange("transactionType", "Payment")
      handleInputChange("poNumber", "")
      handleInputChange("beneficiaryAccountName", "")
      handleInputChange("beneficiaryAccountNumber", "")
      handleInputChange("beneficiaryBankName", "")
      handleInputChange("beneficiaryBankIFSC", "")
      handleInputChange("vendorNumber", "")
      handleInputChange("vendorEmail", "")
      setAvailableBeneficiaryBanks([])
      return
    }

    // Find all matching beneficiary records (could be multiple banks)
    const matchingRecords = allBeneficiaryRecords.filter(
      b => b.beneficiary_name.trim().toLowerCase() === name.trim().toLowerCase()
    )

    // Set available banks for this beneficiary
    setAvailableBeneficiaryBanks(matchingRecords)

    if (matchingRecords.length > 0) {
      const firstRecord = matchingRecords[0]

      // Autofill fields
      if (firstRecord.company_name) {
        handleCompanySelection(firstRecord.company_name)
      }

      if (firstRecord.beneficiary_ac_name) {
        handleInputChange("beneficiaryAccountName", firstRecord.beneficiary_ac_name)
      }

      if (firstRecord.vendorNumber) {
        handleInputChange("vendorNumber", firstRecord.vendorNumber)
      } else {
        handleInputChange("vendorNumber", "")
      }

      if (firstRecord.vendorEmail) {
        handleInputChange("vendorEmail", firstRecord.vendorEmail)
      } else {
        handleInputChange("vendorEmail", "")
      }

      // If only one bank record, autofill bank details immediately
      if (matchingRecords.length === 1) {
        handleInputChange("beneficiaryBankName", firstRecord.beneficiary_bank_name)
        handleInputChange("beneficiaryAccountNumber", firstRecord.beneficiary_ac_number)
        handleInputChange("beneficiaryBankIFSC", firstRecord.beneficiary_bank_ifsc)
      } else {
        // If multiple bank records, clear/reset the bank-specific fields so user must select one
        handleInputChange("beneficiaryBankName", "")
        handleInputChange("beneficiaryAccountNumber", "")
        handleInputChange("beneficiaryBankIFSC", "")
      }
    }
  }

  const handleBeneficiaryBankSelection = (bankNameWithAc: string) => {
    // Find the record matching the bank name and account number combo to avoid duplicates in same bank
    const record = availableBeneficiaryBanks.find(
      b => `${b.beneficiary_bank_name} (A/C: ${b.beneficiary_ac_number})` === bankNameWithAc
    )

    if (record) {
      handleInputChange("beneficiaryBankName", record.beneficiary_bank_name)
      handleInputChange("beneficiaryAccountNumber", record.beneficiary_ac_number)
      handleInputChange("beneficiaryBankIFSC", record.beneficiary_bank_ifsc)
    } else {
      // Allow fallback if it's just raw bankName
      const simpleRecord = availableBeneficiaryBanks.find(
        b => b.beneficiary_bank_name === bankNameWithAc
      )
      if (simpleRecord) {
        handleInputChange("beneficiaryBankName", simpleRecord.beneficiary_bank_name)
        handleInputChange("beneficiaryAccountNumber", simpleRecord.beneficiary_ac_number)
        handleInputChange("beneficiaryBankIFSC", simpleRecord.beneficiary_bank_ifsc)
      } else {
        handleInputChange("beneficiaryBankName", bankNameWithAc)
      }
    }
  }


  const fetchPaymentFromCompaniesFromMaster = async () => {
    try {
      const { data, error } = await supabase.from('master').select('payment_from_company')
      if (error) throw error

      if (data) {
        const uniquePaymentFromCompanies = [...new Set(data.map(item => item.payment_from_company).filter(Boolean))]
        setPaymentFromCompanies(uniquePaymentFromCompanies)
      }
    } catch (error) {
      console.error("Error fetching payment from companies from master:", error)
    }
  }

  const getNextVoucherNumber = async () => {
    try {
      const { data, error } = await supabase
        .from('History')
        .select('voucher_no')
        .order('id', { ascending: false })
        .limit(1)

      if (error) throw error

      if (data && data.length > 0 && data[0].voucher_no) {
        const lastVoucher = data[0].voucher_no
        const match = lastVoucher.match(/(\D+)-(\d+)/)
        if (match) {
          const prefix = match[1]
          const num = parseInt(match[2], 10) + 1
          return `${prefix}-${num.toString().padStart(match[2].length, '0')}`
        }
      }
      return "TNS-01"
    } catch (error) {
      console.error("Error getting next voucher number:", error)
      return "TNS-01"
    }
  }

  useEffect(() => {

    const initializeVoucher = async () => {

      const isLoggedIn = localStorage.getItem("tns_logged_in")

      const storedUsername = localStorage.getItem("tns_username")

      const storedUserRole = localStorage.getItem("tns_user_role")

      if (isLoggedIn !== "true") {

        router.push("/")

      } else {

        setUsername(storedUsername || "User")

        setUserRole(storedUserRole || "user")

        setIsLoadingDropdowns(true)

        try {

          // Get next voucher number from Supabase History table

          const nextVoucher = await getNextVoucherNumber()

          setNextVoucherNumber(nextVoucher)

          
          await Promise.all([

            fetchBankAccountsFromMaster(),

            fetchPaymentFromCompaniesFromMaster(),

            fetchCompanyNamesFromMaster(),

            fetchTransactionTypesFromMaster(),

            fetchProjectsFromMaster(),

            fetchBeneficiariesFromHistory(),

          ])

          const currentDate = new Date().toISOString().split("T")[0]

          setVoucherData((prev) => ({

            ...prev,

            id: "voucher_" + Date.now(),

            voucherNo: nextVoucher,

            dateOfPayment: currentDate,

            bankAcFrom: "",

            entryDoneBy: storedUsername || "User", // Auto-populate with logged-in user

          }))

        } catch (error) {

          console.error("Error fetching dropdown data:", error)

        } finally {

          setIsLoadingDropdowns(false)

        }

      }

    }

    initializeVoucher()

  }, [router])




  const handleInputChange = (field: keyof VoucherData, value: string) => {

    setVoucherData((prev) => ({

      ...prev,

      [field]: value,

    }))

  }

  const convertNumberToWords = (num: number): string => {

    const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"]

    const teens = [

      "Ten",

      "Eleven",

      "Twelve",

      "Thirteen",

      "Fourteen",

      "Fifteen",

      "Sixteen",

      "Seventeen",

      "Eighteen",

      "Nineteen",

    ]

    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]

    if (num === 0) return "Zero"

    if (num < 10) return ones[num]

    if (num < 20) return teens[num - 10]

    if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? " " + ones[num % 10] : "")

    if (num < 1000)

      return ones[Math.floor(num / 100)] + " Hundred" + (num % 100 ? " " + convertNumberToWords(num % 100) : "")

    if (num < 100000)

      return (

        convertNumberToWords(Math.floor(num / 1000)) +

        " Thousand" +

        (num % 1000 ? " " + convertNumberToWords(num % 1000) : "")

      )

    if (num < 10000000)

      return (

        convertNumberToWords(Math.floor(num / 100000)) +

        " Lakh" +

        (num % 100000 ? " " + convertNumberToWords(num % 100000) : "")

      )

    return (

      convertNumberToWords(Math.floor(num / 10000000)) +

      " Crore" +

      (num % 10000000 ? " " + convertNumberToWords(num % 10000000) : "")

    )

  }

  const handleAmountChange = (value: string) => {

    handleInputChange("amount", value)

    const numValue = Number.parseFloat(value)

    if (!isNaN(numValue) && numValue > 0) {

      const words = convertNumberToWords(numValue) + " Rupees Only"

      handleInputChange("amountInWords", words)

    } else {

      handleInputChange("amountInWords", "")

    }

  }

  const generatePDFBlob = (voucherData: { submittedAt?: string; id?: string; voucherNo: any; dateOfPayment: any; bankAcFrom: any; companyName: any; bankAccount?: string; transactionType: any; purposeOfPayment: any; project: any; beneficiaryName: any; poNumber: any; beneficiaryAccountName: any; beneficiaryAccountNumber: any; beneficiaryBankName: any; beneficiaryBankIFSC: any; amount: any; amountInWords: any; particulars: any; entryDoneBy: any; checkedBy: any; approvedBy: any; paymentFromCompany?: any }) => {

    return new Promise((resolve, reject) => {

      try {

        // Portrait orientation for voucher

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

          }

        }

        const formatCurrency = (value: string) => {

          const numValue = parseFloat(value) || 0

          return "Rs. " + numValue.toLocaleString("en-US", {

            minimumFractionDigits: 2,

            maximumFractionDigits: 2

          })

        }

        const formatDate = (dateString: string | number | Date) => {

          return new Date(dateString).toLocaleDateString("en-IN", {

            day: "2-digit",

            month: "2-digit",

            year: "numeric",

          })

        }

        // Main container border

        doc.setDrawColor(...(colors.border.primary as [number, number, number]))

        doc.setLineWidth(2)

        doc.rect(margin, margin, pageWidth - 2 * margin, pageHeight - 2 * margin)

        // Header Section

        doc.setFillColor(...(colors.background.blue as [number, number, number]))

        doc.setDrawColor(...(colors.border.primary as [number, number, number]))

        doc.setLineWidth(1)

        doc.rect(margin + 3, currentY, pageWidth - 2 * margin - 6, 22, "FD")

        // Company Name

        doc.setFont("helvetica", "bold")

        doc.setFontSize(18)

        doc.setTextColor(...colors.primary)

        doc.text(voucherData.companyName || "COMPANY NAME", pageWidth / 2, currentY + 8, { align: "center" })

        // Voucher Title

        doc.setFontSize(12)

        doc.setTextColor(...colors.secondary)

        doc.text("BANK PAYMENT VOUCHER", pageWidth / 2, currentY + 16, { align: "center" })

        currentY += 28

        // Voucher Information Table - Better structured

        const voucherInfoData = [

          // Row 1

          [

            "VOUCHER NO:",

            voucherData.voucherNo || "",

            "DATE OF PAYMENT:",

            formatDate(voucherData.dateOfPayment),

            "TRANSACTION TYPE:",

            voucherData.transactionType || ""

          ],

          // Row 2

          [

            "BANK A/C FROM:",

            voucherData.bankAcFrom || "",

            "PURPOSE:",

            voucherData.purposeOfPayment || "",

            // "PAYMENT FROM COMPANY:",

            // voucherData.paymentFromCompany || ""

          ],

          // Row 3

          [

            "PROJECT:",

            { content: voucherData.project || "", styles: { fontStyle: 'bold' } },

            "BENEFICIARY NAME (PAYER):",

            { content: voucherData.beneficiaryName || "", colSpan: 3, styles: { fontStyle: 'bold' } }

          ],

          // Row 4

          [

            "PO NUMBER:",

            voucherData.poNumber || "N/A",

            "BENEFICIARY A/C NAME:",

            voucherData.beneficiaryAccountName || "",

            "BENEFICIARY A/C NUMBER:",

            voucherData.beneficiaryAccountNumber || ""

          ],

          // Row 5

          [

            "BENEFICIARY BANK NAME:",

            voucherData.beneficiaryBankName || "",

            // "BENEFICIARY BANK IFSC:",

            // { content: voucherData.beneficiaryBankIFSC || "", colSpan: 3 }

          ]

        ]

        autoTable(doc, {

          startY: currentY,

          body: voucherInfoData,

          margin: { left: margin + 3, right: margin + 3 },

          tableWidth: pageWidth - 2 * margin - 6,

          styles: {

            cellPadding: 3,

            lineColor: colors.border.primary,

            lineWidth: 0.5,

            textColor: colors.text.primary,

            font: 'helvetica',

            fontSize: 9,

            overflow: 'linebreak'

          },

          columnStyles: {

            0: {

              cellWidth: 30,

              fillColor: colors.background.light,

              fontStyle: 'bold',

              fontSize: 8,

              textColor: colors.primary

            },

            1: { cellWidth: 30 },

            2: {

              cellWidth: 30,

              fillColor: colors.background.light,

              fontStyle: 'bold',

              fontSize: 8,

              textColor: colors.primary

            },

            3: { cellWidth: 30 },

            4: {

              cellWidth: 30,

              fillColor: colors.background.light,

              fontStyle: 'bold',

              fontSize: 8,

              textColor: colors.primary

            },

            5: { cellWidth: 30 }

          },

          didDrawPage: (data) => {

            currentY = data.cursor.y

          }

        })

        currentY += 8

        // Particulars and Amount Section - Fixed Layout

        const particularsAmountData = [

          // Header row

          [

            {

              content: "PARTICULARS:",

              styles: {

                fontStyle: 'bold',

                fontSize: 10,

                fillColor: colors.background.light,

                textColor: colors.primary,

                halign: 'center'

              }

            },

            {

              content: "AMOUNT:",

              styles: {

                fontStyle: 'bold',

                fontSize: 10,

                fillColor: colors.background.yellow,

                textColor: colors.primary,

                halign: 'center'

              }

            }

          ],

          // Content row

          [

            {

              content: voucherData.particulars || "",

              styles: {

                fontSize: 10,

                minCellHeight: 20,

                valign: 'top',

                cellPadding: 5

              }

            },

            {

              content: "Rs. " + (parseFloat(voucherData.amount || 0)).toLocaleString("en-US", {

                minimumFractionDigits: 2,

                maximumFractionDigits: 2

              }),

              styles: {

                fontSize: 12,

                fontStyle: 'bold',

                fillColor: colors.background.amount,

                textColor: colors.success,

                halign: 'center',

                valign: 'middle',

                minCellHeight: 20,

                cellPadding: 6

              }

            }

          ]

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

            font: 'helvetica',

            overflow: 'linebreak'

          },

          columnStyles: {

            0: { cellWidth: (pageWidth - 2 * margin - 6) * 0.7 },

            1: { cellWidth: (pageWidth - 2 * margin - 6) * 0.3 }

          },

          didDrawPage: (data) => {

            currentY = data.cursor.y

          }

        })

        currentY += 3

        // Amount in Words Section

        const amountWordsData = [

          [

            {

              content: `AMOUNT IN WORDS: ${voucherData.amountInWords || ""}`,

              styles: {

                fontSize: 10,

                fontStyle: 'bold',

                fillColor: colors.background.blue,

                textColor: colors.primary,

                cellPadding: 6

              }

            }

          ]

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

            font: 'helvetica'

          },

          didDrawPage: (data) => {

            currentY = data.cursor.y

          }

        })

        currentY += 15

        // Signature Section - Properly aligned

        const signatureData = [

          // Header row

          [

            {

              content: "ENTRY DONE BY",

              styles: {

                fontStyle: 'bold',

                fontSize: 10,

                fillColor: colors.background.light,

                textColor: colors.primary,

                halign: 'center',

                cellPadding: 4

              }

            },

            {

              content: "CHECKED BY",

              styles: {

                fontStyle: 'bold',

                fontSize: 10,

                fillColor: colors.background.light,

                textColor: colors.primary,

                halign: 'center',

                cellPadding: 4

              }

            },

            {

              content: "APPROVED BY",

              styles: {

                fontStyle: 'bold',

                fontSize: 10,

                fillColor: colors.background.light,

                textColor: colors.primary,

                halign: 'center',

                cellPadding: 4

              }

            }

          ],

          // Empty signature space

          [

            { content: "", styles: { minCellHeight: 15 } },

            { content: "", styles: { minCellHeight: 15 } },

            { content: "", styles: { minCellHeight: 15 } }

          ],

          // Names row

          [

            {

              content: voucherData.entryDoneBy || "",

              styles: {

                fontStyle: 'bold',

                fontSize: 9,

                halign: 'center',

                fillColor: colors.background.light,

                textColor: colors.text.primary

              }

            },

            {

              content: voucherData.checkedBy || "",

              styles: {

                fontStyle: 'bold',

                fontSize: 9,

                halign: 'center',

                fillColor: colors.background.light,

                textColor: colors.text.primary

              }

            },

            {

              content: voucherData.approvedBy || "",

              styles: {

                fontStyle: 'bold',

                fontSize: 9,

                halign: 'center',

                fillColor: colors.background.light,

                textColor: colors.text.primary

              }

            }

          ]

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

            font: 'helvetica'

          },

          columnStyles: {

            0: { cellWidth: (pageWidth - 2 * margin - 6) / 3 },

            1: { cellWidth: (pageWidth - 2 * margin - 6) / 3 },

            2: { cellWidth: (pageWidth - 2 * margin - 6) / 3 }

          },

          didDrawCell: function (data) {

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

          }

        })

        currentY += 15

        // Footer

        doc.setFillColor(...colors.background.light)

        doc.setDrawColor(...colors.border.secondary)

        doc.setLineWidth(0.3)

        doc.rect(margin + 3, currentY, pageWidth - 2 * margin - 6, 12, "FD")

        doc.setFont("helvetica", "bold")

        doc.setFontSize(8)

        doc.setTextColor(...colors.primary)

        doc.text(`Generated on: ${new Date().toLocaleString("en-IN")}`, pageWidth / 2, currentY + 5, { align: "center" })

        doc.setFont("helvetica", "normal")

        doc.setFontSize(7)

        doc.setTextColor(...colors.text.secondary)

        doc.text("This is a computer generated voucher", pageWidth / 2, currentY + 9, { align: "center" })

        // Return base64 string

        const base64Data = doc.output("datauristring").split(",")[1]

        resolve(base64Data)

      } catch (error) {

        reject(error)

      }

    })

  }

  // FIXED: Updated handleSubmit function for the frontend
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const currentTimestamp = new Date().toISOString()
      const generatedVoucherNo = await getNextVoucherNumber()

      const finalSubmissionData = {
        ...voucherData,
        voucherNo: generatedVoucherNo,
        submittedAt: currentTimestamp,
      }

      // 1️⃣ Generate PDF with correct voucher number
      const pdfBase64 = await generatePDFBlob(finalSubmissionData)
      const fileName = `Voucher_${generatedVoucherNo}.pdf`

      // Convert base64 to Blob
      const byteCharacters = atob(pdfBase64 as string)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const pdfBlob = new Blob([byteArray], { type: 'application/pdf' })

      // 2️⃣ Upload PDF to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('vouchers')
        .upload(fileName, pdfBlob, {
          contentType: 'application/pdf',
          upsert: true
        })

      if (uploadError) {
        throw new Error("PDF Upload failed: " + uploadError.message)
      }

      // Get public URL of the uploaded PDF
      const { data: publicUrlData } = supabase.storage
        .from('vouchers')
        .getPublicUrl(fileName)

      const pdfUrl = publicUrlData.publicUrl

      // 3️⃣ Save data to Supabase History table
      const { error: insertError } = await supabase
        .from('History')
        .insert([{
          created_date: currentTimestamp,
          voucher_no: generatedVoucherNo,
          bank_ac_from: finalSubmissionData.bankAcFrom,
          company_name: finalSubmissionData.companyName,
          date_of_payment: finalSubmissionData.dateOfPayment || null,
          purpose_of_payment: finalSubmissionData.purposeOfPayment,
          transaction_type: finalSubmissionData.transactionType,
          project: finalSubmissionData.project,
          beneficiary_name: finalSubmissionData.beneficiaryName,
          po_number: finalSubmissionData.poNumber,
          utr_number: finalSubmissionData.utrNumber,
          beneficiary_ac_name: finalSubmissionData.beneficiaryAccountName,
          beneficiary_ac_number: finalSubmissionData.beneficiaryAccountNumber,
          beneficiary_bank_name: finalSubmissionData.beneficiaryBankName,
          beneficiary_bank_ifsc: finalSubmissionData.beneficiaryBankIFSC,
          particulars: finalSubmissionData.particulars,
          amount: parseFloat(finalSubmissionData.amount) || 0,
          amount_in_words: finalSubmissionData.amountInWords,
          entry_done_by: finalSubmissionData.entryDoneBy,
          checked_by: finalSubmissionData.checkedBy,
          approved_by: finalSubmissionData.approvedBy,
          pdf_link: pdfUrl,
          name: username,
          vendor_number: finalSubmissionData.vendorNumber,
          vendor_email: finalSubmissionData.vendorEmail
        }])

      if (insertError) {
        throw new Error("Database insert failed: " + insertError.message)
      }

      // 4️⃣ Send Notifications (WhatsApp and Email)
      try {
        const shortCompanyName = extractFirstTwoWords(finalSubmissionData.companyName)
        const formattedDate = new Date(finalSubmissionData.dateOfPayment).toLocaleDateString("en-IN")

        const messageContent = `An amount of rupees ${finalSubmissionData.amount} has been transfered to account having ${finalSubmissionData.utrNumber} and ${formattedDate} from ${finalSubmissionData.companyName}`

        // WhatsApp Integration via Edge Function
        const rawPhone = finalSubmissionData.vendorNumber.replace(/\D/g, '')
        const vendorPhone = rawPhone.startsWith('91') ? rawPhone : `91${rawPhone}`

        await supabase.functions.invoke('whatsapp-notification', {
          body: {
            to: vendorPhone,
            beneficiaryName: finalSubmissionData.beneficiaryName,
            amount: finalSubmissionData.amount,
            utr: finalSubmissionData.utrNumber,
            date: formattedDate,
            company: finalSubmissionData.companyName
          }
        })

        // Email Integration via EmailJS
        if (finalSubmissionData.vendorEmail) {
          await emailjs.send(
            process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || "",
            process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || "",
            {
              amount: finalSubmissionData.amount,
              utr_number: finalSubmissionData.utrNumber,
              dated: formattedDate,
              company_name: finalSubmissionData.companyName,
              to_email: finalSubmissionData.vendorEmail,
              message: messageContent
            },
            process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || ""
          )
        }
      } catch (notifyError) {
        console.error("Notification error:", notifyError)
        // We don't throw here to ensure the submission isn't marked as failed just because notifications failed
      }

      // 5️⃣ Save locally (original logic)
      const existingVouchers = JSON.parse(localStorage.getItem("tns_vouchers") || "[]")
      existingVouchers.push(finalSubmissionData)
      localStorage.setItem("tns_vouchers", JSON.stringify(existingVouchers))

      alert(`Voucher ${generatedVoucherNo} submitted successfully! PDF uploaded to Supabase Storage.`)

      // Get next voucher number for display
      const nextVoucher = await getNextVoucherNumber()
      setNextVoucherNumber(nextVoucher)

      // Reset form
      setVoucherData((prev) => ({
        ...prev,
        id: "voucher_" + Date.now(),
        voucherNo: "",
        bankAcFrom: "",
        companyName: "",
        transactionType: "Payment",
        purposeOfPayment: "",
        project: "",
        beneficiaryName: "",
        poNumber: "",
        utrNumber: "",
        beneficiaryAccountName: "",
        beneficiaryAccountNumber: "",
        beneficiaryBankName: "",
        beneficiaryBankIFSC: "",
        amount: "",
        amountInWords: "",
        particulars: "",
        entryDoneBy: username,
        checkedBy: "",
        approvedBy: "",
        vendorNumber: "",
        vendorEmail: "",
      }))
    } catch (error) {
      console.error("Error submitting voucher:", error)
      alert("Error submitting voucher: " + (error instanceof Error ? error.message : "Unknown error"))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto px-2 sm:px-4 max-w-4xl">
      <form onSubmit={handleSubmit}>
        <Card className="shadow-xl border-0 bg-white">

            {/* Voucher Header */}

            <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">

              <div className="text-center space-y-2">

                <CardTitle className="text-xl md:text-2xl font-bold">{voucherData.companyName || "SELECT COMPANY"}</CardTitle>

                <p className="text-blue-100 text-base md:text-lg font-semibold">BANK PAYMENT VOUCHER</p>

                <div className="flex flex-col sm:flex-row justify-between items-center mt-2 sm:mt-4 bg-white/10 rounded-lg p-2 sm:p-3 space-y-2 sm:space-y-0">

                  <div>

                    {/* <p className="text-xs sm:text-sm text-blue-100">Voucher No.</p>

                    <p className="text-base sm:text-lg font-bold">{voucherData.voucherNo}</p> */}

                  </div>

                  <div>

                    <p className="text-xs sm:text-sm text-blue-100">Date</p>

                    <p className="text-base sm:text-lg font-bold">

                      {new Date(voucherData.dateOfPayment).toLocaleDateString("en-IN")}

                    </p>

                  </div>

                  <div>

                    <p className="text-xs sm:text-sm text-blue-100">Type</p>

                    <p className="text-base sm:text-lg font-bold">{voucherData.transactionType}</p>

                  </div>

                </div>

              </div>

            </CardHeader>

            {isLoadingDropdowns && (

              <div className="p-4 bg-blue-50 text-blue-700 text-center">Loading dropdown data...</div>

            )}

            {!isLoadingDropdowns && (

              <div className="p-2 bg-gray-50 text-xs text-gray-600 text-center">

                Loaded: {bankAccounts.length} banks, {companyNames.length} companies, {transactionTypes.length}{" "}

                transaction types, {projects.length} projects,

                {/* {paymentFromCompanies.length} payment companies */}

              </div>

            )}

            <CardContent className="p-2 sm:p-4 md:p-6 lg:p-8">

              {/* Traditional Voucher Layout */}

              <div className="bg-white border-2 border-gray-800 p-2 sm:p-4 md:p-6">

                {/* Company Header */}

                <div className="text-center mb-4 sm:mb-6 border-b-2 border-gray-800 pb-2 sm:pb-4">

                  <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">{voucherData.companyName || "SELECT COMPANY"}</h1>

                </div>

                {/* Main Voucher Grid */}

                <div className="space-y-2 sm:space-y-4">

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 border-b border-gray-400 pb-2">

                    <div className="sm:col-span-8">

                      <Label className="text-xs font-bold text-gray-700 uppercase">Company Name</Label>
                      <Select
                        value={voucherData.companyName}
                        onValueChange={(val) => {
                          // Clear beneficiary details when company is manually changed
                          handleInputChange("beneficiaryName", "")
                          handleInputChange("beneficiaryAccountName", "")
                          handleInputChange("beneficiaryAccountNumber", "")
                          handleInputChange("beneficiaryBankName", "")
                          handleInputChange("beneficiaryBankIFSC", "")
                          handleInputChange("vendorNumber", "")
                          handleInputChange("vendorEmail", "")
                          handleCompanySelection(val)
                        }}
                      >
                        <SelectTrigger className="w-full border-0 border-b border-gray-400 rounded-none px-1 py-0 h-8 text-sm focus:border-gray-600">
                          <SelectValue placeholder="Select Company" />
                        </SelectTrigger>

                        <SelectContent>
                          {companyNames.map((company, index) => (
                            <SelectItem
                              key={`company-name-${index}-${company.replace(/\s+/g, "-")}`}
                              value={company}
                            >
                              {company}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                    </div>

                    <div className="sm:col-span-4">

                      <Label className="text-xs font-bold text-gray-700 uppercase">PO. NUMBER</Label>

                      <Input

                        value={voucherData.poNumber}

                        onChange={(e) => handleInputChange("poNumber", e.target.value)}

                        className="border-0 border-b border-gray-400 rounded-none px-1 py-0 h-8 text-sm focus:border-gray-600"

                      />

                    </div>

                  </div>

                  {/* Row 1: Bank AC From, Beneficiary Name (Payer), Date */}



                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-gray-400 pb-3">

                    {/* BENEFICIARY NAME (PAYER) */}
                    <div>
                      <Label className="text-xs font-bold text-gray-700 uppercase">
                        BENEFICIARY NAME (PAYER)
                      </Label>

                      <SearchableBeneficiarySelect
                        value={voucherData.beneficiaryName}
                        onValueChange={(val) => handleBeneficiarySelection(val)}
                        options={beneficiaries.filter(b => 
                          !voucherData.companyName || 
                          (b.company_name && b.company_name.trim().toLowerCase() === voucherData.companyName.trim().toLowerCase())
                        )}
                        onSelect={handleBeneficiarySelection}
                      />
                    </div>

                    {/* Bank Account */}
                    <div>
                      <Label className="text-xs font-bold text-gray-700 uppercase">
                        BANK AC FROM
                      </Label>

                      <Select
                        value={voucherData.bankAcFrom}
                        onValueChange={(value) => {
                          handleInputChange("bankAcFrom", value)
                        }}
                      >
                        <SelectTrigger className="w-full border-0 border-b border-gray-400 rounded-none px-1 py-0 h-8 text-sm focus:border-gray-600">
                          <SelectValue
                            placeholder={`Select Bank Account (${filteredBankAccounts.length} available)`}
                          />
                        </SelectTrigger>

                        <SelectContent>
                          {(filteredBankAccounts.length > 0
                            ? filteredBankAccounts
                            : bankAccounts
                          ).map((account, index) => (
                            <SelectItem
                              key={`bank-account-${index}-${account}`}
                              value={account}
                            >
                              {account}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Date */}
                    <div>
                      <Label className="text-xs font-bold text-gray-700 uppercase">
                        DATE
                      </Label>

                      <Input
                        type="date"
                        value={voucherData.dateOfPayment}
                        onChange={(e) =>
                          handleInputChange("dateOfPayment", e.target.value)
                        }
                        className="w-full border-0 border-b border-gray-400 rounded-none px-1 py-0 h-8 text-sm focus:border-gray-600"
                        required
                      />
                    </div>
                  </div>

                  {/* Vendor Details Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-gray-400 pb-3">
                    <div>
                      <Label className="text-xs font-bold text-gray-700 uppercase">Vendor WhatsApp Number</Label>
                      <Input
                        value={voucherData.vendorNumber}
                        onChange={(e) => handleInputChange("vendorNumber", e.target.value)}
                        className="w-full border-0 border-b border-gray-400 rounded-none px-1 py-0 h-8 text-sm focus:border-gray-600"
                        placeholder="Enter 10 digit number"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-bold text-gray-700 uppercase">Vendor Email</Label>
                      <Input
                        type="email"
                        value={voucherData.vendorEmail}
                        onChange={(e) => handleInputChange("vendorEmail", e.target.value)}
                        className="w-full border-0 border-b border-gray-400 rounded-none px-1 py-0 h-8 text-sm focus:border-gray-600"
                        placeholder="Enter email address"
                      />
                    </div>
                  </div>

                  {/* Row 2: Purpose, Payment From Company, Transaction Type */}

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 border-b border-gray-400 pb-2">

                    <div className="sm:col-span-4">

                      <Label className="text-xs font-bold text-gray-700 uppercase">PURPOSE</Label>

                      <Input

                        value={voucherData.purposeOfPayment}

                        onChange={(e) => handleInputChange("purposeOfPayment", e.target.value)}

                        className="border-0 border-b border-gray-400 rounded-none px-1 py-0 h-8 text-sm focus:border-gray-600 text-center font-bold"

                        placeholder=""

                        required

                      />

                    </div>

                  

                    <div className="sm:col-span-4">
  <Label className="text-xs font-bold text-gray-700 uppercase">
    TRANSACTION TYPE
  </Label>

  {/* Fixed Value */}
  <div className="border-0 border-b border-gray-400 rounded-none px-1 py-2 h-8 text-sm flex items-center text-gray-800 font-medium">
    Payment
  </div>
</div>

                    <div className="sm:col-span-4">
                      <Label className="text-xs font-bold text-gray-700 uppercase">UTR Number</Label>
                      <Input
                        value={voucherData.utrNumber}
                        onChange={(e) => handleInputChange("utrNumber", e.target.value)}
                        className="border-0 border-b border-gray-400 rounded-none px-1 py-0 h-8 text-sm focus:border-gray-600"
                        placeholder="Enter UTR Number"
                      />
                    </div>
                  </div>

                  {/* Row 3: Voucher No and Project */}

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 border-b border-gray-400 pb-2">


                    <div className="sm:col-span-4">
                      <Label className="text-xs font-bold text-gray-700 uppercase">PROJECT</Label>
                      <Select
                        value={voucherData.project}
                        onValueChange={(value) => handleInputChange("project", value)}
                      >
                        <SelectTrigger className="border-0 border-b border-gray-400 rounded-none px-1 py-0 h-8 text-sm focus:border-gray-600 text-center font-bold">
                          <SelectValue placeholder="Select Project" />
                        </SelectTrigger>
                        <SelectContent>
                          {projects.map((project, index) => (
                            <SelectItem key={`project-${index}-${project.replace(/\s+/g, "-")}`} value={project}>
                              {project}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                   

                  </div>


                  {/* Row 5: Bank Name and IFSC */}

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 border-b border-gray-400 pb-2">
  <div className="sm:col-span-6">

                      <Label className="text-xs font-bold text-gray-700 uppercase">

                        (NAME OF AC HOLDER) BENEFICIARY A/C NAME

                      </Label>

                      <Input

                        value={voucherData.beneficiaryAccountName}

                        onChange={(e) => handleInputChange("beneficiaryAccountName", e.target.value)}

                        className="border-0 border-b border-gray-400 rounded-none px-1 py-0 h-8 text-sm focus:border-gray-600"

                        placeholder=""

                        required

                      />

                    </div>


                    <div className="sm:col-span-6">

                      <Label className="text-xs font-bold text-gray-700 uppercase">BENEFICIARY BANK NAME</Label>

                      {availableBeneficiaryBanks.length > 1 ? (
                        <Select
                          value={voucherData.beneficiaryBankName ? `${voucherData.beneficiaryBankName} (A/C: ${voucherData.beneficiaryAccountNumber})` : ""}
                          onValueChange={handleBeneficiaryBankSelection}
                        >
                          <SelectTrigger className="w-full border-0 border-b border-gray-400 rounded-none px-1 py-0 h-8 text-sm focus:border-gray-600">
                            <SelectValue placeholder="Select Beneficiary Bank" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableBeneficiaryBanks.map((b, index) => {
                              const valueCombo = `${b.beneficiary_bank_name} (A/C: ${b.beneficiary_ac_number})`
                              return (
                                <SelectItem key={`beneficiary-bank-${index}`} value={valueCombo}>
                                  {valueCombo}
                                </SelectItem>
                              )
                            })}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input

                          value={voucherData.beneficiaryBankName}

                          onChange={(e) => handleInputChange("beneficiaryBankName", e.target.value)}

                          className="border-0 border-b border-gray-400 rounded-none px-1 py-0 h-8 text-sm focus:border-gray-600"

                          placeholder=""

                          required

                        />
                      )}

                    </div>

                    {/* <div className="sm:col-span-6">

                      <Label className="text-xs font-bold text-gray-700 uppercase">BENEFICIARY BANK IFSC</Label>

                      <Input

                        value={voucherData.beneficiaryBankIFSC}

                        onChange={(e) => handleInputChange("beneficiaryBankIFSC", e.target.value)}

                        className="border-0 border-b border-gray-400 rounded-none px-1 py-0 h-8 text-sm focus:border-gray-600"

                        placeholder=""

                        required

                      />

                    </div> */}

                  </div>

                  {/* Row 6: Beneficiary Account Details */}

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 border-b border-gray-400 pb-2">

                    {/* <div className="sm:col-span-6">

                      <Label className="text-xs font-bold text-gray-700 uppercase">

                        (NAME OF AC HOLDER) BENEFICIARY A/C NAME

                      </Label>

                      <Input

                        value={voucherData.beneficiaryAccountName}

                        onChange={(e) => handleInputChange("beneficiaryAccountName", e.target.value)}

                        className="border-0 border-b border-gray-400 rounded-none px-1 py-0 h-8 text-sm focus:border-gray-600"

                        placeholder=""

                        required

                      />

                    </div> */}

                    <div className="sm:col-span-6">

                      <Label className="text-xs font-bold text-gray-700 uppercase">BENEFICIARY A/C NUMBER</Label>

                      <Input

                        value={voucherData.beneficiaryAccountNumber}

                        onChange={(e) => handleInputChange("beneficiaryAccountNumber", e.target.value)}

                        className="border-0 border-b border-gray-400 rounded-none px-1 py-0 h-8 text-sm focus:border-gray-600"

                        placeholder=""

                        required

                      />

                    </div>


                     <div className="sm:col-span-6">

                      <Label className="text-xs font-bold text-gray-700 uppercase">BENEFICIARY BANK IFSC</Label>

                      <Input

                        value={voucherData.beneficiaryBankIFSC}

                        onChange={(e) => handleInputChange("beneficiaryBankIFSC", e.target.value)}

                        className="border-0 border-b border-gray-400 rounded-none px-1 py-0 h-8 text-sm focus:border-gray-600"

                        placeholder=""

                        required

                      />

                    </div>

                  </div>

                  {/* Row 7: Particulars and Amount */}

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 border-b border-gray-400 pb-2">

                    <div className="sm:col-span-8">

                      <Label className="text-xs font-bold text-gray-700 uppercase">PARTICULARS</Label>

                      <Textarea

                        value={voucherData.particulars}

                        onChange={(e) => handleInputChange("particulars", e.target.value)}

                        className="border-0 border-b border-gray-400 rounded-none px-1 py-1 min-h-[60px] text-sm focus:border-gray-600 resize-none"

                        placeholder=""

                        required

                      />

                    </div>

                    <div className="sm:col-span-2">

                      <Label className="text-xs font-bold text-gray-700 uppercase">AMOUNT</Label>

                      <Input

                        type="number"

                        step="0.01"

                        value={voucherData.amount}

                        onChange={(e) => handleAmountChange(e.target.value)}

                        className="border-0 border-b border-gray-400 rounded-none px-1 py-0 h-8 text-sm focus:border-gray-600 text-right font-bold"

                        placeholder=""

                        required

                      />

                    </div>

                    <div className="sm:col-span-2">

                      <Label className="text-xs font-bold text-gray-700 uppercase">TOTAL</Label>

                      <div className="border-0 border-b border-gray-400 px-1 py-0 h-8 text-sm font-bold text-right flex items-center">

                        ₹{voucherData.amount ? Number.parseFloat(voucherData.amount).toLocaleString("en-IN") : "0"}

                      </div>

                    </div>

                  </div>

                  {/* Row 8: Amount in Words */}

                  <div className="border-b border-gray-400 pb-2">

                    <Label className="text-xs font-bold text-gray-700 uppercase">AMOUNT IN WORDS :</Label>

                    <Input

                      value={voucherData.amountInWords}

                      onChange={(e) => handleInputChange("amountInWords", e.target.value)}

                      className="border-0 border-b border-gray-400 rounded-none px-1 py-0 h-8 text-sm focus:border-gray-600"

                      placeholder=""

                      required

                    />

                  </div>

                  {/* Row 9: Approval Signatures */}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 pt-4">

                    <div className="text-center">

                      <Label className="text-xs font-bold text-gray-700 uppercase block mb-2">ENTRY DONE BY</Label>

                      <Input
                        value={voucherData.entryDoneBy}
                        onChange={(e) => handleInputChange("entryDoneBy", e.target.value)}
                        className="border-0 border-b border-gray-400 rounded-none px-1 py-0 h-8 text-sm focus:border-gray-600 text-center"
                        required
                        readOnly
                      />


                    </div>

                    <div className="text-center">

                      <Label className="text-xs font-bold text-gray-700 uppercase block mb-2">CHECKED BY</Label>

                      <Input

                        value={voucherData.checkedBy}

                        onChange={(e) => handleInputChange("checkedBy", e.target.value)}

                        className="border-0 border-b border-gray-400 rounded-none px-1 py-0 h-8 text-sm focus:border-gray-600 text-center"

                        required

                      />

                    </div>

                    <div className="text-center">

                      <Label className="text-xs font-bold text-gray-700 uppercase block mb-2">APPROVED BY</Label>

                      <Input

                        value={voucherData.approvedBy}

                        onChange={(e) => handleInputChange("approvedBy", e.target.value)}

                        className="border-0 border-b border-gray-400 rounded-none px-1 py-0 h-8 text-sm focus:border-gray-600 text-center"

                        required

                      />

                    </div>

                  </div>

                </div>

                {/* Submit Button */}

                <div className="flex justify-center pt-4 sm:pt-8 mt-4 sm:mt-8 border-t-2 border-gray-800">

                  <Button

                    type="submit"

                    disabled={isSubmitting}

                    className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-6 sm:px-12 py-2 sm:py-3 text-base sm:text-lg font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"

                  >

                    {isSubmitting ? (

                      <>

                        <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />

                        Submitting...

                      </>

                    ) : (

                      <>

                        <Save className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />

                        Submit Voucher

                      </>

                    )}

                  </Button>

                </div>

              </div>

            </CardContent>

          </Card>

        </form>

      </div>

  )

}
