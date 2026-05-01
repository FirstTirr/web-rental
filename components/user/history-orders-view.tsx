"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { fetchMyRentalHistory, formatDate, formatIdr, getAuthToken, getRentalDurationDays } from "../../lib/rental-api";

interface HistoryOrder {
  id: string;
  productName: string;
  productImage: string;
  days: number;
  startDate: string;
  endDate: string;
  total: number;
  status: string;
  lateFee: number;
  createdAt: number;
}


function resolveProductImage(apiUrl: string, photoUrl?: string | null) {
  if (!photoUrl) return "https://placehold.co/600x400?text=No+Image";
  if (photoUrl.startsWith("http")) return photoUrl;
  const fileName = photoUrl.includes("/") ? photoUrl.split("/").pop() : photoUrl;
  return `${apiUrl}/api/images/products/${fileName}`;
}

function statusBadge(status: string, lateFee: number) {
  if (status === "overdue" || lateFee > 0) return { label: "Selesai (Terlambat)", className: "bg-amber-50 text-amber-700 border-amber-200" };
  return { label: "Selesai", className: "bg-emerald-50 text-emerald-700 border-emerald-200" };
}

export function HistoryOrdersView() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const [orders, setOrders] = useState<HistoryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadHistory = async () => {
      if (!API_URL) return;
      setLoading(true);
      setError(null);
      try {
        const token = getAuthToken();
        const { rows } = await fetchMyRentalHistory(API_URL, token, { page: 1, limit: 100 });

        const historyOrders = (rows as any[])
          .filter((row) => {
            const status = String(row?.rental_status || "").toLowerCase();
            const hasReturnedAt = Boolean(row?.actual_return_date);
            return hasReturnedAt || ["completed", "overdue", "returned", "return"].includes(status);
          })
          .map((row) => ({
            id: String(row?.id ?? "-"),
            productName: String(row?.product_name || "Produk"),
            productImage: resolveProductImage(API_URL, row?.product_photo_url),
            days: getRentalDurationDays(row?.start_date, row?.end_date),
            startDate: formatDate(row?.start_date),
            endDate: formatDate(row?.end_date),
            total: Number(row?.rental_fee || 0) + Number(row?.late_fee || 0),
            lateFee: Number(row?.late_fee || 0),
            status: String(row?.rental_status || "completed").toLowerCase(),
            createdAt: new Date(row?.created_at || Date.now()).getTime(),
          }));

        setOrders(historyOrders);
      } catch {
        setError("Gagal memuat riwayat pesanan.");
      } finally {
        setLoading(false);
      }
    };

    void loadHistory();
  }, [API_URL]);

  const sorted = useMemo(() => [...orders].sort((a, b) => b.createdAt - a.createdAt), [orders]);

  return (
    <section className="mx-auto w-full max-w-4xl pt-8 pb-20 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl italic uppercase">History Pesanan</h1>
        <p className="mt-2 text-lg text-slate-600 font-medium italic">Daftar pesanan yang sudah selesai, termasuk yang sempat terlambat.</p>
      </div>

      {error && <div className="mb-6 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</div>}

      <div className="space-y-6">
        {loading ? (
          <div className="py-24 text-center bg-white rounded-3xl border border-slate-100 shadow-sm text-slate-400 font-bold uppercase tracking-widest">Memuat...</div>
        ) : sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[3rem] border-2 border-dashed border-slate-100 text-slate-400">
            <p className="text-lg font-black uppercase tracking-tighter italic">Belum ada history pesanan</p>
          </div>
        ) : (
          sorted.map((order) => {
            const badge = statusBadge(order.status, order.lateFee);
            return (
              <div key={order.id} className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden relative transition-all hover:scale-[1.01]">
                <div className={`absolute top-0 left-0 w-2 h-full ${(order.status === "overdue" || order.lateFee > 0) ? "bg-amber-500" : "bg-emerald-500"}`} />
                <div className="p-6 sm:p-8 flex flex-col md:flex-row md:items-center gap-6">
                  <div className="flex items-center gap-6 flex-1">
                    <img src={order.productImage} alt={order.productName} className="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl object-cover bg-slate-50 border border-slate-100 shadow-sm" />
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap gap-2">
                        <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border ${badge.className}`}>
                          {badge.label}
                        </span>
                      </div>
                      <h3 className="text-lg sm:text-xl font-black text-slate-900 truncate uppercase italic">{order.productName}</h3>
                      <p className="text-[10px] font-black text-indigo-600 mt-1 uppercase tracking-wider">#{order.id}</p>
                      <div className="mt-4 text-[11px] font-bold text-slate-500 uppercase tracking-tighter italic">
                        {order.days} Hari • {order.startDate} - {order.endDate}
                      </div>
                    </div>
                  </div>

                  <div className="flex md:flex-col items-center md:items-end justify-between border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-8 min-w-[180px]">
                    <div className="text-right">
                      <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Total Biaya</p>
                      <p className="text-xl font-black text-slate-900 tracking-tighter">{formatIdr(order.total)}</p>
                    </div>
                    
                    <Link href={`/user/rating/${order.id}`} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-[10px] font-black uppercase text-white shadow-lg transition-all hover:bg-indigo-700 shadow-indigo-100 active:scale-95">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                        <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401Z" clipRule="evenodd" />
                      </svg>
                      Beri Rating
                    </Link>
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
