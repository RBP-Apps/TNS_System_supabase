"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, LogIn, User, Lock, Shield, ShieldCheck, CheckCircle2 } from "lucide-react"
import supabase from "@/lib/supabase"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("tns_logged_in")
    const userRole = localStorage.getItem("tns_user_role")
    const userPage = localStorage.getItem("tns_user_page")

    if (isLoggedIn === "true") {
      if (userRole === "admin") {
        router.push("/dashboard")
      } else if (userPage) {
        router.push(`/${userPage}`)
      } else {
        router.push("/voucher")
      }
    }
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      // Query the login table in Supabase using name as username
      const { data: users, error: fetchError } = await supabase
        .from("login")
        .select("*")
        .eq("name", username)
        .eq("password", password)

      if (fetchError) {
        throw new Error(fetchError.message)
      }

      if (users && users.length > 0) {
        const user = users[0]
        localStorage.setItem("tns_logged_in", "true")
        localStorage.setItem("tns_username", user.name)
        localStorage.setItem("tns_user_role", user.role || "user")
        localStorage.setItem("tns_user_id", user.id.toString())

        // Since page column is not in Supabase, default to "voucher" unless user is admin
        const pageRoute = user.role === "admin" ? "dashboard" : "voucher"
        localStorage.setItem("tns_user_page", pageRoute)

        router.push(`/${pageRoute}`)
      } else {
        setError("Invalid username or password")
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Login failed. Please try again.")
    }

    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Blobs */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-cyan-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
      <div className="absolute top-1/2 left-1/3 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-pulse"></div>

      {/* Dotted pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:20px_20px] opacity-40"></div>

      <Card className="w-full max-w-[950px] min-h-[580px] shadow-2xl border-0 relative z-10 rounded-[24px] overflow-hidden flex flex-col md:flex-row bg-white">
        {/* Left Panel */}
        <div className="hidden md:flex md:w-[40%] flex-col justify-between p-8 relative overflow-hidden bg-gradient-to-br from-[#3B5BDB] via-[#8B5CF6] to-[#14B8A6] text-white">
          {/* Subtle corporate building illustration in background */}
          <div
            className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=800')] bg-cover bg-center mix-blend-overlay opacity-15"
          ></div>

          {/* Logo & Brand Name */}
          <div className="relative z-10 flex flex-col items-center text-center mt-4">
            <div className="bg-white p-2.5 rounded-2xl shadow-md inline-flex items-center justify-center mb-4">
              <img src="/Logo.PNG" className="h-10 object-contain" alt="Logo" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white">TNS Payment System</h2>
            <div className="w-12 h-1 bg-white/30 rounded-full mt-3"></div>
          </div>

          {/* Shield & Tagline */}
          <div className="relative z-10 flex flex-col items-center text-center my-auto px-4">
            <div className="relative flex items-center justify-center mb-6">
              <div className="absolute w-24 h-24 rounded-full bg-white/10 blur-xl animate-pulse"></div>
              <div className="relative w-16 h-16 rounded-full bg-white/20 border border-white/30 flex items-center justify-center shadow-lg">
                <Shield className="h-8 w-8 text-white" />
              </div>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Secure. Reliable. Simple.</h3>
            <p className="text-xs text-white/80 max-w-[220px] leading-relaxed">
              Welcome to the TNS Payment System. Please sign in to continue.
            </p>
          </div>

          {/* Curved waves decoration */}
          <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
            <svg className="w-full fill-white" viewBox="0 0 1440 120" xmlns="http://www.w3.org/2000/svg">
              <path d="M0,32L120,42.7C240,53,480,75,720,74.7C960,75,1200,53,1320,42.7L1440,32L1440,120L1320,120C1200,120,960,120,720,120C480,120,240,120,120,120L0,120Z" opacity="0.1"></path>
              <path d="M0,64L120,58.7C240,53,480,43,720,48C960,53,1200,75,1320,85.3L1440,96L1440,120L1320,120C1200,120,960,120,720,120C480,120,240,120,120,120L0,120Z" opacity="0.2"></path>
            </svg>
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-full md:w-[60%] p-8 md:p-12 flex flex-col justify-between bg-white">
          <div className="my-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
              <div className="w-10 h-10 rounded-full bg-purple-50 text-[#8B5CF6] flex items-center justify-center shadow-sm">
                <User className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">Welcome Back!</h2>
                <p className="text-xs text-slate-500 font-medium">Please enter your credentials to sign in.</p>
              </div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-5">
              {/* Username Input */}
              <div className="space-y-1.5">
                <Label htmlFor="username" className="text-slate-700 font-semibold text-xs">
                  Username
                </Label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                    <User className="h-5 w-5" />
                  </span>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="h-12 pl-11 pr-10 border border-slate-200 focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/10 rounded-[14px] transition-all duration-200 text-sm"
                    required
                  />
                  {username && (
                    <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-emerald-500">
                      <CheckCircle2 className="h-5 w-5" />
                    </span>
                  )}
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-slate-700 font-semibold text-xs">
                  Password
                </Label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                    <Lock className="h-5 w-5" />
                  </span>
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 pl-11 pr-12 border border-slate-200 focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/10 rounded-[14px] transition-all duration-200 text-sm"
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-slate-300 text-[#4F46E5] focus:ring-[#4F46E5] cursor-pointer"
                  />
                  Remember me
                </label>

              </div>

              {/* Error Message */}
              {error && (
                <div className="text-red-600 text-xs text-center bg-red-50 p-3 rounded-xl border border-red-100 my-2">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-gradient-to-r from-[#8B5CF6] via-[#3B5BDB] to-[#14B8A6] hover:opacity-95 text-white font-semibold text-sm rounded-[14px] shadow-lg shadow-indigo-500/20 transition-all duration-300 hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-2 mt-6 border-0"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Signing In...
                  </div>
                ) : (
                  <>
                    <LogIn className="h-5 w-5" />
                    Sign In
                  </>
                )}
              </Button>
            </form>

            {/* Footer Notice */}
            <div className="mt-8 space-y-4">
              <div className="flex items-center justify-center gap-3">
                <div className="h-px bg-slate-200 flex-1"></div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">or</span>
                <div className="h-px bg-slate-200 flex-1"></div>
              </div>
              <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500 bg-slate-50 py-2.5 px-4 rounded-xl border border-slate-100">
                <ShieldCheck className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                <span className="text-center">Your data is protected with enterprise-grade security.</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}