"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const menuItems = [
  { id: 'dashboard', label: "Dashboard", path: "/admin" },
  { id: 'barang', label: "CRUD Barang", path: "/admin/barang" },
  { id: 'rekap', label: "Rekap Penjualan", path: "/admin/rekap" },
  { id: 'pesanan', label: "Log Pesanan", path: "/admin/pesanan" },
  { id: 'konfirmasi', label: "Konfirmasi Pembayaran", path: "/admin/konfirmasiPembayaran" },
  { id: 'validasi', label: "Validasi Pesanan", path: "/admin/validasiPesanan" },
];

export default function SideBar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-72 bg-[#0f172a] text-white p-6 hidden lg:flex flex-col z-50 shadow-2xl">
      <div className="flex items-center gap-3 mb-12 px-2">
        <div className="h-8 w-8 bg-blue-500 rounded-xl rotate-12 shadow-lg shadow-blue-500/50" />
        <h2 className="text-xl font-black tracking-tight uppercase">Rental.in Admin</h2>
      </div>

      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => (
          <Link
            key={item.id}
            href={item.path}
            className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 ${
              pathname === item.path 
              ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/30' 
              : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <span className="text-xl"></span>
            <span className="font-bold text-sm tracking-wide">{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}