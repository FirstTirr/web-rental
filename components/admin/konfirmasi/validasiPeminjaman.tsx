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

const tabStatusMap: Record<TabKey, string[]> = {
  pending: ["pending"],
  diterima: ["approved", "active"],
  terlambat: ["active"],
  ditolak: ["canceled"],
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

  // Reset page saat tab berubah
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
      if (!result.response.ok) throw new Error("Gagal update backend.");
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
          <h1 className="text-3xl sm:text-4xl font-black tracking-tighter italic">Validasi Pesanan</h1>
          <p className="text-slate-500 font-medium">Monitoring status dan keterlambatan unit.</p>
          {!loading && displayedItems.length > 0 && (
            <p className="text-sm text-slate-400 font-medium mt-1">
              Menampilkan {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, displayedItems.length)} dari {displayedItems.length} data
            </p>
          )}
        </div>

        <div className="flex bg-slate-100 p-1.5 rounded-[1.5rem] w-fit">
          {(["pending", "diterima", "terlambat", "ditolak"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${
                activeTab === tab
                  ? (tab === "terlambat" ? "bg-rose-600 text-white shadow-lg" : "bg-white text-slate-900 shadow-sm")
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
          <div className="py-24 text-center text-slate-400 font-bold bg-white rounded-[3rem] border border-slate-100">Memuat...</div>
        ) : paginatedItems.length > 0 ? (
          paginatedItems.map((order) => (
            <div key={order.id} className={`bg-white p-6 rounded-[2rem] border ${activeTab === "terlambat" ? "border-rose-200 shadow-rose-100" : "border-slate-100"} shadow-xl flex flex-col lg:flex-row items-center justify-between gap-6 transition-all`}>
              <div className="flex items-center gap-5 w-full lg:w-auto">
                <div className={`h-14 w-14 rounded-2xl flex items-center justify-center text-xl font-bold ${activeTab === "terlambat" ? "bg-rose-100 text-rose-600" : "bg-slate-100 text-slate-600"}`}>
                  {activeTab === "terlambat" ? "⏰" : "📦"}
                </div>
                <div>
                  <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase">#{order.id}</span>
                  <h3 className="text-lg font-black text-slate-800 leading-tight">{order.borrower}</h3>
                  <p className="text-sm text-slate-500 font-medium">{order.unit}</p>
                </div>
              </div>

              <div className="flex flex-col lg:items-end text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status {activeTab === "terlambat" && "Keterlambatan"}</p>
                <p className={`text-sm font-black ${activeTab === "terlambat" ? "text-rose-600" : "text-slate-800"}`}>{order.dateRange}</p>
                <p className="text-sm font-black text-slate-900">{formatIdr(order.total)}</p>
              </div>

              <div className="flex gap-3 w-full lg:w-auto">
                {activeTab === "pending" ? (
                  <button onClick={() => setSelectedRental(order)} className="w-full px-8 py-3 rounded-2xl bg-slate-900 text-white font-bold hover:bg-blue-600 transition-all shadow-lg shadow-slate-200">
                    Validasi
                  </button>
                ) : (order.status === "active" || order.status === "approved") ? (
                  <button onClick={() => openReturnModal(order)} className={`w-full px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-white shadow-sm transition-all ${activeTab === "terlambat" ? "bg-rose-600 hover:bg-rose-700" : "bg-emerald-600 hover:bg-emerald-700"}`}>
                    Barang Sudah Kembali
                  </button>
                ) : (
                  <span className="text-[10px] font-black uppercase px-4 py-2 bg-slate-50 text-slate-400 rounded-full">Record Locked</span>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-100 font-bold text-slate-400">Kosong...</div>
        )}
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="h-10 px-4 rounded-xl text-sm font-bold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            ← Prev
          </button>

          {pageNumbers[0] > 1 && (
            <>
              <button onClick={() => setPage(1)} className="h-10 w-10 rounded-xl text-sm font-bold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all shadow-sm">1</button>
              {pageNumbers[0] > 2 && <span className="text-slate-400 font-bold px-1">…</span>}
            </>
          )}

          {pageNumbers.map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`h-10 w-10 rounded-xl text-sm font-bold transition-all shadow-sm border ${
                p === page ? "bg-slate-900 text-white border-slate-900" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {p}
            </button>
          ))}

          {pageNumbers[pageNumbers.length - 1] < totalPages && (
            <>
              {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && <span className="text-slate-400 font-bold px-1">…</span>}
              <button onClick={() => setPage(totalPages)} className="h-10 w-10 rounded-xl text-sm font-bold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all shadow-sm">{totalPages}</button>
            </>
          )}

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="h-10 px-4 rounded-xl text-sm font-bold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            Next →
          </button>
        </div>
      )}

      {/* Modal Validasi */}
      {selectedRental && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl">
            <h2 className="text-2xl font-black italic tracking-tighter mb-2">Konfirmasi Pesanan</h2>
            <p className="text-slate-500 text-sm font-medium mb-6">Setujui penyewaan dari <span className="text-slate-900 font-bold">{selectedRental.borrower}</span>?</p>
            <div className="flex gap-3">
              <button onClick={() => handleAction("approve")} disabled={actionLoading} className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all disabled:opacity-50">
                {actionLoading ? "..." : "Terima"}
              </button>
              <button onClick={() => handleAction("reject")} disabled={actionLoading} className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-bold hover:bg-rose-700 transition-all disabled:opacity-50">
                Tolak
              </button>
            </div>
            <button onClick={() => setSelectedRental(null)} className="w-full mt-4 text-slate-400 text-xs font-bold uppercase tracking-widest">Batal</button>
          </div>
        </div>
      )}

      {/* Modal Pengembalian */}
      {returnTarget && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl">
            <h2 className="text-2xl font-black italic tracking-tighter mb-2">Pengembalian Unit</h2>
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400">Tanggal Kembali</label>
                <input type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-bold" />
              </div>
              {estimateLateFee(returnTarget, returnDate).lateDays > 0 && (
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl">
                  <p className="text-rose-600 text-xs font-bold uppercase">Terlambat {estimateLateFee(returnTarget, returnDate).lateDays} Hari</p>
                  <p className="text-rose-700 font-black text-lg">{formatIdr(estimateLateFee(returnTarget, returnDate).lateFee)}</p>
                </div>
              )}
            </div>
            {returnError && <p className="text-rose-600 text-xs font-bold mb-4">{returnError}</p>}
            <button onClick={handleReturn} disabled={actionLoading} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-blue-600 transition-all disabled:opacity-50">
              {actionLoading ? "Proses..." : "Konfirmasi Selesai"}
            </button>
            <button onClick={() => setReturnTarget(null)} className="w-full mt-4 text-slate-400 text-xs font-bold uppercase tracking-widest">Batal</button>
          </div>
        </div>
      )}
    </div>
  );
}