"use client"

import { useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useHistoryData } from "@/hooks/useHistoryData"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Loader2 } from "lucide-react"

// Import custom sub-components
import VoucherFilters from "@/components/history/VoucherFilters"
import { VoucherToolbar } from "@/components/history/VoucherToolbar"
import { VoucherTable } from "@/components/history/VoucherTable"
import { MobileVoucherCards } from "@/components/history/MobileVoucherCards"
import EditVoucherModal from "@/components/history/EditVoucherModal"

// Import utilities / exports
import { formatDateForInput } from "@/lib/history-utils"
import { downloadPDF, handleExportToExcel, generateSummaryPDF } from "@/lib/voucher-exports"

export default function HistoryPage() {
  const router = useRouter()
  const historyProps = useHistoryData()

  const {
    userRole,
    setUserRole,
    username,
    setUsername,
    masterData,
    loadingMasterData,
    vouchers,
    loading,
    isRefetching,
    isExporting,
    setIsExporting,
    setIsRefetching,
    recordType,
    setRecordType,
    searchTerm,
    setSearchTerm,
    debouncedSearchTerm,
    selectedCompany,
    setSelectedCompany,
    selectedProject,
    setSelectedProject,
    selectedPurpose,
    setSelectedPurpose,
    selectedTransactionType,
    setSelectedTransactionType,
    selectedName,
    setSelectedName,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    amountFrom,
    handleAmountChange,
    amountTo,
    debouncedAmountFrom,
    debouncedAmountTo,
    isEditModalOpen,
    editVoucher,
    setEditVoucher,
    isUpdating,
    deletingVoucherId,
    openEditModal,
    closeEditModal,
    handleInputChange,
    handleEditSubmit,
    handleEditAmountChange,
    deleteVoucher,
    clearAllFilters,
    fetchRealHistoryData,
  } = historyProps

  // Authenticate user on mount
  useEffect(() => {
    const isLoggedIn = localStorage.getItem("tns_logged_in")
    const storedUserRole = localStorage.getItem("tns_user_role")
    const storedUsername = localStorage.getItem("tns_username")

    if (isLoggedIn !== "true") {
      router.push("/")
      return
    }

    setUserRole(storedUserRole || "user")
    setUsername(storedUsername || "User")
  }, [router, setUserRole, setUsername])

  // Compute active filters count
  const activeFiltersCount = useMemo(() => {
    return [
      selectedCompany !== "all",
      selectedProject !== "all",
      selectedPurpose !== "all",
      selectedTransactionType !== "all",
      selectedName !== "all",
      dateFrom,
      dateTo,
      debouncedAmountFrom,
      debouncedAmountTo,
    ].filter(Boolean).length
  }, [
    selectedCompany,
    selectedProject,
    selectedPurpose,
    selectedTransactionType,
    selectedName,
    dateFrom,
    dateTo,
    debouncedAmountFrom,
    debouncedAmountTo,
  ])

  // Trigger exports with debounced options object
  const triggerExportExcel = () => {
    handleExportToExcel({
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
    })
  }


  const triggerExportSummaryPDF = () => {
    generateSummaryPDF({
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
    })
  }

  // Full-page spinner only on very first load; subsequent fetches use inline indicator
  const hasLoaded = vouchers.length > 0 || !loading
  if (loading && !hasLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-50 flex items-center justify-center p-4">
        <Card className="p-6 sm:p-8 text-center w-full max-w-md">
          <CardContent>
            <Loader2 className="h-8 w-8 sm:h-12 sm:w-12 animate-spin text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold text-gray-600 mb-2">Loading Payment History</h3>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Filters Card */}
      <VoucherFilters
        recordType={recordType}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedName={selectedName}
        setSelectedName={setSelectedName}
        selectedCompany={selectedCompany}
        setSelectedCompany={setSelectedCompany}
        selectedProject={selectedProject}
        setSelectedProject={setSelectedProject}
        selectedPurpose={selectedPurpose}
        setSelectedPurpose={setSelectedPurpose}
        selectedTransactionType={selectedTransactionType}
        setSelectedTransactionType={setSelectedTransactionType}
        dateFrom={dateFrom}
        setDateFrom={setDateFrom}
        dateTo={dateTo}
        setDateTo={setDateTo}
        amountFrom={amountFrom}
        setAmountFrom={(val) => handleAmountChange("From", val)}
        amountTo={amountTo}
        setAmountTo={(val) => handleAmountChange("To", val)}
        activeFiltersCount={activeFiltersCount}
        clearAllFilters={clearAllFilters}
        uniqueNames={masterData.uniqueNames}
        uniqueCompanies={masterData.companyNames}
        uniqueProjects={masterData.projects}
        uniquePurposes={masterData.purposes}
        uniqueTransactionTypes={masterData.transactionTypes}
      />

      {/* Top Tabs & Actions Toolbar */}
      <VoucherToolbar
        recordType={recordType}
        setRecordType={setRecordType}
        generateSummaryPDF={triggerExportSummaryPDF}
        handleExportToExcel={triggerExportExcel}
        isExporting={isExporting}
      />

      {/* Vouchers Table Card or Empty State */}
      {vouchers.length === 0 ? (
        <Card className="text-center p-6 sm:p-12 border border-slate-100 rounded-2xl shadow-sm">
          <CardContent>
            <FileText className="h-12 w-12 sm:h-16 sm:w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg sm:text-xl font-bold text-slate-700 mb-2">
              {vouchers.length === 0 ? "No Vouchers Found" : "No Matching Vouchers"}
            </h3>
            <p className="text-sm sm:text-base text-slate-500 mb-6">
              {vouchers.length === 0
                ? "No payment vouchers found in the History database."
                : "Try adjusting your search criteria or filters."}
            </p>
            {vouchers.length === 0 ? (
              <Button
                onClick={() => router.push("/voucher")}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl px-5 py-2.5 shadow-sm text-sm"
              >
                Create First Voucher
              </Button>
            ) : (
              <Button
                onClick={clearAllFilters}
                variant="outline"
                className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100/60 font-bold rounded-xl px-5 py-2.5 text-sm"
              >
                Clear All Filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-md border border-slate-100 rounded-2xl overflow-hidden">
          <CardContent className="p-0">
            {/* Mobile Card View for small screens */}
            <MobileVoucherCards
              filteredVouchers={vouchers}
              downloadPDF={downloadPDF}
              openEditModal={openEditModal}
              userRole={userRole}
            />

            {/* Desktop Table View for larger screens */}
            <VoucherTable
              recordType={recordType}
              filteredVouchers={vouchers}
              downloadPDF={downloadPDF}
              openEditModal={openEditModal}
              deleteVoucher={deleteVoucher}
              deletingVoucherId={deletingVoucherId}
              loading={loading}
              userRole={userRole}
            />
          </CardContent>
        </Card>
      )}

      {/* Edit Modal */}
      <EditVoucherModal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        editVoucher={editVoucher}
        setEditVoucher={setEditVoucher}
        onSubmit={handleEditSubmit}
        isUpdating={isUpdating}
        loadingMasterData={loadingMasterData}
        masterData={masterData}
        handleAmountChange={handleEditAmountChange}
        formatDateForInput={formatDateForInput}
      />
    </div>
  )
}