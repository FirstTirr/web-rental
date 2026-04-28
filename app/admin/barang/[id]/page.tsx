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
  const [productName, setProductName] = useState("Produk");

  // State untuk Modal Edit
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<UnitBarang | null>(null);
  const [editForm, setEditForm] = useState({ asset_code: "", status: "" });

  // --- IMPLEMENTASI BARU: State Modal Tambah ---
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({ asset_code: "" });

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const fetchUnits = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/item-instances?product_id=${id}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const result = await res.json();
      if (res.ok) setUnits(result.data || []);
    } catch (err) { setError("Koneksi gagal"); }
    finally { setLoading(false); }
  }, [API_URL, id]);

  useEffect(() => {
    fetchUnits();
  }, [fetchUnits]);

  // --- IMPLEMENTASI BARU: Fungsi Simpan Unit Baru ---
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
        alert("Unit berhasil ditambah!");
        setIsAddModalOpen(false);
        setAddForm({ asset_code: "" });
        fetchUnits();
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
        alert("Berhasil diupdate!");
        setIsEditModalOpen(false);
        fetchUnits();
      } else {
        const result = await res.json();
        alert("Gagal: " + result.error);
      }
    } catch (err) { alert("Kesalahan server"); }
  };

  const handleDelete = async (unitId: number) => {
    if (!confirm("Hapus unit ini?")) return;
    try {
      const token = localStorage.getItem("token");
      await fetch(`${API_URL}/api/item-instances/${unitId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      fetchUnits();
    } catch (err) { alert("Gagal hapus"); }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <Link href="/admin/barang" className="bg-slate-100 p-2 rounded-xl"> Kembali </Link>
        <h1 className="text-2xl font-bold">{productName}</h1>
        {/* FIX: Sekarang membuka Modal Tambah */}
        <button 
          onClick={() => setIsAddModalOpen(true)} 
          className="bg-blue-600 text-white px-4 py-2 rounded-xl"
        >
          + Tambah
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border">
        <table className="w-full">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="p-4 text-center">No</th>
              <th className="p-4">Asset Code</th>
              <th className="p-4 text-center">Status</th>
              <th className="p-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {units.map((unit, index) => (
              <tr key={unit.id} className="border-b">
                <td className="p-4 text-center">{index + 1}</td>
                <td className="p-4 font-mono font-bold text-blue-600">{unit.asset_code}</td>
                <td className="p-4 text-center capitalize">
                   <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${unit.status === 'available' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                    {unit.status}
                   </span>
                </td>
                <td className="p-4 flex justify-center gap-2">
                  <button onClick={() => openEditModal(unit)} className="bg-slate-900 text-white px-4 py-1 rounded-lg text-xs">EDIT</button>
                  <button onClick={() => handleDelete(unit.id)} className="bg-rose-50 text-rose-600 px-4 py-1 rounded-lg text-xs">HAPUS</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL EDIT */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-[2rem] w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-black mb-4">Edit Unit</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">Asset Code</label>
                <input 
                  className="w-full p-3 bg-slate-100 rounded-xl mt-1"
                  value={editForm.asset_code}
                  onChange={(e) => setEditForm({...editForm, asset_code: e.target.value})}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">Status</label>
                <select 
                  className="w-full p-3 bg-slate-100 rounded-xl mt-1"
                  value={editForm.status}
                  onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                >
                  <option value="available">Available</option>
                  <option value="booked">Booked</option>
                  <option value="rented">Rented</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-8">
              <button onClick={() => setIsEditModalOpen(false)} className="flex-1 p-3 bg-slate-100 rounded-xl font-bold">Batal</button>
              <button onClick={handleUpdate} className="flex-1 p-3 bg-blue-600 text-white rounded-xl font-bold">Simpan</button>
            </div>
          </div>
        </div>
      )}

      {/* --- IMPLEMENTASI BARU: Modal Tambah --- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-[2rem] w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-black mb-4">Tambah Unit Baru</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">Asset Code</label>
                <input 
                  placeholder="Contoh: LN-001"
                  className="w-full p-3 bg-slate-100 rounded-xl mt-1"
                  value={addForm.asset_code}
                  onChange={(e) => setAddForm({ asset_code: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-2 mt-8">
              <button onClick={() => setIsAddModalOpen(false)} className="flex-1 p-3 bg-slate-100 rounded-xl font-bold">Batal</button>
              <button onClick={handleAddUnit} className="flex-1 p-3 bg-blue-600 text-white rounded-xl font-bold">Tambah Unit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}