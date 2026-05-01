// konfirmasiPembayaran.tsx
"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  activateRental,
  fetchAdminRentals,
  formatDate,
  formatIdr,
  getAuthToken,
} from "../../../lib/rental-api";

type PaymentItem = {
  id: string;
  rentalId: number;
  user: string;
  targetAmount: number;
  method: string;
  date: string;
  unitSewa: string;
  paidAmount?: number;
  status?: string;
};

const ITEMS_PER_PAGE = 10;

export default function VerifikasiPembayaranUI() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const [currentPage, setCurrentPage] = useState<'verifikasi' | 'lunas'>('verifikasi');
  const [searchQuery, setSearchQuery] = useState("");
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [completedPayments, setCompletedPayments] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false); // State untuk sinkronisasi transaksi backend
  const [error, setError] = useState("");
  const [activeAction, setActiveAction] = useState<PaymentItem | null>(null);
  const [inputAmount, setInputAmount] = useState("");
  const [page, setPage] = useState(1);

  const mapRentalToPayment = useCallback((row: any): PaymentItem => {
    const rentalFee = Number(row?.rental_fee || 0);
    const lateFee = Number(row?.late_fee || 0);
    const total = rentalFee + lateFee;
    return {
      id: `RNT-${row?.id ?? "-"}`,
      rentalId: Number(row?.id || 0),
      user: String(row?.username || `User #${row?.user_id ?? "-"}`),
      targetAmount: total,
      method: "Manual",
      date: formatDate(row?.created_at),
      unitSewa: String(row?.product_name || "Produk"),
    };
  }, []);

  const fetchPayments = useCallback(async () => {
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
      const typedRows = Array.isArray(rows) ? rows : [];
      const approved = typedRows.filter((row) => String(row?.rental_status) === "approved").map(mapRentalToPayment);
      const activeOrCompleted = typedRows
        .filter((row) => ["active", "completed"].includes(String(row?.rental_status)))
        .map((row) => ({
          ...mapRentalToPayment(row),
          status: "LUNAS",
          paidAmount: Number(row?.rental_fee || 0) + Number(row?.late_fee || 0),
        }));
      setPayments(approved);
      setCompletedPayments(activeOrCompleted);
    } catch {
      setError("Gagal memuat data pembayaran.");
      setPayments([]);
      setCompletedPayments([]);
    } finally {
      setLoading(false);
    }
  }, [API_URL, mapRentalToPayment]);

  useEffect(() => { void fetchPayments(); }, [fetchPayments]);
  useEffect(() => { setPage(1); }, [currentPage, searchQuery]);

  const filteredPayments = useMemo(() => {
    const data = currentPage === "verifikasi" ? payments : completedPayments;
    return data.filter((p) =>
      p.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [currentPage, payments, completedPayments, searchQuery]);

  const totalPages = Math.ceil(filteredPayments.length / ITEMS_PER_PAGE);
  const paginatedPayments = filteredPayments.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const pageNumbers = useMemo(() => {
    const delta = 2;
    const range: number[] = [];
    for (let i = Math.max(1, page - delta); i <= Math.min(totalPages, page + delta); i++) {
      range.push(i);
    }
    return range;
  }, [page, totalPages]);

  // Implementasi ActivateRentalByID dari Backend ke Frontend
  const handleConfirm = async () => {
    if (!activeAction || isProcessing) return;
    
    const currentAction = activeAction;
    const amount = Number(inputAmount);

    // Backend mensyaratkan status 'approved' dan eksekusi transaksi database
    if (amount === currentAction.targetAmount) {
      setIsProcessing(true);
      try {
        if (!API_URL) throw new Error("Konfigurasi backend belum tersedia.");
        const token = getAuthToken();

        // Menjalankan fungsi yang memicu ActivateRentalByID di backend
        const result = await activateRental(API_URL, token, currentAction.rentalId);

        if (!result.response.ok) {
          const payload = result.json as any;
          // Menangkap ErrRentalNotApproved atau ErrItemInstanceNotFound
          throw new Error(String(payload?.error || "Gagal mengaktifkan rental"));
        }

        // Berhasil Commit di Backend: Update State UI
        setCompletedPayments((prev) => [...prev, { ...currentAction, paidAmount: amount, status: "LUNAS" }]);
        setPayments((prev) => prev.filter((p) => p.id !== currentAction.id));
        setCurrentPage("lunas");
        
      } catch (err: any) {
        // Menangani Rollback atau kegagalan koneksi
        alert(err?.message || "Terjadi kesalahan pada transaksi database.");
      } finally {
        setIsProcessing(false);
      }
    } else {
      alert("Pembayaran harus lunas (sesuai tagihan) untuk mengaktifkan unit.");
    }
    setActiveAction(null);
    setInputAmount("");
  };

  function handleClose() {
    if (isProcessing) return;
    setActiveAction(null);
    setInputAmount("");
  }

  return (
    <div className="relative min-h-screen space-y-8 w-full max-w-6xl mx-auto px-4 py-4 sm:px-6 sm:py-6 md:px-8 md:py-8">
      {/* Header & Search */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tighter">
            {currentPage === 'verifikasi' ? 'Verifikasi Dana' : 'Riwayat Lunas'}
          </h1>
          {!loading && filteredPayments.length > 0 && (
            <p className="text-sm text-slate-400 font-medium mt-1">
              Menampilkan {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, filteredPayments.length)} dari {filteredPayments.length} data
            </p>
          )}
        </div>
        <div className="relative group">
          <input
            type="text"
            placeholder="Cari nama atau ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 pr-6 py-4 w-full md:w-80 rounded-2xl bg-white border border-slate-100 shadow-xl shadow-slate-200/50 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
          />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl">🔍</span>
        </div>
      </header>

      {error && (
        <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</div>
      )}

      {/* Grid Card */}
      <div className="grid gap-6">
        {loading ? (
          <div className="text-center py-20 bg-white rounded-[3rem] border border-dashed border-slate-200">
            <p className="text-slate-400 font-bold uppercase tracking-widest">Memuat data...</p>
          </div>
        ) : paginatedPayments.length > 0 ? paginatedPayments.map((pay) => (
          <div key={pay.id} className="group relative bg-white p-1 rounded-[2.2rem] transition-all hover:scale-[1.01]">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-100 to-emerald-100 rounded-[2.2rem] opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-white p-4 sm:p-6 rounded-[2rem] flex flex-col md:flex-row items-start sm:items-center justify-between gap-6 shadow-sm border border-slate-50">
              <div className="flex items-start sm:items-center gap-4 sm:gap-6 min-w-0">
                <div className={`h-16 w-16 rounded-2xl flex items-center justify-center text-2xl shadow-inner ${currentPage === 'lunas' ? 'bg-emerald-50' : 'bg-slate-50'}`}>
                  {currentPage === 'lunas' ? '✅' : '💳'}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md uppercase">{pay.id}</span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{pay.date}</span>
                  </div>
                  <h3 className="text-xl font-black text-slate-800">{pay.user}</h3>
                  <p className="text-sm text-slate-500 font-medium">{pay.unitSewa} • <span className="text-slate-900">{pay.method}</span></p>
                </div>
              </div>

              <div className="flex flex-col items-start md:items-end">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                  {currentPage === 'lunas' ? 'Total Dibayar' : 'Tagihan'}
                </p>
                <p className={`text-2xl font-black ${currentPage === 'lunas' ? 'text-emerald-600' : 'text-slate-900'}`}>
                  {formatIdr(pay.targetAmount)}
                </p>
              </div>

              {currentPage === 'verifikasi' && (
                <button
                  onClick={() => setActiveAction(pay)}
                  className="w-full md:w-auto px-6 sm:px-10 py-3 sm:py-4 rounded-2xl bg-slate-900 text-white font-bold hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200"
                >
                  Verifikasi
                </button>
              )}
            </div>
          </div>
        )) : (
          <div className="text-center py-20 bg-white rounded-[3rem] border border-dashed border-slate-200">
            <p className="text-slate-400 font-bold uppercase tracking-widest">Data Tidak Ditemukan</p>
          </div>
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
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="h-10 px-4 rounded-xl text-sm font-bold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            Next →
          </button>
        </div>
      )}

      {/* Modal Validasi - Tersinkronisasi dengan Backend */}
      {activeAction && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-xl" onClick={handleClose} />
          <div className="relative bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl border border-white">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-2xl font-black text-slate-900">Validasi Nominal</h2>
                <p className="text-sm text-slate-500 font-medium">Data akan langsung di-update di database.</p>
              </div>
              <span className="text-3xl">{isProcessing ? "⏳" : "🎯"}</span>
            </div>

            <div className="space-y-6">
              <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-400 uppercase">Harus Dibayar</span>
                <span className="text-lg font-black text-slate-900">{formatIdr(activeAction.targetAmount)}</span>
              </div>
              <div>
                <input
                  type="number"
                  autoFocus
                  disabled={isProcessing}
                  value={inputAmount}
                  onChange={(e) => setInputAmount(e.target.value)}
                  placeholder="Masukkan nominal..."
                  className="w-full p-6 rounded-[1.5rem] bg-slate-50 border-2 border-slate-100 focus:border-slate-900 focus:outline-none text-2xl font-black transition-all disabled:opacity-50"
                />
                {Number(inputAmount) === activeAction.targetAmount && !isProcessing && (
                  <p className="text-xs font-bold text-emerald-600 mt-3 ml-2">✨ Nominal Pas! Aktivasi diizinkan.</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-10">
              <button 
                onClick={handleClose} 
                disabled={isProcessing}
                className="py-5 rounded-2xl bg-slate-100 text-slate-500 font-bold hover:bg-slate-200 transition-all disabled:opacity-30"
              >
                Batal
              </button>
              <button
                onClick={handleConfirm}
                disabled={!inputAmount || Number(inputAmount) <= 0 || isProcessing}
                className="py-5 rounded-2xl bg-slate-900 text-white font-bold shadow-2xl hover:scale-[1.02] active:scale-95 transition-all disabled:bg-slate-400"
              >
                {isProcessing ? "Menyimpan..." : "Konfirmasi"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}