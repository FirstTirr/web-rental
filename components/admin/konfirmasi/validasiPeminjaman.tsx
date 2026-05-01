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

type TabKey = "pending" | "diterima" | "terlambat" | "ditolak" | "canceled";

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

const tabStatusMap: Record<TabKey, string[]> = {
  pending: ["pending"],
  diterima: ["approved", "active"],
  terlambat: ["active"],
  ditolak: ["denied"], 
  canceled: ["canceled"],
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

const ITEMS_PER_PAGE = 10;

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
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async () => {
    if (!API_URL) {
      setError("Konfigurasi API belum tersedia.");
      setLoading(false);
      return;
    }
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
  useEffect(() => { setPage(1); }, [activeTab]);

  const displayedItems = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return items.filter((item) => {
      if (activeTab === "terlambat") return item.status === "active" && new Date(item.endDate) < now;
      if (activeTab === "diterima") {
        if (item.status === "active") return new Date(item.endDate) >= now;
        return item.status === "approved";
      }
      return new Set(tabStatusMap[activeTab]).has(item.status);
    });
  }, [items, activeTab]);

  const totalPages = Math.ceil(displayedItems.length / ITEMS_PER_PAGE);
  const paginatedItems = displayedItems.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const pageNumbers = useMemo(() => {
    const delta = 2;
    const range: number[] = [];
    for (let i = Math.max(1, page - delta); i <= Math.min(totalPages, page + delta); i++) {
      range.push(i);
    }
    return range;
  }, [page, totalPages]);

  const handleAction = async (action: "approve" | "reject") => {
    if (!selectedRental || !API_URL) return;
    setActionLoading(true);
    try {
      const token = getAuthToken();
      const res = action === "approve"
        ? await approveRental(API_URL, token, selectedRental.id)
        : await rejectRental(API_URL, token, selectedRental.id);
      
      if (!res.response.ok) throw new Error("Gagal melakukan update.");
      
      setSelectedRental(null);
      await fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

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
      const result = await returnRental(API_URL, token, returnTarget.id, returnDate);
      if (!result.response.ok) throw new Error("Gagal update status pengembalian.");
      setReturnTarget(null);
      await fetchData();
    } catch (err: any) {
      setReturnError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const lateCount = items.filter(i => i.status === "active" && new Date(i.endDate) < new Date()).length;

  return (
    <div className="space-y-8 w-full max-w-6xl mx-auto px-4 py-8 text-slate-900">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tighter italic uppercase">Validasi Pesanan</h1>
          <p className="text-slate-500 font-medium">Monitoring status dan penggunaan unit.</p>
        </div>

        <div className="flex bg-slate-100 p-1.5 rounded-[1.5rem] w-fit overflow-x-auto no-scrollbar">
          {(["pending", "diterima", "terlambat", "ditolak", "canceled"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                activeTab === tab
                  ? (tab === "terlambat" || tab === "canceled" || tab === "ditolak" ? "bg-rose-600 text-white shadow-lg" : "bg-white text-slate-900 shadow-sm")
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {tab} {tab === "terlambat" && lateCount > 0 && "🚩"}
            </button>
          ))}
        </div>
      </header>

      {error && (
        <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</div>
      )}

      <div className="grid gap-5">
        {loading ? (
          <div className="py-24 text-center text-slate-400 font-bold bg-white rounded-[3rem] border border-slate-100 animate-pulse italic">MENDAPATKAN DATA...</div>
        ) : paginatedItems.length > 0 ? (
          paginatedItems.map((order) => {
            const now = new Date();
            now.setHours(0, 0, 0, 0);

            const isActive = order.status === "active";
            const isApproved = order.status === "approved";
            const isCanceled = order.status === "canceled";
            const isDenied = order.status === "denied";

            // LOGIKA: Syarat tombol benar-benar aktif (bisa diklik)
            // 1. Status harus 'active' (sudah bayar/ambil)
            // 2. Tanggal hari ini sudah masuk periode sewa (startDate)
            const isStarted = new Date(order.startDate) <= now;
            const canAction = isActive && isStarted;
            
            const currentLate = estimateLateFee(order, now.toISOString().slice(0, 10));

            return (
              <div key={order.id} className={`bg-white p-6 rounded-[2rem] border ${ (activeTab === "terlambat" || isCanceled || isDenied) ? "border-rose-200" : "border-slate-100"} shadow-xl flex flex-col lg:flex-row items-center justify-between gap-6 transition-all hover:scale-[1.01]`}>
                <div className="flex items-center gap-5 w-full lg:w-auto">
                  <div className={`h-14 w-14 rounded-2xl flex items-center justify-center text-xl font-bold ${ (activeTab === "terlambat" || isCanceled || isDenied) ? "bg-rose-100 text-rose-600" : "bg-slate-100 text-slate-600"}`}>
                    {isCanceled || isDenied ? "🚫" : activeTab === "terlambat" ? "⏰" : isActive ? "🚀" : "📦"}
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase">#{order.id}</span>
                    <h3 className="text-lg font-black text-slate-800 leading-tight">{order.borrower}</h3>
                    <p className="text-sm text-slate-500 font-medium">
                        {order.unit} 
                        {isActive && <span className="text-emerald-500 ml-1 italic font-bold">● Sedang Digunakan</span>}
                        {isApproved && !isActive && <span className="text-amber-500 ml-1 italic font-bold">● Menunggu Pengambilan</span>}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col lg:items-end lg:text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    {isCanceled || isDenied ? "Status Akhir" : `Jadwal ${activeTab === "terlambat" ? "Harus Kembali" : "Sewa"}`}
                  </p>
                  <p className={`text-sm font-black ${isCanceled || isDenied || activeTab === "terlambat" ? "text-rose-600" : "text-slate-800"}`}>
                    {isCanceled ? "DIBATALKAN USER" : isDenied ? "DITOLAK ADMIN" : order.dateRange}
                  </p>
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-slate-900">{formatIdr(order.total)}</span>
                    {activeTab === "terlambat" && currentLate.lateFee > 0 && (
                       <span className="text-[10px] font-bold text-rose-500 uppercase tracking-tighter italic">+ Estimasi Denda: {formatIdr(currentLate.lateFee)}</span>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 w-full lg:w-auto">
                  {isCanceled || isDenied ? (
                    <span className="text-[10px] font-black uppercase px-6 py-3 border border-rose-100 bg-rose-50 text-rose-500 rounded-full italic">
                      {isDenied ? "Rejected Record" : "Canceled Record"}
                    </span>
                  ) : activeTab === "pending" ? (
                    <button onClick={() => setSelectedRental(order)} className="w-full px-8 py-3 rounded-2xl bg-slate-900 text-white font-bold hover:bg-blue-600 transition-all shadow-lg shadow-slate-200">VALIDASI</button>
                  ) : isApproved || isActive ? (
                    <button 
                      onClick={() => openReturnModal(order)} 
                      disabled={!canAction}
                      className={`w-full px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-white shadow-sm transition-all 
                        ${!canAction
                          ? "bg-amber-500/40 text-white/80 cursor-not-allowed grayscale" 
                          : activeTab === "terlambat" 
                            ? "bg-rose-600 hover:bg-rose-700 shadow-rose-200 shadow-lg" 
                            : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200 shadow-lg"
                        }`}
                    >
                      {canAction ? "Selesaikan Pesanan" : "Selesaikan (Belum Aktif)"}
                    </button>
                  ) : (
                    <span className="text-[10px] font-black uppercase px-4 py-2 bg-slate-50 text-slate-400 rounded-full">Locked</span>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-100 font-bold text-slate-400 italic uppercase">BELUM ADA DATA {activeTab}...</div>
        )}
      </div>

      {/* Pagination & Modals (Same as before) */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="h-10 px-4 rounded-xl text-sm font-bold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 transition-all">← PREV</button>
          {pageNumbers.map((p) => (
            <button key={p} onClick={() => setPage(p)} className={`h-10 w-10 rounded-xl text-sm font-bold transition-all border ${p === page ? "bg-slate-900 text-white border-slate-900" : "bg-white border-slate-200 text-slate-600"}`}>{p}</button>
          ))}
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="h-10 px-4 rounded-xl text-sm font-bold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 transition-all">NEXT →</button>
        </div>
      )}

      {selectedRental && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl">
            <h2 className="text-2xl font-black italic tracking-tighter mb-2 uppercase">Validasi Pesanan</h2>
            <p className="text-slate-500 text-sm font-medium mb-6">Pilih tindakan untuk pesanan dari <span className="text-slate-900 font-bold">{selectedRental.borrower}</span>.</p>
            <div className="flex gap-3">
              <button onClick={() => handleAction("approve")} disabled={actionLoading} className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 disabled:opacity-50">Terima</button>
              <button onClick={() => handleAction("reject")} disabled={actionLoading} className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-700 disabled:opacity-50">Tolak</button>
            </div>
            <button onClick={() => setSelectedRental(null)} className="w-full mt-4 text-slate-400 text-[10px] font-black uppercase tracking-widest">Batal</button>
          </div>
        </div>
      )}

      {returnTarget && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl text-slate-900">
            <h2 className="text-2xl font-black italic tracking-tighter mb-2 uppercase">Pengembalian Unit</h2>
            <div className="space-y-4 mb-6 mt-4">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Tanggal Kembali Aktual</label>
              <input 
                type="date" 
                value={returnDate} 
                onChange={(e) => setReturnDate(e.target.value)} 
                className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-slate-800 focus:border-slate-900 outline-none transition-all" 
              />
              
              {estimateLateFee(returnTarget, returnDate).lateDays > 0 ? (
                <div className="p-5 bg-rose-50 border-2 border-rose-100 rounded-3xl">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-rose-600 text-[10px] font-black uppercase tracking-widest">Keterlambatan</p>
                    <span className="bg-rose-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase italic">
                      {estimateLateFee(returnTarget, returnDate).lateDays} Hari
                    </span>
                  </div>
                  <p className="text-rose-700 font-black text-2xl tracking-tighter">
                    {formatIdr(estimateLateFee(returnTarget, returnDate).lateFee)}
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3">
                  <span className="text-xl">✨</span>
                  <p className="text-emerald-700 text-[10px] font-black uppercase tracking-widest">Tepat Waktu / Tidak Ada Denda</p>
                </div>
              )}
              
              {returnError && <p className="text-rose-600 text-[10px] font-bold p-2 bg-rose-50 rounded-lg">⚠️ {returnError}</p>}
            </div>
            
            <button 
              onClick={handleReturn} 
              disabled={actionLoading} 
              className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-600 shadow-lg shadow-slate-200 transition-all disabled:opacity-50"
            >
              {actionLoading ? "Processing..." : "Konfirmasi Selesai"}
            </button>
            <button onClick={() => setReturnTarget(null)} className="w-full mt-4 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:text-slate-600 transition-colors">Batal</button>
          </div>
        </div>
      )}
    </div>
  );
}