"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import DetailModal from "../../user/detailModal";
import {
  fetchAdminRentals,
  formatDate,
  formatIdr,
  getAuthToken,
  getRentalDurationDays,
  rentalStatusLabel,
} from "../../../lib/rental-api";

type AdminRentalRow = {
  id: number;
  borrower: string;
  item: string;
  duration: string;
  pricePerDay: string;
  address: string;
  totalPrice: string;
  status: string;
  createdAt: string;
};

function mapRental(row: any): AdminRentalRow {
  const rentalFee = Number(row?.rental_fee || 0);
  const lateFee = Number(row?.late_fee || 0);
  const startDate = String(row?.start_date || "");
  const endDate = String(row?.end_date || "");
  const days = getRentalDurationDays(startDate, endDate);

  return {
    id: Number(row?.id || 0),
    borrower: String(row?.username || `User #${row?.user_id ?? "-"}`),
    item: String(row?.product_name || "Produk"),
    duration: `${days} Hari`,
    pricePerDay: formatIdr(days > 0 ? rentalFee / days : rentalFee),
    address: "Alamat pelanggan tidak tersedia di endpoint ini",
    totalPrice: formatIdr(rentalFee + lateFee),
    status: String(row?.rental_status || "pending"),
    createdAt: String(row?.created_at || ""),
  };
}

const ITEMS_PER_PAGE = 10;

export default function LogPeminjaman() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const [selectedLog, setSelectedLog] = useState<AdminRentalRow | null>(null);
  const [logs, setLogs] = useState<AdminRentalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const fetchLogs = useCallback(async () => {
    if (!API_URL) {
      setError("Konfigurasi NEXT_PUBLIC_API_URL belum tersedia.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const token = getAuthToken();
      const { rows } = await fetchAdminRentals(API_URL, token);
      setLogs((rows as any[]).map(mapRental));
      setCurrentPage(1);
    } catch {
      setError("Gagal memuat log rental.");
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    void fetchLogs();
  }, [fetchLogs]);

  const sortedLogs = useMemo(() => [...logs].sort((a, b) => b.id - a.id), [logs]);

  const totalPages = Math.ceil(sortedLogs.length / ITEMS_PER_PAGE);
  const paginatedLogs = sortedLogs.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Buat range nomor halaman yang ditampilkan (max 5 angka)
  const pageNumbers = useMemo(() => {
    const delta = 2;
    const range: number[] = [];
    for (
      let i = Math.max(1, currentPage - delta);
      i <= Math.min(totalPages, currentPage + delta);
      i++
    ) {
      range.push(i);
    }
    return range;
  }, [currentPage, totalPages]);

  return (
    <div className="space-y-8 w-full max-w-7xl mx-auto px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Log Peminjaman</h1>
          <p className="text-slate-500 font-medium">Riwayat lengkap aktivitas rental dari backend.</p>
        </div>
        {!loading && sortedLogs.length > 0 && (
          <p className="text-sm text-slate-400 font-medium">
            Menampilkan {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, sortedLogs.length)} dari {sortedLogs.length} data
          </p>
        )}
      </header>

      {error && (
        <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          <div className="py-24 text-center bg-white rounded-[2rem] border border-slate-100 text-slate-400 font-bold">
            Memuat data...
          </div>
        ) : sortedLogs.length === 0 ? (
          <div className="py-24 text-center bg-white rounded-[2rem] border border-dashed border-slate-100 text-slate-400 font-bold">
            Belum ada data rental.
          </div>
        ) : (
          paginatedLogs.map((log) => {
            const badge = rentalStatusLabel(log.status);
            return (
              <div
                key={log.id}
                className="bg-white p-5 sm:p-6 lg:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-slate-100 shadow-xl flex flex-col lg:flex-row gap-6 lg:gap-8 items-start lg:items-center justify-between"
              >
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-mono font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">
                      LOG-{String(log.id).padStart(4, "0")}
                    </span>
                    <span className={`text-[10px] uppercase font-black px-3 py-1 rounded-full ${badge.className}`}>
                      {badge.label}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-800">{log.borrower}</h3>
                    <p className="text-slate-500 text-sm font-medium">📅 {log.duration} • {formatDate(log.createdAt)}</p>
                  </div>
                </div>

                <div className="flex-1 border-l-0 lg:border-l border-slate-100 lg:pl-8 space-y-2">
                  <p className="text-xs font-bold text-slate-400 uppercase">Unit & Harga</p>
                  <p className="font-bold text-slate-700">{log.item}</p>
                  <p className="text-sm font-medium text-slate-500">
                    Harga per hari: <span className="text-slate-900 font-bold">{log.pricePerDay}</span>
                  </p>
                </div>

                <div className="flex-1 border-l-0 lg:border-l border-slate-100 lg:pl-8 space-y-2 text-left lg:text-right">
                  <p className="text-xs font-bold text-slate-400 uppercase">Total</p>
                  <p className="text-2xl font-black text-slate-900">{log.totalPrice}</p>
                </div>

                <div className="lg:pl-8 w-full lg:w-auto flex justify-end">
                  <button
                    onClick={() => setSelectedLog(log)}
                    className="h-12 w-12 rounded-2xl bg-slate-900 text-white hover:bg-blue-600 transition-all flex items-center justify-center shadow-lg"
                  >
                    👁️
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          {/* Prev */}
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="h-10 px-4 rounded-xl text-sm font-bold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            ← Prev
          </button>

          {/* Halaman pertama + ellipsis */}
          {pageNumbers[0] > 1 && (
            <>
              <button
                onClick={() => setCurrentPage(1)}
                className="h-10 w-10 rounded-xl text-sm font-bold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
              >
                1
              </button>
              {pageNumbers[0] > 2 && (
                <span className="text-slate-400 font-bold px-1">…</span>
              )}
            </>
          )}

          {/* Nomor halaman */}
          {pageNumbers.map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`h-10 w-10 rounded-xl text-sm font-bold transition-all shadow-sm border ${
                page === currentPage
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {page}
            </button>
          ))}

          {/* Halaman terakhir + ellipsis */}
          {pageNumbers[pageNumbers.length - 1] < totalPages && (
            <>
              {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
                <span className="text-slate-400 font-bold px-1">…</span>
              )}
              <button
                onClick={() => setCurrentPage(totalPages)}
                className="h-10 w-10 rounded-xl text-sm font-bold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
              >
                {totalPages}
              </button>
            </>
          )}

          {/* Next */}
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="h-10 px-4 rounded-xl text-sm font-bold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            Next →
          </button>
        </div>
      )}

      {selectedLog && (
        <DetailModal
          log={selectedLog}
          onClose={() => setSelectedLog(null)}
        />
      )}
    </div>
  );
}