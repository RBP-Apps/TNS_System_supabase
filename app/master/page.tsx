"use client";
import { useEffect, useState } from "react";
import { Search, X, Edit, Trash2, Plus, ArrowLeft, Database, Loader2, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import supabase from "../../lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface MasterRecord {
  id: number;
  company_name: string;
  transaction_type: string;
  project: string;
  bank_ac_from: string;
  payment_from_company: string;
  created_at: string;
}

export default function MasterDataManagement() {
  const router = useRouter();
  const [masterData, setMasterData] = useState<MasterRecord[]>([]);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [userRole, setUserRole] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  
  const [formData, setFormData] = useState({
    company_name: "",
    transaction_type: "",
    project: "",
    bank_ac_from: "",
    payment_from_company: ""
  });

  const [editData, setEditData] = useState(formData);

  useEffect(() => {
    const role = localStorage.getItem("tns_user_role") || "";
    if (role.toLowerCase() !== "admin") {
      router.push("/dashboard");
      return;
    }
    setUserRole(role);
    fetchMasterData();
  }, [router]);

  const fetchMasterData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("master")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMasterData(data || []);
    } catch (error) {
      console.error("Error fetching master data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  const handleEdit = (item: MasterRecord) => {
    setEditId(item.id);
    setEditData({
      company_name: item.company_name || "",
      transaction_type: item.transaction_type || "",
      project: item.project || "",
      bank_ac_from: item.bank_ac_from || "",
      payment_from_company: item.payment_from_company || ""
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const { error } = await supabase.from("master").insert([formData]);
      if (error) throw error;
      setOpen(false);
      setFormData({
        company_name: "",
        transaction_type: "",
        project: "",
        bank_ac_from: "",
        payment_from_company: ""
      });
      fetchMasterData();
    } catch (error) {
      console.error("Error adding master data:", error);
      alert("Error adding data: " + (error as any).message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdate = async (id: number) => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from("master")
        .update(editData)
        .eq("id", id);

      if (error) throw error;
      setEditId(null);
      fetchMasterData();
    } catch (error) {
      console.error("Error updating master data:", error);
      alert("Error updating data: " + (error as any).message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this record?")) return;
    try {
      const { error } = await supabase.from("master").delete().eq("id", id);
      if (error) throw error;
      fetchMasterData();
    } catch (error) {
      console.error("Error deleting master data:", error);
      alert("Error deleting data: " + (error as any).message);
    }
  };

  const filteredData = masterData.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    return (
      item.company_name?.toLowerCase().includes(searchLower) ||
      item.transaction_type?.toLowerCase().includes(searchLower) ||
      item.project?.toLowerCase().includes(searchLower) ||
      item.bank_ac_from?.toLowerCase().includes(searchLower) ||
      item.payment_from_company?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => router.push("/dashboard")}
                className="bg-slate-50 hover:bg-slate-100"
              >
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <div>
                <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <Database className="h-5 w-5 text-indigo-600" />
                  Master Data Management
                </h1>
                <p className="text-xs text-slate-500">Manage companies, projects, and accounts</p>
              </div>
            </div>

            <Button
              onClick={() => setOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-all active:scale-95"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Record
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Search & Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search across all fields..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex justify-around items-center h-full">
              <div className="text-center">
                <p className="text-xs text-slate-500 uppercase font-semibold">Total Records</p>
                <p className="text-2xl font-bold text-indigo-600">{masterData.length}</p>
              </div>
              <div className="w-px h-8 bg-slate-200" />
              <div className="text-center">
                <p className="text-xs text-slate-500 uppercase font-semibold">Filtered</p>
                <p className="text-2xl font-bold text-slate-700">{filteredData.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Table */}
        <Card className="shadow-md overflow-hidden border-none">
          <CardHeader className="bg-white border-b py-4">
            <CardTitle className="text-lg font-semibold text-slate-700">Records List</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto max-h-[60vh]">
              <Table>
                <TableHeader className="bg-slate-50 sticky top-0 z-10">
                  <TableRow>
                    <TableHead className="w-16">S.No</TableHead>
                    <TableHead>Company Name</TableHead>
                    <TableHead>Transaction Type</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Bank Account (From)</TableHead>
                    <TableHead>Payment From Company</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-40 text-center">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
                          <p className="text-slate-500 font-medium">Fetching master data...</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-40 text-center">
                        <p className="text-slate-500">No records found matching your search.</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredData.map((item, index) => (
                      <TableRow key={item.id} className="hover:bg-slate-50 transition-colors">
                        <TableCell className="font-medium text-slate-500">{index + 1}</TableCell>
                        
                        {/* Company Name */}
                        <TableCell>
                          {editId === item.id ? (
                            <Input
                              name="company_name"
                              value={editData.company_name}
                              onChange={handleEditChange}
                              className="h-8 text-sm"
                            />
                          ) : (
                            <span className="font-semibold text-slate-700">{item.company_name || "-"}</span>
                          )}
                        </TableCell>

                        {/* Transaction Type */}
                        <TableCell>
                          {editId === item.id ? (
                            <Input
                              name="transaction_type"
                              value={editData.transaction_type}
                              onChange={handleEditChange}
                              className="h-8 text-sm"
                            />
                          ) : (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100">
                              {item.transaction_type || "-"}
                            </Badge>
                          )}
                        </TableCell>

                        {/* Project */}
                        <TableCell>
                          {editId === item.id ? (
                            <Input
                              name="project"
                              value={editData.project}
                              onChange={handleEditChange}
                              className="h-8 text-sm"
                            />
                          ) : (
                            <span className="text-slate-600">{item.project || "-"}</span>
                          )}
                        </TableCell>

                        {/* Bank Account */}
                        <TableCell>
                          {editId === item.id ? (
                            <Input
                              name="bank_ac_from"
                              value={editData.bank_ac_from}
                              onChange={handleEditChange}
                              className="h-8 text-sm"
                            />
                          ) : (
                            <span className="text-slate-600 text-xs font-mono">{item.bank_ac_from || "-"}</span>
                          )}
                        </TableCell>

                        {/* Payment From Company */}
                        <TableCell>
                          {editId === item.id ? (
                            <Input
                              name="payment_from_company"
                              value={editData.payment_from_company}
                              onChange={handleEditChange}
                              className="h-8 text-sm"
                            />
                          ) : (
                            <span className="text-slate-600 italic">{item.payment_from_company || "-"}</span>
                          )}
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-right">
                          {editId === item.id ? (
                            <div className="flex gap-2 justify-end">
                              <Button
                                size="sm"
                                onClick={() => handleUpdate(item.id)}
                                disabled={isUpdating}
                                className="bg-green-600 hover:bg-green-700 h-8 px-3"
                              >
                                {isUpdating ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3 mr-1" />}
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditId(null)}
                                className="h-8 px-3"
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <div className="flex gap-2 justify-end">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(item)}
                                className="h-8 w-8 p-0 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(item.id)}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Modal */}
      {open && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <Card className="w-full max-w-lg shadow-2xl border-none">
            <CardHeader className="bg-indigo-600 text-white rounded-t-xl py-4">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Plus className="h-5 w-5" /> Add New Record
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setOpen(false)} className="text-white hover:bg-indigo-700 p-0 h-8 w-8">
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>

            <form onSubmit={handleSubmit}>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Company Name</label>
                  <Input
                    name="company_name"
                    placeholder="Enter company name"
                    onChange={handleChange}
                    value={formData.company_name}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Transaction Type</label>
                  <Input
                    name="transaction_type"
                    placeholder="e.g. Bank Transfer, Cash"
                    onChange={handleChange}
                    value={formData.transaction_type}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Project</label>
                  <Input
                    name="project"
                    placeholder="Enter project name"
                    onChange={handleChange}
                    value={formData.project}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Bank Account (From)</label>
                  <Input
                    name="bank_ac_from"
                    placeholder="Enter account number/details"
                    onChange={handleChange}
                    value={formData.bank_ac_from}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Payment From Company</label>
                  <Input
                    name="payment_from_company"
                    placeholder="Enter source company"
                    onChange={handleChange}
                    value={formData.payment_from_company}
                  />
                </div>
              </CardContent>

              <div className="p-4 border-t bg-slate-50 rounded-b-xl flex justify-end gap-3">
                <Button variant="outline" type="button" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isUpdating}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[100px]"
                >
                  {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Record"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
