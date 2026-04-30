"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, LogIn, Building2 } from "lucide-react"
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
        .from('login')
        .select('*')
        .eq('name', username)
        .eq('password', password)

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
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[url('/placeholder.svg?height=1080&width=1920')] opacity-10"></div>

      <Card className="w-full max-w-lg shadow-2xl border-0 relative z-10">
        <CardHeader className="space-y-4 text-center bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white rounded-t-lg p-8">
          <div className="mx-auto  w-32 h-16 flex items-center justify-center">
            {/* <Building2 className="h-10 w-10 text-white" /> */}
            <img src="/Logo.PNG"  w-32 h-16 alt="" />
          </div>
          <CardTitle className="text-3xl font-bold">TNS Payment System</CardTitle>
          {/* <CardDescription className="text-blue-100 text-lg">Hamar Energy (India) Pvt Ltd</CardDescription> */}
        </CardHeader>

        <CardContent className="p-8 bg-white">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-gray-700 font-semibold text-sm">
                Username
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-12 border-2 border-gray-200 focus:border-blue-500 transition-all duration-200 text-lg"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 font-semibold text-sm">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 border-2 border-gray-200 focus:border-blue-500 transition-all duration-200 text-lg pr-12"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </Button>
              </div>
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg border border-red-200">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 text-white font-semibold text-lg transition-all duration-200 shadow-lg"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Signing In...
                </div>
              ) : (
                <>
                  <LogIn className="mr-2 h-5 w-5" />
                  Sign In
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}