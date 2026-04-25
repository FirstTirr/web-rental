"use client";
import React, { useState, useEffect } from 'react';

// Data Dummy
const initialPayments = [
  { id: "PAY-101", user: "Fathir Adzan", targetAmount: 750000, method: "Bank BCA", date: "25 April 2026", unitSewa: "Sony A7III + Lensa" },
  { id: "PAY-102", user: "Raka Pratama", targetAmount: 300000, method: "DANA", date: "25 April 2026", unitSewa: "Canon M50" },
  { id: "PAY-103", user: "Vino Ardiansyah", targetAmount: 500000, method: "Mandiri", date: "26 April 2026", unitSewa: "DJI Mavic Air 2" },
];

export default function VerifikasiPembayaranUI() {
  const [currentPage, setCurrentPage] = useState<'verifikasi' | 'lunas'>('verifikasi');
  const [searchQuery, setSearchQuery] = useState("");
  const [payments, setPayments] = useState(initialPayments);
  const [completedPayments, setCompletedPayments] = useState<any[]>([]);
  
  const [activeAction, setActiveAction] = useState<any>(null);
  const [inputAmount, setInputAmount] = useState("");

  // Filter Search
  const filteredPayments = (currentPage === 'verifikasi' ? payments : completedPayments).filter(p => 
    p.user.toLowerCase().includes(searchQuery.toLowerCase()) || p.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleConfirm = () => {
    const amount = Number(inputAmount);
    if (amount === activeAction.targetAmount) {
      // Pindahkan ke list lunas
      setCompletedPayments([...completedPayments, { ...activeAction, paidAmount: amount, status: 'LUNAS' }]);
      setPayments(payments.filter(p => p.id !== activeAction.id));
      setCurrentPage('lunas'); // Langsung pindah page
    } else {
      alert("Pembayaran dicatat sebagai 'Kurang'. Tetap di halaman verifikasi.");
    }
    setActiveAction(null);
    setInputAmount("");
  };

  return (
    <div className="relative min-h-screen space-y-8 w-full max-w-6xl mx-auto p-6 md:p-10">
      {/* Header & Search */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex gap-4 mb-4">
            <button 
              onClick={() => setCurrentPage('verifikasi')}
              className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${currentPage === 'verifikasi' ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-500 border border-slate-100'}`}
            >
              Perlu Verifikasi
            </button>
            <button 
              onClick={() => setCurrentPage('lunas')}
              className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${currentPage === 'lunas' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-white text-slate-500 border border-slate-100'}`}
            >
              Sudah Lunas ✨
            </button>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">
            {currentPage === 'verifikasi' ? 'Verifikasi Dana' : 'Riwayat Lunas'}
          </h1>
        </div>

        <div className="relative group">
          <input 
            type="text" 
            placeholder="Cari nama atau ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 pr-6 py-4 w-full md:w-80 rounded-2xl bg-white border border-slate-100 shadow-xl shadow-slate-200/50 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
          />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl">🔍</span>
        </div>
      </header>

      {/* Grid Card */}
      <div className="grid gap-6">
        {filteredPayments.length > 0 ? filteredPayments.map((pay) => (
          <div key={pay.id} className="group relative bg-white p-1 rounded-[2.2rem] transition-all hover:scale-[1.01]">
            {/* Dekorasi Border Gradasi */}
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-100 to-emerald-100 rounded-[2.2rem] opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="relative bg-white p-7 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm border border-slate-50">
              <div className="flex items-center gap-6">
                <div className={`h-16 w-16 rounded-2xl flex items-center justify-center text-2xl shadow-inner ${currentPage === 'lunas' ? 'bg-emerald-50' : 'bg-slate-50'}`}>
                  {currentPage === 'lunas' ? '✅' : '💳'}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md uppercase">{pay.id}</span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{pay.date}</span>
                  </div>
                  <h3 className="text-xl font-black text-slate-800">{pay.user}</h3>
                  <p className="text-sm text-slate-500 font-medium">{pay.unitSewa} • <span className="text-slate-900">{pay.method}</span></p>
                </div>
              </div>

              <div className="flex flex-col items-center md:items-end">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                  {currentPage === 'lunas' ? 'Total Dibayar' : 'Tagihan'}
                </p>
                <p className={`text-2xl font-black ${currentPage === 'lunas' ? 'text-emerald-600' : 'text-slate-900'}`}>
                  Rp{pay.targetAmount.toLocaleString('id-ID')}
                </p>
              </div>

              {currentPage === 'verifikasi' && (
                <button 
                  onClick={() => setActiveAction(pay)}
                  className="w-full md:w-auto px-10 py-4 rounded-2xl bg-slate-900 text-white font-bold hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200"
                >
                  Verifikasi
                </button>
              )}
            </div>
          </div>
        )) : (
          <div className="text-center py-20 bg-white rounded-[3rem] border border-dashed border-slate-200">
            <p className="text-slate-400 font-bold uppercase tracking-widest">Data Tidak Ditemukan</p>
          </div>
        )}
      </div>

      {/* --- MODAL VALIDASI DENGAN PROTEKSI --- */}
      {activeAction && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-xl" onClick={handleClose} />
          
          <div className="relative bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl border border-white">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-2xl font-black text-slate-900">Validasi Nominal</h2>
                <p className="text-sm text-slate-500 font-medium">Jangan sampai salah input ya!</p>
              </div>
              <span className="text-3xl">🎯</span>
            </div>

            <div className="space-y-6">
              <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-400 uppercase">Harus Dibayar</span>
                <span className="text-lg font-black text-slate-900">Rp{activeAction.targetAmount.toLocaleString('id-ID')}</span>
              </div>

              <div>
                <input 
                  type="number"
                  autoFocus
                  value={inputAmount}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    // PROTEKSI: Tidak boleh melebihi targetAmount
                    if (val <= activeAction.targetAmount) setInputAmount(e.target.value);
                  }}
                  placeholder="Masukkan nominal..."
                  className="w-full p-6 rounded-[1.5rem] bg-slate-50 border-2 border-slate-100 focus:border-slate-900 focus:outline-none text-2xl font-black transition-all"
                />
                {Number(inputAmount) === activeAction.targetAmount && (
                  <p className="text-xs font-bold text-emerald-600 mt-3 ml-2">✨ Nominal Pas! Akan otomatis lunas.</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-10">
              <button onClick={handleClose} className="py-5 rounded-2xl bg-slate-100 text-slate-500 font-bold hover:bg-slate-200 transition-all">Batal</button>
              <button 
                onClick={handleConfirm}
                disabled={!inputAmount || Number(inputAmount) <= 0}
                className="py-5 rounded-2xl bg-slate-900 text-white font-bold shadow-2xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-20"
              >
                Konfirmasi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  function handleClose() {
    setActiveAction(null);
    setInputAmount("");
  }
}