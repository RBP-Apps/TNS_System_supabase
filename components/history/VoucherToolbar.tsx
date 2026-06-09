import React from "react"
import { ArrowUpRight, ArrowDownLeft, RefreshCw, FileText, FileSpreadsheet, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface VoucherToolbarProps {
  recordType: "Debit" | "Credit" | "Transfer"
  setRecordType: (type: "Debit" | "Credit" | "Transfer") => void
  generateSummaryPDF: () => void
  handleExportToExcel: () => void
  isExporting: boolean
}

export const VoucherToolbar: React.FC<VoucherToolbarProps> = ({
  recordType,
  setRecordType,
  generateSummaryPDF,
  handleExportToExcel,
  isExporting,
}) => {
  return (
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
  )
}
