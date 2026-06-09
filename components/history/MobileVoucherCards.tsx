import React, { useRef, useEffect, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Download, FileText } from "lucide-react"
import { VoucherData } from "@/lib/voucher-exports"
import { useVirtual } from "@/hooks/useVirtual"

interface MobileVoucherCardsProps {
  filteredVouchers: VoucherData[]
  downloadPDF: (voucher: VoucherData) => void
  openEditModal: (voucher: VoucherData) => void
  userRole: string
}

export const MobileVoucherCards: React.FC<MobileVoucherCardsProps> = ({
  filteredVouchers,
  downloadPDF,
  openEditModal,
  userRole,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)

  const { startIndex, endIndex, topSpacerHeight, bottomSpacerHeight } = useVirtual(
    containerRef,
    {
      itemCount: filteredVouchers.length,
      itemHeight: 236,
      overscan: 5,
    }
  )

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0
    }
  }, [filteredVouchers.length])

  const visibleVouchers = useMemo(() => {
    return filteredVouchers.slice(startIndex, endIndex + 1)
  }, [filteredVouchers, startIndex, endIndex])

  return (
    <div className="block sm:hidden">
      <div
        ref={containerRef}
        className="h-[500px] max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
      >
        <div className="space-y-3 p-3">
          {topSpacerHeight > 0 && (
            <div style={{ height: topSpacerHeight }} />
          )}
          {visibleVouchers.map((voucher) => (
            <Card key={voucher.id} className="p-4 shadow-sm border hover:bg-gray-50 transition-colors">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className={`font-bold text-sm ${
                      voucher.recordType === "Debit"
                        ? "text-blue-600"
                        : voucher.recordType === "Credit"
                        ? "text-orange-600"
                        : "text-teal-600"
                    }`}>
                      {voucher.recordType === "Debit"
                        ? `Voucher No: ${voucher.voucherNo}`
                        : `Voucher ID: ${voucher.id}`}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(voucher.timestamp).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-xs font-semibold ${
                      voucher.recordType === "Debit"
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : voucher.recordType === "Credit"
                        ? "bg-orange-50 text-orange-700 border-orange-200"
                        : "bg-teal-50 text-teal-700 border-teal-200"
                    }`}
                  >
                    {voucher.transactionType}
                  </Badge>
                </div>
                <div className="space-y-1">
                  {voucher.recordType === "Debit" && (
                    <>
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
                    </>
                  )}
                  {voucher.recordType === "Credit" && (
                    <>
                      <p className="text-sm">
                        <strong>Company Name:</strong> <span className="text-xs">{voucher.companyName}</span>
                      </p>
                      <p className="text-sm">
                        <strong>Payer Name:</strong> <span className="text-xs">{voucher.beneficiaryName}</span>
                      </p>
                      <p className="text-sm">
                        <strong>Bank A/C From:</strong> <span className="text-xs">{voucher.bankAcFrom}</span>
                      </p>
                      <p className="text-sm">
                        <strong>Purpose:</strong> <span className="text-xs">{voucher.purposeOfPayment}</span>
                      </p>
                      <p className="text-sm">
                        <strong>Project:</strong> <span className="text-xs">{voucher.project}</span>
                      </p>
                      <p className="text-sm">
                        <strong>UTR Number:</strong> <span className="text-xs">{voucher.utrNumber}</span>
                      </p>
                    </>
                  )}
                  {voucher.recordType === "Transfer" && (
                    <>
                      <p className="text-sm">
                        <strong>Company Name:</strong> <span className="text-xs">{voucher.companyName}</span>
                      </p>
                      <p className="text-sm">
                        <strong>Bank A/C From:</strong> <span className="text-xs">{voucher.bankAcFrom}</span>
                      </p>
                      <p className="text-sm">
                        <strong>Bank A/C To:</strong> <span className="text-xs">{voucher.beneficiaryAcName}</span>
                      </p>
                      <p className="text-sm">
                        <strong>Bank A/C Number To:</strong> <span className="text-xs">{voucher.beneficiaryAcNumber}</span>
                      </p>
                      <p className="text-sm">
                        <strong>Bank Name To:</strong> <span className="text-xs">{voucher.beneficiaryBankName}</span>
                      </p>
                      <p className="text-sm">
                        <strong>IFSC To:</strong> <span className="text-xs">{voucher.beneficiaryBankIfsc}</span>
                      </p>
                      <p className="text-sm">
                        <strong>Purpose:</strong> <span className="text-xs">{voucher.purposeOfPayment}</span>
                      </p>
                      <p className="text-sm">
                        <strong>UTR Number:</strong> <span className="text-xs">{voucher.utrNumber}</span>
                      </p>
                    </>
                  )}
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
          {bottomSpacerHeight > 0 && (
            <div style={{ height: bottomSpacerHeight }} />
          )}
          {filteredVouchers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No vouchers to display</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
