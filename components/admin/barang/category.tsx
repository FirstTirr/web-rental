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
    const timer = setTimeout(() => {
      void fetchCategories();
    }, 0);

    return () => clearTimeout(timer);
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
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Manajemen Kategori</h1>
            <p className="text-slate-500 font-medium text-sm">Kelola kategori produk persewaan Anda</p>
          </div>
          
          <form onSubmit={handleAdd} className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nama kategori baru..."
              className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-200 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold sm:min-w-[220px] transition-all"
            />
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-black text-sm shadow-lg shadow-blue-200 transition-all active:scale-95">
              Tambah
            </button>
          </form>
        </div>

        {/* Alert Messages */}
        {error && <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-xs font-bold animate-in fade-in slide-in-from-top-2">⚠️ {error}</div>}
        {message && <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-2xl text-xs font-bold animate-in fade-in slide-in-from-top-2">✅ {message}</div>}

        {/* Table Container */}
        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100">
                  <th className="px-4 sm:px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">ID</th>
                  <th className="px-4 sm:px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Nama Kategori</th>
                  <th className="px-4 sm:px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {isLoading ? (
                  <tr><td colSpan={3} className="px-8 py-10 text-center text-slate-400 font-bold">Memuat data...</td></tr>
                ) : categories.length === 0 ? (
                  <tr><td colSpan={3} className="px-8 py-10 text-center text-slate-400 font-bold">Tidak ada kategori ditemukan.</td></tr>
                ) : (
                  categories.map((cat) => (
                    <tr key={cat.id} className="group hover:bg-blue-50/30 transition-colors">
                      <td className="px-4 sm:px-8 py-5">
                        <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">#{cat.id}</span>
                      </td>
                      <td className="px-4 sm:px-8 py-5">
                        {editId === cat.id ? (
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full p-2 bg-white border border-blue-300 rounded-xl outline-none font-bold text-slate-800 text-sm shadow-sm"
                            autoFocus
                          />
                        ) : (
                          <span className="text-sm font-bold text-slate-700">{cat.name}</span>
                        )}
                      </td>
                      <td className="px-4 sm:px-8 py-5 text-right">
                        <div className="flex flex-wrap justify-end gap-2">
                          {editId === cat.id ? (
                            <>
                              <button onClick={() => handleUpdate(cat.id)} className="p-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all shadow-md shadow-emerald-100">
                                <span className="text-[10px] font-black px-2">SIMPAN</span>
                              </button>
                              <button onClick={() => setEditId(null)} className="p-2 bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-200 transition-all">
                                <span className="text-[10px] font-black px-2">BATAL</span>
                              </button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => { setEditId(cat.id); setEditName(cat.name); }} className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-blue-600 hover:text-white transition-all">
                                <span className="text-[10px] font-black px-2">EDIT</span>
                              </button>
                              <button onClick={() => handleDelete(cat.id)} className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-rose-600 hover:text-white transition-all">
                                <span className="text-[10px] font-black px-2">HAPUS</span>
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
    </div>
  );
}