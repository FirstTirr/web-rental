import Link from "next/link";
import { products } from "../../lib/data";
import { ProductCard } from "../../components/user/product-card";

export default function UserDashboard() {
  const topProducts = products.slice(0, 3); // Ambil 3 data untuk beranda

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col px-4 sm:px-6 lg:px-8">
      {/* Welcome Banner */}
      <section className="animate-fade-up mb-14 overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-cyan-600 p-8 text-white shadow-lg sm:p-12 relative">
        <div className="relative z-10 w-full md:w-3/4">
          <span className="animate-fade-in-soft mb-2 inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-md">Halo, Admin/User</span>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl leading-tight">
            Selamat datang di Dashboard RentalHub.
          </h1>
          <p className="mt-4 text-base text-indigo-100 max-w-xl">
            Area khusus penyewa untuk mengelola pesanan, melihat histori sewa, dan mencari produk terbaik untuk keperluanmu dengan penawaran menarik.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link href="/user/product" className="btn-soft focus-ring-soft rounded-xl border border-white/20 bg-white px-6 py-3 text-sm font-semibold text-indigo-900 shadow-md backdrop-blur-md transition hover:bg-indigo-50">
              Lihat Katalog
            </Link>
            <Link href="/user/pesanan" className="btn-soft focus-ring-soft rounded-xl border border-white/50 bg-white/10 px-6 py-3 text-sm font-semibold text-white shadow-sm backdrop-blur-md transition hover:bg-white/20">
              Cek Pesanan
            </Link>
          </div>
        </div>
      </section>

      {/* Recommended Products */}
      <section className="animate-fade-up-delay">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Rekomendasi Minggu Ini</h2>
          <Link href="/user/product" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
            Lihat semua &rarr;
          </Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {topProducts.map((p) => (
            <ProductCard key={p.id} item={p} />
          ))}
        </div>
      </section>
    </main>
  );
}