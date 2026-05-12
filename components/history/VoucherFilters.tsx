import React, { memo } from "react"
import { Search, Filter, X, Check, ChevronsUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandInput as CommandSearchInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

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

const SearchableSelect = ({
  value,
  onValueChange,
  options,
  placeholder,
  allLabel,
  emptyMessage = "No results found."
}: {
  value: string,
  onValueChange: (v: string) => void,
  options: string[],
  placeholder: string,
  allLabel: string,
  emptyMessage?: string
}) => {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-9 sm:h-10 text-xs sm:text-sm font-normal bg-white"
        >
          <span className="truncate">
            {value === "all" ? allLabel : value}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder={`Search ${placeholder.toLowerCase()}...`} />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="all"
                onSelect={() => {
                  onValueChange("all")
                  setOpen(false)
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === "all" ? "opacity-100" : "opacity-0"
                  )}
                />
                {allLabel}
              </CommandItem>
              {options.map((option) => (
                <CommandItem
                  key={option}
                  value={option}
                  onSelect={() => {
                    onValueChange(option)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

const VoucherFilters: React.FC<VoucherFiltersProps> = memo(({
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
              className="bg-red-500 hover:bg-red-600 text-white border border-red-400 hover:border-red-500 shadow-md hover:shadow-lg transition-all duration-200 rounded-lg px-3 py-2 text-xs sm:text-sm font-semibold"
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
            <SearchableSelect
              value={selectedName}
              onValueChange={setSelectedName}
              options={uniqueNames}
              placeholder="Names"
              allLabel="All Names"
            />
          </div>
        </div>

        {/* Filter Row 1 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div>
            <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">Company</label>
            <SearchableSelect
              value={selectedCompany}
              onValueChange={setSelectedCompany}
              options={uniqueCompanies}
              placeholder="Companies"
              allLabel="All Companies"
            />
          </div>
          <div>
            <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">Project</label>
            <SearchableSelect
              value={selectedProject}
              onValueChange={setSelectedProject}
              options={uniqueProjects}
              placeholder="Projects"
              allLabel="All Projects"
            />
          </div>
          <div>
            <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">Purpose</label>
            <SearchableSelect
              value={selectedPurpose}
              onValueChange={setSelectedPurpose}
              options={uniquePurposes}
              placeholder="Purposes"
              allLabel="All Purposes"
            />
          </div>
          <div>
            <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">Transaction Type</label>
            <SearchableSelect
              value={selectedTransactionType}
              onValueChange={setSelectedTransactionType}
              options={uniqueTransactionTypes}
              placeholder="Types"
              allLabel="All Types"
            />
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

        {/* Date Shortcut Row */}
        <div className="pt-2 border-t border-gray-100">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <label className="text-xs sm:text-sm font-medium text-gray-700">Date Shortcuts:</label>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const today = new Date().toISOString().split("T")[0]
                  setDateFrom(today)
                  setDateTo(today)
                }}
                className="text-xs h-8 bg-blue-50 border-blue-100 hover:bg-blue-100 text-blue-700"
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const now = new Date()
                  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]
                  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0]
                  setDateFrom(firstDay)
                  setDateTo(lastDay)
                }}
                className="text-xs h-8 bg-green-50 border-green-100 hover:bg-green-100 text-green-700"
              >
                Monthly
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const now = new Date()
                  const firstDay = new Date(now.getFullYear(), 0, 1).toISOString().split("T")[0]
                  const lastDay = new Date(now.getFullYear(), 11, 31).toISOString().split("T")[0]
                  setDateFrom(firstDay)
                  setDateTo(lastDay)
                }}
                className="text-xs h-8 bg-purple-50 border-purple-100 hover:bg-purple-100 text-purple-700"
              >
                Yearly
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
})

export default VoucherFilters
