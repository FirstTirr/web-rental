import { products } from "../../../lib/data";
import { ProductCard } from "../../../components/user/product-card";

export default function ProductPage() {
  const kendaraan = products.filter(p => p.category === "Kendaraan");
  const elektronik = products.filter(p => p.category === "Elektronik");

  return (
    <main className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
      <div className="animate-fade-up mb-10 lg:mb-14 text-center max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">Katalog Produk</h1>
        <p className="mt-4 text-base text-slate-600">
          Temukan pilihan unit berkualitas dari kendaraan hingga elektronik. Ada diskon khusus untuk durasi panjang!
        </p>
      </div>

      <div className="animate-fade-up-delay mb-14">
        <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
          <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm">01</span>
          Kendaraan
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {kendaraan.map(p => <ProductCard key={p.id} item={p} />)}
        </div>
      </div>

      <div className="animate-fade-up-delay">
        <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
          <span className="bg-cyan-100 text-cyan-700 px-3 py-1 rounded-full text-sm">02</span>
          Perangkat Elektronik
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {elektronik.map(p => <ProductCard key={p.id} item={p} />)}
        </div>
      </div>
    </main>
  );
}