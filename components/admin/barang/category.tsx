"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Category {
  id: number;
  name: string;
}

export default function CategoryManager() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [newName, setNewName] = useState("");
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");

  // State untuk Pop-up
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const getAuthHeaders = useCallback((): HeadersInit | null => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return null;
    }
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    };
  }, [router]);

  const fetchCategories = useCallback(async () => {
    const headers = getAuthHeaders();
    if (!headers) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/categories`, { headers });
      if (res.status === 401) throw new Error("Sesi berakhir.");
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setIsLoading(false);
    }
  }, [API_URL, getAuthHeaders]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const headers = getAuthHeaders();
    if (!headers || !newName.trim()) return;
    try {
      const res = await fetch(`${API_URL}/api/categories`, {
        method: "POST",
        headers,
        body: JSON.stringify({ name: newName }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      
      setNewName("");
      setIsModalOpen(false); // Tutup modal setelah berhasil
      setMessage("Kategori berhasil ditambahkan!");
      fetchCategories();
      setTimeout(() => setMessage(""), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    }
  };

  const handleUpdate = async (id: number) => {
    const headers = getAuthHeaders();
    if (!headers || !editName.trim()) return;
    try {
      const res = await fetch(`${API_URL}/api/categories/${id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ name: editName }),
      });
      if (!res.ok) throw new Error("Gagal update");
      setEditId(null);
      setMessage("Kategori diperbarui!");
      fetchCategories();
      setTimeout(() => setMessage(""), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Yakin ingin menghapus kategori ini?")) return;
    const headers = getAuthHeaders();
    if (!headers) return;
    try {
      const res = await fetch(`${API_URL}/api/categories/${id}`, { method: "DELETE", headers });
      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error || "Gagal hapus");
      }
      setMessage("Kategori berhasil dihapus.");
      fetchCategories();
      setTimeout(() => setMessage(""), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-3 sm:p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight italic uppercase">Manajemen Kategori</h1>
            <p className="text-slate-500 font-medium text-sm">Kelola kategori produk persewaan Anda</p>
          </div>
          
          {/* Tombol Pemicu Pop-up */}
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-200 transition-all active:scale-95 w-full sm:w-auto"
          >
            + Tambah Kategori
          </button>
        </div>

        {/* Alert Messages */}
        {error && <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-[10px] font-black uppercase tracking-widest">⚠️ {error}</div>}
        {message && <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-2xl text-[10px] font-black uppercase tracking-widest">✅ {message}</div>}

        {/* Table Container */}
        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-400">
                  <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-widest">ID</th>
                  <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-widest">Nama Kategori</th>
                  <th className="px-8 py-6 text-right text-[10px] font-black uppercase tracking-widest">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {isLoading ? (
                  <tr><td colSpan={3} className="px-8 py-20 text-center text-slate-400 font-black italic uppercase text-xs animate-pulse">Syncing Database...</td></tr>
                ) : categories.length === 0 ? (
                  <tr><td colSpan={3} className="px-8 py-20 text-center text-slate-400 font-black italic uppercase text-xs">No records found.</td></tr>
                ) : (
                  categories.map((cat) => (
                    <tr key={cat.id} className="group hover:bg-blue-50/30 transition-colors">
                      <td className="px-8 py-5">
                        <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-md">#{cat.id}</span>
                      </td>
                      <td className="px-8 py-5">
                        {editId === cat.id ? (
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full max-w-xs p-3 bg-white border-2 border-blue-200 rounded-xl outline-none font-bold text-slate-800 text-sm shadow-inner"
                            autoFocus
                          />
                        ) : (
                          <span className="text-sm font-black text-slate-700 uppercase italic">{cat.name}</span>
                        )}
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex justify-end gap-2">
                          {editId === cat.id ? (
                            <>
                              <button onClick={() => handleUpdate(cat.id)} className="p-2 px-4 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all">
                                <span className="text-[10px] font-black uppercase">Simpan</span>
                              </button>
                              <button onClick={() => setEditId(null)} className="p-2 px-4 bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-200 transition-all">
                                <span className="text-[10px] font-black uppercase">Batal</span>
                              </button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => { setEditId(cat.id); setEditName(cat.name); }} className="p-2 px-4 bg-slate-50 text-slate-400 rounded-xl hover:bg-blue-600 hover:text-white transition-all">
                                <span className="text-[10px] font-black uppercase">Edit</span>
                              </button>
                              <button onClick={() => handleDelete(cat.id)} className="p-2 px-4 bg-rose-50 text-rose-400 rounded-xl hover:bg-rose-600 hover:text-white transition-all">
                                <span className="text-[10px] font-black uppercase">Hapus</span>
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
        </div>
      </div>

      {/* --- POP-UP MODAL TAMBAH KATEGORI --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setIsModalOpen(false)}
          />
          
          {/* Modal Content */}
          <div className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900">Tambah Kategori</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l18 18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAdd} className="space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Nama Kategori</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Contoh: Kamera Digital"
                  className="w-full mt-2 px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-sm font-bold transition-all shadow-inner"
                  autoFocus
                />
              </div>

              <div className="flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-6 py-4 rounded-2xl bg-slate-100 text-slate-500 font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="flex-1 px-6 py-4 rounded-2xl bg-blue-600 text-white font-black text-xs uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all active:scale-95"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}