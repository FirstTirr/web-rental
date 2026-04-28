"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation'; // Tambahkan useRouter
import CrudBarang from './crudBarang';

export default function ProductTable() {
  const router = useRouter(); // Inisialisasi router
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    mode: 'tambah' | 'edit' | 'hapus' | 'detail';
    data?: any;
  }>({ isOpen: false, mode: 'tambah' });

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const getImageUrl = (photoUrl: string) => {
    if (!photoUrl) return null;
    if (photoUrl.includes('/')) {
      const parts = photoUrl.split('/');
      const fileName = parts[parts.length - 1];
      return `${API_URL}/api/images/products/${fileName}`;
    }
    return `${API_URL}/api/images/products/${photoUrl}`;
  };

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token"); // Token diambil dari localStorage sesuai koreksimu
      const res = await fetch(`${API_URL}/api/products?limit=100`, {
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      
      const result = await res.json();
      if (res.ok) {
        setProducts(Array.isArray(result.data) ? result.data : []);
      } else {
        setProducts([]);
      }
    } catch (err) {
      setProducts([]); 
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return (
    <div className="p-4 md:p-8">
      <div className='flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4'>
        <div>
          <h1 className='text-3xl font-black text-slate-900 tracking-tighter'>Manajemen Barang</h1>
          <p className='text-slate-500 font-medium'>Level ini hanya menampilkan daftar produk. Klik barang untuk mengelola unit fisik.</p>
        </div>
        <button 
          onClick={() => setModalConfig({ isOpen: true, mode: 'tambah' })}
          className='py-3 px-6 bg-blue-600 rounded-2xl text-white font-bold hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all active:scale-95'
        >
          + Tambah Produk
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50/50 text-slate-400 border-b border-slate-50">
                <th className="p-6 font-black text-[10px] uppercase tracking-widest">Foto</th>
                <th className="p-6 font-black text-[10px] uppercase tracking-widest text-center">ID</th>
                <th className="p-6 font-black text-[10px] uppercase tracking-widest">Nama Produk</th>
                <th className="p-6 font-black text-[10px] uppercase tracking-widest">Kategori</th>
                <th className="p-6 font-black text-[10px] uppercase tracking-widest">Harga /Hari</th>
                <th className="p-6 font-black text-[10px] uppercase tracking-widest text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={6} className="p-20 text-center text-slate-400 font-bold italic animate-pulse">Menghubungkan ke database...</td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan={6} className="p-20 text-center text-slate-400 font-bold">Belum ada produk terdaftar.</td></tr>
              ) : products.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/50 transition-all group">
                  <td className="p-6">
                    <div className="w-12 h-12 bg-slate-100 rounded-xl overflow-hidden flex items-center justify-center border border-slate-50">
                      {p.photo_url ? (
                        <img 
                          src={getImageUrl(p.photo_url) || ""} 
                          alt={p.name} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform" 
                          onError={(e) => { e.currentTarget.src = "https://placehold.co/100x100?text=No+Image"; }}
                        />
                      ) : (
                        <span className="text-xl text-slate-300">🖼️</span>
                      )}
                    </div>
                  </td>
                  <td className="p-6 font-mono text-[10px] text-blue-600 font-bold text-center">
                      <span className="bg-blue-50 px-2 py-1 rounded-md">ID-{p.id}</span>
                  </td>
                  <td className="p-6">
                    <p className="font-black text-slate-800 text-base leading-tight">{p.name}</p>
                  </td>
                  <td className="p-6 font-black text-slate-900">
                      {p.category?.name || p.category_name || "General"}
                  </td>
                  <td className="p-6 font-black text-slate-900">
                    Rp{Number(p.price_per_day || 0).toLocaleString("id-ID")}
                  </td>
                  <td className="p-6">
                    <div className="flex justify-center gap-2">
                      {/* TOMBOL BARANG BARU */}
                      <button 
                        onClick={() => router.push(`/admin/barang/${p.id}`)}
                        className="p-2 px-4 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all active:scale-95"
                      >
                        Barang
                      </button>
                      <button 
                        onClick={() => setModalConfig({ isOpen: true, mode: 'detail', data: p })}
                        className="p-2 px-4 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-blue-600 transition-all active:scale-95"
                      >
                        Detail
                      </button>
                      <button 
                        onClick={() => setModalConfig({ isOpen: true, mode: 'hapus', data: p })}
                        className="p-2 px-4 rounded-xl bg-rose-50 text-rose-500 text-xs font-bold hover:bg-rose-100 transition-all active:scale-95"
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <CrudBarang 
        isOpen={modalConfig.isOpen} 
        mode={modalConfig.mode}
        data={modalConfig.data}
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
        onEdit={() => setModalConfig({ ...modalConfig, mode: 'edit' })} 
        refreshData={fetchProducts} 
      />
    </div>
  );
}