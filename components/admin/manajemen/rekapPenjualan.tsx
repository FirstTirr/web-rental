"use client";
import React from 'react';
import { motion } from 'framer-motion';

const summaryStats = [
  { label: "Penghasilan Bruto", value: "Rp15.200.000", detail: "+12% dari bulan lalu", color: "text-blue-600" },
  { label: "Total Unit Disewa", value: "142", detail: "24 unit sedang jalan", color: "text-emerald-600" },
  { label: "Total Denda", value: "Rp450.000", detail: "5 transaksi terlambat", color: "text-amber-600" },
];

const productPerformance = [
  { nama: "Kamera Canon M50", jumlah: 12, total: "Rp1.800.000", trend: "up" },
  { nama: "Sony A7III", jumlah: 8, total: "Rp2.400.000", trend: "up" },
  { nama: "Tripod Weifeng", jumlah: 20, total: "Rp700.000", trend: "down" },
  { nama: "Mic Rode GO", jumlah: 5, total: "Rp250.000", trend: "stable" },
];

export default function RekapPenjualan() {
  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Laporan Penjualan</h1>
          <p className="text-slate-500 text-sm font-medium">Periode: 1 April 2026 - 24 April 2026</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-[#00c692] hover:bg-[#00b082] text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-emerald-100">
            Export Excel
          </button>
        </div>
      </div>

      {/* 1. Total Penghasilan & Stats Ringkas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {summaryStats.map((stat, i) => (
          <motion.div 
            key={i}
            whileHover={{ y: -5 }}
            className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm"
          >
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
            <h2 className={`text-2xl font-black ${stat.color}`}>{stat.value}</h2>
            <p className="text-[10px] font-bold text-slate-400 mt-2 bg-slate-50 inline-block px-2 py-1 rounded-md">
              {stat.detail}
            </p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 2. Barang yg Terental (Performance) */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex justify-between items-center">
            <h3 className="font-black text-slate-800 tracking-tight">Peringkat Sewa Barang</h3>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">Berdasarkan Volume</span>
          </div>
          <div className="p-0">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                <tr>
                  <th className="px-8 py-4">Nama Barang</th>
                  <th className="px-8 py-4">Sewa (Kali)</th>
                  <th className="px-8 py-4">Total Omzet</th>
                  <th className="px-8 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm">
                {productPerformance.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-5 font-bold text-slate-700">{item.nama}</td>
                    <td className="px-8 py-5 font-black text-slate-900">{item.jumlah}x</td>
                    <td className="px-8 py-5 font-medium text-slate-600">{item.total}</td>
                    <td className="px-8 py-5">
                      <div className={`h-1.5 w-12 rounded-full ${
                        item.trend === 'up' ? 'bg-emerald-400' : item.trend === 'down' ? 'bg-rose-400' : 'bg-slate-300'
                      }`} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <h4 className="font-black text-slate-800 text-sm mb-6">Metrik Rental</h4>
            <div className="space-y-6">
              {[
                { label: "Rerata Durasi", val: "2.4 Hari", color: "bg-blue-500" },
                { label: "Repeat Customer", val: "42%", color: "bg-purple-500" },
                { label: "Kepuasan Pelanggan", val: "4.8/5", color: "bg-amber-500" },
              ].map((m, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span className="text-slate-400 uppercase tracking-widest">{m.label}</span>
                    <span className="text-slate-900">{m.val}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: '70%' }}
                      className={`h-full ${m.color}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
  );
}