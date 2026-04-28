"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

// Memuat MapPicker secara dinamis tanpa Server Side Rendering (SSR) karena komponen Leaflet membutuhkan API Browser/Window.
const MapPicker = dynamic(() => import("./map-picker"), { 
  ssr: false, 
  loading: () => <div className="h-[200px] w-full rounded-xl bg-slate-100 flex items-center justify-center text-sm font-medium text-slate-500 border border-slate-200">Memuat Peta Interaktif...</div> 
});

type ProfileApiResult = {
  data?: {
    address?: string;
  };
  error?: string;
};

type CreateRentalApiResult = {
  data?: Record<string, unknown>;
  message?: string;
  error?: string;
};

const PROFILE_ENDPOINT_CANDIDATES = [
  "/api/users/profile",
  "/api/profile",
  "/api/users/profile",
  "/api/users/me",
];

const CREATE_RENTAL_ENDPOINT_CANDIDATES = ["/api/rentals"];

async function parseProfileResult(response: Response): Promise<ProfileApiResult> {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return (await response.json()) as ProfileApiResult;
  }

  const rawText = await response.text();
  return {
    error: rawText?.trim() || `Request gagal dengan status ${response.status}`,
  };
}

async function parseCreateRentalResult(response: Response): Promise<CreateRentalApiResult> {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return (await response.json()) as CreateRentalApiResult;
  }

  const rawText = await response.text();
  return {
    error: rawText?.trim() || `Request gagal dengan status ${response.status}`,
  };
}

export function Calculator({ pricePerDay, productName = "Produk", productImage = "", productId = "0" }: { pricePerDay: number, productName?: string, productImage?: string, productId?: string }) {
  const router = useRouter();
  const [days, setDays] = useState<number>(1);
  const [address, setAddress] = useState<string>("");
  const profileEndpointRef = useRef<string>(PROFILE_ENDPOINT_CANDIDATES[0]);
  const [minStartDate] = useState<string>(() => {
    const tzOffset = new Date().getTimezoneOffset() * 60000;
    return new Date(Date.now() - tzOffset).toISOString().slice(0, 10);
  });
  const [startDate, setStartDate] = useState<string>(() => {
    // Default: Hari ini
    const tzOffset = new Date().getTimezoneOffset() * 60000;
    return new Date(Date.now() - tzOffset).toISOString().slice(0, 10);
  });
  const maxDays = 60; // maksimal perhitungan contoh 2 bulan

  const handleInput = (val: number) => {
    if (val < 1) val = 1;
    if (val > maxDays) val = maxDays;
    setDays(val);
  };

  const getDiscountData = (d: number) => {
    if (d >= 30) return { discountLabel: "15% (Sebulan+)", factor: 0.85 };
    if (d >= 21) return { discountLabel: "7% (3 Minggu+)", factor: 0.93 };
    if (d >= 14) return { discountLabel: "5% (2 Minggu+)", factor: 0.95 };
    if (d >= 7) return { discountLabel: "3% (1 Minggu+)", factor: 0.97 };
    return { discountLabel: "Tidak ada", factor: 1.0 };
  };

  const { discountLabel, factor } = getDiscountData(days);
  const baseTotal = pricePerDay * days;
  const finalTotal = baseTotal * factor;
  const amountSaved = baseTotal - finalTotal;

  // Tanggal Mulai dan Selesai (hari ini -> hari ini + days)
  const startD = new Date(startDate);
  const endDate = new Date(startD);
  endDate.setDate(startD.getDate() + days);
  
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(date);
  };

  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function toIdr(num: number) {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(num);
  }

  useEffect(() => {
    let isCancelled = false;

    const fetchUserAddress = async () => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) return;

      const token = localStorage.getItem("token");
      if (!token) return;

      const endpoints = [
        profileEndpointRef.current,
        ...PROFILE_ENDPOINT_CANDIDATES.filter((endpoint) => endpoint !== profileEndpointRef.current),
      ];

      for (const endpoint of endpoints) {
        const response = await fetch(`${apiUrl}${endpoint}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const result = await parseProfileResult(response);

        if (response.status === 404) {
          continue;
        }

        if (!response.ok) {
          return;
        }

        profileEndpointRef.current = endpoint;
        const userAddress = result?.data?.address?.trim() || "";
        if (!isCancelled && userAddress) {
          setAddress((prev) => (prev.trim() ? prev : userAddress));
        }
        return;
      }
    };

    fetchUserAddress();

    return () => {
      isCancelled = true;
    };
  }, []);

  const toApiDate = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  };

  const createRental = async () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    if (!address.trim()) {
      alert("Alamat wajib diisi.");
      return;
    }

    if (!apiUrl) {
      alert("Konfigurasi backend belum tersedia.");
      return;
    }

    const payload = {
      product_id: Number(productId),
      start_date: toApiDate(startDate),
      end_date: toApiDate(new Date(endDate.getTime()).toISOString().slice(0, 10)),
    };

    setIsSubmitting(true);
    try {
      const endpoints = CREATE_RENTAL_ENDPOINT_CANDIDATES;
      let lastResponse: Response | null = null;
      let lastResult: CreateRentalApiResult = {};

      for (const endpoint of endpoints) {
        const response = await fetch(`${apiUrl}${endpoint}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(payload),
        });

        const result = await parseCreateRentalResult(response);
        lastResponse = response;
        lastResult = result;

        if (response.status === 404 || response.status === 405) {
          continue;
        }

        if (!response.ok) {
          throw new Error(String(result?.error || "Gagal membuat pesanan."));
        }

        setShowModal(false);
        router.push("/user/pesanan");
        return;
      }

      // Fallback lokal jika backend belum menyediakan route yang cocok.
      if (lastResponse && (lastResponse.status === 404 || lastResponse.status === 405)) {
        const prevOrders = localStorage.getItem("rental_orders");
        const orders = prevOrders ? JSON.parse(prevOrders) : [];

        const newOrder = {
          id: Math.random().toString(36).substring(2, 9).toUpperCase(),
          productId,
          productName,
          productImage,
          days,
          startDate: formatDate(startD),
          endDate: formatDate(endDate),
          address,
          total: finalTotal,
          status: "Menunggu Konfirmasi",
          approvalStatus: "pending",
          paymentStatus: "unpaid",
          createdAt: Date.now(),
        };

        orders.push(newOrder);
        localStorage.setItem("rental_orders", JSON.stringify(orders));
        setShowModal(false);
        router.push("/user/pesanan");
        return;
      }

      throw new Error(String(lastResult?.error || "Gagal membuat pesanan."));
    } catch (error) {
      alert(error instanceof Error ? error.message : "Gagal membuat pesanan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="my-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-bold text-slate-900 mb-4">Simulasi Harga</h3>
      <div>
        <label htmlFor="hari" className="block text-sm font-semibold text-slate-700">Lama Sewa (Hari)</label>
        <div className="flex items-center gap-4">
          <input
            id="hari"
            type="number"
            min="1"
            max={maxDays}
            value={days}
            onChange={(e) => handleInput(Number(e.target.value))}
            className="block w-24 rounded-lg border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-inner outline-none"
          />
          <span className="text-sm text-slate-500">Maks. 60 hari online</span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 rounded-xl bg-indigo-50/50 p-4 border border-indigo-100 items-end">
        <div>
          <label htmlFor="mulaiPinjam" className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">Mulai Pinjam</label>
          <input 
            type="date" 
            id="mulaiPinjam"
            value={startDate} 
            onChange={(e) => setStartDate(e.target.value)}
            min={minStartDate}
            className="mt-1 w-full flex-1 appearance-none rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm font-bold text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-sm"
          />
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Pengembalian</p>
          <p className="text-sm font-bold text-slate-800 mt-1 flex h-[34px] items-center px-1">{formatDate(endDate)}</p>
        </div>
      </div>

      <div className="mt-6 space-y-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
        <div className="flex justify-between border-b border-slate-200 pb-2">
          <span>stock</span>
        </div>
        <div className="flex justify-between border-b border-slate-200 pb-2">
          <span>Harga Dasar ({days} hari)</span>
          <span className="font-semibold">{toIdr(baseTotal)}</span>
        </div>
        <div className="flex justify-between border-b border-slate-200 pb-2">
          <span>Potongan Durasi <span className="text-xs ml-1 rounded bg-green-100 text-green-700 px-1.5 py-0.5">{discountLabel}</span></span>
          <span className="font-semibold text-green-600">- {toIdr(amountSaved)}</span>
        </div>
        <div className="flex items-center justify-between pt-2">
          <span className="font-bold text-slate-900 text-base">Total Bayar</span>
          <span className="text-xl font-bold text-indigo-700">{toIdr(finalTotal)}</span>
        </div>
      </div>

      <div className="mt-8 space-y-4">
        <div>
          <label htmlFor="alamat" className="block text-sm font-semibold text-slate-700 mb-2">Alamat Pengiriman / Penggunaan</label>
          <textarea
            id="alamat"
            rows={2}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Tulis alamat lengkap pengiriman unit atau klik area di peta..."
            className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-sm transition-colors duration-200"
          />
        </div>
        
        <MapPicker addressValue={address} onAddressPicked={(addr) => setAddress(addr)} />
      </div>

      <button 
        onClick={() => setShowModal(true)}
        className="mt-6 w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-md transition hover:bg-indigo-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
      >
        Buat Pesanan ({days} Hari)
      </button>

      {/* Modal Konfirmasi */}
      {showModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl overflow-hidden transform scale-100 transition-transform">
            <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600"></div>
            
            <div className="flex justify-between items-start mb-6 mt-2">
              <h3 className="text-xl font-extrabold text-slate-800">Konfirmasi Pesanan</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-red-500 transition">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                <p className="text-xs uppercase font-semibold text-slate-500 mb-1">Peminjaman</p>
                <div className="flex justify-between">
                  <span className="font-bold text-slate-800">{days} Hari</span>
                  <span className="text-sm font-medium text-slate-600">{formatDate(startD)} - {formatDate(endDate)}</span>
                </div>
              </div>
              
              <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                <p className="text-xs uppercase font-semibold text-slate-500 mb-1">Lokasi Pengiriman/Penggunaan</p>
                <p className="font-medium text-slate-800 text-sm leading-relaxed">
                  {address || <span className="text-red-500 italic">Harap isi alamat lokasi Anda terlebih dahulu!</span>}
                </p>
              </div>

              <div className="rounded-xl bg-indigo-50 p-4 border border-indigo-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-indigo-900">Subtotal</span>
                  <span className="text-sm font-semibold text-indigo-700">{toIdr(baseTotal)}</span>
                </div>
                {amountSaved > 0 && (
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-green-700">Diskon</span>
                    <span className="text-sm font-semibold text-green-600">- {toIdr(amountSaved)}</span>
                  </div>
                )}
                <div className="border-t border-indigo-200 my-2 pt-2 flex justify-between items-center">
                  <span className="font-bold text-indigo-950">Total Bayar</span>
                  <span className="text-lg font-bold text-indigo-700">{toIdr(finalTotal)}</span>
                </div>
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button 
                onClick={() => setShowModal(false)}
                className="w-full rounded-xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-200 transition"
              >
                Batal
              </button>
              <button 
                disabled={!address}
                onClick={createRental}
                className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Memproses..." : "Konfirmasi"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}