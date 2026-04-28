"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  fetchRentalReport,
  formatDate,
  formatIdr,
  getAuthToken,
  getRentalDurationDays,
  rentalStatusLabel,
} from "../../../lib/rental-api";

type SummaryCard = {
  label: string;
  value: string;
  detail: string;
  color: string;
};

type ReportRow = {
  id: number;
  product_name: string;
  username: string;
  rental_status: string;
  rental_fee: string;
  late_fee: string;
  start_date: string;
  end_date: string;
  created_at: string;
};

export default function RekapPenjualan() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const [summaryCards, setSummaryCards] = useState<SummaryCard[]>([]);
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const toNumberValue = (value: unknown) => {
    if (typeof value === "number") return value;
    if (typeof value === "string") return Number(value);
    return 0;
  };

  const fetchReport = useCallback(async () => {
    if (!API_URL) {
      setError("Konfigurasi NEXT_PUBLIC_API_URL belum tersedia.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = getAuthToken();
      const { rows: reportRows } = await fetchRentalReport(API_URL, token);
      
      // Urutkan data terbaru di paling atas
      const typedRows = (reportRows as ReportRow[]).sort((a, b) => b.id - a.id);
      setRows(typedRows);

      // --- LOGIKA KALKULASI TOTAL PENDAPATAN (HARGA SEWA + DENDA) ---
      
      // Filter transaksi yang menghasilkan uang (Approved, Active, Completed, Overdue)
      const validRows = typedRows.filter((row) => 
        ["active", "completed", "approved", "overdue"].includes(String(row?.rental_status))
      );

      // 1. Total Pendapatan = Rental Fee + Late Fee (Mau telat atau tidak, pokoknya masuk kantong)
      const totalRevenue = validRows.reduce(
        (acc, row) => acc + toNumberValue(row?.rental_fee) + toNumberValue(row?.late_fee), 
        0
      );

      // 2. Khusus hitung total denda saja
      const totalLateFees = validRows.reduce(
        (acc, row) => acc + toNumberValue(row?.late_fee), 
        0
      );

      // 3. Hitung berapa banyak yang berstatus 'overdue' (terlambat)
      const totalOverdue = typedRows.filter(r => String(r.rental_status) === "overdue").length;

      const totalTransactions = typedRows.length;

      setSummaryCards([
        { 
          label: "Total Pendapatan", 
          value: formatIdr(totalRevenue), 
          detail: "Sewa + Denda dari semua transaksi", 
          color: "text-emerald-600" 
        },
        { 
          label: "Transaksi Terlambat", 
          value: `${totalOverdue} Unit`, 
          detail: "Unit yang melewati batas waktu", 
          color: "text-rose-600" 
        },
        { 
          label: "Total Denda", 
          value: formatIdr(totalLateFees), 
          detail: "Akumulasi biaya keterlambatan", 
          color: "text-amber-600" 
        },
        { 
          label: "Total Transaksi", 
          value: String(totalTransactions), 
          detail: "Semua riwayat di database", 
          color: "text-slate-900" 
        },
      ]);
    } catch (err) {
      setError("Gagal memuat laporan.");
      setSummaryCards([]);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    void fetchReport();
  }, [fetchReport]);

  const performance = useMemo(() => {
    const map = new Map<string, { nama: string; jumlah: number; total: number }>();
    rows.forEach((row) => {
      const key = row.product_name;
      const current = map.get(key) || { nama: key, jumlah: 0, total: 0 };
      current.jumlah += 1;
      current.total += toNumberValue(row.rental_fee) + toNumberValue(row.late_fee);
      map.set(key, current);
    });
    return [...map.values()].sort((a, b) => b.jumlah - a.jumlah).slice(0, 6);
  }, [rows]);

  const metrics = useMemo(() => {
    const statusCount = rows.reduce<Record<string, number>>((acc, row) => {
      const key = String(row.rental_status || "pending");
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const overdue = statusCount.overdue || 0;
    const completed = statusCount.completed || 0;
    const active = statusCount.active || 0;
    const total = rows.length || 1;

    return [
      { label: "Status Terlambat", val: String(overdue), color: "bg-rose-500" },
      { label: "Status Dipinjam", val: String(active), color: "bg-blue-500" },
      { label: "Status Selesai", val: String(completed), color: "bg-emerald-500" },
      { label: "Rasio Selesai", val: `${((completed/total)*100).toFixed(0)}%`, color: "bg-slate-400" },
    ];
  }, [rows]);

  return (
    <div className="space-y-8 pb-12 px-4 sm:px-0 text-slate-900">
      <header className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tighter italic uppercase">Laporan Keuangan</h1>
          <p className="text-slate-500 text-sm font-medium">Rekap pendapatan otomatis termasuk denda keterlambatan.</p>
        </div>
        <button 
          onClick={fetchReport} 
          className="bg-slate-900 hover:bg-emerald-600 text-white px-8 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all shadow-xl shadow-slate-200"
        >
          Refresh Laporan
        </button>
      </header>

      {error && <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</div>}

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {loading ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="h-32 bg-slate-50 animate-pulse rounded-[2rem] border border-slate-100" />
          ))
        ) : (
          summaryCards.map((stat, i) => (
            <motion.div key={i} whileHover={{ y: -5 }} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-50">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
              <h2 className={`text-2xl font-black tracking-tight ${stat.color}`}>{stat.value}</h2>
              <p className="text-[9px] font-bold text-slate-400 mt-3 bg-slate-50 inline-block px-2 py-1 rounded-lg">{stat.detail}</p>
            </motion.div>
          ))
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex justify-between items-center">
            <h3 className="font-black text-slate-800 tracking-tight uppercase text-sm">Produk Terlaris</h3>
            <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase italic">Top Income</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <tr>
                  <th className="px-8 py-4">Nama Produk</th>
                  <th className="px-8 py-4">Sewa</th>
                  <th className="px-8 py-4 text-right">Total Uang Masuk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm">
                {performance.map((item) => (
                  <tr key={item.nama} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-5 font-bold text-slate-700">{item.nama}</td>
                    <td className="px-8 py-5 font-black text-slate-900">{item.jumlah}x</td>
                    <td className="px-8 py-5 text-right font-black text-emerald-600">{formatIdr(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm self-start">
          <h4 className="font-black text-slate-800 text-xs uppercase tracking-widest mb-8">Kesehatan Rental</h4>
          <div className="space-y-8">
            {metrics.map((m, i) => (
              <div key={i}>
                <div className="flex justify-between text-[10px] font-black mb-2 uppercase">
                  <span className="text-slate-400 tracking-widest">{m.label}</span>
                  <span className="text-slate-900">{m.val}</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: "100%" }} className={`h-full ${m.color}`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* TABLE TRANSAKSI TERBARU */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-50 overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
          <h3 className="font-black text-slate-800 tracking-tight uppercase text-sm">Riwayat Transaksi</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <tr>
                <th className="px-8 py-4">Pelanggan</th>
                <th className="px-8 py-4">Produk</th>
                <th className="px-8 py-4">Status</th>
                <th className="px-8 py-4 text-right">Biaya Sewa</th>
                <th className="px-8 py-4 text-right">Denda</th>
                <th className="px-8 py-4 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {rows.map((row) => {
                const badge = rentalStatusLabel(row.rental_status);
                const total = toNumberValue(row.rental_fee) + toNumberValue(row.late_fee);
                return (
                  <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-5 font-bold text-slate-700">{row.username || "Guest"}</td>
                    <td className="px-8 py-5 font-medium text-slate-600">{row.product_name}</td>
                    <td className="px-8 py-5">
                      <span className={`text-[9px] uppercase font-black px-3 py-1 rounded-lg ${badge.className}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right font-medium text-slate-500">{formatIdr(toNumberValue(row.rental_fee))}</td>
                    <td className={`px-8 py-5 text-right font-bold ${toNumberValue(row.late_fee) > 0 ? "text-rose-600" : "text-slate-400"}`}>
                      {formatIdr(toNumberValue(row.late_fee))}
                    </td>
                    <td className="px-8 py-5 text-right font-black text-slate-900">{formatIdr(total)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}