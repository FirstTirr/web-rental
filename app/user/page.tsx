// app/user/page.tsx
import React from 'react';
import Link from "next/link";
import { cookies } from "next/headers";
import ProductCard from "../../components/user/product-card";

type ProductItem = {
  id: number | string;
  [key: string]: unknown;
};

type UserProfile = {
  address?: string;
  phone?: string;
};

export default async function UserDashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const backendUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

  let topProducts: ProductItem[] = [];
  let userProfile: UserProfile | null = null;

  if (backendUrl) {
    try {
      const resProducts = await fetch(`${backendUrl}/api/products`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      if (resProducts.ok) {
        const jsonResponse = await resProducts.json();
        const data = Array.isArray(jsonResponse?.data) ? jsonResponse.data : [];
        topProducts = data
          .sort((a: ProductItem, b: ProductItem) => Number(b?.id || 0) - Number(a?.id || 0))
          .slice(0, 3);
      }

      if (token) {
        const resProfile = await fetch(`${backendUrl}/api/users/profile`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        if (resProfile.ok) {
          const profileJson = await resProfile.json();
          userProfile = profileJson?.data;
        }
      }
    } catch {
      topProducts = [];
    }
  }

  const isProfileIncomplete = !userProfile?.address || !userProfile?.phone;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col px-4 py-8 sm:px-6 lg:px-8">
      
      {/* BANNER PERINGATAN PROFILE */}
      {isProfileIncomplete && token && (
        <div className="mb-6 animate-pulse rounded-2xl border border-rose-200 bg-rose-50 p-4 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-500 text-white">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-rose-900">Profil Belum Lengkap!</p>
                <p className="text-xs text-rose-700">Lengkapi alamat dan nomor HP di menu profil untuk mempercepat proses penyewaan unit.</p>
              </div>
            </div>
            <Link 
              href="/user/profile" 
              className="shrink-0 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-rose-700"
            >
              Lengkapi Sekarang
            </Link>
          </div>
        </div>
      )}

      {/* HERO SECTION */}
      <section className="relative mb-10 overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-indigo-900 to-cyan-700 p-8 text-white shadow-xl sm:p-10">
        <div className="relative z-10 grid gap-6 lg:grid-cols-3 lg:items-end">
          <div className="lg:col-span-2">
            <span className="mb-3 inline-block rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-cyan-100">
              Dashboard Penyewa
            </span>
            <h1 className="text-3xl font-black leading-tight tracking-tight sm:text-4xl">
              Sewa Unit Lebih Cepat, Alur Lebih Jelas.
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-200 sm:text-base">
              Cari unit, atur tanggal sewa, kirim pesanan, lalu pantau status sampai unit kembali dari satu dashboard.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link href="/user/product" className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-900 shadow-md transition hover:bg-slate-100">
                Mulai Sewa Sekarang
              </Link>
              <Link href="/user/pesanan" className="rounded-xl border border-white/40 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/20">
                Lacak Pesanan
              </Link>
            </div>
          </div>
          <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-md">
            <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-100">Workflow Singkat</p>
            <ul className="mt-3 space-y-2 text-sm font-semibold text-white">
              <li>1. Pilih unit dari katalog</li>
              <li>2. Tentukan durasi & alamat</li>
              <li>3. Konfirmasi dan pantau status</li>
            </ul>
          </div>
        </div>
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-24 h-72 w-72 rounded-full bg-indigo-300/20 blur-3xl" />
      </section>

      {/* STEPS SECTION */}
      <section className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* ... (Konten Steps sama seperti sebelumnya) */}
      </section>

      {/* RECOMMENDATIONS */}
      <section className="isolate relative z-10">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-black text-slate-900">Rekomendasi Untuk Kamu</h2>
          <Link href="/user/product" className="text-sm font-semibold text-indigo-600 hover:underline">
            Lihat semua &rarr;
          </Link>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {topProducts.map((p) => (
            /* 
               FIX: Jangan bungkus ProductCard dengan <Link> lagi.
               Komponen ProductCard sudah memiliki Link internal (Overlay & Button).
            */
            <ProductCard key={p.id} product={p} />
          ))}
        </div>

        {topProducts.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm font-medium text-slate-500">
            Produk belum tersedia atau server backend belum terhubung.
          </div>
        )}
      </section>
    </main>
  );
}