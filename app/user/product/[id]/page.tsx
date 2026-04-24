import Link from "next/link";
import { notFound } from "next/navigation";
import { products } from "../../../../lib/data";
import { Calculator } from "../../../../components/price-calculator";

// In Next.js 13+ app dir, params in dynamic pages is a Promise resolving to {id: string}
export default async function ProductDetail({ params }: { params: Promise<{ id: string }> }) {
  const pId = (await params).id;
  const product = products.find((p) => p.id === pId);

  if (!product) {
    return notFound();
  }

  const isKendaraan = product.category === "Kendaraan";

  return (
    <main className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
      <Link
        href="/user/product"
        className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 transition hover:text-indigo-800"
      >
        <span aria-hidden="true">&larr;</span>
        Kembali ke Katalog
      </Link>

      <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-start">
        <section>
          <div className="mb-8 max-w-3xl">
            <div className="mb-2">
              <span
                className={`inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${
                  isKendaraan ? "bg-indigo-100 text-indigo-700" : "bg-cyan-100 text-cyan-700"
                }`}
              >
                {product.category}
              </span>
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              {product.name}
            </h1>

            <p className="mt-4 text-lg text-slate-600 leading-relaxed max-w-xl">
              {product.description}
            </p>
          </div>

          <div className="relative overflow-hidden rounded-3xl bg-slate-200">
            <picture>
              <img
                src={product.image}
                alt={product.name}
                className="aspect-square w-full object-cover sm:aspect-[4/3] lg:aspect-square"
              />
            </picture>
          </div>
        </section>

        <section className="flex flex-col justify-start">
          <Calculator 
            pricePerDay={product.pricePerDay} 
            productName={product.name} 
            productImage={product.image} 
            productId={product.id} 
          />
        </section>
      </div>

      <div className="mt-20 border-t border-slate-200 pt-16">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Penawaran & Ketentuan Diskon</h2>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-1">1 Minggu</p>
            <p className="text-2xl font-bold text-indigo-600">Diskon 3%</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-1">2 Minggu</p>
            <p className="text-2xl font-bold text-indigo-600">Diskon 5%</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-1">3 Minggu</p>
            <p className="text-2xl font-bold text-indigo-600">Diskon 7%</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-indigo-50 p-6 shadow-sm relative overflow-hidden text-center">
             <div className="absolute right-0 top-0 h-10 w-10 rotate-45 bg-indigo-400 -translate-y-4 translate-x-4"></div>
            <p className="text-xs uppercase tracking-widest text-indigo-700 font-semibold mb-1">1 Bulan</p>
            <p className="text-2xl font-bold text-indigo-900">Diskon 15%</p>
          </div>
        </div>
      </div>
    </main>
  );
}