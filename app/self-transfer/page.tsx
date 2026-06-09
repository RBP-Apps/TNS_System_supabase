"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LogOut, History, Save, Building2, ArrowLeft, Loader2, RefreshCw, Building, CreditCard, User, Briefcase, FileText, Check, ChevronsUpDown } from "lucide-react"
import supabase from "@/lib/supabase"
import { generateColoredVoucherPDF, VoucherData } from "@/lib/voucher-exports"
import React from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"


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
    companyName: "",
    bankAcFrom: "",
    dateOfPayment: new Date().toISOString().split("T")[0],
    amount: "",
    amountInWords: "",
    transactionType: "Contra",
    purposeOfPayment: "",
    utrNumber: "",
    beneficiaryAccountName: "",
    beneficiaryAccountNumber: "",
    beneficiaryBankName: "",
    beneficiaryBankIFSC: "",
    particulars: "",
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // 1. Generate PDF using unified helper
      const pdfData: VoucherData = {
        id: "",
        voucherNo: "",
        companyName: formData.companyName,
        dateOfPayment: formData.dateOfPayment,
        dateOfPaymentProcess: formData.dateOfPayment,
        beneficiaryName: "",
        amount: formData.amount,
        amountInWords: formData.amountInWords,
        bankAcFrom: formData.bankAcFrom,
        purposeOfPayment: formData.purposeOfPayment,
        transactionType: formData.transactionType,
        project: "",
        particulars: formData.particulars,
        entryDoneBy: "",
        checkedBy: "",
        approvedBy: formData.approvedBy,
        beneficiaryAcName: formData.beneficiaryAccountName,
        beneficiaryAcNumber: formData.beneficiaryAccountNumber,
        beneficiaryBankName: formData.beneficiaryBankName,
        beneficiaryBankIfsc: formData.beneficiaryBankIFSC,
        pdfLink: "",
        name: "",
        timestamp: new Date().toISOString(),
        recordType: "Transfer"
      }
      const { pdfBlob, fileName } = await generateColoredVoucherPDF(pdfData)

      // 2. Upload PDF
      const { error: uploadError } = await supabase.storage
        .from("vouchers")
        .upload(fileName, pdfBlob)

      if (uploadError) throw uploadError

      const {
        data: { publicUrl },
      } = supabase.storage
        .from("vouchers")
        .getPublicUrl(fileName)

      // 3. Save Record
      const payload = {
        company_name: formData.companyName,
        bank_ac_from: formData.bankAcFrom,
        date_of_payment: formData.dateOfPayment,

        purpose: formData.purposeOfPayment,
        transaction_type: formData.transactionType,

        utr_number: formData.utrNumber,

        bank_ac_to: formData.beneficiaryAccountName,
        bank_ac_number_to: formData.beneficiaryAccountNumber,
        bank_name_to: formData.beneficiaryBankName,
        ifsc_to: formData.beneficiaryBankIFSC,

        particulars: formData.particulars,

        amount: Number(formData.amount),
        amount_in_words: formData.amountInWords,

        approved_by: formData.approvedBy,

        pdf_link: publicUrl,
      }

      const { error } = await supabase
        .from("Contra")
        .insert([payload])

      if (error) throw error

      alert("Contra added successfully!")

      // Reset Form
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
      alert(`Failed to add record: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
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
                  <Label className="text-xs font-bold text-gray-700 uppercase">Bank A/C To</Label>
                  <Input
                    value={formData.beneficiaryAccountName}
                    onChange={(e) => handleInputChange("beneficiaryAccountName", e.target.value)}
                    className="border-0 border-b border-gray-400 rounded-none px-1 py-0 h-8 text-sm focus:border-teal-600"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold text-gray-700 uppercase">Bank A/C Number To</Label>
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
                  <Label className="text-xs font-bold text-gray-700 uppercase">IFSC To</Label>
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
