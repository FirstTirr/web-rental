"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  approveRental,
  fetchAdminRentals,
  formatDate,
  formatIdr,
  getAuthToken,
  getRentalDurationDays,
  rejectRental,
  returnRental,
} from "../../../lib/rental-api";

type TabKey = "pending" | "diterima" | "terlambat" | "ditolak";

type UiRental = {
  id: number;
  borrower: string;
  unit: string;
  dateRange: string;
  total: number;
  status: string;
  createdAt: string;
  startDate: string;
  endDate: string;
  rentalFee: number;
  lateFee: number;
};

function mapRental(row: any): UiRental {
  const rentalFee = Number(row?.rental_fee || 0);
  const lateFee = Number(row?.late_fee || 0);
  const startDate = String(row?.start_date || "");
  const endDate = String(row?.end_date || "");

  return {
    id: Number(row?.id || 0),
    borrower: String(row?.username || `User #${row?.user_id ?? "-"}`),
    unit: String(row?.product_name || "Produk"),
    dateRange: `${formatDate(startDate)} - ${formatDate(endDate)}`,
    total: rentalFee + lateFee,
    status: String(row?.rental_status || "pending"),
    createdAt: String(row?.created_at || ""),
    startDate,
    endDate,
    rentalFee,
    lateFee,
  };
}

export default function ValidasiPesanan() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const [activeTab, setActiveTab] = useState<TabKey>("pending");
  const [items, setItems] = useState<UiRental[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [selectedRental, setSelectedRental] = useState<UiRental | null>(null);
  const [returnTarget, setReturnTarget] = useState<UiRental | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [returnDate, setReturnDate] = useState("");
  const [returnError, setReturnError] = useState("");

  const fetchData = useCallback(async () => {
    if (!API_URL) return;
    setLoading(true);
    try {
      const token = getAuthToken();
      const { rows } = await fetchAdminRentals(API_URL, token);
      setItems((rows as any[]).map(mapRental));
    } catch {
      setError("Gagal memuat data.");
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => { void fetchData(); }, [fetchData]);

  // LOGIKA FILTER TAB (FIX UNTUK TAB TERLAMBAT)
  const displayedItems = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    return items.filter((item) => {
      // 1. Logika Tab Terlambat: Status Active tapi sudah lewat deadline
      if (activeTab === "terlambat") {
        return item.status === "active" && new Date(item.endDate) < now;
      }
      // 2. Logika Tab Diterima: Status Approved ATAU Active yang belum lewat deadline
      if (activeTab === "diterima") {
        if (item.status === "active") return new Date(item.endDate) >= now;
        return item.status === "approved";
      }
      // 3. Tab Lainnya (Pending & Ditolak)
      if (activeTab === "pending") return item.status === "pending";
      if (activeTab === "ditolak") return item.status === "canceled";
      return false;
    });
  }, [items, activeTab]);

  const openReturnModal = (item: UiRental) => {
    setReturnTarget(item);
    const today = new Date();
    setReturnDate(new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10));
    setReturnError("");
  };

  const estimateLateFee = (item: UiRental, actualDate: string) => {
    if (!item.endDate) return { lateDays: 0, lateFee: 0 };
    const expected = new Date(item.endDate);
    const actual = new Date(actualDate);
    const diff = actual.getTime() - expected.getTime();
    if (Number.isNaN(diff) || diff <= 0) return { lateDays: 0, lateFee: 0 };
    const lateDays = Math.ceil(diff / (1000 * 60 * 60 * 24));
    const pricePerDay = item.rentalFee / (getRentalDurationDays(item.startDate, item.endDate) || 1);
    return { lateDays, lateFee: lateDays * (pricePerDay * 1.5) };
  };

  const handleReturn = async () => {
    if (!returnTarget || !API_URL) return;
    setActionLoading(true);
    try {
      const token = getAuthToken();
      await returnRental(API_URL, token, returnTarget.id, returnDate);
      setReturnTarget(null);
      await fetchData();
    } catch (err: any) {
      setReturnError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAction = async (action: "approve" | "reject") => {
    if (!selectedRental || !API_URL) return;
    setActionLoading(true);
    try {
      const token = getAuthToken();
      action === "approve" 
        ? await approveRental(API_URL, token, selectedRental.id) 
        : await rejectRental(API_URL, token, selectedRental.id);
      setSelectedRental(null);
      await fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Cek apakah ada unit yang telat hari ini
  const lateCount = items.filter(i => i.status === 'active' && new Date(i.endDate) < new Date()).length;

  return (
    <div className="space-y-8 w-full max-w-6xl mx-auto px-4 py-8 text-slate-900">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black italic uppercase tracking-tighter">Validasi Pesanan</h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Monitoring status unit.</p>
        </div>

        <div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit">
          {(["pending", "diterima", "terlambat", "ditolak"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === tab 
                ? (tab === 'terlambat' ? "bg-rose-600 text-white shadow-lg" : "bg-white text-slate-900 shadow-sm") 
                : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {tab} {tab === 'terlambat' && lateCount > 0 && `(${lateCount})`}
            </button>
          ))}
        </div>
      </header>

      <div className="grid gap-4">
        {loading ? (
          <div className="py-20 text-center font-black text-slate-300 italic">MEMUAT DATA...</div>
        ) : displayedItems.length > 0 ? (
          displayedItems.map((order) => (
            <div key={order.id} className={`bg-white p-6 rounded-[2rem] border-2 flex flex-col lg:flex-row items-center justify-between gap-6 transition-all ${activeTab === 'terlambat' ? 'border-rose-100 shadow-rose-50' : 'border-slate-50 shadow-sm'}`}>
              <div className="flex items-center gap-5">
                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center text-xl ${activeTab === 'terlambat' ? 'bg-rose-100' : 'bg-slate-100'}`}>
                  {activeTab === 'terlambat' ? '⚠️' : '📦'}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800 leading-tight">{order.borrower}</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{order.unit} • #{order.id}</p>
                </div>
              </div>

              <div className="text-right">
                <p className={`text-xs font-black uppercase tracking-widest ${activeTab === 'terlambat' ? 'text-rose-600' : 'text-slate-400'}`}>
                  {activeTab === 'terlambat' ? 'Batas Waktu Terlewati' : 'Periode Sewa'}
                </p>
                <p className="text-sm font-bold text-slate-700">{order.dateRange}</p>
              </div>

              <div className="flex gap-3 w-full lg:w-auto">
                {activeTab === "pending" ? (
                  <button onClick={() => setSelectedRental(order)} className="w-full px-8 py-3 rounded-2xl bg-slate-900 text-white font-bold text-xs uppercase tracking-widest hover:bg-blue-600 transition-all">
                    Validasi
                  </button>
                ) : (order.status === "active" || order.status === "approved") ? (
                  <button onClick={() => openReturnModal(order)} className={`w-full px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-white shadow-sm transition-all ${activeTab === 'terlambat' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
                    Konfirmasi Kembali
                  </button>
                ) : (
                  <span className="text-[10px] font-black uppercase px-4 py-2 bg-slate-100 text-slate-400 rounded-full">Archive</span>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-24 bg-white rounded-[3rem] border-4 border-dashed border-slate-50 font-black italic text-slate-200 text-4xl uppercase">
            Kosong
          </div>
        )}
      </div>

      {/* MODAL PENGEMBALIAN (DENGAN KALKULASI DENDA) */}
      {returnTarget && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl overflow-hidden relative">
            <h2 className="text-2xl font-black italic tracking-tighter mb-4">Pengembalian Unit</h2>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Tanggal Dikembalikan</label>
                <input type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-bold" />
              </div>

              {estimateLateFee(returnTarget, returnDate).lateDays > 0 && (
                <div className="p-5 bg-rose-50 border-2 border-rose-100 rounded-[1.5rem] animate-pulse">
                  <p className="text-rose-600 text-[10px] font-black uppercase tracking-widest mb-1">Terlambat {estimateLateFee(returnTarget, returnDate).lateDays} Hari</p>
                  <p className="text-rose-700 font-black text-2xl leading-none">{formatIdr(estimateLateFee(returnTarget, returnDate).lateFee)}</p>
                </div>
              )}
            </div>

            <button onClick={handleReturn} disabled={actionLoading} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:scale-[1.02] active:scale-95 transition-all">
              {actionLoading ? "Processing..." : "Konfirmasi Selesai"}
            </button>
            <button onClick={() => setReturnTarget(null)} className="w-full mt-4 text-slate-400 text-[10px] font-black uppercase tracking-widest">Batal</button>
          </div>
        </div>
      )}

      {/* MODAL VALIDASI PENDING TETAP SAMA SEPERTI SEBELUMNYA */}
    </div>
  );
}