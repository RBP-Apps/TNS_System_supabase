
import React, { useState } from "react"
import {
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  FileText,
  FileSpreadsheet,
  Loader2,
  Download,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"

interface VoucherToolbarProps {
  recordType: "Debit" | "Credit" | "Transfer"
  setRecordType: (type: "Debit" | "Credit" | "Transfer") => void
  generateSummaryPDF: () => void
  generatePDFDownload2?: () => void
  generatePDFDownload3?: () => void
  handleExportToExcel: () => void
  isExporting: boolean
  isExportingPDF2?: boolean
  isExportingPDF3?: boolean
}

export const VoucherToolbar: React.FC<VoucherToolbarProps> = ({
  recordType,
  setRecordType,
  generateSummaryPDF,
  generatePDFDownload2,
  generatePDFDownload3,
  handleExportToExcel,
  isExporting,
  isExportingPDF2 = false,
  isExportingPDF3 = false,
}) => {

  const [showPDFModal, setShowPDFModal] = useState(false)

  return (
    <>
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">

        {/* Left: Tab Selectors */}
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
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto justify-end">

          {/* Download PDF Button */}
          <Button
            onClick={() => setShowPDFModal(true)}
            variant="outline"
            size="sm"
            className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100 h-10 px-4 rounded-xl font-bold flex items-center gap-2 transition-all duration-200"
          >
            <FileText className="h-4 w-4" />
            Download PDF
          </Button>

          {/* Export Excel */}
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
              text-sm flex items-center gap-2
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

      {/* PDF Download Modal */}
      {showPDFModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setShowPDFModal(false)}
        >

          <div
            className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >

            {/* Modal Header */}
            <div className="bg-gradient-to-r from-red-600 to-rose-500 px-6 py-5 text-white">

              <div className="flex items-center justify-between">

                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-xl bg-white/20 flex items-center justify-center">
                    <FileText className="h-6 w-6" />
                  </div>

                  <div>
                    <h2 className="text-lg font-bold">
                      Download PDF
                    </h2>
                    <p className="text-xs text-red-100 mt-1">
                      Select your preferred PDF format
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowPDFModal(false)}
                  className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors"
                  aria-label="Close modal"
                >
                  <X className="h-5 w-5" />
                </button>

              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-3">

              {/* PDF 1 */}
              <button
                onClick={() => {
                  setShowPDFModal(false)
                  generateSummaryPDF()
                }}
                className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-red-300 hover:bg-red-50/50 transition-all duration-200 group text-left"
              >
                <div className="flex items-center gap-3">

                  <div className="h-11 w-11 rounded-xl bg-red-100 text-red-600 flex items-center justify-center group-hover:bg-red-200 transition-colors">
                    <FileText className="h-5 w-5" />
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">
                      PDF Download 1
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Download PDF format Gaurav
                    </p>
                  </div>

                </div>

                <Download className="h-5 w-5 text-slate-400 group-hover:text-red-600" />
              </button>

              {/* PDF 2 */}
              <button
                onClick={() => {
                  if (generatePDFDownload2) {
                    setShowPDFModal(false)
                    generatePDFDownload2()
                  }
                }}
                disabled={!generatePDFDownload2 || isExportingPDF2}
                className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-red-300 hover:bg-red-50/50 transition-all duration-200 group text-left disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-3">

                  <div className="h-11 w-11 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                    {isExportingPDF2 ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <FileText className="h-5 w-5" />
                    )}
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">
                      PDF Download 2
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {isExportingPDF2 ? "Generating PDF..." : "Download PDF format Bajaj"}
                    </p>
                  </div>

                </div>

                {isExportingPDF2 ? (
                  <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
                ) : (
                  <Download className="h-5 w-5 text-slate-400 group-hover:text-red-600" />
                )}
              </button>

              {/* PDF 3 */}
              <button
                onClick={() => {
                  if (generatePDFDownload3) {
                    setShowPDFModal(false)
                    generatePDFDownload3()
                  }
                }}
                disabled={!generatePDFDownload3 || isExportingPDF3}
                className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-red-300 hover:bg-red-50/50 transition-all duration-200 group text-left disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-3">

                  <div className="h-11 w-11 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center group-hover:bg-rose-200 transition-colors">
                    {isExportingPDF3 ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <FileText className="h-5 w-5" />
                    )}
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">
                      PDF Download 3
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {isExportingPDF3 ? "Generating PDF..." : "Download PDF format Spriha"}
                    </p>
                  </div>

                </div>

                {isExportingPDF3 ? (
                  <Loader2 className="h-5 w-5 animate-spin text-rose-500" />
                ) : (
                  <Download className="h-5 w-5 text-slate-400 group-hover:text-red-600" />
                )}
              </button>

            </div>

            {/* Modal Footer */}
            <div className="px-6 pb-5">
              <Button
                onClick={() => setShowPDFModal(false)}
                variant="outline"
                className="w-full h-10 rounded-xl font-semibold"
              >
                Cancel
              </Button>
            </div>

          </div>
        </div>
      )}
    </>
  )
}
