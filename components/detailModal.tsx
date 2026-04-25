"use client";
import React from 'react';

export default function DetailModal({ log, onClose }: { log: any; onClose: () => void }) {
  if (!log) return null;

  return (
    // z-[9999] memastikan modal di atas segalanya
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Overlay Backdrop - Klik luar untuk tutup */}
      <div 
        className="fixed inset-0 bg-slate-900/80 backdrop-blur-md" 
        onClick={onClose} 
      />
      
      {/* Box Modal */}
      <div className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">
              {log.id}
            </span>
            <button onClick={onClose} className="text-slate-400 hover:text-rose-500 font-bold text-xl">
              ✕
            </button>
          </div>

          <h2 className="text-2xl font-black text-slate-900 mb-6">Detail Peminjaman</h2>

          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-2xl">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Penyewa</p>
              <p className="text-lg font-black text-slate-800">{log.borrower}</p>
              <p className="text-sm text-slate-500">📍 {log.address}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border border-slate-100 rounded-2xl">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Unit</p>
                <p className="font-bold text-slate-700">{log.item}</p>
              </div>
              <div className="p-4 border border-slate-100 rounded-2xl">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Durasi</p>
                <p className="font-bold text-slate-700">{log.duration}</p>
              </div>
            </div>

            <div className="p-5 bg-blue-600 rounded-2xl text-white flex justify-between items-center shadow-lg shadow-blue-200">
              <p className="font-bold">Total Bayar</p>
              <p className="text-2xl font-black">{log.totalPrice}</p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="w-full mt-6 bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}