"use client";
import React, { useState, useEffect, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface UnitBarang {
  id: number;
  product_id: number;
  asset_code: string;
  status: string;
}

export default function DetailUnitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  
  const [units, setUnits] = useState<UnitBarang[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [productName, setProductName] = useState("Memuat...");

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<UnitBarang | null>(null);
  const [editForm, setEditForm] = useState({ asset_code: "", status: "" });

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({ asset_code: "" });

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // Fungsi ambil data unit & nama produk
  const fetchData = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    try {
      // 1. Ambil Nama Produk
      const resProd = await fetch(`${API_URL}/api/products/${id}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const prodResult = await resProd.json();
      if (resProd.ok) setProductName(prodResult.data.name);

      // 2. Ambil List Units
      const resUnits = await fetch(`${API_URL}/api/item-instances?product_id=${id}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const unitResult = await resUnits.json();
      if (resUnits.ok) setUnits(unitResult.data || []);
      
    } catch (err) { 
      setError("Koneksi ke server gagal"); 
    } finally { 
      setLoading(false); 
    }
  }, [API_URL, id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddUnit = async () => {
    if (!addForm.asset_code) return alert("Asset code wajib diisi");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/products/${id}/instances`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          product_id: Number(id),
          asset_code: addForm.asset_code,
          status: "available"
        })
      });

      if (res.ok) {
        setIsAddModalOpen(false);
        setAddForm({ asset_code: "" });
        fetchData();
      } else {
        const result = await res.json();
        alert("Gagal: " + result.error);
      }
    } catch (err) { alert("Kesalahan server"); }
  };

  const openEditModal = (unit: UnitBarang) => {
    setEditingUnit(unit);
    setEditForm({ asset_code: unit.asset_code, status: unit.status });
    setIsEditModalOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingUnit) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/item-instances/${editingUnit.id}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(editForm)
      });

      if (res.ok) {
        setIsEditModalOpen(false);
        fetchData();
      } else {
        const result = await res.json();
        alert("Gagal: " + result.error);
      }
    } catch (err) { alert("Kesalahan server"); }
  };

  const handleDelete = async (unitId: number) => {
    if (!confirm("Hapus unit ini secara permanen?")) return;
    try {
      const token = localStorage.getItem("token");
      await fetch(`${API_URL}/api/item-instances/${unitId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      fetchData();
    } catch (err) { alert("Gagal hapus unit"); }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
        <div>
          <Link href="/admin/barang" className="text-xs font-black text-indigo-600 uppercase tracking-widest hover:underline flex items-center gap-2 mb-2">
            ← Kembali ke CRUD Barang
          </Link>
          <h1 className="text-4xl font-black tracking-tighter uppercase italic text-slate-900 leading-none">
            Manage Unit: <span className="text-indigo-600">{productName}</span>
          </h1>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)} 
          className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-indigo-200 hover:scale-105 active:scale-95 transition-all"
        >
          + Tambah Unit Baru
        </button>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 overflow-hidden border border-slate-100">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 border-b border-slate-100">
            <tr>
              <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center w-20">No</th>
              <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Asset Code</th>
              <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Status</th>
              <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan={4} className="p-20 text-center text-slate-400 font-bold italic">Mengambil data unit...</td></tr>
            ) : units.length === 0 ? (
              <tr><td colSpan={4} className="p-20 text-center text-slate-400 font-bold italic">Belum ada unit untuk produk ini.</td></tr>
            ) : (
              units.map((unit, index) => (
                <tr key={unit.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-6 text-center font-bold text-slate-400 text-sm">{index + 1}</td>
                  <td className="p-6">
                    <span className="font-mono font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg text-sm italic">
                      {unit.asset_code}
                    </span>
                  </td>
                  <td className="p-6 text-center">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${
                      unit.status === 'available' ? 'bg-emerald-100 text-emerald-600' : 
                      unit.status === 'rented' ? 'bg-blue-100 text-blue-600' : 
                      'bg-rose-100 text-rose-600'
                    }`}>
                      {unit.status}
                    </span>
                  </td>
                  <td className="p-6">
                    <div className="flex justify-end gap-3">
                      <button onClick={() => openEditModal(unit)} className="bg-slate-900 text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all">EDIT</button>
                      <button onClick={() => handleDelete(unit.id)} className="bg-rose-50 text-rose-600 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all">HAPUS</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL EDIT & TAMBAH (Gaya Neo-Brutalism) */}
      {(isEditModalOpen || isAddModalOpen) && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-10 rounded-[3rem] w-full max-w-md shadow-2xl border border-white">
            <h2 className="text-2xl font-black italic uppercase tracking-tighter mb-6">
              {isEditModalOpen ? "Update Unit" : "Registrasi Unit"}
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Asset Code / Serial Number</label>
                <input 
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl mt-2 font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                  placeholder="Contoh: TYT-AVZ-001"
                  value={isEditModalOpen ? editForm.asset_code : addForm.asset_code}
                  onChange={(e) => isEditModalOpen 
                    ? setEditForm({...editForm, asset_code: e.target.value})
                    : setAddForm({ asset_code: e.target.value })
                  }
                />
              </div>

              {isEditModalOpen && (
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kondisi / Status Unit</label>
                  <select 
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl mt-2 font-bold outline-none"
                    value={editForm.status}
                    onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                  >
                    <option value="available">Available (Siap Sewa)</option>
                    <option value="booked">Booked (Sudah Dipesan)</option>
                    <option value="rented">Rented (Sedang Disewa)</option>
                    <option value="maintenance">Maintenance (Perbaikan)</option>
                  </select>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-10">
              <button 
                onClick={() => { setIsEditModalOpen(false); setIsAddModalOpen(false); }} 
                className="flex-1 py-4 bg-slate-100 rounded-2xl font-black uppercase text-[10px] tracking-widest"
              >
                Batal
              </button>
              <button 
                onClick={isEditModalOpen ? handleUpdate : handleAddUnit} 
                className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-indigo-100"
              >
                {isEditModalOpen ? "Simpan Perubahan" : "Konfirmasi Tambah"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}