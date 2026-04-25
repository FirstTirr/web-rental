"use client";
import React, { Suspense, lazy } from 'react';
import { motion } from 'framer-motion';
import LoadingScreen from "../LoadingScreen";

const StatCard = lazy(() => import("./statCard"));
const RekapPenjualan = lazy(() => import("./rekapPenjualan"));
const ProductTable = lazy(() => import("../barang/productTable"));

export default function Dashboard({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: any }) {
  return (
    <>
    <div className="p-8 md:p-12 w-full">
      {/* <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        > */}
        <Suspense fallback={<LoadingScreen />}>
          
          {activeTab === 'dashboard' && (
            <div className="space-y-10 w-full max-w-7xl mx-auto">
              <header>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">Main Dashboard</h1>
                <p className="text-slate-500 font-medium">Selamat datang kembali, berikut ringkasan sistem Anda.</p>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <StatCard label="Total Penjualan" value="Rp12.5M" color="text-blue-600" />
                <StatCard label="Peminjaman Aktif" value="18" color="text-emerald-600" />
                <StatCard label="Denda Terlambat" value="Rp750rb" color="text-rose-500" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* KONTEN BOX - Pastikan rounded dan paddingnya mantap */}
                <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="font-black text-xl text-slate-800">Unit Terpopuler</h3>
                    <button onClick={() => setActiveTab('barang')} className="text-sm font-bold text-blue-600 hover:underline">Kelola Semua</button>
                  </div>
                  {/* Isi Unit... */}
                  <div className="space-y-4">
                     <div className="p-5 bg-slate-50 rounded-2xl flex justify-between items-center">
                        <span className="font-bold">Kamera Canon M50</span>
                        <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-black">LARIS</span>
                     </div>
                  </div>
                </div>

                <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="font-black text-xl text-slate-800">Pesanan Terbaru</h3>
                    <button onClick={() => setActiveTab('pesanan')} className="text-sm font-bold text-blue-600 hover:underline">Lihat Detail</button>
                  </div>
                  {/* Isi Pesanan... */}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'rekap' && <RekapPenjualan />}
          
          {activeTab === 'barang' && (
             <div className="w-full max-w-7xl mx-auto space-y-8">
                <h1 className="text-3xl font-black">Katalog Barang</h1>
                <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100">
                   <ProductTable />
                </div>
             </div>
          )}

        </Suspense>
      {/* </motion.div> */}
    </div>
    </>
  );
}