import React, { useRef, useEffect, useMemo } from "react"
import {
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Download, Loader2, Trash2, FileText } from "lucide-react"
import { VoucherData } from "@/lib/voucher-exports"
import { useVirtual } from "@/hooks/useVirtual"

interface VoucherTableProps {
  recordType: "Debit" | "Credit" | "Transfer"
  filteredVouchers: VoucherData[]
  downloadPDF: (voucher: VoucherData) => void
  openEditModal: (voucher: VoucherData) => void
  deleteVoucher: (id: string) => Promise<void>
  deletingVoucherId: string | null
  loading: boolean
  userRole: string
}

export const VoucherTable: React.FC<VoucherTableProps> = ({
  recordType,
  filteredVouchers,
  downloadPDF,
  openEditModal,
  deleteVoucher,
  deletingVoucherId,
  loading,
  userRole,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)

  const { startIndex, endIndex, topSpacerHeight, bottomSpacerHeight } = useVirtual(
    containerRef,
    {
      itemCount: filteredVouchers.length,
      itemHeight: 52,
      overscan: 15,
    }
  )

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0
    }
  }, [recordType, filteredVouchers.length])

  const visibleVouchers = useMemo(() => {
    return filteredVouchers.slice(startIndex, endIndex + 1)
  }, [filteredVouchers, startIndex, endIndex])

  const colSpanVal = useMemo(() => {
    let baseCols = 0
    if (recordType === "Debit") baseCols = 21
    else if (recordType === "Credit") baseCols = 14
    else if (recordType === "Transfer") baseCols = 15

    const adminExtra = userRole === "admin" ? 2 : 0
    return 1 + 1 + adminExtra + baseCols // S.N. + View + adminExtra + baseCols
  }, [recordType, userRole])

  return (
    <div className="hidden sm:block w-full">
      <div className="overflow-x-auto w-full border rounded-lg">
        <div
          ref={containerRef}
          className="h-[500px] max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
        >
          <table className="w-full caption-bottom text-sm border-collapse relative">
            <TableHeader className="sticky top-0 bg-slate-100 z-10">
              <TableRow>
                <TableHead className="font-semibold text-xs lg:text-sm">S.N.</TableHead>
                <TableHead className="font-semibold text-center text-xs lg:text-sm">View</TableHead>
                {userRole === "admin" && (
                  <TableHead className="font-semibold text-center text-xs lg:text-sm">Edit</TableHead>
                )}
                {recordType === "Debit" && (
                  <>
                    <TableHead className="font-semibold text-xs lg:text-sm">Voucher No.</TableHead>
                    <TableHead className="font-semibold text-xs lg:text-sm">Created Date</TableHead>
                    <TableHead className="font-semibold text-xs lg:text-sm">Voucher Date</TableHead>
                    <TableHead className="font-semibold text-xs lg:text-sm">Company</TableHead>
                    <TableHead className="font-semibold text-xs lg:text-sm">Bank AC From</TableHead>
                    <TableHead className="font-semibold text-xs lg:text-sm">Beneficiary Name</TableHead>
                    <TableHead className="font-semibold text-xs lg:text-sm">PO Number</TableHead>
                    <TableHead className="font-semibold text-xs lg:text-sm">UTR Number</TableHead>
                    <TableHead className="font-semibold text-xs lg:text-sm">Beneficiary A/C Name</TableHead>
                    <TableHead className="font-semibold text-xs lg:text-sm">Beneficiary A/C Number</TableHead>
                    <TableHead className="font-semibold text-xs lg:text-sm">Beneficiary Bank Name</TableHead>
                    <TableHead className="font-semibold text-xs lg:text-sm">Beneficiary Bank IFSC</TableHead>
                    <TableHead className="font-semibold text-xs lg:text-sm">Purpose</TableHead>
                    <TableHead className="font-semibold text-xs lg:text-sm">Project</TableHead>
                    <TableHead className="font-semibold text-xs lg:text-sm">Particulars</TableHead>
                    <TableHead className="text-right font-semibold text-xs lg:text-sm">Amount</TableHead>
                    <TableHead className="font-semibold text-xs lg:text-sm">Transaction Type</TableHead>
                    <TableHead className="font-semibold text-xs lg:text-sm">Entry Done By</TableHead>
                    <TableHead className="font-semibold text-xs lg:text-sm">Checked By</TableHead>
                    <TableHead className="font-semibold text-xs lg:text-sm">Approved By</TableHead>
                    <TableHead className="font-semibold text-center text-xs lg:text-sm">Name</TableHead>
                  </>
                )}
                {recordType === "Credit" && (
                  <>
                    <TableHead className="font-semibold text-xs lg:text-sm">ID</TableHead>
                    <TableHead className="font-semibold text-xs lg:text-sm">Created Date</TableHead>
                    <TableHead className="font-semibold text-xs lg:text-sm">Payment Date</TableHead>
                    <TableHead className="font-semibold text-xs lg:text-sm">Company Name</TableHead>
                    <TableHead className="font-semibold text-xs lg:text-sm">Payer Name</TableHead>
                    <TableHead className="font-semibold text-xs lg:text-sm">Bank A/C From</TableHead>
                    <TableHead className="font-semibold text-xs lg:text-sm">Purpose</TableHead>
                    <TableHead className="font-semibold text-xs lg:text-sm">Project</TableHead>
                    <TableHead className="font-semibold text-xs lg:text-sm">UTR Number</TableHead>
                    <TableHead className="font-semibold text-xs lg:text-sm">Particulars</TableHead>
                    <TableHead className="text-right font-semibold text-xs lg:text-sm">Amount</TableHead>
                    <TableHead className="font-semibold text-xs lg:text-sm">Transaction Type</TableHead>
                    <TableHead className="font-semibold text-xs lg:text-sm">Entry Done By</TableHead>
                    <TableHead className="font-semibold text-xs lg:text-sm">Checked By</TableHead>
                  </>
                )}
                {recordType === "Transfer" && (
                  <>
                    <TableHead className="font-semibold text-xs lg:text-sm">ID</TableHead>
                    <TableHead className="font-semibold text-xs lg:text-sm">Created Date</TableHead>
                    <TableHead className="font-semibold text-xs lg:text-sm">Payment Date</TableHead>
                    <TableHead className="font-semibold text-xs lg:text-sm">Company Name</TableHead>
                    <TableHead className="font-semibold text-xs lg:text-sm">Bank A/C From</TableHead>
                    <TableHead className="font-semibold text-xs lg:text-sm">Bank A/C To</TableHead>
                    <TableHead className="font-semibold text-xs lg:text-sm">Bank A/C Number To</TableHead>
                    <TableHead className="font-semibold text-xs lg:text-sm">Bank Name To</TableHead>
                    <TableHead className="font-semibold text-xs lg:text-sm">IFSC To</TableHead>
                    <TableHead className="font-semibold text-xs lg:text-sm">Purpose</TableHead>
                    <TableHead className="font-semibold text-xs lg:text-sm">UTR Number</TableHead>
                    <TableHead className="font-semibold text-xs lg:text-sm">Particulars</TableHead>
                    <TableHead className="text-right font-semibold text-xs lg:text-sm">Amount</TableHead>
                    <TableHead className="font-semibold text-xs lg:text-sm">Transaction Type</TableHead>
                    <TableHead className="font-semibold text-xs lg:text-sm">Approved By</TableHead>
                  </>
                )}
                {userRole === "admin" && (
                  <TableHead className="font-semibold text-center text-xs lg:text-sm">Delete</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {topSpacerHeight > 0 && (
                <tr>
                  <td colSpan={colSpanVal} style={{ height: topSpacerHeight, padding: 0, border: 0 }} />
                </tr>
              )}
              {visibleVouchers.map((voucher, index) => {
                const actualIndex = startIndex + index
                return (
                  <TableRow
                    key={voucher.id}
                    className={`${actualIndex % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-blue-50 transition-colors`}
                  >
                    <TableCell className="text-xs lg:text-sm font-medium text-slate-500">
                      {actualIndex + 1}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center space-x-1 lg:space-x-2">
                        <Button
                          type="button"
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
                            type="button"
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
                    {recordType === "Debit" && (
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
                        <TableCell className="min-w-[120px] max-w-[200px] break-words whitespace-normal">
                          <Badge variant="outline" className="text-xs whitespace-normal text-left">
                            {voucher.companyName}
                          </Badge>
                        </TableCell>
                        <TableCell className="min-w-[120px] max-w-[200px] break-words whitespace-normal text-xs lg:text-sm">
                          {voucher.bankAcFrom}
                        </TableCell>
                        <TableCell className="min-w-[120px] max-w-[200px] break-words whitespace-normal text-xs lg:text-sm">
                          {voucher.beneficiaryName}
                        </TableCell>
                        <TableCell className="text-xs lg:text-sm">
                          {voucher.poNumber}
                        </TableCell>
                        <TableCell className="text-xs lg:text-sm">
                          {voucher.utrNumber}
                        </TableCell>
                        <TableCell className="min-w-[120px] max-w-[200px] break-words whitespace-normal text-xs lg:text-sm">
                          {voucher.beneficiaryAcName}
                        </TableCell>
                        <TableCell className="text-xs lg:text-sm">
                          {voucher.beneficiaryAcNumber}
                        </TableCell>
                        <TableCell className="min-w-[120px] max-w-[200px] break-words whitespace-normal text-xs lg:text-sm">
                          {voucher.beneficiaryBankName}
                        </TableCell>
                        <TableCell className="text-xs lg:text-sm">
                          {voucher.beneficiaryBankIfsc}
                        </TableCell>
                        <TableCell className="min-w-[120px] max-w-[200px] break-words whitespace-normal text-xs lg:text-sm">
                          {voucher.purposeOfPayment}
                        </TableCell>
                        <TableCell className="min-w-[100px] max-w-[180px] break-words whitespace-normal text-xs lg:text-sm">
                          {voucher.project}
                        </TableCell>
                        <TableCell className="min-w-[150px] max-w-[250px] break-words whitespace-normal text-xs lg:text-sm">
                          {voucher.particulars}
                        </TableCell>
                        <TableCell className="text-right font-bold text-green-600 text-xs lg:text-sm">
                          ₹{Number.parseFloat(voucher.amount).toLocaleString("en-IN")}
                        </TableCell>
                        <TableCell className="text-xs lg:text-sm">
                          {voucher.transactionType}
                        </TableCell>
                        <TableCell className="text-xs lg:text-sm">
                          {voucher.entryDoneBy}
                        </TableCell>
                        <TableCell className="text-xs lg:text-sm">
                          {voucher.checkedBy}
                        </TableCell>
                        <TableCell className="text-xs lg:text-sm">
                          {voucher.approvedBy}
                        </TableCell>
                        <TableCell className="text-center text-xs lg:text-sm">
                          {voucher.name}
                        </TableCell>
                      </>
                    )}
                    {recordType === "Credit" && (
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
                        <TableCell className="text-xs lg:text-sm font-medium">
                          {voucher.beneficiaryName}
                        </TableCell>
                        <TableCell className="text-xs lg:text-sm">
                          {voucher.bankAcFrom}
                        </TableCell>
                        <TableCell className="min-w-[120px] max-w-[200px] break-words whitespace-normal text-xs lg:text-sm">
                          {voucher.purposeOfPayment}
                        </TableCell>
                        <TableCell className="min-w-[100px] max-w-[180px] break-words whitespace-normal text-xs lg:text-sm">
                          {voucher.project}
                        </TableCell>
                        <TableCell className="text-xs lg:text-sm">
                          {voucher.utrNumber}
                        </TableCell>
                        <TableCell className="min-w-[150px] max-w-[250px] break-words whitespace-normal text-xs lg:text-sm">
                          {voucher.particulars}
                        </TableCell>
                        <TableCell className="text-right font-bold text-green-600 text-xs lg:text-sm">
                          ₹{Number.parseFloat(voucher.amount).toLocaleString("en-IN")}
                        </TableCell>
                        <TableCell className="text-xs lg:text-sm font-medium text-orange-600">
                          {voucher.transactionType}
                        </TableCell>
                        <TableCell className="text-xs lg:text-sm">
                          {voucher.entryDoneBy}
                        </TableCell>
                        <TableCell className="text-xs lg:text-sm">
                          {voucher.checkedBy}
                        </TableCell>
                      </>
                    )}
                    {recordType === "Transfer" && (
                      <>
                        <TableCell className="font-medium text-teal-600 text-xs lg:text-sm">
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
                          {voucher.bankAcFrom}
                        </TableCell>
                        <TableCell className="text-xs lg:text-sm font-medium">
                          {voucher.beneficiaryAcName}
                        </TableCell>
                        <TableCell className="text-xs lg:text-sm">
                          {voucher.beneficiaryAcNumber}
                        </TableCell>
                        <TableCell className="text-xs lg:text-sm">
                          {voucher.beneficiaryBankName}
                        </TableCell>
                        <TableCell className="text-xs lg:text-sm">
                          {voucher.beneficiaryBankIfsc}
                        </TableCell>
                        <TableCell className="min-w-[120px] max-w-[200px] break-words whitespace-normal text-xs lg:text-sm">
                          {voucher.purposeOfPayment}
                        </TableCell>
                        <TableCell className="text-xs lg:text-sm">
                          {voucher.utrNumber}
                        </TableCell>
                        <TableCell className="min-w-[150px] max-w-[250px] break-words whitespace-normal text-xs lg:text-sm">
                          {voucher.particulars}
                        </TableCell>
                        <TableCell className="text-right font-bold text-green-600 text-xs lg:text-sm">
                          ₹{Number.parseFloat(voucher.amount).toLocaleString("en-IN")}
                        </TableCell>
                        <TableCell className="text-xs lg:text-sm font-medium text-teal-600">
                          {voucher.transactionType}
                        </TableCell>
                        <TableCell className="text-xs lg:text-sm">
                          {voucher.approvedBy}
                        </TableCell>
                      </>
                    )}
                    {userRole.toLowerCase() === "admin" && (
                      <TableCell>
                        <div className="flex justify-center space-x-1 lg:space-x-2">
                          <Button
                            type="button"
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
                )
              })}
              {bottomSpacerHeight > 0 && (
                <tr>
                  <td colSpan={colSpanVal} style={{ height: bottomSpacerHeight, padding: 0, border: 0 }} />
                </tr>
              )}
              {filteredVouchers.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={colSpanVal}
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
  )
}
