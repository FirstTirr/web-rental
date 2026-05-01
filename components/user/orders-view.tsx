"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  fetchMyRentalHistory,
  formatDate,
  formatIdr,
  getAuthToken,
  getRentalDurationDays,
  cancelRental,
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
  approvalStatus: "pending" | "confirmed" | "rejected" | "canceled";
  paymentStatus: "paid" | "unpaid";
  createdAt: number;
}

// --- Komponen RatingModal ---
function RatingModal({ orderId, onClose }: { orderId: string; onClose: () => void }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return alert("Pilih bintang terlebih dahulu!");
    setIsSubmitting(true);
    setTimeout(() => {
      alert("Terima kasih! Rating Anda telah terkirim.");
      setIsSubmitting(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="relative w-full max-w-md scale-in-center overflow-hidden rounded-[2.5rem] border border-white/50 bg-white/90 p-8 shadow-2xl backdrop-blur-xl sm:p-10 text-slate-900">
        <button onClick={onClose} className="absolute right-6 top-6 text-slate-400 hover:text-slate-900 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="text-center">
          <h2 className="text-2xl font-black tracking-tight uppercase italic">Beri <span className="text-indigo-600">Rating</span></h2>
          <p className="mt-1 text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em]">ORDER ID: #{orderId}</p>
        </div>
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="flex flex-col items-center gap-3">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} type="button" onClick={() => setRating(star)} onMouseEnter={() => setHover(star)} onMouseLeave={() => setHover(0)} className="transition-transform active:scale-90">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`h-10 w-10 transition-colors ${star <= (hover || rating) ? "text-yellow-400" : "text-slate-200"}`}>
                    <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Ceritakan pengalaman Anda..." rows={3} className="block w-full rounded-2xl border border-slate-100 bg-slate-50/50 p-4 text-xs font-bold focus:border-indigo-500 focus:outline-none italic" />
          <button type="submit" disabled={isSubmitting || rating === 0} className="w-full rounded-xl bg-indigo-600 py-4 text-[10px] font-black uppercase tracking-widest text-white shadow-lg transition-all hover:bg-indigo-700 disabled:opacity-50">
            {isSubmitting ? "Mengirim..." : "Kirim Rating Sekarang"}
          </button>
        </form>
      </div>
    </div>
  );
}

// --- Helper Functions ---
function approvalBadge(status: string) {
  if (status === "confirmed") return { label: "Barang Disetujui", className: "text-emerald-700 bg-emerald-50 border-emerald-200" };
  if (status === "rejected") return { label: "Pesanan Ditolak Admin", className: "text-rose-700 bg-rose-50 border-rose-200" };
  if (status === "canceled") return { label: "Pesanan Dibatalkan", className: "text-slate-500 bg-slate-50 border-slate-200" };
  return { label: "Wait For Validation", className: "text-amber-700 bg-amber-50 border-amber-200" };
}

function paymentBadge(status: "paid" | "unpaid") {
  if (status === "paid") return { label: "Sudah Dibayar", className: "text-emerald-700 bg-emerald-50 border-emerald-200" };
  return { label: "Belum Dibayar", className: "text-rose-700 bg-rose-50 border-rose-200" };
}

function mapBackendStatus(status: string): string {
  const normalized = String(status || "").toLowerCase();
  switch (normalized) {
    case "approved": return "Disetujui";
    case "active": return "Sedang Dipinjam";
    case "completed": return "Selesai";
    case "overdue": return "Terlambat";
    case "returned": return "Selesai";
    case "return": return "Selesai";
    case "canceled": return "Dibatalkan";
    case "denied": return "Ditolak";
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
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // --- Pagination State ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const loadOrders = async () => {
    if (!API_URL) return;
    setLoading(true);
    setError(null);
    try {
      const token = getAuthToken();
      const { rows } = await fetchMyRentalHistory(API_URL, token, { page: 1, limit: 100 });
      
      const backendOrders = (rows as any[])
        // Cek Pesanan hanya menampilkan order yang masih berjalan/proses.
        .filter((row) => {
          const status = String(row?.rental_status || "").toLowerCase();
          const hasReturnedAt = Boolean(row?.actual_return_date);
          return !hasReturnedAt && !["canceled", "completed", "overdue", "returned", "return"].includes(status);
        })
        .map((row) => {
          const rentalStatus = String(row?.rental_status || "pending").toLowerCase();
          const isRejected = ["rejected", "expired", "denied"].includes(rentalStatus);
          const isConfirmed = ["approved", "active", "completed", "overdue", "returned", "return"].includes(rentalStatus);
          const isPaid = ["active", "completed", "overdue", "returned", "return"].includes(rentalStatus);

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
            status: mapBackendStatus(rentalStatus),
            approvalStatus: isRejected ? "rejected" : isConfirmed ? "confirmed" : "pending",
            paymentStatus: isPaid ? "paid" : "unpaid",
            createdAt: new Date(row?.created_at || Date.now()).getTime(),
          } as Order;
        });
      setOrders(backendOrders);
    } catch (err) {
      setError("Gagal memuat pesanan.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadOrders(); }, [API_URL]);

  const handleCancelClick = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin membatalkan pesanan ini?")) return;
    if (!API_URL) return;

    setActionLoading(id);
    try {
      const token = getAuthToken();
      const { response, json } = await cancelRental(API_URL, token, parseInt(id));
      if (!response.ok) throw new Error((json.error as string) || "Gagal membatalkan rental");
      alert("Rental berhasil dibatalkan");
      // Memuat ulang data sehingga filter .filter() akan berjalan kembali dan menghapus pesanan tersebut dari list
      await loadOrders();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const sorted = useMemo(() => [...orders].sort((a, b) => b.createdAt - a.createdAt), [orders]);

  // --- Logika Pagination ---
  const totalPages = Math.ceil(sorted.length / itemsPerPage);
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sorted.slice(start, start + itemsPerPage);
  }, [sorted, currentPage]);

  return (
    <section suppressHydrationWarning className={embedded ? "" : "mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8 pt-8 pb-20"}>
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl italic uppercase text-center md:text-left">Cek Pesanan</h1>
          <p className="mt-2 text-lg text-slate-600 font-medium italic text-center md:text-left">Pantau pesanan yang sedang diproses atau berjalan.</p>
        </div>
        <Link href="/user/product" className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-6 py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg transition hover:bg-indigo-600">
          Sewa Lagi
        </Link>
      </div>

      {error && <div className="mb-6 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</div>}

      <div className="space-y-6">
        {loading ? (
          <div className="py-24 text-center bg-white rounded-3xl border border-slate-100 shadow-sm text-slate-400 font-bold uppercase tracking-widest">Memuat...</div>
        ) : paginatedOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[3rem] border-2 border-dashed border-slate-100 text-slate-400">
            <p className="text-lg font-black uppercase tracking-tighter italic">Tidak ada pesanan aktif 🍃</p>
          </div>
        ) : (
          paginatedOrders.map((order) => {
            const rentalStatusBadge = approvalBadge(order.approvalStatus);
            const payStatus = paymentBadge(order.paymentStatus);
            
            const canRate = false;
            const canCancel = order.status === "Menunggu Konfirmasi" && order.approvalStatus === "pending";

            return (
              <div key={order.id} className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden relative transition-all hover:scale-[1.01]">
                <div className={`absolute top-0 left-0 w-2 h-full ${
                    order.approvalStatus === "confirmed" ? "bg-emerald-500" : 
                    order.approvalStatus === "rejected" ? "bg-rose-500" : "bg-indigo-500"
                }`} />

                <div className="p-6 sm:p-8 flex flex-col md:flex-row md:items-center gap-6">
                  <div className="flex items-center gap-6 flex-1">
                    <img src={order.productImage} alt={order.productName} className="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl object-cover bg-slate-50 border border-slate-100 shadow-sm" />
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap gap-2">
                        <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border ${rentalStatusBadge.className}`}>
                          {rentalStatusBadge.label}
                        </span>
                        {(order.approvalStatus !== "rejected") && (
                             <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border ${payStatus.className}`}>
                                {payStatus.label}
                             </span>
                        )}
                      </div>
                      <h3 className="text-lg sm:text-xl font-black text-slate-900 truncate uppercase italic">{order.productName}</h3>
                      <p className="text-[10px] font-black text-indigo-600 mt-1 uppercase tracking-wider">#{order.id} • {order.status}</p>
                      <div className="mt-4 flex flex-col gap-2 text-[11px] font-bold text-slate-500 uppercase tracking-tighter italic">
                        <span>{order.days} Hari • {order.startDate} - {order.endDate}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex md:flex-col items-center md:items-end justify-between border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-8 min-w-[180px]">
                    <div className="text-right">
                      <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Total Biaya</p>
                      <p className="text-xl font-black text-slate-900 tracking-tighter">{formatIdr(order.total)}</p>
                    </div>

                    <div className="mt-4 w-full">
                      {canCancel ? (
                        <button
                          onClick={() => handleCancelClick(order.id)}
                          disabled={actionLoading === order.id}
                          className="w-full rounded-xl bg-rose-50 border border-rose-100 py-2.5 text-[10px] font-black uppercase tracking-widest text-rose-600 transition-all hover:bg-rose-600 hover:text-white disabled:opacity-50"
                        >
                          {actionLoading === order.id ? "Memproses..." : "Batalkan Pesanan"}
                        </button>
                      ) : canRate ? (
                        <button 
                          onClick={() => setSelectedOrderId(order.id)} 
                          className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-[10px] font-black uppercase text-white shadow-lg transition-all hover:bg-indigo-700 shadow-indigo-100"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                            <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401Z" clipRule="evenodd" />
                          </svg>
                          Beri Rating
                        </button>
                      ) : (
                        <div className="text-center text-[9px] font-black uppercase text-slate-400 italic">No Action Available</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* --- Kontrol Pagination --- */}
      {totalPages > 1 && (
        <div className="mt-12 flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-indigo-50 disabled:opacity-30 disabled:hover:bg-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>

          <div className="flex items-center gap-1">
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`h-10 w-10 rounded-xl text-[10px] font-black transition-all ${
                  currentPage === i + 1
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                    : "bg-white text-slate-400 border border-slate-100 hover:bg-slate-50"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-indigo-50 disabled:opacity-30 disabled:hover:bg-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>
      )}

      {selectedOrderId && <RatingModal orderId={selectedOrderId} onClose={() => setSelectedOrderId(null)} />}
    </section>
  );
}
