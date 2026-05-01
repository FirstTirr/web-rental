"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { 
  fetchAdminRentals, 
  formatDate, 
  formatIdr, 
  getAuthToken, 
  rentalStatusLabel 
} from "../../../lib/rental-api";

// Mapping status untuk UI Log
function mapRentalLog(row: any) {
  const rentalFee = Number(row?.rental_fee || 0);
  const lateFee = Number(row?.late_fee || 0);
  return {
    id: Number(row?.id || 0),
    borrower: String(row?.username || `User #${row?.user_id ?? "-"}`),
    unit: String(row?.product_name || "Produk"),
    status: String(row?.rental_status || "pending"),
    startDate: String(row?.start_date || ""),
    endDate: String(row?.end_date || ""),
    createdAt: String(row?.created_at || ""),
    total: rentalFee + lateFee,
  };
}

const LOGS_PER_PAGE = 8;

export default function LogPeminjaman() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async () => {
    if (!API_URL) return;
    setLoading(true);
    try {
      const token = getAuthToken();
      const { rows } = await fetchAdminRentals(API_URL, token);
      setLogs((rows as any[]).map(mapRentalLog));
    } catch {
      setError("Gagal memuat riwayat log.");
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => { void fetchData(); }, [fetchData]);

  // Sortir log: ID terbesar (terbaru) di atas
  const sortedLogs = useMemo(() => {
    return [...logs].sort((a, b) => b.id - a.id);
  }, [logs]);

  const totalPages = Math.ceil(sortedLogs.length / LOGS_PER_PAGE);
  const paginatedLogs = sortedLogs.slice((page - 1) * LOGS_PER_PAGE, page * LOGS_PER_PAGE);

  return (
    <div className="space-y-8 w-full max-w-7xl mx-auto px-4 py-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tighter italic">Log Peminjaman</h1>
          <p className="text-slate-500 font-medium">Rekaman seluruh aktivitas transaksi masuk.</p>
        </div>
        <div className="bg-blue-600 px-6 py-3 rounded-2xl shadow-lg shadow-blue-100">
          <p className="text-[10px] font-black text-blue-100 uppercase tracking-widest">Total Record</p>
          <p className="text-2xl font-black text-white leading-none">{logs.length}</p>
        </div>
      </header>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl font-bold">{error}</div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          <div className="py-24 text-center bg-white rounded-[2rem] border border-slate-100 text-slate-400 font-bold italic">Memuat log sistem...</div>
        ) : sortedLogs.length === 0 ? (
          <div className="py-24 text-center bg-white rounded-[2rem] border border-dashed border-slate-100 text-slate-400 font-bold">Belum ada riwayat aktivitas.</div>
        ) : (
          paginatedLogs.map((log) => {
            // LOGIKA UI: Tangani status 'canceled' agar konsisten dengan Dashboard Validasi
            let badge = rentalStatusLabel(log.status);
            
            if (log.status === "canceled") {
              badge = {
                label: "CANCELED",
                className: "bg-rose-100 text-rose-600 border border-rose-200"
              };
            }

            return (
              <div key={log.id} className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-100 shadow-xl flex flex-col lg:flex-row gap-8 items-start lg:items-center justify-between transition-all hover:border-blue-100">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-mono font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">
                      LOG-{String(log.id).padStart(4, "0")}
                    </span>
                    {/* Badge Status akan otomatis merah jika 'canceled' */}
                    <span className={`text-[10px] uppercase font-black px-4 py-1.5 rounded-full ${badge.className}`}>
                      {badge.label}
                    </span>
                  </div>
                  
                  <div className="space-y-1">
                    <h3 className="text-xl font-black text-slate-900 tracking-tight leading-tight">{log.borrower}</h3>
                    <p className="text-sm text-slate-500 font-bold uppercase tracking-wide">{log.unit}</p>
                  </div>

                  <div className="flex flex-wrap gap-x-6 gap-y-2">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-slate-300" />
                      <p className="text-xs font-bold text-slate-400 uppercase">Start: {formatDate(log.startDate)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-blue-400" />
                      <p className="text-xs font-bold text-slate-400 uppercase">End: {formatDate(log.endDate)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-emerald-400" />
                      <p className="text-xs font-bold text-slate-400 uppercase">Logged: {formatDate(log.createdAt)}</p>
                    </div>
                  </div>
                </div>

                <div className="w-full lg:w-auto flex lg:flex-col items-center lg:items-end justify-between gap-2 pt-6 lg:pt-0 border-t lg:border-t-0 border-slate-50">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Total Transaction</p>
                  <p className="text-2xl font-black text-slate-900 italic tracking-tighter">{formatIdr(log.total)}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-8">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="h-12 px-6 rounded-2xl text-xs font-black uppercase tracking-widest bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 transition-all shadow-sm"
          >
            Prev
          </button>
          <div className="flex gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`h-12 w-12 rounded-2xl text-xs font-black transition-all shadow-sm border ${
                  p === page ? "bg-slate-900 text-white border-slate-900" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="h-12 px-6 rounded-2xl text-xs font-black uppercase tracking-widest bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 transition-all shadow-sm"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}