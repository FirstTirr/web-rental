"use client";
import React, { Suspense, lazy, useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import LoadingScreen from "../LoadingScreen";
import { 
  fetchRentalReport, 
  fetchAdminReviews,
  formatIdr, 
  getAuthToken, 
  rentalStatusLabel 
} from "../../../lib/rental-api";

const StatCard = lazy(() => import("./statCard"));
const RekapPenjualan = lazy(() => import("./rekapPenjualan"));
const ProductTable = lazy(() => import("../barang/productTable"));

export default function Dashboard({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: any }) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  
  // State untuk data murni dari API
  const [rawData, setRawData] = useState<any[]>([]);
  const [latestReviews, setLatestReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const toNumber = (val: any) => Number(val || 0);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!API_URL) return;
      setLoading(true);
      try {
        const token = getAuthToken();
        // Menggunakan fetchRentalReport agar konsisten dengan halaman Rekap
        const [{ rows }, { rows: reviews }] = await Promise.all([
          fetchRentalReport(API_URL, token),
          fetchAdminReviews(API_URL, token, { page: 1, limit: 5 }),
        ]);
        setRawData(Array.isArray(rows) ? rows : []);
        setLatestReviews(Array.isArray(reviews) ? reviews : []);
      } catch (error) {
        console.error("Dashboard error:", error);
        setRawData([]);
        setLatestReviews([]);
      } finally {
        setLoading(false);
      }
    };

    void loadDashboardData();
  }, [API_URL]);

  // --- LOGIKA KALKULASI (SAMA DENGAN REKAP) ---
  const stats = useMemo(() => {
    const validRows = rawData.filter((row) => 
      ["active", "completed", "approved", "overdue"].includes(String(row?.rental_status))
    );

    const totalRevenue = validRows.reduce((acc, row) => 
      acc + toNumber(row?.rental_fee) + toNumber(row?.late_fee), 0
    );

    const activeRentals = rawData.filter((row) => 
      String(row?.rental_status) === "active"
    ).length;

    const totalLateFees = validRows.reduce((acc, row) => 
      acc + toNumber(row?.late_fee), 0
    );

    return { totalRevenue, activeRentals, totalLateFees };
  }, [rawData]);

  // Logika Unit Terpopuler
  const popularUnits = useMemo(() => {
    const map = new Map<string, number>();
    rawData.forEach((row) => {
      const name = row.product_name || "Produk";
      map.set(name, (map.get(name) || 0) + 1);
    });
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3); // Ambil top 3
  }, [rawData]);

  // Logika Pesanan Terbaru
  const latestOrders = useMemo(() => {
    return [...rawData]
      .sort((a, b) => b.id - a.id)
      .slice(0, 5); // Ambil 5 terakhir
  }, [rawData]);

  return (
    <div className="w-full px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
      <Suspense fallback={<LoadingScreen />}>
        {activeTab === 'dashboard' && (
          <div className="space-y-8 w-full max-w-7xl mx-auto">
            <header className="flex justify-between items-end">
              <div>
                <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Main Dashboard</h1>
                <p className="text-slate-500 font-medium">Ringkasan aktivitas rental Anda hari ini.</p>
              </div>
              {loading && <div className="text-xs font-bold text-blue-600 animate-pulse">SYNCING...</div>}
            </header>

            {/* STAT CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              <StatCard label="Total Penjualan" value={formatIdr(stats.totalRevenue)} color="text-blue-600" />
              <StatCard label="Peminjaman Aktif" value={String(stats.activeRentals)} color="text-emerald-600" />
              <StatCard label="Denda Terlambat" value={formatIdr(stats.totalLateFees)} color="text-rose-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
              {/* UNIT TERPOPULER */}
              <div className="bg-white p-6 sm:p-8 lg:p-10 rounded-[2rem] sm:rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="font-black text-lg sm:text-xl text-slate-800">Unit Terpopuler</h3>
                  <button onClick={() => setActiveTab('barang')} className="text-sm font-bold text-blue-600 hover:underline tracking-tight">Kelola Semua</button>
                </div>
                <div className="space-y-3">
                  {popularUnits.length > 0 ? popularUnits.map(([name, count], i) => (
                    <div key={i} className="p-5 bg-slate-50 rounded-2xl flex justify-between items-center group hover:bg-gray-500 transition-all duration-300">
                      <span className="font-bold group-hover:text-white transition-colors">{name}</span>
                      <span className={`text-[10px] px-3 py-1 rounded-full font-black ${i === 0 ? 'bg-orange-100 text-orange-600' : 'bg-slate-200 text-slate-600'}`}>
                        {count}x DISEWA
                      </span>
                    </div>
                  )) : <p className="text-slate-400 text-center py-4 font-bold italic text-sm">Belum ada data unit.</p>}
                </div>
              </div>

              {/* PESANAN TERBARU */}
              <div className="bg-white p-6 sm:p-8 lg:p-10 rounded-[2rem] sm:rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="font-black text-lg sm:text-xl text-slate-800">Pesanan Terbaru</h3>
                  <button onClick={() => setActiveTab('rekap')} className="text-sm font-bold text-blue-600 hover:underline tracking-tight">Lihat Detail</button>
                </div>
                <div className="space-y-4">
                   {latestOrders.length > 0 ? latestOrders.map((order) => {
                     const badge = rentalStatusLabel(order.rental_status);
                     return (
                       <div key={order.id} className="flex items-center justify-between border-b border-slate-50 pb-4 last:border-0 last:pb-0">
                          <div>
                            <p className="font-bold text-slate-800 text-sm">{order.username || "Guest"}</p>
                            <p className="text-xs text-slate-500 font-medium">{order.product_name}</p>
                          </div>
                          <span className={`text-[9px] font-black px-2 py-1 rounded-md ${badge.className}`}>
                            {badge.label}
                          </span>
                       </div>
                     )
                   }) : <p className="text-slate-400 text-center py-4 font-bold italic text-sm">Belum ada pesanan.</p>}
                </div>
              </div>
            </div>

            <div className="bg-white p-6 sm:p-8 lg:p-10 rounded-[2rem] sm:rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50">
              <div className="flex justify-between items-center mb-8">
                <h3 className="font-black text-lg sm:text-xl text-slate-800">Ulasan Terbaru Pengguna</h3>
              </div>
              <div className="space-y-4">
                {latestReviews.length > 0 ? latestReviews.map((review) => (
                  <div key={review.id} className="rounded-2xl border border-slate-100 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{review.username}</p>
                        <p className="text-xs text-slate-500">{review.product_name}</p>
                      </div>
                      <p className="text-amber-500 text-sm font-black">{"★".repeat(Math.max(1, Number(review.rating || 0)))}</p>
                    </div>
                    <p className="mt-2 text-sm text-slate-700">{review.comment || "-"}</p>
                  </div>
                )) : <p className="text-slate-400 text-center py-4 font-bold italic text-sm">Belum ada ulasan.</p>}
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
    </div>
  );
}
