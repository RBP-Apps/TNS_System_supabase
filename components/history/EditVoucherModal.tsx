import type React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { X, Loader2 } from "lucide-react"

interface VoucherData {
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

interface MasterData {
  companyNames: string[]
  transactionTypes: string[]
  projects: string[]
  bankAccounts: string[]
}

interface EditVoucherModalProps {
  isOpen: boolean
  onClose: () => void
  editVoucher: VoucherData | null
  setEditVoucher: React.Dispatch<React.SetStateAction<VoucherData | null>>
  onSubmit: (e: React.FormEvent) => void
  isUpdating: boolean
  loadingMasterData: boolean
  masterData: MasterData
  handleAmountChange: (value: string) => void
  formatDateForInput: (dateString: string) => string
}

const EditVoucherModal: React.FC<EditVoucherModalProps> = ({
  isOpen,
  onClose,
  editVoucher,
  setEditVoucher,
  onSubmit,
  isUpdating,
  loadingMasterData,
  masterData,
  handleAmountChange,
  formatDateForInput,
}) => {
  if (!isOpen || !editVoucher) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-4xl w-full max-h-[90vh] overflow-y-auto transition-all duration-300">
        <div className="p-6 sm:p-8">
          <div className="flex justify-between items-center mb-6 border-b pb-4">
            <h2 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-green-600">
              Edit {editVoucher.recordType === "Credit" ? "Credit Entry" : editVoucher.recordType === "Transfer" ? "CONTRA" : "Voucher"}: {editVoucher.voucherNo || editVoucher.id}
            </h2>
            <Button onClick={onClose} variant="ghost" size="sm" className="text-gray-500 hover:text-red-600">
              <X className="h-5 w-5" />
            </Button>
          </div>

          {loadingMasterData && (
            <div className="flex items-center justify-center p-4 mb-4 bg-blue-50 rounded-lg">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600 mr-2" />
              <span className="text-blue-700 text-sm">Loading dropdown options...</span>
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Company Name Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                <Select
                  value={editVoucher.companyName}
                  onValueChange={(value) => setEditVoucher((prev) => (prev ? { ...prev, companyName: value } : null))}
                  disabled={loadingMasterData}
                >
                  <SelectTrigger className="w-full border border-gray-300 rounded-lg px-3 py-2 h-auto">
                    <SelectValue placeholder={loadingMasterData ? "Loading..." : "Select Company"} />
                  </SelectTrigger>
                  <SelectContent>
                    {masterData.companyNames.map((company) => (
                      <SelectItem key={company} value={company}>
                        {company}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Bank AC From Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bank AC From</label>
                <Select
                  value={editVoucher.bankAcFrom}
                  onValueChange={(value) => setEditVoucher((prev) => (prev ? { ...prev, bankAcFrom: value } : null))}
                  disabled={loadingMasterData}
                >
                  <SelectTrigger className="w-full border border-gray-300 rounded-lg px-3 py-2 h-auto">
                    <SelectValue placeholder={loadingMasterData ? "Loading..." : "Select Bank Account"} />
                  </SelectTrigger>
                  <SelectContent>
                    {masterData.bankAccounts.map((bank) => (
                      <SelectItem key={bank} value={bank}>
                        {bank}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date of Payment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <Input
                  type="date"
                  value={formatDateForInput(editVoucher.dateOfPaymentProcess)}
                  onChange={(e) =>
                    setEditVoucher((prev) => (prev ? { ...prev, dateOfPaymentProcess: e.target.value } : null))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              {/* Purpose */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Purpose</label>
                <Input
                  value={editVoucher.purposeOfPayment}
                  onChange={(e) => setEditVoucher((prev) => (prev ? { ...prev, purposeOfPayment: e.target.value } : null))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              {/* Project Dropdown */}
              {editVoucher.recordType !== "Transfer" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
                  <Select
                    value={editVoucher.project}
                    onValueChange={(value) => setEditVoucher((prev) => (prev ? { ...prev, project: value } : null))}
                    disabled={loadingMasterData}
                  >
                    <SelectTrigger className="w-full border border-gray-300 rounded-lg px-3 py-2 h-auto">
                      <SelectValue placeholder={loadingMasterData ? "Loading..." : "Select Project"} />
                    </SelectTrigger>
                    <SelectContent>
                      {masterData.projects.map((proj) => (
                        <SelectItem key={proj} value={proj}>
                          {proj}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Other input fields */}
              {[
                [
                  editVoucher.recordType === "Credit" ? "Payer Name" : "Beneficiary Name",
                  "beneficiaryName",
                  editVoucher.recordType !== "Transfer",
                ],
                ["PO Number", "poNumber", editVoucher.recordType !== "Credit" && editVoucher.recordType !== "Transfer"],
                ["UTR Number", "utrNumber", editVoucher.recordType !== "Debit"],
                [
                  editVoucher.recordType === "Transfer" ? "Bank A/C To" : "Beneficiary A/C Name",
                  "beneficiaryAcName",
                  editVoucher.recordType !== "Credit",
                ],
                [
                  editVoucher.recordType === "Transfer" ? "Bank A/C Number To" : "Beneficiary A/C Number",
                  "beneficiaryAcNumber",
                  editVoucher.recordType !== "Credit",
                ],
                [
                  editVoucher.recordType === "Transfer" ? "Bank Name To" : "Beneficiary Bank Name",
                  "beneficiaryBankName",
                  editVoucher.recordType !== "Credit",
                ],
                [
                  editVoucher.recordType === "Transfer" ? "IFSC To" : "Beneficiary Bank IFSC",
                  "beneficiaryBankIfsc",
                  editVoucher.recordType !== "Credit",
                ],
              ]
                .filter(([,, show]) => show)
                .map(([label, key]) => (
                  <div key={key as string}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{label as string}</label>
                    <Input
                      value={editVoucher[key as string] || ""}
                      onChange={(e) => setEditVoucher((prev) => (prev ? { ...prev, [key as string]: e.target.value } : null))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                ))}

              {/* Transaction Type Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Type</label>
                <Select
                  value={editVoucher.transactionType}
                  onValueChange={(value) =>
                    setEditVoucher((prev) => (prev ? { ...prev, transactionType: value } : null))
                  }
                  disabled={loadingMasterData}
                >
                  <SelectTrigger className="w-full border border-gray-300 rounded-lg px-3 py-2 h-auto">
                    <SelectValue placeholder={loadingMasterData ? "Loading..." : "Select Transaction Type"} />
                  </SelectTrigger>
                  <SelectContent>
                    {masterData.transactionTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Particulars</label>
              <Textarea
                value={editVoucher.particulars}
                onChange={(e) => setEditVoucher((prev) => (prev ? { ...prev, particulars: e.target.value } : null))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <Input
                  type="number"
                  step="0.01"
                  value={editVoucher.amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount in Words</label>
                <Input
                  value={editVoucher.amountInWords}
                  onChange={(e) => setEditVoucher((prev) => (prev ? { ...prev, amountInWords: e.target.value } : null))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: "Entry Done By", key: "entryDoneBy", isReadOnly: true, show: editVoucher.recordType !== "Transfer" },
                { label: "Checked By", key: "checkedBy", isReadOnly: false, show: editVoucher.recordType !== "Transfer" },
                { label: "Approved By", key: "approvedBy", isReadOnly: false, show: editVoucher.recordType !== "Credit" },
              ]
                .filter((s) => s.show)
                .map(({ label, key, isReadOnly }) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                    <Input
                      value={editVoucher[key] || ""}
                      onChange={(e) => setEditVoucher((prev) => (prev ? { ...prev, [key]: e.target.value } : null))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      readOnly={isReadOnly}
                    />
                  </div>
                ))}
            </div>

            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 mt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={isUpdating}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isUpdating || loadingMasterData}
                className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Voucher"
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default EditVoucherModal
