"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LogOut, History, Save, ArrowLeft, Loader2, DollarSign, Check, ChevronsUpDown, RefreshCw } from "lucide-react"
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
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const filteredOptions = useMemo(() => {
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
        className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200 pr-8 h-10"
        placeholder="Type or select beneficiary"
        required
      />
      <ChevronsUpDown
        className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 shrink-0 opacity-50 cursor-pointer hover:opacity-80 transition-opacity"
        onClick={() => setOpen(!open)}
      />

      {open && filteredOptions.length > 0 && (
        <div className="absolute z-50 w-full mt-1.5 max-h-60 overflow-auto rounded-xl border border-slate-100 bg-white p-1 text-slate-700 shadow-xl outline-none ring-1 ring-black/5 animate-in fade-in slide-in-from-top-1 duration-200">
          {filteredOptions.map((beneficiary) => (
            <div
              key={beneficiary.beneficiary_name}
              className={cn(
                "relative flex w-full cursor-pointer select-none items-center rounded-lg px-3 py-2 text-sm outline-none transition-colors hover:bg-amber-50 hover:text-amber-900",
                value === beneficiary.beneficiary_name && "bg-amber-50 font-medium text-amber-900"
              )}
              onClick={() => {
                onSelect(beneficiary.beneficiary_name)
                setOpen(false)
              }}
            >
              <Check
                className={cn(
                  "mr-2 h-4 w-4 text-amber-600",
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

export default function AddCreditPage() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [userRole, setUserRole] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingDropdowns, setIsLoadingDropdowns] = useState(true)

  const [companyNames, setCompanyNames] = useState<string[]>([])
  const [bankAccounts, setBankAccounts] = useState<string[]>([])
  const [filteredBankAccounts, setFilteredBankAccounts] = useState<string[]>([])
  const [beneficiaries, setBeneficiaries] = useState<any[]>([])

  const [formData, setFormData] = useState({
    beneficiaryName: "",
    companyName: "",
    bankAcFrom: "",
    dateOfPayment: new Date().toISOString().split("T")[0],
    amount: "",
    amountInWords: "",
    transactionType: "Receipt",
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
          primary: [180, 80, 0] as [number, number, number], // Orange
          secondary: [200, 120, 50] as [number, number, number],
          background: {
            light: [255, 245, 235] as [number, number, number], // Very light orange
            orange: [255, 240, 220] as [number, number, number],
          },
          border: [180, 80, 0] as [number, number, number]
        }

        const formatDate = (d: string) => new Date(d).toLocaleDateString("en-IN")
        const formatCurrency = (v: string) => "Rs. " + parseFloat(v || "0").toLocaleString("en-IN", { minimumFractionDigits: 2 })

        doc.setDrawColor(...colors.border)
        doc.setLineWidth(2)
        doc.rect(margin, margin, pageWidth - 2 * margin, pageHeight - 2 * margin)

        doc.setFillColor(...colors.background.orange)
        doc.rect(margin + 3, currentY, pageWidth - 2 * margin - 6, 22, "FD")
        doc.setFont("helvetica", "bold")
        doc.setFontSize(18)
        doc.setTextColor(...colors.primary)
        doc.text(data.companyName || "COMPANY NAME", pageWidth / 2, currentY + 8, { align: "center" })
        doc.setFontSize(12)
        doc.text("RECEIPT VOUCHER", pageWidth / 2, currentY + 16, { align: "center" })

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
            [{ content: "PARTICULARS", styles: { fontStyle: 'bold', halign: 'center', fillColor: colors.background.orange } }, { content: "AMOUNT", styles: { fontStyle: 'bold', halign: 'center', fillColor: colors.background.orange } }],
            [{ content: data.particulars || "", styles: { minCellHeight: 20 } }, { content: formatCurrency(data.amount), styles: { halign: 'center', valign: 'middle', fontSize: 14, fontStyle: 'bold', textColor: colors.primary } }]
          ],
          columnStyles: { 0: { cellWidth: 130 }, 1: { cellWidth: 60 } },
          didDrawPage: (d) => { currentY = d.cursor!.y }
        })

        currentY += 5
        doc.setFillColor(...colors.background.orange)
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
      const fileName = `Credit_${Date.now()}.pdf`
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
      const { error } = await supabase.from("Credit").insert([
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

      alert("Credit record added successfully!")
      setFormData({
        beneficiaryName: "",
        companyName: "",
        bankAcFrom: "",
        dateOfPayment: new Date().toISOString().split("T")[0],
        amount: "",
        amountInWords: "",
        transactionType: "Receipt",
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
      })
    } catch (error: any) {
      console.error("Error adding credit:", error)
      alert("Failed to add credit record: " + error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLogout = () => {
    localStorage.clear()
    router.push("/")
  }

  return (
    <div className="container mx-auto max-w-4xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="shadow-lg border border-slate-100 bg-white rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600 text-white py-6 px-8">
            <CardTitle className="text-center text-xl font-bold tracking-wider uppercase">Receipt Voucher</CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            
            {/* Section 1: Payer & Company Info */}
            <div className="space-y-4">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                Payer & Company Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="md:col-span-3">
  <Label className="text-xs font-semibold text-slate-500 mb-1.5 block">
    Payer Name
  </Label>

  <Input
    type="text"
    placeholder="Enter Payer Name"
    value={formData.beneficiaryName}
    onChange={(e) =>
      setFormData((prev) => ({
        ...prev,
        beneficiaryName: e.target.value,
      }))
    }
  />
</div>

                <div>
                  <Label className="text-xs font-semibold text-slate-500 mb-1.5 block">Company Name</Label>
                  <Select value={formData.companyName} onValueChange={handleCompanySelection}>
                    <SelectTrigger className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200 h-10">
                      <SelectValue placeholder="Select Company" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border border-slate-100 shadow-xl">
                      {companyNames.map((c, i) => (
                        <SelectItem key={i} value={c} className="rounded-lg py-2 hover:bg-slate-50">
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs font-semibold text-slate-500 mb-1.5 block">Credited Bank Account</Label>
                  <Select value={formData.bankAcFrom} onValueChange={(v) => handleInputChange("bankAcFrom", v)}>
                    <SelectTrigger className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200 h-10">
                      <SelectValue placeholder="Select Bank" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border border-slate-100 shadow-xl">
                      {filteredBankAccounts.map((a, i) => (
                        <SelectItem key={i} value={a} className="rounded-lg py-2 hover:bg-slate-50">
                          {a}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs font-semibold text-slate-500 mb-1.5 block">Date of Payment</Label>
                  <Input
                    type="date"
                    value={formData.dateOfPayment}
                    onChange={(e) => handleInputChange("dateOfPayment", e.target.value)}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200 h-10"
                    required
                  />
                </div>
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* Section 2: Transaction Details */}
            <div className="space-y-4">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                Transaction Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <Label className="text-xs font-semibold text-slate-500 mb-1.5 block">Purpose</Label>
                  <Input
                    value={formData.purposeOfPayment}
                    onChange={(e) => handleInputChange("purposeOfPayment", e.target.value)}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200 h-10"
                    placeholder="e.g. Services payment"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold text-slate-500 mb-1.5 block">Transaction Type</Label>
                  <div className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-500 h-10 flex items-center font-medium">
                    Receipt
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-semibold text-slate-500 mb-1.5 block">UTR Number</Label>
                  <Input
                    value={formData.utrNumber}
                    onChange={(e) => handleInputChange("utrNumber", e.target.value)}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200 h-10"
                    placeholder="Enter UTR number"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold text-slate-500 mb-1.5 block">Project (Manual)</Label>
                  <Input
                    value={formData.project}
                    onChange={(e) => handleInputChange("project", e.target.value)}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200 h-10"
                    placeholder="Enter project name"
                  />
                </div>
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* Section 4: Particulars & Amount */}
            <div className="space-y-4">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                Particulars & Amount
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                <div className="md:col-span-8">
                  <Label className="text-xs font-semibold text-slate-500 mb-1.5 block">Particulars</Label>
                  <Textarea
                    value={formData.particulars}
                    onChange={(e) => handleInputChange("particulars", e.target.value)}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200 min-h-[90px] resize-none"
                    placeholder="Enter details of the transaction..."
                    required
                  />
                </div>
                <div className="md:col-span-4">
                  <Label className="text-xs font-semibold text-slate-500 mb-1.5 block">Amount (₹)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-lg">₹</span>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => handleInputChange("amount", e.target.value)}
                      className="w-full bg-slate-50/50 border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-lg font-bold text-amber-600 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200 h-12 text-right"
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Amount in Words */}
              <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-4 flex items-start space-x-3 mt-3">
                <div className="bg-amber-100 p-1.5 rounded-lg text-amber-600 mt-0.5">
                  <DollarSign className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Amount in Words</span>
                  <p className="text-sm font-medium text-amber-900 mt-0.5 italic">
                    {formData.amountInWords || "Enter amount to see words..."}
                  </p>
                </div>
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* Section 5: Checked By & Save */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
              <div>
                <Label className="text-xs font-semibold text-slate-500 mb-1.5 block">Checked By</Label>
                <Input
                  value={formData.checkedBy}
                  onChange={(e) => handleInputChange("checkedBy", e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200 h-10"
                  placeholder="Enter name"
                />
              </div>

              <div>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold py-5 rounded-xl shadow-md shadow-orange-500/10 hover:shadow-orange-500/20 transition-all duration-200 flex items-center justify-center gap-2 h-10 cursor-pointer"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <Save className="h-4 w-4" /> Save Credit
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
