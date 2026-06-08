"use client"

import { useEffect, useState, useMemo } from "react"
import { Search, X, Users, UserPlus, LogOut, ArrowLeft, Database } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import supabase from "@/lib/supabase"

interface User {
  id: number
  name: string
  password?: string
  role: string
}

export default function UserRegistration() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [open, setOpen] = useState(false)
  const [editUserId, setEditUserId] = useState<number | null>(null)

  const [searchTerm, setSearchTerm] = useState("")
  const [filterRole, setFilterRole] = useState("")

  const [formData, setFormData] = useState({
    name: "",
    password: "",
    role: "USER",
  })

  const [editData, setEditData] = useState({
    name: "",
    password: "",
    role: "USER",
  })

  const [currentUserRole, setCurrentUserRole] = useState("")
  const [currentUsername, setCurrentUsername] = useState("")

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("tns_logged_in")
    const role = localStorage.getItem("tns_user_role") || ""
    const user = localStorage.getItem("tns_username") || ""
    
    if (isLoggedIn !== "true") {
      router.push("/")
      return
    }

    if (role !== "admin" && role !== "ADMIN") {
      alert("Unauthorized Access. Only admins can view this page.")
      router.push("/dashboard")
      return
    }

    setCurrentUserRole(role)
    setCurrentUsername(user)
    fetchUsers()
  }, [router])

  // ================= FETCH USERS =================
  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("login")
        .select("*")
        .order("id", { ascending: true })

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error("Error fetching users:", error)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setEditData({ ...editData, [e.target.name]: e.target.value })
  }

  const handleEdit = (user: User) => {
    setEditUserId(user.id)
    setEditData({
      name: user.name || "",
      password: user.password || "",
      role: user.role || "USER"
    })
  }

  // ========== HANDLE SUBMIT ==========
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      // 1. Get max ID
      const { data: maxIdData, error: maxIdError } = await supabase
        .from("login")
        .select("id")
        .order("id", { ascending: false })
        .limit(1)
        
      if (maxIdError) throw maxIdError
      
      const newId = maxIdData && maxIdData.length > 0 ? maxIdData[0].id + 1 : 1

      const payload = {
        id: newId,
        name: formData.name,
        password: formData.password,
        role: formData.role,
      }

      const { error } = await supabase.from("login").insert([payload])

      if (error) throw error

      setOpen(false)
      setFormData({
        name: "",
        password: "",
        role: "USER",
      })

      fetchUsers()
      alert("User created successfully!")
    } catch (error: any) {
      console.error("Error adding user:", error)
      if (error.code === "23505") {
        alert("⚠️ Username already exists! Please use a different username.")
      } else {
        alert(error.message || "Something went wrong!")
      }
    }
  }

  const handleUpdate = async (id: number) => {
    const payload = {
      name: editData.name,
      password: editData.password,
      role: editData.role
    }

    try {
      const { error } = await supabase
        .from("login")
        .update(payload)
        .eq("id", id)

      if (error) throw error

      setEditUserId(null)
      fetchUsers()
      alert("User updated successfully!")
    } catch (error) {
      console.error("Error updating user:", error)
      alert("Failed to update user.")
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this user?")) return

    try {
      const { error } = await supabase.from("login").delete().eq("id", id)

      if (error) throw error

      fetchUsers()
    } catch (error) {
      console.error("Error deleting user:", error)
      alert("Failed to delete user.")
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("tns_logged_in")
    localStorage.removeItem("tns_user_role")
    localStorage.removeItem("tns_username")
    localStorage.removeItem("tns_user_id")
    localStorage.removeItem("tns_user_page")
    router.push("/")
  }

  // Optimizing Filtering
  const uniqueRoles = useMemo(() => Array.from(new Set(users.map(u => u.role).filter(Boolean))), [users])

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch = searchTerm === "" || 
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.id?.toString().includes(searchTerm.toLowerCase()) ||
        u.role?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesRole = filterRole === "" || u.role === filterRole

      return matchesSearch && matchesRole
    })
  }, [users, searchTerm, filterRole])

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
        {/* STATS & ADD BUTTON SECTION */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full sm:w-auto flex-1">
            <div className="bg-white rounded-xl p-4 shadow border border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{users.length}</p>
              </div>
              <div className="p-3 rounded-full bg-purple-50 text-purple-600">
                <Users className="h-6 w-6" />
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow border border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Admins</p>
                <p className="text-2xl font-bold text-gray-900">
                  {users.filter((u) => u.role === "admin" || u.role === "ADMIN").length}
                </p>
              </div>
              <div className="p-3 rounded-full bg-blue-50 text-blue-600">
                <Users className="h-6 w-6" />
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow border border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Users</p>
                <p className="text-2xl font-bold text-gray-900">
                  {users.filter((u) => u.role === "user" || u.role === "USER").length}
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-50 text-green-600">
                <Users className="h-6 w-6" />
              </div>
            </div>
          </div>

          <button
            onClick={() => setOpen(true)}
            className="flex items-center justify-center w-full sm:w-auto gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-5 py-4 sm:py-3 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all"
          >
            <UserPlus className="h-5 w-5" />
            Add New User
          </button>
        </div>

        {/* Dynamic Filters Section */}
        <div className="bg-white p-4 rounded-xl shadow border border-gray-100 flex flex-col space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Global Search */}
            <div className="flex flex-col">
              <label className="text-xs font-medium text-gray-500 mb-1">Global Search</label>
              <div className="relative h-full flex items-center">
                <input
                  type="text"
                  placeholder="Search by name, ID, or role..."
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-700 text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search size={16} className="absolute left-3 text-gray-500" />
              </div>
            </div>

            {/* Role Filter */}
            <div className="flex flex-col">
              <label className="text-xs font-medium text-gray-500 mb-1">Role Filter</label>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-700 text-sm"
              >
                <option value="">All Roles</option>
                {uniqueRoles.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>
          </div>

        </div>

        {/* ================= DESKTOP TABLE ================= */}
        <div className="hidden md:block overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
          <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-indigo-50">
            <h2 className="text-lg font-semibold text-gray-800">User Accounts</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">ID</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">Name</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">Password</th>
                  <th className="px-6 py-4 text-center font-semibold text-gray-700">Role</th>
                  <th className="px-6 py-4 text-center font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id} className="border-b border-gray-50 hover:bg-purple-50/30 transition-colors">
                      <td className="px-6 py-4 font-mono text-gray-600">{u.id}</td>
                      <td className="px-6 py-4">
                        {editUserId === u.id ? (
                          <input
                            name="name"
                            value={editData.name}
                            onChange={handleEditChange}
                            className="border border-gray-300 rounded px-3 py-1.5 w-full focus:ring-2 focus:ring-purple-500"
                          />
                        ) : (
                          <span className="font-medium text-gray-900">{u.name}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {editUserId === u.id ? (
                          <input
                            name="password"
                            value={editData.password}
                            onChange={handleEditChange}
                            className="border border-gray-300 rounded px-3 py-1.5 w-full focus:ring-2 focus:ring-purple-500"
                          />
                        ) : (
                          <span className="font-mono bg-gray-100 text-gray-700 px-2.5 py-1 rounded-md text-xs">
                            {u.password || "••••••••"}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {editUserId === u.id ? (
                          <select
                            name="role"
                            value={editData.role}
                            onChange={handleEditChange}
                            className="border border-gray-300 rounded px-3 py-1.5 focus:ring-2 focus:ring-purple-500"
                          >
                            <option value="user">user</option>
                            <option value="admin">admin</option>
                          </select>
                        ) : (
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${
                            u.role?.toLowerCase() === "admin" 
                              ? "bg-purple-100 text-purple-700 border border-purple-200" 
                              : "bg-blue-100 text-blue-700 border border-blue-200"
                          }`}>
                            {u.role}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          {editUserId === u.id ? (
                            <>
                              <button onClick={() => handleUpdate(u.id)} className="bg-green-500 text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-green-600">
                                Save
                              </button>
                              <button onClick={() => setEditUserId(null)} className="bg-gray-200 text-gray-800 px-3 py-1.5 rounded text-xs font-medium hover:bg-gray-300">
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => handleEdit(u)} className="bg-purple-100 text-purple-700 px-3 py-1.5 rounded text-xs font-medium hover:bg-purple-200">
                                Edit
                              </button>
                              <button onClick={() => handleDelete(u.id)} className="bg-red-50 text-red-600 px-3 py-1.5 rounded text-xs font-medium hover:bg-red-100">
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-3 border-t border-gray-100 text-sm text-gray-500 bg-gray-50">
            Showing {filteredUsers.length} of {users.length} users
          </div>
        </div>

        {/* ================= MOBILE VIEW ================= */}
        <div className="md:hidden space-y-4">
          <div className="bg-white rounded-xl shadow p-4 border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-800">Users ({filteredUsers.length})</h2>
            </div>
            <div className="space-y-4">
              {filteredUsers.map((u) => (
                <div key={u.id} className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                  <div className="flex justify-between items-start mb-3 border-b border-gray-200 pb-3">
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">{u.name}</h3>
                      <p className="text-xs text-gray-500 mt-1">ID: {u.id}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                      u.role?.toLowerCase() === "admin" 
                        ? "bg-purple-100 text-purple-700" 
                        : "bg-blue-100 text-blue-700"
                    }`}>
                      {u.role}
                    </span>
                  </div>
                  
                  {editUserId === u.id ? (
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Name</label>
                        <input name="name" value={editData.name} onChange={handleEditChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Password</label>
                        <input name="password" value={editData.password} onChange={handleEditChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Role</label>
                        <select name="role" value={editData.role} onChange={handleEditChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm">
                          <option value="user">user</option>
                          <option value="admin">admin</option>
                        </select>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button onClick={() => handleUpdate(u.id)} className="flex-1 bg-green-500 text-white px-3 py-2 rounded text-sm font-medium">Save</button>
                        <button onClick={() => setEditUserId(null)} className="flex-1 bg-gray-200 text-gray-800 px-3 py-2 rounded text-sm font-medium">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Password:</span>
                        <span className="text-sm font-mono bg-white px-2 py-1 rounded border">{u.password || "••••••••"}</span>
                      </div>
                      <div className="flex gap-2 pt-2 border-t border-gray-200">
                        <button onClick={() => handleEdit(u)} className="flex-1 bg-purple-100 text-purple-700 px-3 py-2 rounded text-sm font-medium">Edit</button>
                        <button onClick={() => handleDelete(u.id)} className="flex-1 bg-red-50 text-red-600 px-3 py-2 rounded text-sm font-medium">Delete</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ================= ADD USER MODAL ================= */}
        {open && (
          <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold">Add New User</h2>
                  <button onClick={() => setOpen(false)} className="text-white hover:text-gray-200 transition-colors">
                    <X size={24} />
                  </button>
                </div>
                <p className="text-purple-100 text-sm mt-1">Create a new login credential</p>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5 bg-gray-50">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Name / Username</label>
                  <input
                    className="border border-gray-300 rounded-lg px-4 py-2.5 w-full focus:ring-2 focus:ring-purple-500 outline-none bg-white shadow-sm"
                    name="name"
                    value={formData.name}
                    placeholder="Enter user's name"
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Password</label>
                  <input
                    className="border border-gray-300 rounded-lg px-4 py-2.5 w-full focus:ring-2 focus:ring-purple-500 outline-none bg-white shadow-sm"
                    name="password"
                    value={formData.password}
                    placeholder="Enter secure password"
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Role</label>
                  <select
                    className="border border-gray-300 rounded-lg px-4 py-2.5 w-full focus:ring-2 focus:ring-purple-500 outline-none bg-white shadow-sm"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                  >
                    <option value="USER">USER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1.5">Admins can access Dashboard and User Management.</p>
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition-colors bg-white shadow-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all"
                  >
                    Create User
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

  )
}
