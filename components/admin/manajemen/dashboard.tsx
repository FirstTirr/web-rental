"use client";
import React, { Suspense, lazy, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import LoadingScreen from "../LoadingScreen";
import { fetchAdminRentals, formatIdr, getAuthToken } from "../../../lib/rental-api";

const StatCard = lazy(() => import("./statCard"));
const RekapPenjualan = lazy(() => import("./rekapPenjualan"));
const ProductTable = lazy(() => import("../barang/productTable"));

export default function Dashboard({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: any }) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [lateFees, setLateFees] = useState(0);

  useEffect(() => {
    const loadStats = async () => {
      if (!API_URL) return;
      try {
        const token = getAuthToken();
        const { rows } = await fetchAdminRentals(API_URL, token);
        const typedRows = Array.isArray(rows) ? rows : [];
        const paidRows = typedRows.filter((row) => ["active", "completed"].includes(String(row?.rental_status)));
        const completedRows = typedRows.filter((row) => String(row?.rental_status) === "completed");

        const revenue = paidRows.reduce((acc, row) => acc + Number(row?.rental_fee || 0) + Number(row?.late_fee || 0), 0);
        const active = typedRows.filter((row) => String(row?.rental_status) === "active").length;
        const late = completedRows.reduce((acc, row) => acc + Number(row?.late_fee || 0), 0);

        setTotalRevenue(revenue);
        setActiveCount(active);
        setLateFees(late);
      } catch {
        setTotalRevenue(0);
        setActiveCount(0);
        setLateFees(0);
      }
    };

    void loadStats();
  }, [API_URL]);
  return (
    <>
    <div className="w-full px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
      {/* <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        > */}
        <Suspense fallback={<LoadingScreen />}>
          
          {activeTab === 'dashboard' && (
            <div className="space-y-8 w-full max-w-7xl mx-auto">
              <header>
                <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Main Dashboard</h1>
                <p className="text-slate-500 font-medium">Selamat datang kembali, berikut ringkasan sistem Anda.</p>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                <StatCard label="Total Penjualan" value={formatIdr(totalRevenue)} color="text-blue-600" />
                <StatCard label="Peminjaman Aktif" value={String(activeCount)} color="text-emerald-600" />
                <StatCard label="Denda Terlambat" value={formatIdr(lateFees)} color="text-rose-500" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
                {/* KONTEN BOX - Pastikan rounded dan paddingnya mantap */}
                <div className="bg-white p-6 sm:p-8 lg:p-10 rounded-[2rem] sm:rounded-[2.5rem] lg:rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6 sm:mb-8">
                    <h3 className="font-black text-lg sm:text-xl text-slate-800">Unit Terpopuler</h3>
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

                <div className="bg-white p-6 sm:p-8 lg:p-10 rounded-[2rem] sm:rounded-[2.5rem] lg:rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6 sm:mb-8">
                    <h3 className="font-black text-lg sm:text-xl text-slate-800">Pesanan Terbaru</h3>
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