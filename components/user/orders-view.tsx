"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  fetchMyRentalHistory,
  formatDate,
  formatIdr,
  getAuthToken,
  getRentalDurationDays,
} from "../../lib/rental-api";

interface Order {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  days: number;
  startDate: string;
  endDate: string;
  address: string;
  total: number;
  lateFee: number;
  status: string;
  approvalStatus: "pending" | "confirmed" | "rejected";
  paymentStatus: "paid" | "unpaid";
  createdAt: number;
}

// 1. Perbaikan Fungsi Badge agar lebih akurat sesuai UI
function approvalBadge(status: "pending" | "confirmed" | "rejected") {
  if (status === "confirmed") return { label: "Barang Dalam Perjalanan", className: "text-emerald-700 bg-emerald-50 border-emerald-200" };
  if (status === "rejected") return { label: "Peminjaman Ditolak", className: "text-rose-700 bg-rose-50 border-rose-200" };
  return { label: "Wait For Validation", className: "text-amber-700 bg-amber-50 border-amber-200" };
}

function paymentBadge(status: "paid" | "unpaid") {
  if (status === "paid") return { label: "Sudah Dibayar", className: "text-emerald-700 bg-emerald-50 border-emerald-200" };
  return { label: "Belum Dibayar", className: "text-rose-700 bg-rose-50 border-rose-200" };
}

function mapBackendStatus(status: string): string {
  switch (status) {
    case "approved": return "Disetujui";
    case "active": return "Dipinjam";
    case "completed": return "Selesai";
    case "overdue": return "Terlambat";
    case "canceled": return "Dibatalkan";
    default: return "Menunggu Konfirmasi";
  }
}

function resolveProductImage(apiUrl: string, photoUrl?: string | null) {
  if (!photoUrl) return "https://placehold.co/600x400?text=No+Image";
  if (photoUrl.startsWith("http")) return photoUrl;
  const fileName = photoUrl.includes('/') ? photoUrl.split('/').pop() : photoUrl;
  return `${apiUrl}/api/images/products/${fileName}`;
}

export function OrdersView({ embedded = false }: { embedded?: boolean }) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadOrders = async () => {
      if (!API_URL) return;
      setLoading(true);
      setError(null);

      try {
        const token = getAuthToken();
        const { rows } = await fetchMyRentalHistory(API_URL, token, { page: 1, limit: 50 });
        
        const backendOrders = (rows as any[])
          .map((row) => {
            const rentalStatus = String(row?.rental_status || "pending");
            
            // Logika Penentuan Status Internal
            const isRejected = ["canceled", "rejected", "expired"].includes(rentalStatus);
            const isConfirmed = ["approved", "active", "completed", "overdue"].includes(rentalStatus);
            const isPaid = ["active", "completed", "overdue"].includes(rentalStatus);

            return {
              id: String(row?.id ?? "-"),
              productId: String(row?.item_instance_id ?? "-"),
              productName: String(row?.product_name || "Produk"),
              productImage: resolveProductImage(API_URL, row?.product_photo_url),
              days: getRentalDurationDays(row?.start_date, row?.end_date),
              startDate: formatDate(row?.start_date),
              endDate: formatDate(row?.end_date),
              address: "Alamat pengiriman terekam di sistem",
              total: Number(row?.rental_fee || 0) + Number(row?.late_fee || 0),
              lateFee: Number(row?.late_fee || 0),
              status: mapBackendStatus(rentalStatus),
              approvalStatus: isRejected ? "rejected" : isConfirmed ? "confirmed" : "pending",
              paymentStatus: isPaid ? "paid" : "unpaid",
              createdAt: new Date(row?.created_at || Date.now()).getTime(),
            } as Order;
          })
          // 2. FILTER UTAMA: Hapus order yang statusnya ditolak/dibatalkan dari list
          .filter(order => order.approvalStatus !== "rejected");

        setOrders(backendOrders);
      } catch (err) {
        setError("Gagal memuat pesanan.");
      } finally {
        setLoading(false);
      }
    };

    void loadOrders();
  }, [API_URL]);

  const sorted = useMemo(() => [...orders].sort((a, b) => b.createdAt - a.createdAt), [orders]);

  return (
    <section suppressHydrationWarning className={embedded ? "" : "mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8 pt-8 pb-20"}>
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl italic">Cek Pesanan</h1>
          <p className="mt-2 text-lg text-slate-600 font-medium">Pantau pesanan yang sedang diproses atau berjalan.</p>
        </div>
        <Link
          href="/user/product"
          className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-indigo-600"
        >
          Sewa Lagi
        </Link>
      </div>

      {error && <div className="mb-6 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</div>}

      <div className="space-y-6">
        {loading ? (
          <div className="py-24 text-center bg-white rounded-3xl border border-slate-100 shadow-sm text-slate-400 font-bold uppercase tracking-widest">Memuat...</div>
        ) : sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[3rem] border-2 border-dashed border-slate-100 text-slate-400">
            <p className="text-lg font-black uppercase tracking-tighter italic">Tidak ada pesanan aktif 🍃</p>
          </div>
        ) : (
          sorted.map((order) => {
            const rentalStatus = approvalBadge(order.approvalStatus);
            const payStatus = paymentBadge(order.paymentStatus);

            return (
              <div key={order.id} className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden relative transition-all hover:scale-[1.01]">
                <div className={`absolute top-0 left-0 w-2 h-full ${order.approvalStatus === "confirmed" ? "bg-emerald-500" : "bg-indigo-500"}`} />

                <div className="p-6 sm:p-8 flex flex-col md:flex-row md:items-center gap-6">
                  <div className="flex items-center gap-6 flex-1">
                    <img
                      src={order.productImage}
                      alt={order.productName}
                      className="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl object-cover bg-slate-50 border border-slate-100"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap gap-2">
                        <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border ${rentalStatus.className}`}>
                          {rentalStatus.label}
                        </span>
                        <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border ${payStatus.className}`}>
                          {payStatus.label}
                        </span>
                      </div>
                      <h3 className="text-lg sm:text-xl font-black text-slate-900 truncate leading-tight">{order.productName}</h3>
                      <p className="text-[10px] font-black text-blue-600 mt-1 uppercase">#{order.id} • {order.status}</p>
                      
                      <div className="mt-4 flex flex-col gap-2 text-xs font-bold text-slate-500">
                        <div className="flex items-center gap-2">
                           <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700">{order.days} Hari</span>
                           <span>{order.startDate} - {order.endDate}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex md:flex-col items-center md:items-end justify-between border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-8">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Biaya</p>
                    <p className="text-xl sm:text-2xl font-black text-slate-900">
                      {formatIdr(order.total)}
                    </p>
                    {order.paymentStatus === "unpaid" && (
                       <p className="text-[9px] font-black text-rose-500 mt-1 uppercase">Menunggu Pembayaran</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}