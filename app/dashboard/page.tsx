"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  LogOut,
  FileText,
  Building2,
  Calendar,
  TrendingUp,
  DollarSign,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Briefcase,
  History,
  Loader2,
  Users,
  Database,
} from "lucide-react"
import supabase from "@/lib/supabase"


interface VoucherData {
  id: string
  timestamp: string
  voucherNo: string
  bankAcFrom: string
  companyName: string
  dateOfPaymentProcess: string
  purposeOfPayment: string
  transactionType: string
  project: string
  beneficiaryName: string
  poNumber: string
  beneficiaryAcName: string
  beneficiaryAcNumber: string
  beneficiaryBankName: string
  beneficiaryBankIfsc: string
  particulars: string
  amount: string
  amountInWords: string
  entryDoneBy: string
  checkedBy: string
  approvedBy: string
  pdfLink: string
  dateOfPayment: string
  [key: string]: any
}

export default function DashboardPage() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [userRole, setUserRole] = useState("")
  const [vouchers, setVouchers] = useState<VoucherData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("tns_logged_in")
    const storedUserRole = localStorage.getItem("tns_user_role")
    const storedUsername = localStorage.getItem("tns_username")

    if (isLoggedIn !== "true" || (storedUserRole?.toLowerCase() !== "admin")) {
      router.push("/")
    } else {
      setUsername(storedUsername || "Admin")
      setUserRole(storedUserRole || "admin")
      fetchVouchersFromSupabase()
    }
  }, [router])

  const fetchVouchersFromSupabase = async () => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from('History')
        .select('*')
        .order('created_date', { ascending: false })

      if (error) {
        throw new Error(`Supabase error: ${error.message}`)
      }

      if (data && data.length > 0) {
        const mappedVouchers = data
          .map((row: any, index: number) => {
            if (!row.voucher_no) return null

            return {
              id: row.id ? row.id.toString() : `history_${index + 1}`,
              timestamp: row.created_date || '',
              voucherNo: row.voucher_no || '',
              bankAcFrom: row.bank_ac_from || '',
              companyName: row.company_name || '',
              dateOfPaymentProcess: row.date_of_payment || '',
              purposeOfPayment: row.purpose_of_payment || '',
              transactionType: row.transaction_type || '',
              project: row.project || '',
              beneficiaryName: row.beneficiary_name || '',
              poNumber: row.po_number || '',
              beneficiaryAcName: row.beneficiary_ac_name || '',
              beneficiaryAcNumber: row.beneficiary_ac_number || '',
              beneficiaryBankName: row.beneficiary_bank_name || '',
              beneficiaryBankIfsc: row.beneficiary_bank_ifsc || '',
              particulars: row.particulars || '',
              amount: row.amount ? String(row.amount) : '0',
              amountInWords: row.amount_in_words || '',
              entryDoneBy: row.entry_done_by || '',
              checkedBy: row.checked_by || '',
              approvedBy: row.approved_by || '',
              pdfLink: row.pdf_link || '',
              dateOfPayment: row.created_date || '', // For compatibility
            } as VoucherData
          })
          .filter((voucher): voucher is VoucherData => Boolean(voucher))

        setVouchers(mappedVouchers)
      } else {
        console.warn('No vouchers found in History table')
        setVouchers([])
      }
    } catch (error) {
      console.error('=== FETCH FAILED ===', error)
      setVouchers([])
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("tns_logged_in")
    localStorage.removeItem("tns_username")
    localStorage.removeItem("tns_user_role")
    localStorage.removeItem("tns_user_id")
    router.push("/")
  }

  // Analytics calculations
  const getTotalAmount = () => {
    return vouchers.reduce((sum, voucher) => sum + (Number.parseFloat(voucher.amount) || 0), 0)
  }

  const getCompanyWiseData = () => {
    const companyData: { [key: string]: { count: number; amount: number } } = {}
    vouchers.forEach((voucher) => {
      if (!companyData[voucher.companyName]) {
        companyData[voucher.companyName] = { count: 0, amount: 0 }
      }
      companyData[voucher.companyName].count++
      companyData[voucher.companyName].amount += Number.parseFloat(voucher.amount) || 0
    })
    return Object.entries(companyData).map(([name, data]) => ({ name, ...data }))
  }

  const getProjectWiseData = () => {
    const projectData: { [key: string]: { count: number; amount: number } } = {}
    vouchers.forEach((voucher) => {
      if (!projectData[voucher.project]) {
        projectData[voucher.project] = { count: 0, amount: 0 }
      }
      projectData[voucher.project].count++
      projectData[voucher.project].amount += Number.parseFloat(voucher.amount) || 0
    })
    return Object.entries(projectData).map(([name, data]) => ({ name, ...data }))
  }

  const getDateWiseData = () => {
    const dateData: { [key: string]: { count: number; amount: number } } = {}
    vouchers.forEach((voucher) => {
      const date = new Date(voucher.timestamp).toLocaleDateString("en-IN")
      if (!dateData[date]) {
        dateData[date] = { count: 0, amount: 0 }
      }
      dateData[date].count++
      dateData[date].amount += Number.parseFloat(voucher.amount) || 0
    })
    return Object.entries(dateData)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }

  const getMonthlyData = () => {
    const monthlyData: { [key: string]: { count: number; amount: number } } = {}
    vouchers.forEach((voucher) => {
      const date = new Date(voucher.timestamp)
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
      if (!monthlyData[monthYear]) {
        monthlyData[monthYear] = { count: 0, amount: 0 }
      }
      monthlyData[monthYear].count++
      monthlyData[monthYear].amount += Number.parseFloat(voucher.amount) || 0
    })
    return Object.entries(monthlyData)
      .map(([month, data]) => ({ month, ...data }))
      .sort()
  }

  const getPurposeWiseData = () => {
    const purposeData: { [key: string]: { count: number; amount: number } } = {}
    vouchers.forEach((voucher) => {
      if (!purposeData[voucher.purposeOfPayment]) {
        purposeData[voucher.purposeOfPayment] = { count: 0, amount: 0 }
      }
      purposeData[voucher.purposeOfPayment].count++
      purposeData[voucher.purposeOfPayment].amount += Number.parseFloat(voucher.amount) || 0
    })
    return Object.entries(purposeData).map(([purpose, data]) => ({ purpose, ...data }))
  }

  const getRecentVouchers = () => {
    return vouchers.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-50 flex items-center justify-center p-4">
        <Card className="p-6 sm:p-8 text-center w-full max-w-md">
          <CardContent>
            <Loader2 className="h-8 w-8 sm:h-12 sm:w-12 animate-spin text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold text-gray-600 mb-2">Loading Dashboard</h3>
          </CardContent>
        </Card>
      </div>
    )
  }

  const companyWiseData = getCompanyWiseData()
  const projectWiseData = getProjectWiseData()
  const dateWiseData = getDateWiseData()
  const monthlyData = getMonthlyData()
  const purposeWiseData = getPurposeWiseData()
  const recentVouchers = getRecentVouchers()

  return (
    <div className="container mx-auto space-y-4 sm:space-y-8">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-xs sm:text-sm font-medium">Total Vouchers</p>
                <p className="text-lg sm:text-3xl font-bold">{vouchers.length}</p>
              </div>
              <FileText className="h-4 w-4 sm:h-8 sm:w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-xs sm:text-sm font-medium">Total Amount</p>
                <p className="text-sm sm:text-3xl font-bold">₹{getTotalAmount().toLocaleString("en-IN")}</p>
              </div>
              <DollarSign className="h-4 w-4 sm:h-8 sm:w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-xs sm:text-sm font-medium">Active Projects</p>
                <p className="text-lg sm:text-3xl font-bold">{projectWiseData.length}</p>
              </div>
              <Briefcase className="h-4 w-4 sm:h-8 sm:w-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-xs sm:text-sm font-medium">Avg Amount</p>
                <p className="text-sm sm:text-3xl font-bold">
                  ₹
                  {vouchers.length > 0 ? Math.round(getTotalAmount() / vouchers.length).toLocaleString("en-IN") : "0"}
                </p>
              </div>
              <TrendingUp className="h-4 w-4 sm:h-8 sm:w-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Company Wise Analysis & Project Wise Analysis with Scrollable Frames */}
      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <CardTitle className="flex items-center text-sm sm:text-base">
              <Building2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              Company Wise Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-80 sm:max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                {companyWiseData.map((company, index) => (
                  <div key={index} className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="min-w-0 flex-1 mr-3">
                      <p className="font-semibold text-gray-800 text-sm sm:text-base truncate">{company.name}</p>
                      <p className="text-xs sm:text-sm text-gray-600">{company.count} vouchers</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-green-600 text-sm sm:text-base">₹{company.amount.toLocaleString("en-IN")}</p>
                      <p className="text-xs text-gray-500">{((company.amount / getTotalAmount()) * 100).toFixed(1)}%</p>
                    </div>
                  </div>
                ))}
                {companyWiseData.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Building2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No company data available</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-green-600 to-teal-600 text-white">
            <CardTitle className="flex items-center text-sm sm:text-base">
              <Target className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              Project Wise Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-80 sm:max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                {projectWiseData.map((project, index) => (
                  <div key={index} className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="min-w-0 flex-1 mr-3">
                      <p className="font-semibold text-gray-800 text-sm sm:text-base truncate">{project.name}</p>
                      <p className="text-xs sm:text-sm text-gray-600">{project.count} vouchers</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-green-600 text-sm sm:text-base">₹{project.amount.toLocaleString("en-IN")}</p>
                      <p className="text-xs text-gray-500">{((project.amount / getTotalAmount()) * 100).toFixed(1)}%</p>
                    </div>
                  </div>
                ))}
                {projectWiseData.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No project data available</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trends */}
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
          <CardTitle className="flex items-center text-sm sm:text-base">
            <BarChart3 className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
            Monthly Trends
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {monthlyData.slice(-6).map((month, index) => (
              <div key={index} className="p-3 sm:p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm text-gray-600">
                      {new Date(month.month + "-01").toLocaleDateString("en-IN", {
                        year: "numeric",
                        month: "long",
                      })}
                    </p>
                    <p className="text-sm sm:text-lg font-bold text-gray-800">{month.count} vouchers</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-sm sm:text-lg font-bold text-green-600">₹{month.amount.toLocaleString("en-IN")}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Purpose Wise & Recent Vouchers with Scrollable Frames */}
      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-orange-600 to-red-600 text-white">
            <CardTitle className="flex items-center text-sm sm:text-base">
              <PieChart className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              Purpose Wise Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-80 sm:max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                {purposeWiseData.map((purpose, index) => (
                  <div key={index} className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="min-w-0 flex-1 mr-3">
                      <p className="font-medium text-gray-800 text-sm sm:text-base truncate">{purpose.purpose}</p>
                      <p className="text-xs sm:text-sm text-gray-600">{purpose.count} vouchers</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-green-600 text-sm sm:text-base">₹{purpose.amount.toLocaleString("en-IN")}</p>
                      <Badge variant="secondary" className="text-xs mt-1">
                        {((purpose.amount / getTotalAmount()) * 100).toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                ))}
                {purposeWiseData.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <PieChart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No purpose data available</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white">
            <CardTitle className="flex items-center text-sm sm:text-base">
              <Activity className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              Recent Vouchers
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-80 sm:max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                {recentVouchers.map((voucher, index) => (
                  <div key={index} className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="min-w-0 flex-1 mr-3">
                      <p className="font-medium text-gray-800 text-sm sm:text-base truncate">{voucher.voucherNo}</p>
                      <p className="text-xs sm:text-sm text-gray-600 truncate">{voucher.beneficiaryName}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(voucher.timestamp).toLocaleDateString("en-IN")}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-green-600 text-sm sm:text-base">
                        ₹{Number.parseFloat(voucher.amount).toLocaleString("en-IN")}
                      </p>
                      <Badge variant="outline" className="text-xs mt-1">
                        {voucher.transactionType}
                      </Badge>
                    </div>
                  </div>
                ))}
                {recentVouchers.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No recent vouchers available</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Date Wise Analysis */}
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white">
          <CardTitle className="flex items-center text-sm sm:text-base">
            <Calendar className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
            Date Wise Analysis (Last 10 Days)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {dateWiseData.slice(-10).map((day, index) => (
              <div key={index} className="p-3 sm:p-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg border">
                <div className="text-center">
                  <p className="text-xs sm:text-sm text-gray-600 truncate">{day.date}</p>
                  <p className="text-sm sm:text-lg font-bold text-gray-800">{day.count}</p>
                  <p className="text-xs sm:text-sm font-semibold text-green-600">₹{day.amount.toLocaleString("en-IN")}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}