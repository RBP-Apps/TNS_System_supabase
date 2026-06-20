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
  project: string;
  bank_ac_from: string;
  payment_from_company: string;
  created_at: string;
}

interface BeneficiaryRecord {
  id: number;
  beneficiary_name: string;
  beneficiary_account_number: string;
  beneficiary_bank_name: string;
  beneficiary_bank_ifsc: string;
  company_name: string;
  whatsapp_no: string;
  email_id: string;
  created_at: string;
}

interface ContraRecord {
  id: number;
  company_name: string;
  bank_name: string;
  account_no: string;
  ifsc_code: string;
  created_at: string;
  updated_at?: string;
}

export default function MasterDataManagement() {
  const router = useRouter();
  const [masterData, setMasterData] = useState<MasterRecord[]>([]);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [userRole, setUserRole] = useState("");

  const [activeTab, setActiveTab] = useState<"master" | "beneficiary" | "contra">("master");

  const [beneficiaryOpen, setBeneficiaryOpen] = useState(false);

  const [beneficiaryData, setBeneficiaryData] = useState<BeneficiaryRecord[]>([]);

  const [contraOpen, setContraOpen] = useState(false);
  const [contraData, setContraData] = useState<ContraRecord[]>([]);
  const [editContraId, setEditContraId] = useState<number | null>(null);

  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState({
    company_name: "",
    project: "",
    bank_ac_from: "",
    payment_from_company: ""
  });

  const [beneficiaryForm, setBeneficiaryForm] = useState({
    beneficiary_name: "",
    beneficiary_account_number: "",
    beneficiary_bank_name: "",
    beneficiary_bank_ifsc: "",
    company_name: "",
    whatsapp_no: "",
    email_id: "",
  });

  const [contraForm, setContraForm] = useState({
    company_name: "",
    bank_name: "",
    account_no: "",
    ifsc_code: "",
  });

  const [editBeneficiaryId, setEditBeneficiaryId] = useState<number | null>(null);
  const [editBeneficiaryForm, setEditBeneficiaryForm] = useState({
    beneficiary_name: "",
    beneficiary_account_number: "",
    beneficiary_bank_name: "",
    beneficiary_bank_ifsc: "",
    company_name: "",
    whatsapp_no: "",
    email_id: "",
  });

  const [editContraForm, setEditContraForm] = useState({
    company_name: "",
    bank_name: "",
    account_no: "",
    ifsc_code: "",
  });

  const handleBeneficiaryChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setBeneficiaryForm({
      ...beneficiaryForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleEditBeneficiaryChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setEditBeneficiaryForm({
      ...editBeneficiaryForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleContraChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setContraForm({
      ...contraForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleEditContraChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setEditContraForm({
      ...editContraForm,
      [e.target.name]: e.target.value,
    });
  };

  const [editData, setEditData] = useState(formData);

  useEffect(() => {
    const role = localStorage.getItem("tns_user_role") || "";
    if (role.toLowerCase() !== "admin") {
      router.push("/dashboard");
      return;
    }
    setUserRole(role);
    fetchMasterData();
    fetchBeneficiaryData();
    fetchContraData();
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


  const handleBeneficiarySubmit = async (
  e: React.FormEvent
) => {
  e.preventDefault();

  try {
    const { error } = await supabase
      .from("tns_master")
      .insert([beneficiaryForm]);

    if (error) throw error;

    setBeneficiaryOpen(false);

    setBeneficiaryForm({
      beneficiary_name: "",
      beneficiary_account_number: "",
      beneficiary_bank_name: "",
      beneficiary_bank_ifsc: "",
      company_name: "",
      whatsapp_no: "",
      email_id: "",
    });

    fetchBeneficiaryData();

    alert("Beneficiary Added Successfully");
  } catch (err: any) {
    alert(err.message);
  }
};

  const fetchBeneficiaryData = async () => {
    try {
      const { data, error } = await supabase
        .from("tns_master")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setBeneficiaryData(data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchContraData = async () => {
    try {
      const { data, error } = await supabase
        .from("contra_master")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setContraData(data || []);
    } catch (error) {
      console.error("Error fetching contra data:", error);
    }
  };

  const handleContraSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from("contra_master")
        .insert([contraForm]);

      if (error) throw error;

      setContraOpen(false);
      setContraForm({
        company_name: "",
        bank_name: "",
        account_no: "",
        ifsc_code: "",
      });
      fetchContraData();
      alert("Contra Record Added Successfully");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsUpdating(false);
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

  const handleEditBeneficiary = (item: BeneficiaryRecord) => {
    setEditBeneficiaryId(item.id);
    setEditBeneficiaryForm({
      beneficiary_name: item.beneficiary_name || "",
      beneficiary_account_number: item.beneficiary_account_number || "",
      beneficiary_bank_name: item.beneficiary_bank_name || "",
      beneficiary_bank_ifsc: item.beneficiary_bank_ifsc || "",
      company_name: item.company_name || "",
      whatsapp_no: item.whatsapp_no || "",
      email_id: item.email_id || "",
    });
  };

  const handleUpdateBeneficiary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editBeneficiaryId === null) return;
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from("tns_master")
        .update(editBeneficiaryForm)
        .eq("id", editBeneficiaryId);

      if (error) throw error;
      setEditBeneficiaryId(null);
      fetchBeneficiaryData();
      alert("Beneficiary Updated Successfully");
    } catch (err: any) {
      alert("Error updating beneficiary: " + err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteBeneficiary = async (id: number) => {
    if (!confirm("Are you sure you want to delete this beneficiary?")) return;
    try {
      const { error } = await supabase
        .from("tns_master")
        .delete()
        .eq("id", id);

      if (error) throw error;
      fetchBeneficiaryData();
    } catch (err: any) {
      alert("Error deleting beneficiary: " + err.message);
    }
  };

  const handleEditContra = (item: ContraRecord) => {
    setEditContraId(item.id);
    setEditContraForm({
      company_name: item.company_name || "",
      bank_name: item.bank_name || "",
      account_no: item.account_no || "",
      ifsc_code: item.ifsc_code || ""
    });
  };

  const handleUpdateContra = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editContraId === null) return;
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from("contra_master")
        .update(editContraForm)
        .eq("id", editContraId);

      if (error) throw error;
      setEditContraId(null);
      fetchContraData();
      alert("Contra Record Updated Successfully");
    } catch (err: any) {
      alert("Error updating contra: " + err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteContra = async (id: number) => {
    if (!confirm("Are you sure you want to delete this contra record?")) return;
    try {
      const { error } = await supabase
        .from("contra_master")
        .delete()
        .eq("id", id);

      if (error) throw error;
      fetchContraData();
    } catch (err: any) {
      alert("Error deleting contra: " + err.message);
    }
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

  const filteredBeneficiaryData = beneficiaryData.filter((item: BeneficiaryRecord) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      item.beneficiary_name?.toLowerCase().includes(searchLower) ||
      item.beneficiary_account_number?.toLowerCase().includes(searchLower) ||
      item.beneficiary_bank_name?.toLowerCase().includes(searchLower) ||
      item.beneficiary_bank_ifsc?.toLowerCase().includes(searchLower) ||
      item.company_name?.toLowerCase().includes(searchLower) ||
      item.whatsapp_no?.toLowerCase().includes(searchLower) ||
      item.email_id?.toLowerCase().includes(searchLower)
    );
  });

  const filteredContraData = contraData.filter((item: ContraRecord) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      item.company_name?.toLowerCase().includes(searchLower) ||
      item.bank_name?.toLowerCase().includes(searchLower) ||
      item.account_no?.toLowerCase().includes(searchLower) ||
      item.ifsc_code?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Search + Add Record */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search across all fields..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-2">

          <Button
            onClick={() => setOpen(true)}
            className="bg-indigo-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Record
          </Button>

          <Button
            onClick={() => setBeneficiaryOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Beneficiary
          </Button>

          <Button
            onClick={() => setContraOpen(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Contra
          </Button>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <Button
          variant={activeTab === "master" ? "default" : "outline"}
          onClick={() => setActiveTab("master")}
        >
          Master Records
        </Button>

        <Button
          variant={activeTab === "beneficiary" ? "default" : "outline"}
          onClick={() => setActiveTab("beneficiary")}
        >
          Beneficiary Records
        </Button>

        <Button
          variant={activeTab === "contra" ? "default" : "outline"}
          onClick={() => setActiveTab("contra")}
        >
          Contra Master
        </Button>
      </div>

      {/* Main Table */}
      {activeTab === "master" ? (
      <Card className="shadow-md overflow-hidden border-none">
        <CardContent className="p-0">
          <Table wrapperClassName="max-h-[70vh] overflow-auto">
            <TableHeader className="sticky top-0 z-50 bg-white">
              <TableRow>
                <TableHead className="sticky top-0 bg-white z-20 w-24">Action</TableHead>
                <TableHead className="sticky top-0 bg-white z-20 w-16">S.No</TableHead>
                <TableHead className="sticky top-0 bg-white z-20">Company Name</TableHead>
                {/* <TableHead className="sticky top-0 bg-white z-20">Transaction Type</TableHead> */}
                <TableHead className="sticky top-0 bg-white z-20">Project</TableHead>
                <TableHead className="sticky top-0 bg-white z-20">Bank Account (From)</TableHead>
                <TableHead className="sticky top-0 bg-white z-20">Payment From Company</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-40 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
                      <p className="text-slate-500 font-medium">Fetching master data...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-40 text-center">
                    <p className="text-slate-500">No records found matching your search.</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((item, index) => (
                  <TableRow key={item.id} className="hover:bg-slate-50 transition-colors">
                    {/* Actions */}
                    <TableCell className="w-24">
                      <div className="flex gap-2">
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
                    </TableCell>

                    <TableCell className="font-medium text-slate-500">{index + 1}</TableCell>

                    {/* Company Name */}
                    <TableCell>
                      <span className="font-semibold text-slate-700">{item.company_name || "-"}</span>
                    </TableCell>

        

                    {/* Project */}
                    <TableCell>
                      <span className="text-slate-600">{item.project || "-"}</span>
                    </TableCell>

                    {/* Bank Account */}
                    <TableCell>
                      <span className="text-slate-600 text-xs font-mono">{item.bank_ac_from || "-"}</span>
                    </TableCell>

                    {/* Payment From Company */}
                    <TableCell>
                      <span className="text-slate-600 italic">{item.payment_from_company || "-"}</span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      ) : activeTab === "beneficiary" ? (
        <Card className="shadow-md overflow-hidden border-none">
          <CardContent className="p-0">
            <Table wrapperClassName="max-h-[70vh] overflow-auto">
              <TableHeader className="sticky top-0 z-50 bg-white">
                <TableRow>
                  <TableHead className="sticky top-0 bg-white z-20 w-24">Action</TableHead>
                  <TableHead className="sticky top-0 bg-white z-20 w-16">S.No</TableHead>
                  <TableHead className="sticky top-0 bg-white z-20">Beneficiary Name</TableHead>
                  <TableHead className="sticky top-0 bg-white z-20">Account Number</TableHead>
                  <TableHead className="sticky top-0 bg-white z-20">Bank Name</TableHead>
                  <TableHead className="sticky top-0 bg-white z-20">IFSC</TableHead>
                  <TableHead className="sticky top-0 bg-white z-20">Company</TableHead>
                  <TableHead className="sticky top-0 bg-white z-20">WhatsApp</TableHead>
                  <TableHead className="sticky top-0 bg-white z-20">Email</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredBeneficiaryData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-40 text-center text-slate-500">
                      No Beneficiary Found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBeneficiaryData.map((item: BeneficiaryRecord, index) => (
                    <TableRow key={item.id} className="hover:bg-slate-50 transition-colors">
                      <TableCell className="w-24">
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditBeneficiary(item)}
                            className="h-8 w-8 p-0 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteBeneficiary(item.id)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-slate-500">{index + 1}</TableCell>
                      <TableCell className="font-semibold text-slate-700">{item.beneficiary_name}</TableCell>
                      <TableCell className="text-xs font-mono text-slate-600">{item.beneficiary_account_number}</TableCell>
                      <TableCell className="text-slate-600">{item.beneficiary_bank_name}</TableCell>
                      <TableCell className="text-xs font-mono text-slate-600">{item.beneficiary_bank_ifsc}</TableCell>
                      <TableCell className="text-slate-600">{item.company_name}</TableCell>
                      <TableCell className="text-slate-600">{item.whatsapp_no}</TableCell>
                      <TableCell className="text-slate-600">{item.email_id}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-md overflow-hidden border-none">
          <CardContent className="p-0">
            <Table wrapperClassName="max-h-[70vh] overflow-auto">
              <TableHeader className="sticky top-0 z-50 bg-white">
                <TableRow>
                  <TableHead className="sticky top-0 bg-white z-20 w-24">Action</TableHead>
                  <TableHead className="sticky top-0 bg-white z-20 w-16">S.No</TableHead>
                  <TableHead className="sticky top-0 bg-white z-20">Company Name</TableHead>
                  <TableHead className="sticky top-0 bg-white z-20">Bank Name</TableHead>
                  <TableHead className="sticky top-0 bg-white z-20">Account Number</TableHead>
                  <TableHead className="sticky top-0 bg-white z-20">IFSC Code</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredContraData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-40 text-center text-slate-500">
                      No Contra Record Found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredContraData.map((item: ContraRecord, index) => (
                    <TableRow key={item.id} className="hover:bg-slate-50 transition-colors">
                      <TableCell className="w-24">
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditContra(item)}
                            className="h-8 w-8 p-0 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteContra(item.id)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-slate-500">{index + 1}</TableCell>
                      <TableCell className="font-semibold text-slate-700">{item.company_name}</TableCell>
                      <TableCell className="text-slate-600">{item.bank_name}</TableCell>
                      <TableCell className="text-xs font-mono text-slate-600">{item.account_no}</TableCell>
                      <TableCell className="text-xs font-mono text-slate-600">{item.ifsc_code}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}


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

                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Transaction Type</label>
                  <Input
                    name="transaction_type"
                    placeholder="e.g. Bank Transfer, Cash"
                    onChange={handleChange}
                    value={formData.transaction_type}

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



      {beneficiaryOpen && (
  <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
    <Card className="w-full max-w-xl">
      <CardHeader>
        <div className="flex justify-between">
          <CardTitle>Add Beneficiary</CardTitle>

          <Button
            variant="ghost"
            onClick={() => setBeneficiaryOpen(false)}
          >
            <X />
          </Button>
        </div>
      </CardHeader>

      <form onSubmit={handleBeneficiarySubmit}>
        <CardContent className="space-y-4">

          <Input
            name="beneficiary_name"
            placeholder="Beneficiary Name"
            value={beneficiaryForm.beneficiary_name}
            onChange={handleBeneficiaryChange}
          />

          <Input
            name="beneficiary_account_number"
            placeholder="Account Number"
            value={beneficiaryForm.beneficiary_account_number}
            onChange={handleBeneficiaryChange}
          />

          <Input
            name="beneficiary_bank_name"
            placeholder="Bank Name"
            value={beneficiaryForm.beneficiary_bank_name}
            onChange={handleBeneficiaryChange}
          />

          <Input
            name="beneficiary_bank_ifsc"
            placeholder="IFSC Code"
            value={beneficiaryForm.beneficiary_bank_ifsc}
            onChange={handleBeneficiaryChange}
          />

          <Input
            name="company_name"
            placeholder="Company Name"
            value={beneficiaryForm.company_name}
            onChange={handleBeneficiaryChange}
          />

          <Input
            name="whatsapp_no"
            placeholder="WhatsApp No"
            value={beneficiaryForm.whatsapp_no}
            onChange={handleBeneficiaryChange}
          />

          <Input
            name="email_id"
            placeholder="Email"
            value={beneficiaryForm.email_id}
            onChange={handleBeneficiaryChange}
          />
        </CardContent>

        <div className="p-4 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setBeneficiaryOpen(false)}
          >
            Cancel
          </Button>

          <Button type="submit">
            Save Beneficiary
          </Button>
        </div>
      </form>
    </Card>
  </div>
)}

      {/* Edit Master Modal */}
      {editId !== null && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <Card className="w-full max-w-lg shadow-2xl border-none">
            <CardHeader className="bg-indigo-600 text-white rounded-t-xl py-4">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Edit className="h-5 w-5" /> Edit Record
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setEditId(null)} className="text-white hover:bg-indigo-700 p-0 h-8 w-8">
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>

            <form onSubmit={(e) => { e.preventDefault(); handleUpdate(editId); }}>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Company Name</label>
                  <Input
                    name="company_name"
                    placeholder="Enter company name"
                    onChange={handleEditChange}
                    value={editData.company_name}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Transaction Type</label>
                  <Input
                    name="transaction_type"
                    placeholder="e.g. Bank Transfer, Cash"
                    onChange={handleEditChange}
                    value={editData.transaction_type}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Project</label>
                  <Input
                    name="project"
                    placeholder="Enter project name"
                    onChange={handleEditChange}
                    value={editData.project}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Bank Account (From)</label>
                  <Input
                    name="bank_ac_from"
                    placeholder="Enter account number/details"
                    onChange={handleEditChange}
                    value={editData.bank_ac_from}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Payment From Company</label>
                  <Input
                    name="payment_from_company"
                    placeholder="Enter source company"
                    onChange={handleEditChange}
                    value={editData.payment_from_company}
                  />
                </div>
              </CardContent>

              <div className="p-4 border-t bg-slate-50 rounded-b-xl flex justify-end gap-3">
                <Button variant="outline" type="button" onClick={() => setEditId(null)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isUpdating}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[100px]"
                >
                  {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Edit Beneficiary Modal */}
      {editBeneficiaryId !== null && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
          <Card className="w-full max-w-xl animate-in fade-in zoom-in-95 duration-150">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Edit className="h-5 w-5" /> Edit Beneficiary
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditBeneficiaryId(null)}
                  className="p-0 h-8 w-8"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>

            <form onSubmit={handleUpdateBeneficiary}>
              <CardContent className="space-y-4 max-h-[60vh] overflow-y-auto">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Beneficiary Name</label>
                  <Input
                    name="beneficiary_name"
                    placeholder="Beneficiary Name"
                    value={editBeneficiaryForm.beneficiary_name}
                    onChange={handleEditBeneficiaryChange}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Account Number</label>
                  <Input
                    name="beneficiary_account_number"
                    placeholder="Account Number"
                    value={editBeneficiaryForm.beneficiary_account_number}
                    onChange={handleEditBeneficiaryChange}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Bank Name</label>
                  <Input
                    name="beneficiary_bank_name"
                    placeholder="Bank Name"
                    value={editBeneficiaryForm.beneficiary_bank_name}
                    onChange={handleEditBeneficiaryChange}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">IFSC Code</label>
                  <Input
                    name="beneficiary_bank_ifsc"
                    placeholder="IFSC Code"
                    value={editBeneficiaryForm.beneficiary_bank_ifsc}
                    onChange={handleEditBeneficiaryChange}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Company Name</label>
                  <Input
                    name="company_name"
                    placeholder="Company Name"
                    value={editBeneficiaryForm.company_name}
                    onChange={handleEditBeneficiaryChange}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">WhatsApp No</label>
                  <Input
                    name="whatsapp_no"
                    placeholder="WhatsApp No"
                    value={editBeneficiaryForm.whatsapp_no}
                    onChange={handleEditBeneficiaryChange}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Email</label>
                  <Input
                    name="email_id"
                    placeholder="Email"
                    value={editBeneficiaryForm.email_id}
                    onChange={handleEditBeneficiaryChange}
                  />
                </div>
              </CardContent>

              <div className="p-4 border-t bg-slate-50 rounded-b-xl flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditBeneficiaryId(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isUpdating} className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[100px]">
                  {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {contraOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <Card className="w-full max-w-lg shadow-2xl border-none">
            <CardHeader className="bg-indigo-600 text-white rounded-t-xl py-4">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Plus className="h-5 w-5" /> Add Contra Record
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setContraOpen(false)} className="text-white hover:bg-indigo-700 p-0 h-8 w-8">
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>

            <form onSubmit={handleContraSubmit}>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Company Name</label>
                  <Input
                    name="company_name"
                    placeholder="Enter company name"
                    onChange={handleContraChange}
                    value={contraForm.company_name}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Bank Name</label>
                  <Input
                    name="bank_name"
                    placeholder="Enter bank name"
                    onChange={handleContraChange}
                    value={contraForm.bank_name}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Account Number</label>
                  <Input
                    name="account_no"
                    placeholder="Enter account number"
                    onChange={handleContraChange}
                    value={contraForm.account_no}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">IFSC Code</label>
                  <Input
                    name="ifsc_code"
                    placeholder="Enter IFSC code"
                    onChange={handleContraChange}
                    value={contraForm.ifsc_code}
                    required
                  />
                </div>
              </CardContent>

              <div className="p-4 border-t bg-slate-50 rounded-b-xl flex justify-end gap-3">
                <Button variant="outline" type="button" onClick={() => setContraOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isUpdating}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[100px]"
                >
                  {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Contra"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {editContraId !== null && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <Card className="w-full max-w-lg shadow-2xl border-none">
            <CardHeader className="bg-indigo-600 text-white rounded-t-xl py-4">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Edit className="h-5 w-5" /> Edit Contra Record
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setEditContraId(null)} className="text-white hover:bg-indigo-700 p-0 h-8 w-8">
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>

            <form onSubmit={handleUpdateContra}>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Company Name</label>
                  <Input
                    name="company_name"
                    placeholder="Enter company name"
                    onChange={handleEditContraChange}
                    value={editContraForm.company_name}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Bank Name</label>
                  <Input
                    name="bank_name"
                    placeholder="Enter bank name"
                    onChange={handleEditContraChange}
                    value={editContraForm.bank_name}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Account Number</label>
                  <Input
                    name="account_no"
                    placeholder="Enter account number"
                    onChange={handleEditContraChange}
                    value={editContraForm.account_no}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">IFSC Code</label>
                  <Input
                    name="ifsc_code"
                    placeholder="Enter IFSC code"
                    onChange={handleEditContraChange}
                    value={editContraForm.ifsc_code}
                    required
                  />
                </div>
              </CardContent>

              <div className="p-4 border-t bg-slate-50 rounded-b-xl flex justify-end gap-3">
                <Button variant="outline" type="button" onClick={() => setEditContraId(null)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isUpdating}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[100px]"
                >
                  {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
