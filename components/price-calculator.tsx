"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

// Memuat MapPicker secara dinamis tanpa Server Side Rendering (SSR)
const MapPicker = dynamic(() => import("./map-picker"), { 
  ssr: false, 
  loading: () => <div className="h-[150px] w-full rounded-xl bg-slate-100 flex items-center justify-center text-sm font-medium text-slate-500 border border-slate-200">Memuat Peta Interaktif...</div> 
});

type ProfileApiResult = {
  data?: { address?: string; phone?: string; };
  error?: string;
};

const PROFILE_ENDPOINT_CANDIDATES = ["/api/users/profile", "/api/profile", "/api/users/me"];
const CREATE_RENTAL_ENDPOINT_CANDIDATES = ["/api/rentals"];

async function parseProfileResult(response: Response): Promise<ProfileApiResult> {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return (await response.json()) as ProfileApiResult;
  const rawText = await response.text();
  return { error: rawText?.trim() || `Request gagal dengan status ${response.status}` };
}

export function Calculator({
  pricePerDay,
  productId = "0",
  availableStock = 0,
}: {
  pricePerDay: number;
  productId?: string;
  availableStock?: number;
}) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [days, setDays] = useState<number>(1);
  const [address, setAddress] = useState<string>("");
  const [startDate, setStartDate] = useState<string>(() => {
    const tzOffset = new Date().getTimezoneOffset() * 60000;
    return new Date(Date.now() - tzOffset).toISOString().slice(0, 10);
  });

  const maxDays = 60;
  const minStartDate = new Date().toISOString().slice(0, 10);

  // Data Penawaran Diskon sesuai permintaan: 1minggu=3%, 2minggu=5%, 3minggu=7%, 4minggu=15%
  const discountOffers = [
    { threshold: 7, label: "1 MINGGU", percent: "3%", factor: 0.97 },
    { threshold: 14, label: "2 MINGGU", percent: "5%", factor: 0.95 },
    { threshold: 21, label: "3 MINGGU", percent: "7%", factor: 0.93 },
    { threshold: 28, label: "4 MINGGU", percent: "15%", factor: 0.85 }, // Menggunakan 28 hari (4 minggu)
  ];

  // Logika Kalkulasi
  const activeOffer = [...discountOffers].reverse().find(d => days >= d.threshold);
  const factor = activeOffer ? activeOffer.factor : 1.0;
  
  const baseTotal = pricePerDay * days;
  const finalTotal = baseTotal * factor;
  const amountSaved = baseTotal - finalTotal;

  const startD = new Date(startDate);
  const endDate = new Date(startD);
  endDate.setDate(startD.getDate() + days);
  
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(date);
  };

  function toIdr(num: number) {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(num);
  }

  useEffect(() => {
    const fetchUserAddress = async () => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const token = localStorage.getItem("token");
      if (!apiUrl || !token) return;

      for (const endpoint of PROFILE_ENDPOINT_CANDIDATES) {
        try {
          const response = await fetch(`${apiUrl}${endpoint}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const result = await parseProfileResult(response);
          if (response.ok && result?.data?.address) {
            setAddress(result.data.address);
            break;
          }
        } catch (e) { console.error(e); }
      }
    };
    fetchUserAddress();
  }, []);

  const createRental = async () => {
    if (!address.trim()) return alert("Alamat wajib diisi.");
    setIsSubmitting(true);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const payload = {
      product_id: Number(productId),
      start_date: startDate,
      end_date: new Date(endDate.getTime()).toISOString().slice(0, 10),
    };

    try {
      const response = await fetch(`${apiUrl}${CREATE_RENTAL_ENDPOINT_CANDIDATES[0]}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Gagal membuat pesanan.");
      setShowModal(false);
      router.push("/user/pesanan");
    } catch (error) {
      alert("Terjadi kesalahan saat memproses pesanan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasStock = availableStock > 0;

  return (
    <div className="flex flex-col gap-10">
      {/* KARTU RINCIAN PEMBAYARAN */}
      <div className="rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-sm">
        <h3 className="text-xl font-bold text-slate-800 mb-6">Rincian Pembayaran</h3>
        <div className="space-y-4 text-sm">
          <div className="flex justify-between items-center pb-3 border-b border-slate-50">
            <span className="text-slate-500 font-medium">Ketersediaan</span>
            <span className={`font-bold ${hasStock ? "text-emerald-600" : "text-rose-600"}`}>
              {hasStock ? `${availableStock} Unit Ready` : "Stok Habis"}
            </span>
          </div>
          <div className="flex justify-between items-center pb-3 border-b border-slate-50">
            <span className="text-slate-500 font-medium">Harga (1 Hari)</span>
            <span className="font-bold text-slate-800">{toIdr(pricePerDay)}</span>
          </div>
          <div className="flex justify-between items-center pb-3 border-b border-slate-50">
            <span className="text-slate-500 font-medium">Potongan</span>
            <span className="font-bold text-emerald-600">
              {amountSaved > 0 ? `- ${toIdr(amountSaved)}` : "Rp0"}
            </span>
          </div>
          <div className="flex justify-between items-center pt-2">
            <span className="font-bold text-slate-800 text-lg">Total Bayar</span>
            <div className="text-right">
              <span className="text-2xl font-black text-slate-900">{toIdr(finalTotal)}</span>
              <p className="text-[10px] text-slate-400 font-medium italic">*Estimasi {days} hari</p>
            </div>
          </div>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          disabled={!hasStock}
          className="mt-8 w-full rounded-2xl bg-[#00a369] py-4 text-sm font-bold text-white shadow-lg shadow-emerald-100 transition hover:bg-[#008f5d] disabled:bg-slate-200 disabled:shadow-none"
        >
          {hasStock ? `Sewa Sekarang` : "Stok Habis"}
        </button>
      </div>

      {/* SECTION DISKON */}
      <div className="space-y-5">
        <h4 className="text-lg font-bold text-slate-800 px-1">Penawaran & Ketentuan Diskon</h4>
        <div className="grid grid-cols-2 gap-4">
          {discountOffers.map((offer) => {
            const isActive = activeOffer?.threshold === offer.threshold;
            return (
              <div 
                key={offer.label}
                className={`relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 ${
                  isActive 
                  ? "border-emerald-200 bg-emerald-50 shadow-md ring-2 ring-emerald-500/10" 
                  : "border-slate-100 bg-white"
                }`}
              >
                {isActive && (
                  <div className="absolute top-0 right-0 w-8 h-8 bg-emerald-500 flex items-center justify-center rounded-bl-xl shadow-sm">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
                <p className={`text-[10px] font-bold tracking-widest mb-1 ${isActive ? "text-emerald-600" : "text-slate-400"}`}>
                  {offer.label}
                </p>
                <p className={`text-lg font-black ${isActive ? "text-emerald-700" : "text-emerald-600"}`}>
                  Diskon {offer.percent}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL TRANSAKSI */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl rounded-[2.5rem] bg-white p-8 shadow-2xl overflow-y-auto max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800">Detail Pesanan</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-6 rounded-3xl">
                <div className="col-span-full">
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Lama Sewa (Hari)</label>
                  <input
                    type="number"
                    min="1"
                    max={maxDays}
                    value={days}
                    onChange={(e) => setDays(Math.max(1, Math.min(maxDays, Number(e.target.value))))}
                    className="w-24 p-2.5 rounded-xl border border-slate-200 font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Mulai</label>
                  <input type="date" value={startDate} min={minStartDate} onChange={(e) => setStartDate(e.target.value)} className="w-full p-2.5 rounded-xl border border-slate-200 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Selesai</label>
                  <div className="p-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700">{formatDate(endDate)}</div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-400 uppercase">Alamat Pengiriman</label>
                <textarea rows={2} value={address} onChange={(e) => setAddress(e.target.value)} className="w-full p-4 rounded-2xl border border-slate-100 bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Masukkan alamat lengkap..." />
                <MapPicker addressValue={address} onAddressPicked={(addr) => setAddress(addr)} />
              </div>

              {/* HARGA DAN DISKON DI DALAM MODAL */}
              <div className="pt-2 border-t border-dashed border-slate-200">
                <div className="flex justify-between text-sm py-1">
                  <span className="text-slate-500">Subtotal ({days} Hari)</span>
                  <span className="font-semibold text-slate-800">{toIdr(baseTotal)}</span>
                </div>
                {amountSaved > 0 && (
                  <div className="flex justify-between text-sm py-1">
                    <span className="text-emerald-600 font-medium">Potongan Diskon ({activeOffer?.percent})</span>
                    <span className="font-semibold text-emerald-600">-{toIdr(amountSaved)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center py-2">
                  <span className="text-base font-bold text-slate-800">Total Akhir</span>
                  <span className="text-xl font-black text-indigo-700">{toIdr(finalTotal)}</span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowModal(false)} className="flex-1 py-4 rounded-2xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition">Batal</button>
                <button disabled={isSubmitting || !address.trim()} onClick={createRental} className="flex-[2] py-4 rounded-2xl bg-[#00a369] text-white font-bold transition hover:bg-[#008f5d] disabled:opacity-50 shadow-lg shadow-emerald-100">
                  {isSubmitting ? "Memproses..." : "Konfirmasi Pesanan"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}