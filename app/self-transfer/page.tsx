"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LogOut, History, Save, Building2, ArrowLeft, Loader2, RefreshCw, Building, CreditCard, User, Briefcase, FileText, Check, ChevronsUpDown } from "lucide-react"
import supabase from "@/lib/supabase"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import React from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

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
        className="border-0 border-b border-gray-400 rounded-none px-1 py-0 h-8 text-sm focus:border-teal-600 pr-8 w-full"
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

export default function SelfTransferPage() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [userRole, setUserRole] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingDropdowns, setIsLoadingDropdowns] = useState(true)

  const [companyNames, setCompanyNames] = useState<string[]>([])
  const [bankAccounts, setBankAccounts] = useState<string[]>([])
  const [transactionTypes, setTransactionTypes] = useState<string[]>([])
  const [filteredBankAccounts, setFilteredBankAccounts] = useState<string[]>([])
  const [beneficiaries, setBeneficiaries] = useState<any[]>([])

  const [formData, setFormData] = useState({
    beneficiaryName: "",
    companyName: "",
    bankAcFrom: "",
    dateOfPayment: new Date().toISOString().split("T")[0],
    amount: "",
    amountInWords: "",
    transactionType: "Contra",
    purposeOfPayment: "",
    project: "",
    poNumber: "",
    utrNumber: "",
    beneficiaryAccountName: "",
    beneficiaryAccountNumber: "",
    beneficiaryBankName: "",
    beneficiaryBankIFSC: "",
    particulars: "",
    entryDoneBy: "",
    checkedBy: "",
    approvedBy: "",
    vendorNumber: "",
    vendorEmail: "",
  })

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("tns_logged_in")
    const storedUsername = localStorage.getItem("tns_username")
    const storedUserRole = localStorage.getItem("tns_user_role")
    if (isLoggedIn !== "true") {
      router.push("/")
    } else {
      setUsername(storedUsername || "User")
      setUserRole(storedUserRole || "user")
      setFormData(prev => ({ ...prev, entryDoneBy: storedUsername || "User" }))
      initializeData()
    }
  }, [router])

  const initializeData = async () => {
    setIsLoadingDropdowns(true)
    try {
      await Promise.all([
        fetchCompanyNames(),
        fetchBankAccounts(),
        fetchTransactionTypes(),
        fetchBeneficiaries()
      ])
    } catch (error) {
      console.error("Error fetching initial data:", error)
    } finally {
      setIsLoadingDropdowns(false)
    }
  }

  const fetchCompanyNames = async () => {
    const { data, error } = await supabase.from('master').select('company_name')
    if (!error && data) {
      setCompanyNames([...new Set(data.map(i => i.company_name).filter(Boolean))])
    }
  }

  const fetchBankAccounts = async () => {
    const { data, error } = await supabase.from('master').select('bank_ac_from')
    if (!error && data) {
      const accounts = [...new Set(data.map(i => i.bank_ac_from).filter(Boolean))]
      setBankAccounts(accounts)
      setFilteredBankAccounts(accounts)
    }
  }

  const fetchTransactionTypes = async () => {
    const { data, error } = await supabase.from('master').select('transaction_type')
    if (!error && data) {
      setTransactionTypes([...new Set(data.map(i => i.transaction_type).filter(Boolean))])
    }
  }

  const fetchBeneficiaries = async () => {
    const { data, error } = await supabase
      .from('History')
      .select('beneficiary_name, company_name, bank_ac_from, transaction_type, beneficiary_ac_name, beneficiary_ac_number, beneficiary_bank_name, beneficiary_bank_ifsc')
      .order('created_date', { ascending: false })

    if (!error && data) {
      const unique = new Map()
      data.forEach(item => {
        if (item.beneficiary_name && !unique.has(item.beneficiary_name)) {
          unique.set(item.beneficiary_name, item)
        }
      })
      setBeneficiaries(Array.from(unique.values()))
    }
  }

  const handleCompanySelection = (value: string) => {
    handleInputChange("companyName", value)
    setTimeout(() => {
      const filtered = filterBankAccountsByCompany(value, bankAccounts)
      setFilteredBankAccounts(filtered)
      if (formData.bankAcFrom && !filtered.includes(formData.bankAcFrom)) {
        handleInputChange("bankAcFrom", "")
      }
    }, 100)
  }

  const filterBankAccountsByCompany = (selectedCompany: string, allBankAccounts: string[]) => {
    if (!selectedCompany || !allBankAccounts.length) return allBankAccounts

    const keywords = selectedCompany.split(' ').filter(word => {
      const upperWord = word.toUpperCase()
      return word.length > 2 && !['PVT', 'LTD', 'LIMITED', 'PRIVATE', 'INDIA', 'COMPANY'].includes(upperWord)
    })

    const strategies = [
      (acc: string) => keywords.every(k => acc.toUpperCase().includes(k.toUpperCase())),
      (acc: string) => keywords.filter(k => acc.toUpperCase().includes(k.toUpperCase())).length >= Math.min(2, keywords.length),
      (acc: string) => keywords.some(k => acc.toUpperCase().includes(k.toUpperCase()))
    ]

    for (const strategy of strategies) {
      const filtered = allBankAccounts.filter(strategy)
      if (filtered.length > 0) return filtered
    }
    return allBankAccounts
  }

  const handleBeneficiarySelection = (name: string) => {
    handleInputChange("beneficiaryName", name)
    if (!name) return

    const data = beneficiaries.find(b => b.beneficiary_name === name)
    if (data) {
      if (data.company_name) handleCompanySelection(data.company_name)
      if (data.bank_ac_from) {
        setTimeout(() => handleInputChange("bankAcFrom", data.bank_ac_from), 150)
      }
      if (data.beneficiary_ac_name) handleInputChange("beneficiaryAccountName", data.beneficiary_ac_name)
      if (data.beneficiary_ac_number) handleInputChange("beneficiaryAccountNumber", data.beneficiary_ac_number)
      if (data.beneficiary_bank_name) handleInputChange("beneficiaryBankName", data.beneficiary_bank_name)
      if (data.beneficiary_bank_ifsc) handleInputChange("beneficiaryBankIFSC", data.beneficiary_bank_ifsc)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value }
      if (field === "amount") {
        const numValue = Number.parseFloat(value)
        if (!isNaN(numValue) && numValue > 0) {
          newData.amountInWords = convertNumberToWords(numValue) + " Rupees Only"
        } else {
          newData.amountInWords = ""
        }
      }
      return newData
    })
  }

  const generatePDFBlob = async (data: any) => {
    return new Promise((resolve, reject) => {
      try {
        const doc = new jsPDF("p", "mm", "a4")
        const pageWidth = 210
        const pageHeight = 297
        const margin = 10
        let currentY = 15

        const colors = {
          primary: [0, 128, 128] as [number, number, number], // Teal
          secondary: [0, 150, 150] as [number, number, number],
          background: {
            light: [240, 255, 255] as [number, number, number], // Very light teal
            teal: [224, 255, 255] as [number, number, number],
          },
          border: [0, 128, 128] as [number, number, number]
        }

        const formatDate = (d: string) => new Date(d).toLocaleDateString("en-IN")
        const formatCurrency = (v: string) => "Rs. " + parseFloat(v || "0").toLocaleString("en-IN", { minimumFractionDigits: 2 })

        doc.setDrawColor(...colors.border)
        doc.setLineWidth(2)
        doc.rect(margin, margin, pageWidth - 2 * margin, pageHeight - 2 * margin)

        doc.setFillColor(...colors.background.teal)
        doc.rect(margin + 3, currentY, pageWidth - 2 * margin - 6, 22, "FD")
        doc.setFont("helvetica", "bold")
        doc.setFontSize(18)
        doc.setTextColor(...colors.primary)
        doc.text(data.companyName || "COMPANY NAME", pageWidth / 2, currentY + 8, { align: "center" })
        doc.setFontSize(12)
        doc.text("CONTRA VOUCHER", pageWidth / 2, currentY + 16, { align: "center" })

        currentY += 28

        const info = [
          ["DATE:", formatDate(data.dateOfPayment), "TYPE:", data.transactionType || "", "BANK AC:", data.bankAcFrom || ""],
          ["PAYER:", { content: data.beneficiaryName || "", colSpan: 3 }, "PROJECT:", data.project || ""],
          ["PO NO:", data.poNumber || "N/A", "UTR NO:", data.utrNumber || "N/A", "PURPOSE:", data.purposeOfPayment || ""],
          ["A/C NAME:", data.beneficiaryAccountName || "", "A/C NO:", data.beneficiaryAccountNumber || "", "IFSC:", data.beneficiaryBankIFSC || ""],
          ["BANK:", { content: data.beneficiaryBankName || "", colSpan: 5 }]
        ]

        autoTable(doc, {
          startY: currentY,
          body: info,
          styles: { fontSize: 9, cellPadding: 3, lineColor: colors.border, lineWidth: 0.5 },
          columnStyles: { 0: { fontStyle: 'bold', fillColor: colors.background.light }, 2: { fontStyle: 'bold', fillColor: colors.background.light }, 4: { fontStyle: 'bold', fillColor: colors.background.light } },
          didDrawPage: (d) => { currentY = d.cursor!.y }
        })

        currentY += 10
        autoTable(doc, {
          startY: currentY,
          body: [
            [{ content: "PARTICULARS", styles: { fontStyle: 'bold', halign: 'center', fillColor: colors.background.teal } }, { content: "AMOUNT", styles: { fontStyle: 'bold', halign: 'center', fillColor: colors.background.teal } }],
            [{ content: data.particulars || "", styles: { minCellHeight: 20 } }, { content: formatCurrency(data.amount), styles: { halign: 'center', valign: 'middle', fontSize: 14, fontStyle: 'bold', textColor: colors.primary } }]
          ],
          columnStyles: { 0: { cellWidth: 130 }, 1: { cellWidth: 60 } },
          didDrawPage: (d) => { currentY = d.cursor!.y }
        })

        currentY += 5
        doc.setFillColor(...colors.background.teal)
        doc.rect(margin + 3, currentY, pageWidth - 2 * margin - 6, 10, "FD")
        doc.setFontSize(10)
        doc.setTextColor(0)
        doc.text(`AMOUNT IN WORDS: ${data.amountInWords || ""}`, margin + 6, currentY + 7)

        currentY += 20
        const sigs = [
          ["ENTRY BY", "CHECKED BY", "APPROVED BY"],
          ["", "", ""],
          [data.entryDoneBy || "", data.checkedBy || "", data.approvedBy || ""]
        ]
        autoTable(doc, {
          startY: currentY,
          body: sigs,
          styles: { halign: 'center', fontSize: 9 },
          columnStyles: { 0: { cellWidth: 63 }, 1: { cellWidth: 63 }, 2: { cellWidth: 63 } },
          didDrawCell: (d) => {
            if (d.row.index === 1) {
              doc.line(d.cell.x + 5, d.cell.y + d.cell.height - 2, d.cell.x + d.cell.width - 5, d.cell.y + d.cell.height - 2)
            }
          }
        })

        const base64 = doc.output("datauristring").split(",")[1]
        resolve(base64)
      } catch (e) { reject(e) }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      // 1. Generate PDF
      const pdfBase64 = await generatePDFBlob(formData)
      const fileName = `SelfTransfer_${Date.now()}.pdf`
      const byteCharacters = atob(pdfBase64 as string)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i)
      const pdfBlob = new Blob([new Uint8Array(byteNumbers)], { type: 'application/pdf' })

      // 2. Upload to Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('vouchers')
        .upload(fileName, pdfBlob)
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from('vouchers').getPublicUrl(fileName)

      // 3. Insert into Database
      const { error } = await supabase.from("SelfTransfer").insert([
        {
          beneficiary_name: formData.beneficiaryName,
          company_name: formData.companyName,
          bank_ac_from: formData.bankAcFrom,
          date_of_payment: formData.dateOfPayment,
          amount: parseFloat(formData.amount),
          amount_in_words: formData.amountInWords,
          transaction_type: formData.transactionType,
          purpose_of_payment: formData.purposeOfPayment,
          project: formData.project,
          po_number: formData.poNumber,
          utr_number: formData.utrNumber,
          beneficiary_ac_name: formData.beneficiaryAccountName,
          beneficiary_ac_number: formData.beneficiaryAccountNumber,
          beneficiary_bank_name: formData.beneficiaryBankName,
          beneficiary_bank_ifsc: formData.beneficiaryBankIFSC,
          particulars: formData.particulars,
          entry_done_by: formData.entryDoneBy,
          checked_by: formData.checkedBy,
          approved_by: formData.approvedBy,
          pdf_link: publicUrl,
        },
      ])

      if (error) throw error

      alert("Contra added successfully!")
      setFormData({
        beneficiaryName: "",
        companyName: "",
        bankAcFrom: "",
        dateOfPayment: new Date().toISOString().split("T")[0],
        amount: "",
        amountInWords: "",
        transactionType: "Contra",
        purposeOfPayment: "",
        project: "",
        poNumber: "",
        utrNumber: "",
        beneficiaryAccountName: "",
        beneficiaryAccountNumber: "",
        beneficiaryBankName: "",
        beneficiaryBankIFSC: "",
        particulars: "",
        entryDoneBy: username,
        checkedBy: "",
        approvedBy: "",
        vendorNumber: "",
        vendorEmail: "",
      })
    } catch (error: any) {
      console.error("Error adding Contra:", error)
      alert("Failed to add record: " + error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLogout = () => {
    localStorage.clear()
    router.push("/")
  }

  return (
    <div className="container mx-auto px-4 max-w-4xl">
      <form onSubmit={handleSubmit}>
        <Card className="shadow-xl border-0 bg-white">
          <CardHeader className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-t-lg">
            <CardTitle className="text-center">CONTRA VOUCHER</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="bg-white border-2 border-gray-800 p-4 space-y-6">

           

              {/* Row 2: Company, Bank, Date */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-b border-gray-400 pb-4">
                <div>
                  <Label className="text-xs font-bold text-gray-700 uppercase">Company Name</Label>
                  <Select value={formData.companyName} onValueChange={handleCompanySelection}>
                    <SelectTrigger className="border-0 border-b border-gray-400 rounded-none px-1 py-0 h-8 text-sm focus:border-teal-600">
                      <SelectValue placeholder="Select Company" />
                    </SelectTrigger>
                    <SelectContent>
                      {companyNames.map((c, i) => <SelectItem key={i} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-bold text-gray-700 uppercase">BANK AC FROM</Label>
                  <Select value={formData.bankAcFrom} onValueChange={(v) => handleInputChange("bankAcFrom", v)}>
                    <SelectTrigger className="border-0 border-b border-gray-400 rounded-none px-1 py-0 h-8 text-sm focus:border-teal-600">
                      <SelectValue placeholder="Select Bank" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredBankAccounts.map((a, i) => <SelectItem key={i} value={a}>{a}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-bold text-gray-700 uppercase">Date of Payment</Label>
                  <Input
                    type="date"
                    value={formData.dateOfPayment}
                    onChange={(e) => handleInputChange("dateOfPayment", e.target.value)}
                    className="border-0 border-b border-gray-400 rounded-none px-1 py-0 h-8 text-sm focus:border-teal-600"
                    required
                  />
                </div>
              </div>

              {/* Row 4: Purpose, Transaction Type, UTR */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-b border-gray-400 pb-4">
                <div>
                  <Label className="text-xs font-bold text-gray-700 uppercase">PURPOSE</Label>
                  <Input
                    value={formData.purposeOfPayment}
                    onChange={(e) => handleInputChange("purposeOfPayment", e.target.value)}
                    className="border-0 border-b border-gray-400 rounded-none px-1 py-0 h-8 text-sm focus:border-teal-600"
                  />
                </div>

                <div>
                  <Label className="text-xs font-bold text-gray-700 uppercase">
                    TRANSACTION TYPE
                  </Label>

                  {/* Fixed Value */}
                  <div className="border-0 border-b border-gray-400 rounded-none px-1 py-2 h-8 text-sm flex items-center text-gray-800 font-medium">
                    Contra
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-bold text-gray-700 uppercase">UTR Number</Label>
                  <Input
                    value={formData.utrNumber}
                    onChange={(e) => handleInputChange("utrNumber", e.target.value)}
                    className="border-0 border-b border-gray-400 rounded-none px-1 py-0 h-8 text-sm focus:border-teal-600"
                  />
                </div>
              </div>

           

              {/* Row 6: Beneficiary Account Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-gray-400 pb-4">
                <div>
                  <Label className="text-xs font-bold text-gray-700 uppercase">Beneficiary A/C To</Label>
                  <Input
                    value={formData.beneficiaryAccountName}
                    onChange={(e) => handleInputChange("beneficiaryAccountName", e.target.value)}
                    className="border-0 border-b border-gray-400 rounded-none px-1 py-0 h-8 text-sm focus:border-teal-600"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold text-gray-700 uppercase">Beneficiary A/C Number To</Label>
                  <Input
                    value={formData.beneficiaryAccountNumber}
                    onChange={(e) => handleInputChange("beneficiaryAccountNumber", e.target.value)}
                    className="border-0 border-b border-gray-400 rounded-none px-1 py-0 h-8 text-sm focus:border-teal-600"
                  />
                </div>
              </div>

              {/* Row 7: Bank Name and IFSC */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-gray-400 pb-4">
                <div>
                  <Label className="text-xs font-bold text-gray-700 uppercase">Bank Name To</Label>
                  <Input
                    value={formData.beneficiaryBankName}
                    onChange={(e) => handleInputChange("beneficiaryBankName", e.target.value)}
                    className="border-0 border-b border-gray-400 rounded-none px-1 py-0 h-8 text-sm focus:border-teal-600"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold text-gray-700 uppercase">Bank Name To</Label>
                  <Input
                    value={formData.beneficiaryBankIFSC}
                    onChange={(e) => handleInputChange("beneficiaryBankIFSC", e.target.value)}
                    className="border-0 border-b border-gray-400 rounded-none px-1 py-0 h-8 text-sm focus:border-teal-600"
                  />
                </div>
              </div>

              {/* Row 8: Particulars and Amount */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 border-b border-gray-400 pb-4">
                <div className="md:col-span-8">
                  <Label className="text-xs font-bold text-gray-700 uppercase">Particulars</Label>
                  <Textarea
                    value={formData.particulars}
                    onChange={(e) => handleInputChange("particulars", e.target.value)}
                    className="border-0 border-b border-gray-400 rounded-none px-1 py-1 min-h-[60px] text-sm focus:border-teal-600 resize-none"
                    required
                  />
                </div>
                <div className="md:col-span-4">
                  <Label className="text-xs font-bold text-gray-700 uppercase">Amount (₹)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => handleInputChange("amount", e.target.value)}
                    className="border-0 border-b border-gray-400 rounded-none px-1 py-0 h-10 text-xl font-bold text-teal-600 focus:border-teal-600 text-right"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              {/* Row 9: Amount in Words */}
              <div className="bg-teal-50 p-4 rounded-lg border border-teal-100">
                <Label className="text-xs font-bold text-teal-700 uppercase">Amount in Words</Label>
                <p className="text-sm font-medium text-teal-800 mt-1 italic">
                  {formData.amountInWords || "Enter amount to see words..."}
                </p>
              </div>

              {/* Row 10: Signatures */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                <div>
                  <Label className="text-xs font-bold text-gray-700 uppercase">Approved By</Label>
                  <Input
                    value={formData.approvedBy}
                    onChange={(e) => handleInputChange("approvedBy", e.target.value)}
                    className="border-0 border-b border-gray-400 rounded-none px-1 py-0 h-8 text-sm focus:border-teal-600"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-6 rounded-xl shadow-lg transition-all"
                  >
                    {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Save className="mr-2 h-5 w-5" /> Save Transfer</>}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
