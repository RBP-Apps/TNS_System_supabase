import type React from "react"
import { Search, Filter, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface VoucherFiltersProps {
  searchTerm: string
  setSearchTerm: (v: string) => void
  selectedName: string
  setSelectedName: (v: string) => void
  selectedCompany: string
  setSelectedCompany: (v: string) => void
  selectedProject: string
  setSelectedProject: (v: string) => void
  selectedPurpose: string
  setSelectedPurpose: (v: string) => void
  selectedTransactionType: string
  setSelectedTransactionType: (v: string) => void
  dateFrom: string
  setDateFrom: (v: string) => void
  dateTo: string
  setDateTo: (v: string) => void
  amountFrom: string
  setAmountFrom: (v: string) => void
  amountTo: string
  setAmountTo: (v: string) => void
  activeFiltersCount: number
  clearAllFilters: () => void
  uniqueNames: string[]
  uniqueCompanies: string[]
  uniqueProjects: string[]
  uniquePurposes: string[]
  uniqueTransactionTypes: string[]
}

const VoucherFilters: React.FC<VoucherFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  selectedName,
  setSelectedName,
  selectedCompany,
  setSelectedCompany,
  selectedProject,
  setSelectedProject,
  selectedPurpose,
  setSelectedPurpose,
  selectedTransactionType,
  setSelectedTransactionType,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  amountFrom,
  setAmountFrom,
  amountTo,
  setAmountTo,
  activeFiltersCount,
  clearAllFilters,
  uniqueNames,
  uniqueCompanies,
  uniqueProjects,
  uniquePurposes,
  uniqueTransactionTypes,
}) => {
  return (
    <Card className="shadow-sm">
      <CardHeader className="bg-gradient-to-r from-gray-600 to-gray-700 text-white">
        <CardTitle className="flex items-center justify-between text-sm sm:text-base">
          <div className="flex items-center">
            <Filter className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
            Search & Filters
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2 bg-orange-100 text-orange-800 text-xs">
                {activeFiltersCount} active
              </Badge>
            )}
          </div>
          {activeFiltersCount > 0 && (
            <Button
              onClick={clearAllFilters}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20 text-xs sm:text-sm"
            >
              <X className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
              Clear All
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-6 space-y-3 sm:space-y-4">
        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div className="relative w-full sm:w-[70%]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 w-3 sm:h-4 sm:w-4" />
            <Input
              placeholder="Search by voucher number, beneficiary name, project, purpose, or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 sm:pl-10 h-10 sm:h-11 border-2 border-gray-200 focus:border-blue-500 text-sm"
            />
          </div>

          <div className="w-full sm:w-[25%]">
            <Select value={selectedName} onValueChange={setSelectedName}>
              <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm w-full">
                <SelectValue placeholder="All Names" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Names</SelectItem>
                {uniqueNames.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Filter Row 1 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div>
            <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">Company</label>
            <Select value={selectedCompany} onValueChange={setSelectedCompany}>
              <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm">
                <SelectValue placeholder="All Companies" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Companies</SelectItem>
                {uniqueCompanies.map((company) => (
                  <SelectItem key={company} value={company}>
                    {company}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">Project</label>
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm">
                <SelectValue placeholder="All Projects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {uniqueProjects.map((project) => (
                  <SelectItem key={project} value={project}>
                    {project}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">Purpose</label>
            <Select value={selectedPurpose} onValueChange={setSelectedPurpose}>
              <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm">
                <SelectValue placeholder="All Purposes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Purposes</SelectItem>
                {uniquePurposes.map((purpose) => (
                  <SelectItem key={purpose} value={purpose}>
                    {purpose}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">Transaction Type</label>
            <Select value={selectedTransactionType} onValueChange={setSelectedTransactionType}>
              <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {uniqueTransactionTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Filter Row 2 - Date and Amount Range */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div>
            <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">Date From</label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-9 sm:h-10 text-xs sm:text-sm"
            />
          </div>
          <div>
            <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">Date To</label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-9 sm:h-10 text-xs sm:text-sm"
            />
          </div>
          <div>
            <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">Amount From (₹)</label>
            <Input
              type="number"
              placeholder="Min amount"
              value={amountFrom}
              onChange={(e) => setAmountFrom(e.target.value)}
              className="h-9 sm:h-10 text-xs sm:text-sm"
            />
          </div>
          <div>
            <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">Amount To (₹)</label>
            <Input
              type="number"
              placeholder="Max amount"
              value={amountTo}
              onChange={(e) => setAmountTo(e.target.value)}
              className="h-9 sm:h-10 text-xs sm:text-sm"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default VoucherFilters
