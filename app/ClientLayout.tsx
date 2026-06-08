"use client"

import React, { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { 
  LayoutDashboard, 
  FileText, 
  DollarSign, 
  RefreshCw, 
  History, 
  Database, 
  Users, 
  LogOut,
  Menu,
  X,
  Building2,
  ChevronRight
} from "lucide-react"
import { Button } from "@/components/ui/button"

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userRole, setUserRole] = useState("")
  const [username, setUsername] = useState("")
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // Check login status on mount and when pathname changes
  useEffect(() => {
    const loggedIn = localStorage.getItem("tns_logged_in") === "true"
    const role = localStorage.getItem("tns_user_role") || ""
    const user = localStorage.getItem("tns_username") || ""
    
    setIsLoggedIn(loggedIn)
    setUserRole(role)
    setUsername(user)
  }, [pathname])

  const handleLogout = () => {
    localStorage.clear()
    setIsLoggedIn(false)
    router.push("/")
  }

  // If not logged in or on the login page ("/"), do not render the sidebar layout
  if (!isLoggedIn || pathname === "/") {
    return <>{children}</>
  }

  const navItems = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: LayoutDashboard,
      adminOnly: true,
      color: "from-blue-500 to-indigo-600"
    },
    {
      name: "Payment Voucher",
      path: "/voucher",
      icon: FileText,
      adminOnly: false,
      color: "from-blue-500 to-cyan-600"
    },
    {
      name: "Add Receipt",
      path: "/credit",
      icon: DollarSign,
      adminOnly: false,
      color: "from-amber-500 to-orange-600"
    },
    {
      name: "Contra (Self Transfer)",
      path: "/self-transfer",
      icon: RefreshCw,
      adminOnly: false,
      color: "from-teal-500 to-emerald-600"
    },
    {
      name: "History",
      path: "/history",
      icon: History,
      adminOnly: false,
      color: "from-purple-500 to-pink-600"
    },
    {
      name: "Master Database",
      path: "/master",
      icon: Database,
      adminOnly: true,
      color: "from-slate-600 to-slate-800"
    },
    {
      name: "Users Management",
      path: "/users",
      icon: Users,
      adminOnly: true,
      color: "from-violet-500 to-purple-600"
    },
  ]

  const activeItems = navItems.filter(
    (item) => !item.adminOnly || userRole.toLowerCase() === "admin"
  )

  // Get active page name for header
  const getPageTitle = () => {
    const activeItem = navItems.find(item => item.path === pathname)
    return activeItem ? activeItem.name : "TNS System"
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex md:w-64 lg:w-72 flex-col fixed inset-y-0 left-0 z-30 bg-slate-900 text-slate-300 border-r border-slate-800 shadow-xl">
        {/* Brand Logo */}
        <div className="flex items-center space-x-3.5 px-6 py-6 border-b border-slate-800/60 bg-slate-950/40">
          <div className="bg-gradient-to-tr from-amber-500 to-orange-600 p-2.5 rounded-xl shadow-lg shadow-orange-500/10">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-white tracking-widest uppercase">TNS System</h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Payment Portal</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {activeItems.map((item) => {
            const isActive = pathname === item.path
            const Icon = item.icon
            return (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className={`flex items-center justify-between w-full px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 group cursor-pointer ${
                  isActive 
                    ? `bg-gradient-to-r ${item.color} text-white shadow-lg shadow-orange-500/5` 
                    : "hover:bg-slate-800/60 hover:text-white"
                }`}
              >
                <div className="flex items-center">
                  <Icon className={`mr-3 h-4 w-4 transition-colors ${isActive ? "text-white" : "text-slate-400 group-hover:text-white"}`} />
                  <span>{item.name}</span>
                </div>
                {isActive && <ChevronRight className="h-3.5 w-3.5 text-white/80" />}
              </button>
            )
          })}
        </nav>

        {/* User Footer Profile & Logout */}
        <div className="p-4 border-t border-slate-800/60 bg-slate-950/20">
          <div className="flex items-center space-x-3 px-2 py-1 mb-4">
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-amber-500 font-extrabold border border-slate-700 shadow-inner">
              {username.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-white truncate">{username}</p>
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">{userRole}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center w-full px-4 py-2.5 text-sm font-bold text-red-400 bg-red-950/10 hover:bg-red-900/20 border border-red-900/30 hover:border-red-900/50 rounded-xl transition-all duration-200 cursor-pointer"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Sidebar - Mobile Drawer */}
      <div className={`md:hidden fixed inset-0 z-50 transition-all duration-300 ${isSidebarOpen ? "visible opacity-100" : "invisible opacity-0"}`}>
        {/* Overlay */}
        <div 
          className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
        
        {/* Drawer Content */}
        <aside className={`absolute inset-y-0 left-0 w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 shadow-2xl transition-transform duration-300 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
          {/* Close Button & Brand */}
          <div className="flex items-center justify-between px-5 py-5 border-b border-slate-800 bg-slate-950">
            <div className="flex items-center space-x-2.5">
              <div className="bg-gradient-to-tr from-amber-500 to-orange-600 p-2 rounded-lg">
                <Building2 className="h-4.5 w-4.5 text-white" />
              </div>
              <span className="text-sm font-bold text-white tracking-wider uppercase">TNS System</span>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {activeItems.map((item) => {
              const isActive = pathname === item.path
              const Icon = item.icon
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    router.push(item.path)
                    setIsSidebarOpen(false)
                  }}
                  className={`flex items-center w-full px-4 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 cursor-pointer ${
                    isActive 
                      ? `bg-gradient-to-r ${item.color} text-white shadow-md` 
                      : "hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <Icon className="mr-3 h-4 w-4" />
                  {item.name}
                </button>
              )
            })}
          </nav>

          {/* User Info & Logout */}
          <div className="p-4 border-t border-slate-800 bg-slate-950">
            <div className="flex items-center space-x-3 px-2 py-1 mb-4">
              <div className="w-9 h-9 rounded-lg bg-slate-850 flex items-center justify-center text-amber-500 font-extrabold border border-slate-700">
                {username.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate">{username}</p>
                <p className="text-[10px] text-slate-500 capitalize">{userRole}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center w-full px-4 py-2 text-xs font-bold text-red-400 bg-red-950/20 hover:bg-red-900/30 border border-red-900/30 rounded-xl transition-colors cursor-pointer"
            >
              <LogOut className="mr-2 h-3.5 w-3.5" />
              Logout
            </button>
          </div>
        </aside>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:pl-64 lg:pl-72 min-h-screen min-w-0">
        {/* Unified Top Header Bar */}
        <header className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-sm">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors md:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-base font-extrabold text-slate-800 tracking-wide uppercase">
              {getPageTitle()}
            </h1>
          </div>
          <div className="flex items-center space-x-3 text-right">
            <div className="hidden sm:block">
              <p className="text-xs font-bold text-slate-700">{username}</p>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">{userRole}</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 font-bold text-xs shadow-sm">
              {username.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
