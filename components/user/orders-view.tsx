"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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
  status: string;
  approvalStatus?: "pending" | "confirmed" | "rejected";
  paymentStatus?: "paid" | "unpaid";
  createdAt: number;
}

const dummyOrders: Order[] = [
  {
    id: "RNT-X92M",
    productId: "p1",
    productName: "Toyota Avanza",
    productImage: "https://images.unsplash.com/photo-1549317661-bd32c8ce0be2?q=80&w=2070&auto=format&fit=crop",
    days: 3,
    startDate: "23 April 2026",
    endDate: "26 April 2026",
    address: "Jl. Sudirman No. 1, Jakarta Pusat",
    total: 1050000,
    status: "Sedang Berjalan",
    approvalStatus: "confirmed",
    paymentStatus: "paid",
    createdAt: Date.now() - 50000,
  },
  {
    id: "RNT-B47K",
    productId: "p5",
    productName: "Laptop Core i5 / R5",
    productImage: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?q=80&w=2071&auto=format&fit=crop",
    days: 7,
    startDate: "10 April 2026",
    endDate: "17 April 2026",
    address: "Gedung Cyber, Lt 5, Jakarta Selatan",
    total: 1260000,
    status: "Selesai",
    approvalStatus: "confirmed",
    paymentStatus: "paid",
    createdAt: Date.now() - 864000000,
  },
];

function normalizeApprovalStatus(value: unknown): "pending" | "confirmed" | "rejected" {
  if (value === "confirmed" || value === "rejected" || value === "pending") {
    return value;
  }
  return "pending";
}

function normalizePaymentStatus(value: unknown): "paid" | "unpaid" {
  if (value === "paid" || value === "unpaid") {
    return value;
  }
  return "unpaid";
}

function approvalBadge(status: "pending" | "confirmed" | "rejected") {
  if (status === "confirmed") {
    return {
      label: "Peminjaman Dikonfirmasi",
      className: "text-emerald-700 bg-emerald-50 border-emerald-200",
    };
  }
  if (status === "rejected") {
    return {
      label: "Peminjaman Ditolak",
      className: "text-rose-700 bg-rose-50 border-rose-200",
    };
  }
  return {
    label: "Peminjaman Pending",
    className: "text-amber-700 bg-amber-50 border-amber-200",
  };
}

function paymentBadge(status: "paid" | "unpaid") {
  if (status === "paid") {
    return {
      label: "Sudah Dibayar",
      className: "text-emerald-700 bg-emerald-50 border-emerald-200",
    };
  }
  return {
    label: "Belum Dibayar",
    className: "text-rose-700 bg-rose-50 border-rose-200",
  };
}

export function OrdersView({ embedded = false }: { embedded?: boolean }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("rental_orders");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.length > 0) {
        const normalizedOrders: Order[] = parsed.map((order: Order) => ({
          ...order,
          approvalStatus: normalizeApprovalStatus(order.approvalStatus),
          paymentStatus: normalizePaymentStatus(order.paymentStatus),
        }));
        setOrders(normalizedOrders);
        return;
      }
    }
    setOrders(dummyOrders);
  }, []);

  function toIdr(num: number) {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(num);
  }

  if (!mounted) return null;

  return (
    <section className={embedded ? "" : "mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8 pt-8 pb-20"}>
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Cek Pesanan</h1>
          <p className="mt-2 text-lg text-slate-600">Riwayat dan status penyewaan Anda saat ini.</p>
        </div>
        <Link
          href="/user/product"
          className="inline-flex items-center justify-center rounded-xl bg-indigo-50 px-4 py-2.5 text-sm font-bold text-indigo-700 shadow-sm transition hover:bg-indigo-100 hover:text-indigo-800"
        >
          Mulai Sewa Baru
        </Link>
      </div>

      <div className="space-y-6">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm text-slate-400">
            <svg className="w-20 h-20 mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            <p className="text-lg font-medium text-slate-500">Belum ada pesanan penyewaan.</p>
          </div>
        ) : (
          orders.sort((a, b) => b.createdAt - a.createdAt).map((order) => {
            const currentApprovalStatus = normalizeApprovalStatus(order.approvalStatus);
            const currentPaymentStatus = normalizePaymentStatus(order.paymentStatus);
            const rentalStatus = approvalBadge(currentApprovalStatus);
            const paymentStatus = paymentBadge(currentPaymentStatus);

            return (
            <div key={order.id} className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden relative transition hover:shadow-md">
              <div className={`absolute top-0 left-0 w-2 h-full ${currentApprovalStatus === "confirmed" ? "bg-emerald-500" : currentApprovalStatus === "rejected" ? "bg-rose-500" : "bg-indigo-500"}`} />

              <div className="p-6 pl-8 flex flex-col md:flex-row md:items-center gap-6">
                <div className="flex items-center gap-6 flex-1">
                  <picture>
                    <img
                      src={order.productImage}
                      alt={order.productName}
                      className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl object-cover border border-slate-100 bg-slate-50"
                    />
                  </picture>
                  <div>
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className={`inline-block px-3 py-1 text-[10px] sm:text-xs font-bold uppercase tracking-widest rounded-full border ${rentalStatus.className}`}>
                        {rentalStatus.label}
                      </span>
                      <span className={`inline-block px-3 py-1 text-[10px] sm:text-xs font-bold uppercase tracking-widest rounded-full border ${paymentStatus.className}`}>
                        {paymentStatus.label}
                      </span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-extrabold text-slate-800 leading-tight">{order.productName}</h3>
                    <p className="text-xs sm:text-sm font-mono text-slate-400 mt-1">ID Order: #{order.id}</p>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">Status Rental: {order.status}</p>

                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        <span>{order.days} Hari ({order.startDate})</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <svg className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        <span className="line-clamp-2">{order.address}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 min-w-[200px]">
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">Total Pembayaran</p>
                  <p className={`text-xl sm:text-2xl font-black ${order.status === "Selesai" ? "text-slate-600" : "text-indigo-700"}`}>
                    {toIdr(order.total)}
                  </p>
                  {order.status !== "Selesai" && (
                    <button className="mt-3 px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200 shadow-sm hidden md:block">
                      Hubungi Admin
                    </button>
                  )}
                </div>
              </div>
            </div>
          )})
        )}
      </div>
    </section>
  );
}