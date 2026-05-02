"use client";
import React from 'react';
import Link from 'next/link';

export default function ProductCard({ product, onDetail }: { product: any, onDetail?: (p: any) => void }) {
  if (!product) return null;

  // 1. Hitung stok tersedia
  const availableUnits =
    typeof product.item_instance_count === "number"
      ? product.item_instance_count
      : product.item_instances?.filter((unit: any) => unit.status === "available").length ?? 0;

  // 2. Tentukan status stok habis
  const isOutOfStock = availableUnits === 0;

  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const getImageUrl = (photoUrl: string) => {
    if (!photoUrl) return "https://placehold.co/400x300?text=No+Image";
    const fileName = photoUrl.includes('/') ? photoUrl.split('/').pop() : photoUrl;
    return `${API_URL}/api/images/products/${fileName}`;
  };

  return (
    <div className={`relative group bg-white p-4 rounded-[2.5rem] border border-slate-100 shadow-sm transition-all 
      ${isOutOfStock ? 'grayscale-[0.5] opacity-80' : 'hover:shadow-xl hover:scale-[1.01]'}`}>
      
      {/* 1. Link Transparan (Overlay) - Dimatikan jika stok habis */}
      {!isOutOfStock && (
        <Link 
          href={`/user/product/${product.id}`} 
          className="absolute inset-0 z-10"
          aria-label={`Lihat ${product.name}`}
        />
      )}

      {/* 2. Konten Visual */}
      <div className="relative z-0">
        <div className="h-48 w-full bg-slate-100 rounded-[2rem] overflow-hidden mb-4 relative">
          <img 
            src={getImageUrl(product.photo_url)} 
            alt={product.name}
            className={`w-full h-full object-cover transition-transform duration-500 ${!isOutOfStock && 'group-hover:scale-110'}`}
          />
          
          {/* Badge Stok - Berubah warna jika habis */}
          <div className="absolute top-4 left-4 z-20">
              <span className={`backdrop-blur px-3 py-1 rounded-full text-[10px] font-black shadow-sm ${
                isOutOfStock 
                ? 'bg-rose-500/90 text-white' 
                : 'bg-white/90 text-slate-800'
              }`}>
                  {isOutOfStock ? 'OUT OF STOCK' : `${availableUnits} READY`}
              </span>
          </div>
        </div>
        
        <div className="px-2">
          <h3 className="font-black text-slate-800 text-lg mb-1 truncate">{product.name}</h3>
          <p className="text-blue-600 font-black text-xl mb-4">
            Rp{Number(product.price_per_day || 0).toLocaleString('id-ID')}
          </p>
          
          {/* 3. Tombol Aksi */}
          <div className="space-y-2 relative z-20">
            {isOutOfStock ? (
              // Tombol Sewa Versi Mati
              <button
                disabled
                className="w-full py-3 bg-slate-200 text-slate-400 cursor-not-allowed rounded-2xl font-bold text-sm"
              >
                Stok Habis
              </button>
            ) : (
              // Tombol Sewa Aktif
              <Link
                href={`/user/product/${product.id}`}
                className="block w-full py-3 bg-slate-900 text-white text-center rounded-2xl font-bold text-sm hover:bg-blue-600 transition-all"
              >
                Sewa Sekarang
              </Link>
            )}

            <button
              onClick={(e) => {
                e.preventDefault();
                if (!isOutOfStock && onDetail) onDetail(product);
              }}
              disabled={isOutOfStock}
              className={`w-full py-3 rounded-2xl font-bold text-sm transition-all ${
                isOutOfStock 
                ? 'bg-gray-50 text-gray-300 cursor-not-allowed' 
                : 'bg-gray-100 text-gray-600 hover:bg-slate-200'
              }`}
            >
              Lihat Detail
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}