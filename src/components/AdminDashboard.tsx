import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Save, 
  X, 
  RefreshCw, 
  Package, 
  FileText, 
  Users, 
  ClipboardList,
  Lock as LockIcon,
  Eye
} from "lucide-react";

interface AdminDashboardProps {
  adminPassword: string;
}

type TableName = "products" | "blog_posts" | "consultations" | "profiles";

export default function AdminDashboard({ adminPassword }: AdminDashboardProps) {
  const [activeTable, setActiveTable] = useState<TableName>("products");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [isAdding, setIsAdding] = useState(false);

  const tables: { id: TableName; label: string; icon: any }[] = [
    { id: "products", label: "Products", icon: Package },
    { id: "blog_posts", label: "Blog Posts", icon: FileText },
    { id: "consultations", label: "Consultations", icon: ClipboardList },
    { id: "profiles", label: "Profiles", icon: Users },
  ];

  useEffect(() => {
    fetchData();
  }, [activeTable]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/${activeTable}`, {
        headers: { "x-admin-password": adminPassword }
      });
      const result = await res.json();
      if (Array.isArray(result)) {
        setData(result);
      } else {
        setData([]);
      }
    } catch (e) {
      console.error("Fetch error:", e);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (id?: string) => {
    setLoading(true);
    try {
      const method = id ? "PUT" : "POST";
      const url = id ? `/api/admin/${activeTable}/${id}` : `/api/admin/${activeTable}`;
      
      const res = await fetch(url, {
        method,
        headers: { 
          "Content-Type": "application/json",
          "x-admin-password": adminPassword 
        },
        body: JSON.stringify(editForm)
      });

      if (res.ok) {
        setEditingId(null);
        setIsAdding(false);
        setEditForm({});
        fetchData();
      } else {
        const err = await res.json();
        alert(`Error: ${err.error}`);
      }
    } catch (e) {
      alert("Failed to save data");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/${activeTable}/${id}`, {
        method: "DELETE",
        headers: { "x-admin-password": adminPassword }
      });
      if (res.ok) {
        fetchData();
      }
    } catch (e) {
      alert("Delete failed");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (item: any) => {
    setEditingId(item.id);
    setEditForm(item);
    setIsAdding(false);
  };

  const startAdd = () => {
    setIsAdding(true);
    setEditingId(null);
    // Initialize with default values based on table
    const defaults: any = { id: Math.random().toString(36).substring(2) + Date.now().toString(36) };
    if (activeTable === "products") {
      defaults.name = "";
      defaults.product_code = "";
      defaults.price_naira = 0;
      defaults.discount_percent = 0;
      defaults.health_benefits = [];
    } else if (activeTable === "blog_posts") {
      defaults.title = "";
      defaults.content = "";
      defaults.tags = [];
    }
    setEditForm(defaults);
  };

  const renderField = (key: string, value: any) => {
    if (key === "id" || key === "created_at" || key === "updated_at") {
      return <span className="text-slate-400 text-[10px] font-mono">{value}</span>;
    }

    if (Array.isArray(value)) {
      return (
        <input 
          className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs"
          value={value.join(", ")}
          onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value.split(",").map(s => s.trim()) })}
        />
      );
    }

    if (typeof value === "number") {
      return (
        <input 
          type="number"
          className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs"
          value={value}
          onChange={(e) => setEditForm({ ...editForm, [key]: parseFloat(e.target.value) })}
        />
      );
    }

    if (key === "content" || key === "symptoms" || key === "ai_recommendation") {
      return (
        <textarea 
          className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs h-24"
          value={value || ""}
          onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })}
        />
      );
    }

    return (
      <input 
        className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs"
        value={value || ""}
        onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })}
      />
    );
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xl">
      <div className="flex flex-col md:flex-row border-b border-slate-200">
        <div className="md:w-64 bg-slate-50 border-r border-slate-200 p-6 space-y-2">
          <div className="flex items-center gap-2 text-slate-400 mb-6 px-2">
            <LockIcon size={14} />
            <span className="text-[10px] uppercase font-bold tracking-widest">Admin Control</span>
          </div>
          {tables.map(table => (
            <button
              key={table.id}
              onClick={() => { setActiveTable(table.id); setIsAdding(false); setEditingId(null); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                activeTable === table.id 
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200" 
                  : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              <table.icon size={18} />
              {table.label}
            </button>
          ))}
        </div>

        <div className="flex-1 p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 capitalize">{activeTable.replace("_", " ")}</h2>
              <p className="text-slate-500 text-sm">Manage and populate your live database.</p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={fetchData}
                className="p-3 text-slate-400 hover:text-emerald-600 transition-colors bg-slate-50 rounded-xl"
              >
                <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
              </button>
              <button 
                onClick={startAdd}
                className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
              >
                <Plus size={18} />
                Add New
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="py-4 px-4 text-[10px] uppercase font-bold text-slate-400 tracking-wider">Data</th>
                  <th className="py-4 px-4 text-[10px] uppercase font-bold text-slate-400 tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {isAdding && (
                  <tr className="bg-emerald-50/30">
                    <td className="py-6 px-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.keys(editForm).map(key => (
                          <div key={key} className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">{key}</label>
                            {renderField(key, editForm[key])}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="py-6 px-4 text-right align-top">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleSave()} className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
                          <Save size={16} />
                        </button>
                        <button onClick={() => setIsAdding(false)} className="p-2 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300">
                          <X size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
                {data.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="py-6 px-4">
                      {editingId === item.id ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {Object.keys(editForm).map(key => (
                            <div key={key} className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-400 uppercase">{key}</label>
                              {renderField(key, editForm[key])}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800">{item.name || item.title || item.patient_name || item.full_name || "Untitled"}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{item.id.slice(0,8)}...</span>
                          </div>
                          <div className="text-xs text-slate-500 line-clamp-1">
                            {Object.entries(item)
                              .filter(([k]) => !["id", "name", "title", "patient_name", "full_name", "created_at", "updated_at"].includes(k))
                              .map(([k, v]) => `${k}: ${v}`).join(" | ")}
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="py-6 px-4 text-right align-top">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {editingId === item.id ? (
                          <>
                            <button onClick={() => handleSave(item.id)} className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
                              <Save size={16} />
                            </button>
                            <button onClick={() => setEditingId(null)} className="p-2 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300">
                              <X size={16} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => startEdit(item)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                              <Edit2 size={16} />
                            </button>
                            <button onClick={() => handleDelete(item.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.length === 0 && !loading && !isAdding && (
              <div className="text-center py-20">
                <p className="text-slate-400">No data found in this table.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
