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

// --- Tipe Data ---
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

// --- Komponen Rating Modal (Pop-up) ---
function RatingModal({ orderId, onClose }: { orderId: string; onClose: () => void }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return alert("Pilih bintang terlebih dahulu!");
    
    setIsSubmitting(true);
    // Simulasi pengiriman data
    setTimeout(() => {
      alert("Terima kasih! Rating Anda untuk order #" + orderId + " telah terkirim.");
      setIsSubmitting(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="relative w-full max-w-md scale-in-center overflow-hidden rounded-[2.5rem] border border-white/50 bg-white/90 p-8 shadow-2xl backdrop-blur-xl sm:p-10">
        {/* Tombol Close */}
        <button onClick={onClose} className="absolute right-6 top-6 text-slate-400 hover:text-slate-900 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="text-center">
          <h2 className="text-2xl font-black tracking-tight text-slate-900 uppercase italic">Beri <span className="text-indigo-600">Rating</span></h2>
          <p className="mt-1 text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em]">ORDER ID: #{orderId}</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="flex flex-col items-center gap-3">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHover(star)}
                  onMouseLeave={() => setHover(0)}
                  className="transition-transform active:scale-90"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className={`h-10 w-10 transition-colors ${star <= (hover || rating) ? "text-yellow-400" : "text-slate-200"}`}
                  >
                    <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                  </svg>
                </button>
              ))}
            </div>
          </div>

          <div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Ceritakan pengalaman Anda menyewa unit ini..."
              rows={3}
              className="block w-full rounded-2xl border border-slate-100 bg-slate-50/50 p-4 text-xs font-bold transition-all focus:border-indigo-500 focus:outline-none italic"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || rating === 0}
            className="w-full rounded-xl bg-indigo-600 py-4 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-indigo-100 transition-all hover:bg-indigo-700 disabled:opacity-50"
          >
            {isSubmitting ? "Mengirim..." : "Kirim Rating Sekarang"}
          </button>
        </form>
      </div>
    </div>
  );
}

// --- Helper Functions ---
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

// --- Main Component ---
export function OrdersView({ embedded = false }: { embedded?: boolean }) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State untuk Pop-up
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

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
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl italic uppercase">Cek Pesanan</h1>
          <p className="mt-2 text-lg text-slate-600 font-medium italic">Pantau pesanan yang sedang diproses atau berjalan.</p>
        </div>
        <Link
          href="/user/product"
          className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-6 py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg transition hover:bg-indigo-600"
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
            const canRate = order.paymentStatus === "paid"; 

            return (
              <div key={order.id} className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden relative transition-all hover:scale-[1.01]">
                <div className={`absolute top-0 left-0 w-2 h-full ${order.approvalStatus === "confirmed" ? "bg-emerald-500" : "bg-indigo-500"}`} />

                <div className="p-6 sm:p-8 flex flex-col md:flex-row md:items-center gap-6">
                  {/* Bagian Kiri: Produk */}
                  <div className="flex items-center gap-6 flex-1">
                    <img
                      src={order.productImage}
                      alt={order.productName}
                      className="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl object-cover bg-slate-50 border border-slate-100 shadow-sm"
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
                      <h3 className="text-lg sm:text-xl font-black text-slate-900 truncate leading-tight uppercase italic">{order.productName}</h3>
                      <p className="text-[10px] font-black text-indigo-600 mt-1 uppercase tracking-wider">#{order.id} • {order.status}</p>
                      
                      <div className="mt-4 flex flex-col gap-2 text-[11px] font-bold text-slate-500 uppercase tracking-tighter">
                        <div className="flex items-center gap-2">
                           <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-900 italic">{order.days} Hari</span>
                           <span className="italic">{order.startDate} - {order.endDate}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bagian Kanan: Total & Tombol */}
                  <div className="flex md:flex-col items-center md:items-end justify-between border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-8 min-w-[180px]">
                    <div className="text-right">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Biaya</p>
                      <p className="text-xl sm:text-2xl font-black text-slate-900 tracking-tighter">
                        {formatIdr(order.total)}
                      </p>
                    </div>

                    <div className="mt-4 w-full">
                      {canRate ? (
                        <button
                          onClick={() => setSelectedOrderId(order.id)}
                          className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-indigo-100 transition-all hover:bg-indigo-700 hover:-translate-y-0.5"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          Beri Rating
                        </button>
                      ) : (
                        <div className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-400 cursor-not-allowed italic">
                          Belum Bayar
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pop-up Rating Modal */}
      {selectedOrderId && (
        <RatingModal 
          orderId={selectedOrderId} 
          onClose={() => setSelectedOrderId(null)} 
        />
      )}
    </section>
  );
}