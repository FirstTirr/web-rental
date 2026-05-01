import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { Calculator } from "../../../../components/price-calculator";

export default async function ProductDetail({ params }: { params: Promise<{ id: string }> }) {
  const pId = (await params).id;
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL;

  const res = await fetch(`${BACKEND_URL}/api/products/${pId}`, {
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) return notFound();

  const jsonResponse = await res.json();
  const product = jsonResponse.data;

  if (!product) return notFound();

  // --- LOGIKA FIX ENDPOINT GAMBAR ---
  let photoPath = product.photo_url || "";
  
  // Jika path mengandung '/static/img/', kita ubah menjadi '/api/images/'
  if (photoPath.includes("/static/img/")) {
    photoPath = photoPath.replace("/static/img/", "/api/images/");
  }

  const imageUrl = photoPath 
    ? `${BACKEND_URL}${photoPath}`
    : "https://via.placeholder.com/400";
  // ----------------------------------

  const categoryName = product.category_name || "Umum";
  const isKendaraan = categoryName === "Kendaraan";
  const finalPrice = Number(product.price_per_day || 0);
  const availableUnits =
    typeof product.item_instance_count === "number"
      ? product.item_instance_count
      : Array.isArray(product.item_instances)
        ? product.item_instances.filter((unit: { status?: string }) => unit?.status === "available").length
        : 0;

  const parseSpecifications = (value: unknown): Array<{ key: string; value: string }> => {
    if (!value) return [];

    let source: unknown = value;
    if (typeof value === "string") {
      try {
        source = JSON.parse(value);
      } catch {
        return value
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean)
          .map((line) => {
            const [left, ...rest] = line.split(":");
            if (!rest.length) return { key: "Detail", value: line };
            return { key: left.trim(), value: rest.join(":").trim() };
          });
      }
    }

    if (Array.isArray(source)) {
      return source
        .map((item) => {
          if (typeof item === "string") return { key: "Detail", value: item };
          if (item && typeof item === "object") {
            const key = String((item as { key?: unknown }).key ?? "").trim();
            const val = String((item as { value?: unknown }).value ?? "").trim();
            if (key && val) return { key, value: val };
          }
          return null;
        })
        .filter((item): item is { key: string; value: string } => !!item);
    }

    if (source && typeof source === "object") {
      return Object.entries(source as Record<string, unknown>)
        .map(([key, val]) => ({ key: key.trim(), value: String(val ?? "").trim() }))
        .filter((item) => item.key && item.value);
    }

    return [];
  };

  const specifications = parseSpecifications(product.specifications);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
      <Link
        href="/user/product"
        className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 transition hover:text-emerald-700"
      >
        <span aria-hidden="true">&larr;</span>
        Kembali ke Katalog
      </Link>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 lg:p-8">
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-10 items-start">
        <section>
          <div className="mb-6 max-w-3xl">
            <div className="mb-2">
              <span
                className={`inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${
                  isKendaraan ? "bg-emerald-100 text-emerald-700" : "bg-cyan-100 text-cyan-700"
                }`}
              >
                {categoryName}
              </span>
            </div>

            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              {product.name}
            </h1>

            <p className="mt-3 text-sm text-slate-600 leading-relaxed max-w-xl">
              {product.description || "Tidak ada deskripsi produk."}
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Harga / Hari</p>
                <p className="text-2xl font-black text-emerald-600">
                  Rp{finalPrice.toLocaleString("id-ID")}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Stok Tersedia</p>
                <p className="text-lg font-black text-slate-900">{availableUnits} Unit</p>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl bg-slate-200">
            <picture>
              <img
                src={imageUrl}
                alt={product.name}
                className="aspect-square w-full object-cover sm:aspect-[4/3] lg:aspect-square"
              />
            </picture>
          </div>

          {specifications.length > 0 && (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="text-sm font-extrabold uppercase tracking-widest text-slate-900">Spesifikasi Produk</h2>
              <p className="mt-1 text-xs text-slate-500">Detail teknis unit untuk memastikan cocok dengan kebutuhan sewa.</p>
              <div className="mt-4 overflow-hidden rounded-xl border border-slate-100">
                {specifications.map((spec, index) => (
                  <div
                    key={`${spec.key}-${index}`}
                    className={`grid grid-cols-12 gap-2 px-4 py-3 ${index !== specifications.length - 1 ? "border-b border-slate-100" : ""}`}
                  >
                    <p className="col-span-4 text-[11px] font-bold uppercase tracking-wide text-slate-500">{spec.key}</p>
                    <p className="col-span-8 text-sm font-semibold text-slate-800">{spec.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="flex flex-col justify-start lg:sticky lg:top-24">
          <Calculator 
            pricePerDay={finalPrice} 
            productId={product.id}
            availableStock={availableUnits}
          />
        </section>
      </div>
      </div>

      <div className="mt-20 border-t border-slate-200 pt-16">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Penawaran & Ketentuan Diskon</h2>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-1">1 Minggu</p>
            <p className="text-2xl font-bold text-emerald-600">Diskon 3%</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-1">2 Minggu</p>
            <p className="text-2xl font-bold text-emerald-600">Diskon 5%</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-1">3 Minggu</p>
            <p className="text-2xl font-bold text-emerald-600">Diskon 7%</p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm relative overflow-hidden text-center">
             <div className="absolute right-0 top-0 h-10 w-10 rotate-45 bg-emerald-400 -translate-y-4 translate-x-4"></div>
            <p className="text-xs uppercase tracking-widest text-emerald-700 font-semibold mb-1">1 Bulan</p>
            <p className="text-2xl font-bold text-emerald-900">Diskon 15%</p>
          </div>
        </div>
      </div>
    </main>
  );
}
