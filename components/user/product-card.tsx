import Link from "next/link";
import Image from "next/image";
import { Product } from "../../lib/data";

export function ProductCard({ item }: { item: Product }) {
  const isKendaraan = item.category === "Kendaraan";
  const badgeColor = isKendaraan ? "bg-indigo-100 text-indigo-700" : "bg-cyan-100 text-cyan-700";

  return (
    <Link href={`/user/product/${item.id}`} className="group hover-lift-soft focus-ring-soft flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
        {/* Menggunakan image dari URL unsplash (mock) */}
        <picture>
          <img src={item.image} alt={item.name} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
        </picture>
        <div className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold ${badgeColor}`}>
          {item.category}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-bold text-slate-900">{item.name}</h3>
        <p className="mt-2 line-clamp-2 text-sm text-slate-600 flex-1">{item.description}</p>
        <div className="mt-5 border-t border-slate-100 pt-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Sewa dari</span>
            <span className="text-base font-bold text-indigo-700">Rp{(item.pricePerDay / 1000).toFixed(0)}k <span className="text-xs font-normal text-slate-500">/hari</span></span>
          </div>
          <span className="btn-soft flex w-full items-center justify-center rounded-xl bg-indigo-50 px-4 py-2.5 text-sm font-semibold text-indigo-700 transition group-hover:bg-indigo-600 group-hover:text-white">
            Lihat Detail
          </span>
        </div>
      </div>
    </Link>
  );
}