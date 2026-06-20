import supabase from "@/lib/supabase"
import * as XLSX from "xlsx"
import { formatDate } from "./history-utils"

export interface VoucherData {
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

export interface ExportExcelOptions {
  recordType: "Debit" | "Credit" | "Transfer"
  debouncedSearchTerm: string
  selectedCompany: string
  selectedProject: string
  selectedPurpose: string
  selectedTransactionType: string
  selectedName: string
  dateFrom: string
  dateTo: string
  debouncedAmountFrom: string
  debouncedAmountTo: string
  setIsExporting: (val: boolean) => void
}

export interface ExportSummaryOptions {
  recordType: "Debit" | "Credit" | "Transfer"
  debouncedSearchTerm: string
  selectedCompany: string
  selectedProject: string
  selectedPurpose: string
  selectedTransactionType: string
  selectedName: string
  dateFrom: string
  dateTo: string
  debouncedAmountFrom: string
  debouncedAmountTo: string
  setIsRefetching: (val: boolean) => void
}

export const downloadPDF = async (voucher: VoucherData) => {
  try {
    if (voucher.recordType === "Credit" || voucher.recordType === "Transfer" || !voucher.pdfLink) {
      const { pdfBlob, fileName } = await generateColoredVoucherPDF(voucher)
      const url = window.URL.createObjectURL(pdfBlob)
      const link = document.createElement("a")
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      return
    }

    if (voucher.pdfLink && voucher.pdfLink.includes("http")) {
      let downloadUrl = voucher.pdfLink
      if (voucher.pdfLink.includes("drive.google.com")) {
        const fileIdMatch = voucher.pdfLink.match(/\/d\/([a-zA-Z0-9-_]+)/)
        if (fileIdMatch) {
          downloadUrl = `https://drive.google.com/uc?export=download&id=${fileIdMatch[1]}`
        }
      }

      try {
        const response = await fetch(downloadUrl, {
          method: "GET",
          mode: "no-cors",
        })

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
        const validFields = fields.filter((field) => {
          if (!field.value) return false
          const strVal = String(field.value).trim()
          return strVal !== "" && strVal !== "N/A" && strVal !== "₹0" && strVal !== "₹NaN"
        })

        if (validFields.length === 0) return

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

      if (voucher.recordType === "Transfer") {
        addSection("BASIC VOUCHER INFORMATION", [
          {
            label: "Timestamp",
            value: voucher.timestamp ? new Date(voucher.timestamp).toLocaleString("en-IN") : "N/A",
          },
          { label: "Voucher ID", value: voucher.id },
          { label: "Transaction Type", value: voucher.transactionType },
          { label: "Purpose", value: voucher.purposeOfPayment },
        ])

        addSection("BANK INFORMATION", [
          { label: "Bank AC From", value: voucher.bankAcFrom },
          { label: "Date", value: voucher.dateOfPaymentProcess },
        ])

        addSection("BENEFICIARY INFORMATION (CONTRA)", [
          { label: "Bank A/C To", value: voucher.beneficiaryAcName },
          { label: "Bank A/C Number To", value: voucher.beneficiaryAcNumber },
          { label: "Bank Name To", value: voucher.beneficiaryBankName },
          { label: "IFSC To", value: voucher.beneficiaryBankIfsc },
        ])

        addSection("FINANCIAL INFORMATION", [
          { label: "Particulars", value: voucher.particulars },
          { label: "Amount", value: voucher.amount ? `₹${Number.parseFloat(voucher.amount).toLocaleString("en-IN")}` : "" },
          { label: "Amount in Words", value: voucher.amountInWords },
        ])

        addSection("APPROVAL INFORMATION", [
          { label: "Approved By", value: voucher.approvedBy },
          { label: "PDF Link", value: voucher.pdfLink },
        ])
      } else if (voucher.recordType === "Credit") {
        addSection("BASIC RECEIPT INFORMATION", [
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

        addSection("PAYER INFORMATION", [
          { label: "Payer Name", value: voucher.beneficiaryName },
          { label: "UTR Number", value: voucher.utrNumber },
        ])

        addSection("FINANCIAL INFORMATION", [
          { label: "Particulars", value: voucher.particulars },
          { label: "Amount", value: voucher.amount ? `₹${Number.parseFloat(voucher.amount).toLocaleString("en-IN")}` : "" },
          { label: "Amount in Words", value: voucher.amountInWords },
        ])

        addSection("APPROVAL INFORMATION", [
          { label: "Entry Done By", value: voucher.entryDoneBy },
          { label: "Checked By", value: voucher.checkedBy },
          { label: "PDF Link", value: voucher.pdfLink },
        ])
      } else {
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
            label: "Beneficiary Name",
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
      }

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

export const handleExportToExcel = async (options: ExportExcelOptions) => {
  const {
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
    setIsExporting,
  } = options

  try {
    setIsExporting(true)

    let searchFilter = null
    if (debouncedSearchTerm) {
      if (recordType === "Debit") {
        searchFilter = `voucher_no.ilike.%${debouncedSearchTerm}%,beneficiary_name.ilike.%${debouncedSearchTerm}%,project.ilike.%${debouncedSearchTerm}%,purpose_of_payment.ilike.%${debouncedSearchTerm}%,company_name.ilike.%${debouncedSearchTerm}%`
      } else if (recordType === "Credit") {
        searchFilter = `beneficiary_name.ilike.%${debouncedSearchTerm}%,company_name.ilike.%${debouncedSearchTerm}%,purpose_of_payment.ilike.%${debouncedSearchTerm}%,utr_number.ilike.%${debouncedSearchTerm}%`
      } else if (recordType === "Transfer") {
        searchFilter = `company_name.ilike.%${debouncedSearchTerm}%,purpose.ilike.%${debouncedSearchTerm}%,utr_number.ilike.%${debouncedSearchTerm}%`
      }
    }

    let COLUMNS = ""
    let tableName = "History"
    let orderColumn = "created_date"

    if (recordType === "Debit") {
      tableName = "History"
      orderColumn = "created_date"
      COLUMNS = [
        'id', 'voucher_no', 'created_date', 'date_of_payment', 'company_name',
        'beneficiary_name', 'purpose_of_payment', 'project', 'amount', 'transaction_type',
        'name', 'pdf_link', 'bank_ac_from', 'po_number', 'beneficiary_ac_name',
        'beneficiary_ac_number', 'beneficiary_bank_name', 'beneficiary_bank_ifsc',
        'particulars', 'amount_in_words', 'entry_done_by', 'checked_by', 'approved_by'
      ].join(',')
    } else if (recordType === "Credit") {
      tableName = "Credit"
      orderColumn = "created_date"
      COLUMNS = [
        'id', 'created_date', 'date_of_payment', 'company_name',
        'beneficiary_name', 'amount', 'amount_in_words', 'bank_ac_from',
        'purpose_of_payment', 'transaction_type', 'project', 'utr_number',
        'particulars', 'entry_done_by', 'checked_by', 'pdf_link'
      ].join(',')
    } else if (recordType === "Transfer") {
      tableName = "Contra"
      orderColumn = "created_at"
      COLUMNS = [
        'id', 'created_at', 'date_of_payment', 'company_name',
        'bank_ac_from', 'purpose', 'transaction_type', 'utr_number',
        'bank_ac_to', 'bank_ac_number_to', 'bank_name_to', 'ifsc_to',
        'particulars', 'amount', 'amount_in_words', 'approved_by', 'pdf_link'
      ].join(',')
    }

    let allData: any[] = []
    let from = 0
    const limit = 1000
    let hasMore = true

    while (hasMore) {
      let query = supabase.from(tableName).select(COLUMNS)

      if (searchFilter) query = query.or(searchFilter)
      if (selectedCompany !== "all") query = query.eq("company_name", selectedCompany)
      
      if (recordType === "Debit" || recordType === "Credit") {
        if (selectedProject !== "all") query = query.eq("project", selectedProject)
        if (selectedPurpose !== "all") query = query.eq("purpose_of_payment", selectedPurpose)
        if (selectedTransactionType !== "all") query = query.eq("transaction_type", selectedTransactionType)
        if (selectedName !== "all") query = query.eq("beneficiary_name", selectedName)
      } else if (recordType === "Transfer") {
        if (selectedPurpose !== "all") query = query.eq("purpose", selectedPurpose)
        if (selectedTransactionType !== "all") query = query.eq("transaction_type", selectedTransactionType)
        if (selectedName !== "all") query = query.eq("bank_ac_to", selectedName)
      }

      if (dateFrom) query = query.gte("date_of_payment", dateFrom)
      if (dateTo) query = query.lte("date_of_payment", dateTo)
      if (debouncedAmountFrom) query = query.gte("amount", debouncedAmountFrom)
      if (debouncedAmountTo) query = query.lte("amount", debouncedAmountTo)

      const { data, error } = await query
        .order(orderColumn, { ascending: false })
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

    let columnMapping: Record<string, string> = {}
    if (recordType === "Debit") {
      columnMapping = {
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
      }
    } else if (recordType === "Credit") {
      columnMapping = {
        created_date: "CREATED DATE",
        date_of_payment: "PAYMENT DATE",
        company_name: "COMPANY NAME",
        beneficiary_name: "PAYER NAME",
        bank_ac_from: "BANK A/C FROM",
        purpose_of_payment: "PURPOSE",
        transaction_type: "TRANSACTION TYPE",
        project: "PROJECT",
        utr_number: "UTR NUMBER",
        particulars: "PARTICULARS",
        amount: "AMOUNT",
        amount_in_words: "AMOUNT IN WORDS",
        entry_done_by: "ENTRY DONE BY",
        checked_by: "CHECKED BY",
        pdf_link: "PDF Link",
      }
    } else if (recordType === "Transfer") {
      columnMapping = {
        created_at: "CREATED DATE",
        date_of_payment: "PAYMENT DATE",
        company_name: "COMPANY NAME",
        bank_ac_from: "BANK A/C FROM",
        bank_ac_to: "BANK A/C TO",
        bank_ac_number_to: "BANK A/C NUMBER TO",
        bank_name_to: "BANK NAME TO",
        ifsc_to: "IFSC TO",
        purpose: "PURPOSE",
        utr_number: "UTR NUMBER",
        particulars: "PARTICULARS",
        amount: "AMOUNT",
        amount_in_words: "AMOUNT IN WORDS",
        approved_by: "APPROVED BY",
        transaction_type: "TRANSACTION TYPE",
        pdf_link: "PDF Link",
      }
    }

    const dataToExport = allData.map((voucher) => {
      const row: any = {}
      Object.entries(columnMapping).forEach(([key, label]) => {
        let value = voucher[key]
        if ((key === "created_date" || key === "created_at") && value) {
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

    const maxWidths = dataToExport.reduce((acc: any, row: any) => {
      Object.keys(row).forEach((key, i) => {
        const value = String(row[key])
        acc[i] = Math.max(acc[i] || 0, value.length, key.length)
      })
      return acc
    }, [])
    worksheet["!cols"] = maxWidths.map((w: number) => ({ wch: w + 2 }))

    XLSX.writeFile(workbook, `Vouchers_Full_History_${new Date().toISOString().split('T')[0]}.xlsx`)
  } catch (error) {
    console.error("Excel Export Error:", error)
    alert("Failed to export Excel file")
  } finally {
    setIsExporting(false)
  }
}

export const generateSummaryPDF = async (options: ExportSummaryOptions) => {
  const {
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
    setIsRefetching,
  } = options

  try {
    setIsRefetching(true)
    const { jsPDF } = await import("jspdf")
    const { default: autoTable } = await import("jspdf-autotable")

    const fetchAllData = async (table: "History" | "Credit" | "Contra") => {
      let searchFilter = null
      if (debouncedSearchTerm) {
        if (table === "History") {
          searchFilter = `voucher_no.ilike.%${debouncedSearchTerm}%,beneficiary_name.ilike.%${debouncedSearchTerm}%,project.ilike.%${debouncedSearchTerm}%,purpose_of_payment.ilike.%${debouncedSearchTerm}%,company_name.ilike.%${debouncedSearchTerm}%`
        } else if (table === "Credit") {
          searchFilter = `beneficiary_name.ilike.%${debouncedSearchTerm}%,company_name.ilike.%${debouncedSearchTerm}%,purpose_of_payment.ilike.%${debouncedSearchTerm}%,utr_number.ilike.%${debouncedSearchTerm}%`
        } else if (table === "Contra") {
          searchFilter = `company_name.ilike.%${debouncedSearchTerm}%,purpose.ilike.%${debouncedSearchTerm}%,utr_number.ilike.%${debouncedSearchTerm}%`
        }
      }

      let allData: any[] = []
      let from = 0
      const limit = 1000
      let hasMore = true

      while (hasMore) {
        let query = supabase.from(table).select("*")
        if (searchFilter) query = query.or(searchFilter)
        if (selectedCompany !== "all") query = query.eq("company_name", selectedCompany)
        if (table === "History" || table === "Credit") {
          if (selectedProject !== "all") query = query.eq("project", selectedProject)
          if (selectedPurpose !== "all") query = query.eq("purpose_of_payment", selectedPurpose)
          if (selectedTransactionType !== "all") query = query.eq("transaction_type", selectedTransactionType)
          if (selectedName !== "all") query = query.eq("beneficiary_name", selectedName)
        } else if (table === "Contra") {
          if (selectedPurpose !== "all") query = query.eq("purpose", selectedPurpose)
          if (selectedTransactionType !== "all") query = query.eq("transaction_type", selectedTransactionType)
          if (selectedName !== "all") query = query.eq("bank_ac_to", selectedName)
        }
        if (dateFrom) query = query.gte("date_of_payment", dateFrom)
        if (dateTo) query = query.lte("date_of_payment", dateTo)
        if (debouncedAmountFrom) query = query.gte("amount", debouncedAmountFrom)
        if (debouncedAmountTo) query = query.lte("amount", debouncedAmountTo)

        const orderColumn = (table === "Contra") ? "created_at" : "created_date"
        const { data, error } = await query
          .order(orderColumn, { ascending: false })
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
      return allData
    }

    if (recordType === "Transfer") {
      const contraData = await fetchAllData("Contra")
      const doc = new jsPDF("l", "mm", "a4")
      const pageWidth = 297
      const pageHeight = 210

      const rowsPerPage = 28
      const totalPages = Math.ceil(contraData.length / rowsPerPage) || 1
      const contraTotal = contraData.reduce((sum, d) => sum + (Number(d.amount) || 0), 0)

      for (let p = 0; p < totalPages; p++) {
        if (p > 0) doc.addPage()

        doc.setFont("helvetica", "bold")
        doc.setFontSize(18)
        doc.setTextColor(0, 0, 0)
        doc.text("CONTRA SUMMARY REPORT", pageWidth / 2, 12, { align: "center" })
        doc.setFontSize(10)
        doc.text(`Page ${p + 1} of ${totalPages}`, pageWidth - 20, 10, { align: "right" })

        const fromDateStr = dateFrom ? formatDate(dateFrom) : "Start"
        const toDateStr = dateTo ? formatDate(dateTo) : "End"
        const dateHeaderRange = `From Date: ${fromDateStr}     To Date: ${toDateStr}`
        
        doc.setFont("helvetica", "normal")
        doc.setFontSize(10)
        doc.text(dateHeaderRange, pageWidth / 2, 19, { align: "center" })

        const slice = contraData.slice(p * rowsPerPage, (p + 1) * rowsPerPage)
        const isLastPage = p === totalPages - 1

        const body: any[] = slice.map((d, i) => [
          p * rowsPerPage + i + 1,
          d.company_name || "",
          d.bank_ac_from || "",
          d.bank_ac_to || "",
          d.purpose || "",
          formatDate(d.date_of_payment || d.created_at || ""),
          { content: Number(d.amount).toLocaleString("en-IN"), styles: { halign: 'right' } }
        ])

        if (isLastPage) {
          body.push([
            { content: "TOTAL", colSpan: 6, styles: { fontStyle: 'bold' as any, fillColor: [204, 251, 241], textColor: [15, 118, 110] } },
            { content: contraTotal.toLocaleString("en-IN"), styles: { fontStyle: 'bold' as any, halign: 'right', fillColor: [204, 251, 241], textColor: [15, 118, 110] } }
          ])
        }

        autoTable(doc, {
          startY: 30,
          head: [['S.N.', 'Company Name', 'Bank A/C From', 'Bank A/C To', 'Purpose', 'Date', 'Amount']],
          body: body,
          margin: { left: 15, right: 15 },
          theme: 'grid',
          styles: { fontSize: 7, cellPadding: 2, lineWidth: 0.1 },
          headStyles: { fillColor: [15, 118, 110], textColor: 255 },
          columnStyles: {
            0: { cellWidth: 15 },
            1: { cellWidth: 50 },
            2: { cellWidth: 45 },
            3: { cellWidth: 45 },
            4: { cellWidth: 50 },
            5: { cellWidth: 27 },
            6: { cellWidth: 35, halign: 'right' }
          }
        })
      }
      doc.save(`Contra_Summary_${new Date().toISOString().split('T')[0]}.pdf`)
      return
    }

    const [debitData, creditData] = await Promise.all([
      fetchAllData("History"),
      fetchAllData("Credit")
    ])

    const doc = new jsPDF("l", "mm", "a4")
    const pageWidth = 297
    const pageHeight = 210

    const rowsPerPage = 28
    const totalPages = Math.max(
      Math.ceil(debitData.length / rowsPerPage),
      Math.ceil(creditData.length / rowsPerPage),
      1
    )

    const debitTotal = debitData.reduce((sum, d) => sum + (Number(d.amount) || 0), 0)
    const creditTotal = creditData.reduce((sum, d) => sum + (Number(d.amount) || 0), 0)

    for (let p = 0; p < totalPages; p++) {
      if (p > 0) doc.addPage()

      doc.setFont("helvetica", "bold")
      doc.setFontSize(18)
      doc.setTextColor(0, 0, 0)
      doc.text("VOUCHER SUMMARY REPORT", pageWidth / 2, 12, { align: "center" })
      doc.setFontSize(10)
      doc.text(`Page ${p + 1} of ${totalPages}`, pageWidth - 20, 10, { align: "right" })

      const fromDateStr = dateFrom ? formatDate(dateFrom) : "Start"
      const toDateStr = dateTo ? formatDate(dateTo) : "End"
      const dateHeaderRange = `From Date: ${fromDateStr}     To Date: ${toDateStr}`
      
      doc.setFont("helvetica", "normal")
      doc.setFontSize(10)
      doc.text(dateHeaderRange, pageWidth / 2, 19, { align: "center" })

      const debitSlice = debitData.slice(p * rowsPerPage, (p + 1) * rowsPerPage)
      const creditSlice = creditData.slice(p * rowsPerPage, (p + 1) * rowsPerPage)
      const isLastPage = p === totalPages - 1

      const debitBody: any[] = debitSlice.map((d, i) => [
        p * rowsPerPage + i + 1,
        d.beneficiary_name || "",
        (d.company_name || "").split(" ").slice(0, 2).join(" "),
        formatDate(d.date_of_payment || d.created_date || ""),
        { content: Number(d.amount).toLocaleString("en-IN"), styles: { halign: 'right' } }
      ])

      if (isLastPage) {
        debitBody.push([
          { content: "TOTAL", colSpan: 4, styles: { fontStyle: 'bold' as any, fillColor: [219, 234, 254], textColor: [30, 58, 138] } },
          { content: debitTotal.toLocaleString("en-IN"), styles: { fontStyle: 'bold' as any, halign: 'right', fillColor: [219, 234, 254], textColor: [30, 58, 138] } }
        ])
      }

      autoTable(doc, {
        startY: 30,
        head: [['S.N.', 'Beneficiary Name (Debit)', 'Company Name', 'Date', 'Amount']],
        body: debitBody,
        margin: { left: 6, right: 150 },
        tableWidth: 141,
        theme: 'grid',
        styles: { fontSize: 6, cellPadding: 1.5, lineWidth: 0.1 },
        headStyles: { fillColor: [59, 130, 246], textColor: 255 },
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
          doc.text("Debit Vouchers (Send Payments)", data.settings.margin.left, 28)
        }
      })

      const creditBody: any[] = creditSlice.map((d, i) => [
        p * rowsPerPage + i + 1,
        d.beneficiary_name || "",
        (d.company_name || "").split(" ").slice(0, 2).join(" "),
        formatDate(d.date_of_payment || d.created_date || ""),
        { content: Number(d.amount).toLocaleString("en-IN"), styles: { halign: 'right' } }
      ])

      if (isLastPage) {
        creditBody.push([
          { content: "TOTAL", colSpan: 4, styles: { fontStyle: 'bold' as any, fillColor: [254, 215, 170], textColor: [120, 53, 15] } },
          { content: creditTotal.toLocaleString("en-IN"), styles: { fontStyle: 'bold' as any, halign: 'right', fillColor: [254, 215, 170], textColor: [120, 53, 15] } }
        ])
      }

      autoTable(doc, {
        startY: 30,
        head: [['S.N.', 'Beneficiary Name (Credit)', 'Company Name', 'Date', 'Amount']],
        body: creditBody,
        margin: { left: 150, right: 6 },
        tableWidth: 141,
        theme: 'grid',
        styles: { fontSize: 6, cellPadding: 1.5, lineWidth: 0.1 },
        headStyles: { fillColor: [249, 115, 22], textColor: 255 },
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
          doc.text("Credit Vouchers (Receipt Payments)", data.settings.margin.left, 28)
        }
      })
    }

    doc.save(`Voucher_Summary_${new Date().toISOString().split('T')[0]}.pdf`)
  } catch (error) {
    console.error("PDF Summary Export Error:", error)
    alert("Failed to export summary PDF")
  } finally {
    setIsRefetching(false)
  }
}

export const generateColoredVoucherPDF = async (editVoucher: VoucherData): Promise<{ pdfBlob: Blob; fileName: string }> => {
  const { jsPDF } = await import("jspdf")
  const { default: autoTable } = await import("jspdf-autotable")

  const doc = new jsPDF("p", "mm", "a4")
  const pageWidth = 210
  const pageHeight = 297
  const margin = 10
  let currentY = 15

  const isCredit = editVoucher.recordType === "Credit"
  const isTransfer = editVoucher.recordType === "Transfer"

  const BOLD = "bold" as any

  let colors = {
    primary: [28, 48, 80] as [number, number, number],
    secondary: [90, 120, 150] as [number, number, number],
    accent: [200, 50, 50] as [number, number, number],
    success: [40, 140, 80] as [number, number, number],
    background: {
      light: [248, 248, 248] as [number, number, number],
      blue: [235, 245, 255] as [number, number, number],
      green: [240, 255, 240] as [number, number, number],
      yellow: [255, 252, 220] as [number, number, number],
      amount: [230, 255, 230] as [number, number, number],
    },
    text: {
      primary: [20, 20, 20] as [number, number, number],
      secondary: [60, 60, 60] as [number, number, number],
      muted: [120, 120, 120] as [number, number, number],
    },
    border: {
      primary: [80, 80, 80] as [number, number, number],
      secondary: [150, 150, 150] as [number, number, number],
    },
  }

  if (isCredit) {
    colors = {
      primary: [180, 80, 0] as [number, number, number],
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
      primary: [0, 128, 128] as [number, number, number],
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

  const localFormatDate = (dateString: string | number | Date) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  doc.setDrawColor(...colors.border.primary)
  doc.setLineWidth(2)
  doc.rect(margin, margin, pageWidth - 2 * margin, pageHeight - 2 * margin)

  doc.setFillColor(...colors.background.blue)
  doc.setDrawColor(...colors.border.primary)
  doc.setLineWidth(1)
  doc.rect(margin + 3, currentY, pageWidth - 2 * margin - 6, 22, "FD")

  doc.setFont("helvetica", BOLD)
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

  const activeFields: Array<{ label: string; value: string; section: "blue" | "yellow" | "green" | "light" }> = []

  const addField = (label: string, val: any, section: "blue" | "yellow" | "green" | "light") => {
    if (!val) return
    const strVal = String(val).trim()
    if (strVal !== "" && strVal !== "N/A" && strVal !== "₹0" && strVal !== "₹NaN") {
      activeFields.push({ label, value: strVal, section })
    }
  }

  if (isTransfer) {
    addField("DATE OF PAYMENT", editVoucher.dateOfPaymentProcess ? localFormatDate(editVoucher.dateOfPaymentProcess) : null, "blue")
    addField("TRANSACTION TYPE", editVoucher.transactionType || "Contra", "blue")
    addField("BANK A/C FROM", editVoucher.bankAcFrom, "blue")
    addField("UTR NUMBER", editVoucher.utrNumber, "yellow")
    addField("COMPANY NAME", editVoucher.companyName, "yellow")
    addField("PURPOSE", editVoucher.purposeOfPayment || editVoucher.purpose, "yellow")
    addField("BANK A/C TO", editVoucher.beneficiaryAcName || editVoucher.bank_ac_to, "green")
    addField("ACCOUNT NO TO", editVoucher.beneficiaryAcNumber || editVoucher.bank_ac_number_to, "green")
    addField("BANK NAME TO", editVoucher.beneficiaryBankName || editVoucher.bank_name_to, "light")
    addField("IFSC CODE TO", editVoucher.beneficiaryBankIfsc || editVoucher.ifsc_to, "light")
  } else if (isCredit) {
    addField("CREDIT ID", editVoucher.id, "blue")
    addField("DATE OF PAYMENT", editVoucher.dateOfPaymentProcess ? localFormatDate(editVoucher.dateOfPaymentProcess) : null, "blue")
    addField("TRANSACTION TYPE", editVoucher.transactionType || "Receipt", "blue")
    addField("BANK A/C FROM", editVoucher.bankAcFrom, "yellow")
    addField("COMPANY", editVoucher.companyName, "yellow")
    addField("PURPOSE", editVoucher.purposeOfPayment || editVoucher.purpose, "yellow")
    addField("PROJECT", editVoucher.project, "green")
    addField("PAYER NAME", editVoucher.beneficiaryName, "green")
    addField("UTR NUMBER", editVoucher.utrNumber, "light")
  } else {
    addField("VOUCHER NO", editVoucher.voucherNo, "blue")
    addField("DATE OF PAYMENT", editVoucher.dateOfPaymentProcess ? localFormatDate(editVoucher.dateOfPaymentProcess) : null, "blue")
    addField("TRANSACTION TYPE", editVoucher.transactionType || "Debit", "blue")
    addField("BANK A/C FROM", editVoucher.bankAcFrom, "yellow")
    addField("COMPANY", editVoucher.companyName, "yellow")
    addField("PURPOSE", editVoucher.purposeOfPayment || editVoucher.purpose, "yellow")
    addField("PROJECT", editVoucher.project, "green")
    addField("BENEFICIARY NAME", editVoucher.beneficiaryName, "green")
    addField("PO NUMBER", editVoucher.poNumber, "green")
    addField("BENEFICIARY A/C NAME", editVoucher.beneficiaryAcName, "light")
    addField("BENEFICIARY A/C NO", editVoucher.beneficiaryAcNumber, "light")
    addField("BENEFICIARY BANK NAME", editVoucher.beneficiaryBankName, "light")
    addField("BENEFICIARY BANK IFSC", editVoucher.beneficiaryBankIfsc, "light")
  }

  const voucherInfoData: any[] = []
  for (let i = 0; i < activeFields.length; i += 2) {
    const f1 = activeFields[i]
    const f2 = activeFields[i + 1]

    const row = [
      {
        content: f1.label + ":",
        styles: { fontStyle: BOLD, fillColor: colors.background[f1.section], textColor: colors.primary },
      },
      { content: f1.value, styles: { fillColor: colors.background[f1.section] } },
      f2 ? {
        content: f2.label + ":",
        styles: { fontStyle: BOLD, fillColor: colors.background[f2.section], textColor: colors.primary },
      } : { content: "", styles: { fillColor: colors.background.light } },
      f2 ? { content: f2.value, styles: { fillColor: colors.background[f2.section] } } : { content: "", styles: { fillColor: colors.background.light } }
    ]
    voucherInfoData.push(row)
  }

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
      0: { cellWidth: 32, fontSize: 8 },
      1: { cellWidth: 60 },
      2: { cellWidth: 32, fontSize: 8 },
      3: { cellWidth: 60 },
    },
    didDrawPage: (data) => {
      if (data.cursor && typeof data.cursor.y === "number") {
        currentY = data.cursor.y
      }
    },
  })

  currentY += 8

  const particularsAmountData = [
    [
      {
        content: "PARTICULARS:",
        styles: {
          fontStyle: BOLD,
          fontSize: 10,
          fillColor: colors.background.light,
          textColor: colors.primary,
          halign: "center",
          cellPadding: 5,
        } as any,
      },
      {
        content: "AMOUNT:",
        styles: {
          fontStyle: BOLD,
          fontSize: 10,
          fillColor: colors.background.yellow,
          textColor: colors.primary,
          halign: "center",
          cellPadding: 5,
        } as any,
      },
    ],
    [
      {
        content: editVoucher.particulars || "",
        styles: {
          fontSize: 10,
          minCellHeight: 20,
          valign: "top",
          cellPadding: 6,
          fillColor: [255, 255, 255],
        } as any,
      },
      {
        content: formatCurrency(editVoucher.amount),
        styles: {
          fontSize: 14,
          fontStyle: BOLD,
          fillColor: colors.background.amount,
          textColor: colors.success,
          halign: "center",
          valign: "middle",
          minCellHeight: 20,
          cellPadding: 8,
        } as any,
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

  const amountWordsData = [
    [
      {
        content: `AMOUNT IN WORDS: ${editVoucher.amountInWords || ""}`,
        styles: {
          fontSize: 11,
          fontStyle: BOLD,
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

  const signatureData = isTransfer
    ? [
        [
          {
            content: "APPROVED BY",
            styles: {
              fontStyle: BOLD,
              fontSize: 10,
              fillColor: colors.background.green,
              textColor: colors.primary,
              halign: "center",
              cellPadding: 5,
            } as any,
          },
        ],
        [
          { content: "", styles: { minCellHeight: 15, fillColor: [245, 255, 245] } as any },
        ],
        [
          {
            content: editVoucher.approvedBy || "",
            styles: {
              fontStyle: BOLD,
              fontSize: 9,
              halign: "center",
              fillColor: colors.background.green,
              textColor: colors.primary,
              cellPadding: 4,
            } as any,
          },
        ],
      ]
    : isCredit
    ? [
        [
          {
            content: "ENTRY DONE BY",
            styles: {
              fontStyle: BOLD,
              fontSize: 10,
              fillColor: colors.background.blue,
              textColor: colors.primary,
              halign: "center",
              cellPadding: 5,
            } as any,
          },
          {
            content: "CHECKED BY",
            styles: {
              fontStyle: BOLD,
              fontSize: 10,
              fillColor: colors.background.yellow,
              textColor: colors.primary,
              halign: "center",
              cellPadding: 5,
            } as any,
          },
        ],
        [
          { content: "", styles: { minCellHeight: 15, fillColor: [245, 245, 255] } as any },
          { content: "", styles: { minCellHeight: 15, fillColor: [255, 255, 245] } as any },
        ],
        [
          {
            content: editVoucher.entryDoneBy || "",
            styles: {
              fontStyle: BOLD,
              fontSize: 9,
              halign: "center",
              fillColor: colors.background.blue,
              textColor: colors.primary,
              cellPadding: 4,
            } as any,
          },
          {
            content: editVoucher.checkedBy || "",
            styles: {
              fontStyle: BOLD,
              fontSize: 9,
              halign: "center",
              fillColor: colors.background.yellow,
              textColor: colors.primary,
              cellPadding: 4,
            } as any,
          },
        ],
      ]
    : [
        [
          {
            content: "ENTRY DONE BY",
            styles: {
              fontStyle: BOLD,
              fontSize: 10,
              fillColor: colors.background.blue,
              textColor: colors.primary,
              halign: "center",
              cellPadding: 5,
            } as any,
          },
          {
            content: "CHECKED BY",
            styles: {
              fontStyle: BOLD,
              fontSize: 10,
              fillColor: colors.background.yellow,
              textColor: colors.primary,
              halign: "center",
              cellPadding: 5,
            } as any,
          },
          {
            content: "APPROVED BY",
            styles: {
              fontStyle: BOLD,
              fontSize: 10,
              fillColor: colors.background.green,
              textColor: colors.primary,
              halign: "center",
              cellPadding: 5,
            } as any,
          },
        ],
        [
          { content: "", styles: { minCellHeight: 15, fillColor: [250, 250, 255] } as any },
          { content: "", styles: { minCellHeight: 15, fillColor: [255, 255, 240] } as any },
          { content: "", styles: { minCellHeight: 15, fillColor: [245, 255, 245] } as any },
        ],
        [
          {
            content: editVoucher.entryDoneBy || "",
            styles: {
              fontStyle: BOLD,
              fontSize: 9,
              halign: "center",
              fillColor: colors.background.blue,
              textColor: colors.primary,
              cellPadding: 4,
            } as any,
          },
          {
            content: editVoucher.checkedBy || "",
            styles: {
              fontStyle: BOLD,
              fontSize: 9,
              halign: "center",
              fillColor: colors.background.yellow,
              textColor: colors.primary,
              cellPadding: 4,
            } as any,
          },
          {
            content: editVoucher.approvedBy || "",
            styles: {
              fontStyle: BOLD,
              fontSize: 9,
              halign: "center",
              fillColor: colors.background.green,
              textColor: colors.primary,
              cellPadding: 4,
            } as any,
          },
        ],
      ]

  autoTable(doc, {
    startY: currentY,
    body: signatureData,
    margin: isTransfer
      ? { left: (pageWidth - 70) / 2 }
      : isCredit
      ? { left: (pageWidth - 130) / 2 }
      : { left: margin + 3, right: margin + 3 },
    tableWidth: isTransfer ? 70 : isCredit ? 130 : pageWidth - 2 * margin - 6,
    styles: {
      cellPadding: 3,
      lineColor: colors.border.primary,
      lineWidth: 0.8,
      textColor: colors.text.primary,
      font: "helvetica",
    },
    columnStyles: isTransfer
      ? { 0: { cellWidth: 70 } }
      : isCredit
      ? {
          0: { cellWidth: 65 },
          1: { cellWidth: 65 },
        }
      : {
          0: { cellWidth: (pageWidth - 2 * margin - 6) / 3 },
          1: { cellWidth: (pageWidth - 2 * margin - 6) / 3 },
          2: { cellWidth: (pageWidth - 2 * margin - 6) / 3 },
        },
    didDrawCell: (data) => {
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
      if (data.cursor) {
        currentY = data.cursor.y
      }
    },
  })

  currentY += 15

  doc.setFillColor(...colors.background.light)
  doc.setDrawColor(...colors.accent)
  doc.setLineWidth(0.5)
  doc.rect(margin + 3, currentY, pageWidth - 2 * margin - 6, 12, "FD")

  doc.setFont("helvetica", BOLD)
  doc.setFontSize(8)
  doc.setTextColor(...colors.primary)
  doc.text(`Generated on: ${new Date().toLocaleString("en-IN")}`, pageWidth / 2, currentY + 5, { align: "center" })

  doc.setFont("helvetica", "normal")
  doc.setFontSize(7)
  doc.setTextColor(...colors.secondary)
  doc.text("This is a computer generated voucher", pageWidth / 2, currentY + 9, { align: "center" })

  doc.setDrawColor(...colors.accent)
  doc.setLineWidth(2)
  doc.line(margin + 8, currentY + 11, pageWidth - margin - 8, currentY + 11)

  const pdfOutput = doc.output("datauristring")
  const pdfBase64 = pdfOutput.split(",")[1]

  const fileName = `Voucher_${editVoucher.voucherNo}_${Date.now()}.pdf`

  const byteCharacters = atob(pdfBase64)
  const byteNumbers = new Array(byteCharacters.length)
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i)
  }
  const byteArray = new Uint8Array(byteNumbers)
  const pdfBlob = new Blob([byteArray], { type: "application/pdf" })

  return { pdfBlob, fileName }
}
