"use client";
import React, { useState } from 'react';
import DetailModal from '../../detailModal';

const loanLogs = [
  {
    id: "LOG-8801",
    borrower: "Fathir Adzan",
    item: "Sony A7III + Lensa 24-70mm",
    duration: "3 Hari",
    pricePerDay: "Rp250.000",
    address: "Labuah Basilang, Payakumbuh",
    totalPrice: "Rp750.000",
    status: "Aktif",
    statusColor: "bg-blue-100 text-blue-700"
  },
  {
    id: "LOG-8802",
    borrower: "Raka Pratama",
    item: "Kamera Canon M50",
    duration: "2 Hari",
    pricePerDay: "Rp150.000",
    address: "Koto Nan IV, Payakumbuh",
    totalPrice: "Rp300.000",
    status: "Terlambat",
    statusColor: "bg-rose-100 text-rose-700"
  },
  {
    id: "LOG-8803",
    borrower: "Sinta Maharani",
    item: "Tripod Weifeng + Mic Rode GO",
    duration: "5 Hari",
    pricePerDay: "Rp85.000",
    address: "Napa, Payakumbuh Utara",
    totalPrice: "Rp425.000",
    status: "Dikembalikan",
    statusColor: "bg-emerald-100 text-emerald-700"
  }
];

export default function LogPeminjaman() {
  const [selectedLog, setSelectedLog] = useState<any>(null);

  return (
    <div className="space-y-8 w-full max-w-7xl mx-auto p-4">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Log Peminjaman</h1>
          <p className="text-slate-500 font-medium">Riwayat lengkap aktivitas sewa unit Anda.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6">
        {loanLogs.map((log) => (
          <div
            key={log.id}
            className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl flex flex-col md:flex-row gap-8 items-start md:items-center justify-between"
          >
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-xs font-mono font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">{log.id}</span>
                <span className={`text-[10px] uppercase font-black px-3 py-1 rounded-full ${log.statusColor}`}>{log.status}</span>
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-800">{log.borrower}</h3>
                <p className="text-slate-500 text-sm font-medium">📍 {log.address}</p>
              </div>
            </div>

            <div className="flex-1 border-l border-slate-100 md:pl-8 space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase">Unit & Durasi</p>
              <p className="font-bold text-slate-700">{log.item}</p>
              <p className="text-sm font-medium text-slate-500">Durasi: <span className="text-slate-900 font-bold">{log.duration}</span></p>
            </div>

            <div className="flex-1 border-l border-slate-100 md:pl-8 space-y-2 text-right">
              <p className="text-xs font-bold text-slate-400 uppercase">Total</p>
              <p className="text-2xl font-black text-slate-900">{log.totalPrice}</p>
            </div>

            <div className="md:pl-8">
              <button 
                onClick={() => setSelectedLog(log)}
                className="h-12 w-12 rounded-2xl bg-slate-900 text-white hover:bg-blue-600 transition-all flex items-center justify-center shadow-lg"
              >
                👁️
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedLog && (
        <DetailModal 
          log={selectedLog} 
          onClose={() => setSelectedLog(null)} 
        />
      )}
    </div>
  );
}