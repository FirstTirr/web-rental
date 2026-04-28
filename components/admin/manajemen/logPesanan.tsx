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

export default function LogPeminjaman() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const [selectedLog, setSelectedLog] = useState<AdminRentalRow | null>(null);
  const [logs, setLogs] = useState<AdminRentalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  return (
    <div className="space-y-8 w-full max-w-7xl mx-auto px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Log Peminjaman</h1>
          <p className="text-slate-500 font-medium">Riwayat lengkap aktivitas rental dari backend.</p>
        </div>
      </header>

      {error && <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</div>}

      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          <div className="py-24 text-center bg-white rounded-[2rem] border border-slate-100 text-slate-400 font-bold">Memuat data...</div>
        ) : sortedLogs.length === 0 ? (
          <div className="py-24 text-center bg-white rounded-[2rem] border border-dashed border-slate-100 text-slate-400 font-bold">Belum ada data rental.</div>
        ) : (
          sortedLogs.map((log) => {
            const badge = rentalStatusLabel(log.status);
            return (
              <div
                key={log.id}
                className="bg-white p-5 sm:p-6 lg:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-slate-100 shadow-xl flex flex-col lg:flex-row gap-6 lg:gap-8 items-start lg:items-center justify-between"
              >
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-mono font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">LOG-{String(log.id).padStart(4, "0")}</span>
                    <span className={`text-[10px] uppercase font-black px-3 py-1 rounded-full ${badge.className}`}>{badge.label}</span>
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

      {selectedLog && (
        <DetailModal
          log={selectedLog}
          onClose={() => setSelectedLog(null)}
        />
      )}
    </div>
  );
}
