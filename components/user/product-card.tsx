"use client";
import React from 'react';
import Link from 'next/link';

export default function ProductCard({ product, onDetail }: { product: any, onDetail?: (p: any) => void }) {
  if (!product) return null;

  // LOGIKA STOK: Filter unit yang statusnya 'available'
  const availableUnits = product.item_instances?.filter((unit: any) => unit.status === 'available').length ?? 0;

  // JIKA STOK 0, JANGAN RENDER CARD (HILANG DARI KATALOG)
  if (availableUnits === 0 && product.item_instances) return null;

  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const getImageUrl = (photoUrl: string) => {
    if (!photoUrl) return "https://placehold.co/400x300?text=No+Image";
    const fileName = photoUrl.includes('/') ? photoUrl.split('/').pop() : photoUrl;
    return `${API_URL}/api/images/products/${fileName}`;
  };

  return (
    <div className="group bg-white p-4 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all">
      <div className="h-48 w-full bg-slate-100 rounded-[2rem] overflow-hidden mb-4 relative">
        <img 
          src={getImageUrl(product.photo_url)} 
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        {/* Badge Stok Real-time */}
        <div className="absolute top-4 left-4">
            <span className="bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-black text-slate-800 shadow-sm">
                {availableUnits} READY
            </span>
        </div>
      </div>
      
      <div className="px-2">
        <h3 className="font-black text-slate-800 text-lg mb-1 truncate">{product.name}</h3>
        <p className="text-blue-600 font-black text-xl mb-4">
          Rp{Number(product.price_per_day || 0).toLocaleString('id-ID')}
        </p>
        
        <button
          onClick={() => onDetail ? onDetail(product) : null}
          className="w-full py-3 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-blue-600 transition-all"
        >
          Lihat Detail
        </button>
      </div>
    </div>
  );
}