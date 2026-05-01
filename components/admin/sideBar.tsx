"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation'; // Tambah useRouter
import { useState } from 'react';

const menuItems = [
  { id: 'dashboard', label: "Dashboard", path: "/admin" },
  { id: 'validasi', label: "Validasi Pesanan", path: "/admin/validasi" },
  { id: 'konfirmasi', label: "Konfirmasi Pembayaran", path: "/admin/pembayaran-page" },
  { id: 'category', label: "Manajemen Kategori", path: "/admin/category" },
  { id: 'barang', label: "CRUD Barang", path: "/admin/barang" },
  { id: 'rekap', label: "Rekap Penjualan", path: "/admin/rekap" },
  { id: 'pesanan', label: "Log Pesanan", path: "/admin/log-pesanan" },
];

export default function SideBar() {
  const pathname = usePathname();
  const router = useRouter(); // Inisialisasi router
  const [isOpen, setIsOpen] = useState(false);

  const closeMenu = () => setIsOpen(false);

  // --- FUNGSI LOGOUT ---
  const handleLogout = () => {
    if (confirm("Apakah Anda yakin ingin keluar?")) {
      // 1. Hapus token dari localstorage sesuai koreksi data sebelumnya
      localStorage.removeItem("token");
      
      // 2. Redirect ke halaman login admin (sesuaikan path-nya)
      router.push('/login');
      
      // Optional: Refresh halaman untuk memastikan state bersih
      router.refresh();
    }
  };

  const SidebarContent = (
    <>
      <div className="flex items-center gap-3 mb-8 px-2">
        <div className="h-8 w-8 bg-blue-500 rounded-xl rotate-12 shadow-lg shadow-blue-500/50" />
        <h2 className="text-lg sm:text-xl font-black tracking-tight uppercase leading-tight">Rental.in Admin</h2>
      </div>

      <nav className="flex-1 space-y-2 overflow-y-auto pr-1">
        {menuItems.map((item) => (
          <Link
            key={item.id}
            href={item.path}
            onClick={closeMenu}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 ${
              pathname === item.path
                ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/30'
                : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <span className="font-bold text-sm tracking-wide leading-snug">{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* --- TOMBOL LOGOUT --- */}
      <div className="pt-6 mt-6 border-t border-slate-800">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-rose-400 hover:bg-rose-500/10 hover:text-rose-500 transition-all duration-300 group"
        >
          <svg 
            className="w-5 h-5 transition-transform group-hover:translate-x-1" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor" 
            strokeWidth="2.5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
          </svg>
          <span className="font-black text-sm tracking-wide uppercase">Logout</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Header Mobile */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
        <h2 className="text-base font-black tracking-tight text-slate-900">Rental.in Admin</h2>
        <button
          onClick={() => setIsOpen(true)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700"
          aria-label="Buka menu admin"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </header>

      {/* Sidebar Mobile */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            onClick={closeMenu}
            className="absolute inset-0 bg-slate-900/50"
            aria-label="Tutup menu admin"
          />
          <aside className="absolute left-0 top-0 h-full w-[85vw] max-w-72 bg-[#0f172a] text-white p-5 sm:p-6 shadow-2xl flex flex-col">
            {SidebarContent}
          </aside>
        </div>
      )}

      {/* Sidebar Desktop */}
      <aside className="fixed inset-y-0 left-0 hidden w-72 bg-[#0f172a] text-white p-6 lg:flex flex-col z-50 shadow-2xl">
        {SidebarContent}
      </aside>
    </>
  );
}