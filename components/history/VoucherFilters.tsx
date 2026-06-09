import React, { memo } from "react"
import { Search, Filter, X, Check, ChevronsUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface VoucherFiltersProps {
  recordType: string
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
          className="w-full justify-between h-10 text-xs sm:text-sm font-normal bg-white rounded-xl border-slate-200 hover:bg-slate-50 transition-colors"
        >
          <span className="truncate">
            {value === "all" ? allLabel : value}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 text-slate-400" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command className="rounded-xl border border-slate-100">
          <CommandInput placeholder={`Search ${placeholder.toLowerCase()}...`} className="h-10 text-sm" />
          <CommandList className="max-h-60 overflow-y-auto">
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="all"
                onSelect={() => {
                  onValueChange("all")
                  setOpen(false)
                }}
                className="text-xs sm:text-sm py-2 cursor-pointer"
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4 text-blue-600",
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
                  className="text-xs sm:text-sm py-2 cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4 text-blue-600",
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
  recordType,
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
    <Card className="shadow-md border border-slate-100 rounded-2xl overflow-hidden">
      <CardHeader className="bg-blue-50/40 border-b border-blue-100/50  ">
        <CardTitle className="flex items-center justify-between text-sm sm:text-base font-bold text-slate-800">
          <div className="flex items-center gap-2">
            <Filter className="h-4.5 w-4.5 text-blue-600" />
            <span>Search & Filters</span>
            {activeFiltersCount > 0 && (
              <Badge className="bg-blue-100 hover:bg-blue-100 text-blue-800 border-none font-semibold text-xs rounded-full px-2.5 py-0.5">
                {activeFiltersCount} active
              </Badge>
            )}
          </div>
          {activeFiltersCount > 0 && (
            <Button
              onClick={clearAllFilters}
              variant="outline"
              size="sm"
              className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 hover:border-red-300 font-bold text-xs rounded-xl px-3 h-8.5 transition-all duration-200 flex items-center gap-1"
            >
              <X className="h-3.5 w-3.5" />
              Clear Filters
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 sm:p-6 space-y-5 bg-white">
        {/* Systematic Grid for all filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          
          {/* Keyword Search */}
          <div className="sm:col-span-2 space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Keyword Search</label>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input
                placeholder={
                  recordType === "Debit"
                    ? "Search by voucher no, beneficiary, project, purpose, company..."
                    : recordType === "Credit"
                    ? "Search by payer, company, project, purpose..."
                    : "Search by company, purpose..."
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 h-10 border-slate-200 focus:border-blue-500 text-sm rounded-xl transition-all duration-150"
              />
            </div>
          </div>

          {/* Beneficiary Name / Payer Name / Bank AC To */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              {recordType === "Debit" ? "Beneficiary Name" : recordType === "Credit" ? "Payer Name" : "Bank A/C To"}
            </label>
            <SearchableSelect
              value={selectedName}
              onValueChange={setSelectedName}
              options={uniqueNames}
              placeholder={recordType === "Debit" ? "Names" : recordType === "Credit" ? "Payers" : "Bank Accounts"}
              allLabel={recordType === "Debit" ? "All Names" : recordType === "Credit" ? "All Payers" : "All Bank Accounts"}
            />
          </div>

          {/* Company Dropdown */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Company</label>
            <SearchableSelect
              value={selectedCompany}
              onValueChange={setSelectedCompany}
              options={uniqueCompanies}
              placeholder="Companies"
              allLabel="All Companies"
            />
          </div>

          {/* Project Dropdown (hide if Transfer) */}
          {recordType !== "Transfer" && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Project</label>
              <SearchableSelect
                value={selectedProject}
                onValueChange={setSelectedProject}
                options={uniqueProjects}
                placeholder="Projects"
                allLabel="All Projects"
              />
            </div>
          )}

          {/* Purpose Dropdown */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Purpose</label>
            <SearchableSelect
              value={selectedPurpose}
              onValueChange={setSelectedPurpose}
              options={uniquePurposes}
              placeholder="Purposes"
              allLabel="All Purposes"
            />
          </div>

          {/* Transaction Type Dropdown (hide if Transfer) */}
          {recordType !== "Transfer" && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Transaction Type</label>
              <SearchableSelect
                value={selectedTransactionType}
                onValueChange={setSelectedTransactionType}
                options={uniqueTransactionTypes}
                placeholder="Types"
                allLabel="All Types"
              />
            </div>
          )}

          {/* Date From */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Date From</label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-10 border-slate-200 focus:border-blue-500 text-sm rounded-xl cursor-pointer"
            />
          </div>

          {/* Date To */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Date To</label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-10 border-slate-200 focus:border-blue-500 text-sm rounded-xl cursor-pointer"
            />
          </div>

          {/* Amount From */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Min Amount (₹)</label>
            <Input
              type="number"
              placeholder="Min amount"
              value={amountFrom}
              onChange={(e) => setAmountFrom(e.target.value)}
              className="h-10 border-slate-200 focus:border-blue-500 text-sm rounded-xl"
            />
          </div>

          {/* Amount To */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Max Amount (₹)</label>
            <Input
              type="number"
              placeholder="Max amount"
              value={amountTo}
              onChange={(e) => setAmountTo(e.target.value)}
              className="h-10 border-slate-200 focus:border-blue-500 text-sm rounded-xl"
            />
          </div>
        </div>

        {/* Date Shortcuts Row */}
        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-3">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Date Shortcuts:</span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const today = new Date().toISOString().split("T")[0]
                setDateFrom(today)
                setDateTo(today)
              }}
              className="text-xs h-8 px-3 rounded-lg bg-blue-50/60 border-blue-100 hover:bg-blue-100/60 text-blue-600 font-semibold"
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
              className="text-xs h-8 px-3 rounded-lg bg-emerald-50/60 border-emerald-100 hover:bg-emerald-100/60 text-emerald-600 font-semibold"
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
              className="text-xs h-8 px-3 rounded-lg bg-purple-50/60 border-purple-100 hover:bg-purple-100/60 text-purple-600 font-semibold"
            >
              Yearly
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
})

VoucherFilters.displayName = "VoucherFilters"
export default VoucherFilters
