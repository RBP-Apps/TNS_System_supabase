"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save, Send } from "lucide-react"
import supabase from "@/lib/supabase"

interface FormData {
  id: string
  companyName: string
  bankAccount: string
  dateOfPayment: string
  purposeOfPayment: string
  transactionType: string
  voucherNo: string
  beneficiaryName: string
  poNumber: string
  project: string
  beneficiaryAccountName: string
  beneficiaryAccountNumber: string
  beneficiaryBankName: string
  beneficiaryBankIFSC: string
  amount: string
  amountInWords: string
  particulars: string
  entryDoneBy: string
  checkedBy: string
  approvedBy: string
  submittedAt: string
}

export default function FormPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<FormData>({
    id: "",
    companyName: "HAMAR ENERGY (INDIA) PVT LTD",
    bankAccount: "AXIS BANK LTD- CC A/C 8711-TANAY",
    dateOfPayment: "",
    purposeOfPayment: "",
    transactionType: "PAYMENT",
    voucherNo: "",
    beneficiaryName: "",
    poNumber: "",
    project: "",
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
    submittedAt: "",
  })

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("tns_logged_in")
    if (isLoggedIn !== "true") {
      router.push("/")
    }

    // Generate unique ID
    setFormData((prev) => ({
      ...prev,
      id: "TNS" + Date.now(),
      dateOfPayment: new Date().toISOString().split("T")[0],
    }))
  }, [router])

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const submissionData = {
        ...formData,
        submittedAt: new Date().toISOString(),
      }

      // Save to Supabase History table
      const { error: insertError } = await supabase
        .from('History')
        .insert([{
          created_date: submissionData.submittedAt,
          voucher_no: submissionData.voucherNo,
          bank_ac_from: submissionData.bankAccount,
          company_name: submissionData.companyName,
          date_of_payment: submissionData.dateOfPayment || null,
          purpose_of_payment: submissionData.purposeOfPayment,
          transaction_type: submissionData.transactionType,
          project: submissionData.project,
          beneficiary_name: submissionData.beneficiaryName,
          po_number: submissionData.poNumber,
          beneficiary_ac_name: submissionData.beneficiaryAccountName,
          beneficiary_ac_number: submissionData.beneficiaryAccountNumber,
          beneficiary_bank_name: submissionData.beneficiaryBankName,
          beneficiary_bank_ifsc: submissionData.beneficiaryBankIFSC,
          particulars: submissionData.particulars,
          amount: parseFloat(submissionData.amount) || 0,
          amount_in_words: submissionData.amountInWords,
          entry_done_by: submissionData.entryDoneBy,
          checked_by: submissionData.checkedBy,
          approved_by: submissionData.approvedBy,
          name: localStorage.getItem("tns_username") || "User"
        }])

      if (insertError) {
        throw new Error("Database insert failed: " + insertError.message)
      }

      // Save to localStorage (legacy)
      const existingForms = JSON.parse(localStorage.getItem("tns_forms") || "[]")
      existingForms.push(submissionData)
      localStorage.setItem("tns_forms", JSON.stringify(existingForms))

      alert("Form submitted successfully!")
      router.push("/history")
    } catch (error) {
      console.error("Error submitting form:", error)
      alert("Error submitting form: " + (error instanceof Error ? error.message : "Unknown error"))
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-500 p-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 bg-white/10 backdrop-blur-md rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Button
              onClick={() => router.push("/dashboard")}
              variant="outline"
              className="bg-white/20 border-white/30 text-white hover:bg-white/30"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold text-white">Payment Voucher Form</h1>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="bg-white/95 backdrop-blur-sm shadow-xl border-0">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
              <CardTitle>Bank Payment Voucher</CardTitle>
              <CardDescription className="text-blue-100">
                Fill in all required details for the payment voucher
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Company and Bank Details */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName" className="text-gray-700 font-medium">
                    Company Name
                  </Label>
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) => handleInputChange("companyName", e.target.value)}
                    className="border-2 border-gray-200 focus:border-purple-500"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bankAccount" className="text-gray-700 font-medium">
                    Bank Account
                  </Label>
                  <Input
                    id="bankAccount"
                    value={formData.bankAccount}
                    onChange={(e) => handleInputChange("bankAccount", e.target.value)}
                    className="border-2 border-gray-200 focus:border-purple-500"
                    required
                  />
                </div>
              </div>

              {/* Date and Transaction Details */}
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateOfPayment" className="text-gray-700 font-medium">
                    Date of Payment
                  </Label>
                  <Input
                    id="dateOfPayment"
                    type="date"
                    value={formData.dateOfPayment}
                    onChange={(e) => handleInputChange("dateOfPayment", e.target.value)}
                    className="border-2 border-gray-200 focus:border-purple-500"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="transactionType" className="text-gray-700 font-medium">
                    Transaction Type
                  </Label>
                  <Select
                    value={formData.transactionType}
                    onValueChange={(value) => handleInputChange("transactionType", value)}
                  >
                    <SelectTrigger className="border-2 border-gray-200 focus:border-purple-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PAYMENT">Payment</SelectItem>
                      <SelectItem value="TRANSFER">Transfer</SelectItem>
                      <SelectItem value="REFUND">Refund</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="voucherNo" className="text-gray-700 font-medium">
                    Voucher No.
                  </Label>
                  <Input
                    id="voucherNo"
                    value={formData.voucherNo}
                    onChange={(e) => handleInputChange("voucherNo", e.target.value)}
                    className="border-2 border-gray-200 focus:border-purple-500"
                    required
                  />
                </div>
              </div>

              {/* Purpose and Project */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="purposeOfPayment" className="text-gray-700 font-medium">
                    Purpose
                  </Label>
                  <Input
                    id="purposeOfPayment"
                    value={formData.purposeOfPayment}
                    onChange={(e) => handleInputChange("purposeOfPayment", e.target.value)}
                    className="border-2 border-gray-200 focus:border-purple-500"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="project" className="text-gray-700 font-medium">
                    Project
                  </Label>
                  <Input
                    id="project"
                    value={formData.project}
                    onChange={(e) => handleInputChange("project", e.target.value)}
                    className="border-2 border-gray-200 focus:border-purple-500"
                    placeholder="e.g., UPAD-ROTOMAG"
                    required
                  />
                </div>
              </div>

              {/* Beneficiary Details */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Beneficiary Details</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="beneficiaryName" className="text-gray-700 font-medium">
                      Beneficiary Name PAYER
                    </Label>
                    <Input
                      id="beneficiaryName"
                      value={formData.beneficiaryName}
                      onChange={(e) => handleInputChange("beneficiaryName", e.target.value)}
                      className="border-2 border-gray-200 focus:border-green-500"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="poNumber" className="text-gray-700 font-medium">
                      PO Number
                    </Label>
                    <Input
                      id="poNumber"
                      value={formData.poNumber}
                      onChange={(e) => handleInputChange("poNumber", e.target.value)}
                      className="border-2 border-gray-200 focus:border-green-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="beneficiaryAccountName" className="text-gray-700 font-medium">
                      Beneficiary A/C Name
                    </Label>
                    <Input
                      id="beneficiaryAccountName"
                      value={formData.beneficiaryAccountName}
                      onChange={(e) => handleInputChange("beneficiaryAccountName", e.target.value)}
                      className="border-2 border-gray-200 focus:border-green-500"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="beneficiaryAccountNumber" className="text-gray-700 font-medium">
                      Beneficiary A/C Number
                    </Label>
                    <Input
                      id="beneficiaryAccountNumber"
                      value={formData.beneficiaryAccountNumber}
                      onChange={(e) => handleInputChange("beneficiaryAccountNumber", e.target.value)}
                      className="border-2 border-gray-200 focus:border-green-500"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="beneficiaryBankName" className="text-gray-700 font-medium">
                      Beneficiary Bank Name
                    </Label>
                    <Input
                      id="beneficiaryBankName"
                      value={formData.beneficiaryBankName}
                      onChange={(e) => handleInputChange("beneficiaryBankName", e.target.value)}
                      className="border-2 border-gray-200 focus:border-green-500"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="beneficiaryBankIFSC" className="text-gray-700 font-medium">
                      Beneficiary Bank IFSC
                    </Label>
                    <Input
                      id="beneficiaryBankIFSC"
                      value={formData.beneficiaryBankIFSC}
                      onChange={(e) => handleInputChange("beneficiaryBankIFSC", e.target.value)}
                      className="border-2 border-gray-200 focus:border-green-500"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Amount Details */}
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Amount Details</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount" className="text-gray-700 font-medium">
                      Amount (₹)
                    </Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => handleAmountChange(e.target.value)}
                      className="border-2 border-gray-200 focus:border-orange-500"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amountInWords" className="text-gray-700 font-medium">
                      Amount in Words
                    </Label>
                    <Input
                      id="amountInWords"
                      value={formData.amountInWords}
                      onChange={(e) => handleInputChange("amountInWords", e.target.value)}
                      className="border-2 border-gray-200 focus:border-orange-500"
                      required
                    />
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <Label htmlFor="particulars" className="text-gray-700 font-medium">
                    Particulars
                  </Label>
                  <Textarea
                    id="particulars"
                    value={formData.particulars}
                    onChange={(e) => handleInputChange("particulars", e.target.value)}
                    className="border-2 border-gray-200 focus:border-orange-500"
                    rows={3}
                    required
                  />
                </div>
              </div>

              {/* Approval Details */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Approval Details</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="entryDoneBy" className="text-gray-700 font-medium">
                      Entry Done By
                    </Label>
                    <Input
                      id="entryDoneBy"
                      value={formData.entryDoneBy}
                      onChange={(e) => handleInputChange("entryDoneBy", e.target.value)}
                      className="border-2 border-gray-200 focus:border-purple-500"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="checkedBy" className="text-gray-700 font-medium">
                      Checked By
                    </Label>
                    <Input
                      id="checkedBy"
                      value={formData.checkedBy}
                      onChange={(e) => handleInputChange("checkedBy", e.target.value)}
                      className="border-2 border-gray-200 focus:border-purple-500"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="approvedBy" className="text-gray-700 font-medium">
                      Approved By
                    </Label>
                    <Input
                      id="approvedBy"
                      value={formData.approvedBy}
                      onChange={(e) => handleInputChange("approvedBy", e.target.value)}
                      className="border-2 border-gray-200 focus:border-purple-500"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/dashboard")}
                  className="bg-gray-100 hover:bg-gray-200"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white px-8"
                >
                  <Send className="mr-2 h-4 w-4" />
                  Submit Form
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  )
}
