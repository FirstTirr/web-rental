import React from 'react';

const products = [
  { id: "BRG-001", nama: "Kamera Canon M50", stok: 7, harga: 150000, status: "Aktif" },
  { id: "BRG-002", nama: "Tripod Weifeng", stok: 14, harga: 35000, status: "Aktif" },
  { id: "BRG-003", nama: "Mic Rode GO", stok: 3, harga: 50000, status: "Low Stock" },
];

export default function ProductTable() {
  return (
    <>
    <div className='flex justify-between items-center mb-6'>
      <p className='text-3xl font-bold text-gray-700 w-full'>Manage Your Product</p>
      <div className='justify-end items-center flex w-full'>
        <button className='py-2 px-4 bg-blue-500 rounded-full text-white font-semibold mb-4 flex hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/60 hover:shadow-blue-600/70'>
        + Tambah Product
        </button>
      </div>
    </div>

    {/* <div className='justify-end flex items-center'>
      
    </div> */}

    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse text-sm">
        <thead>
          <tr className="bg-slate-50 text-slate-600 border-b">
            <th className="p-4 font-semibold text-xs uppercase tracking-wider">ID</th>
            <th className="p-4 font-semibold text-xs uppercase tracking-wider">Nama</th>
            <th className="p-4 font-semibold text-xs uppercase tracking-wider">Stok</th>
            <th className="p-4 font-semibold text-xs uppercase tracking-wider">Harga</th>
            <th className="p-4 font-semibold text-xs uppercase tracking-wider">Status</th>
            <th className="p-4 font-semibold text-xs uppercase tracking-wider text-center">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id} className="border-b hover:bg-slate-50 transition-colors">
              <td className="p-4 font-mono text-xs text-slate-500">{p.id}</td>
              <td className="p-4 font-medium text-slate-900">{p.nama}</td>
              <td className="p-4 text-slate-500">{p.stok}</td>
              <td className="p-4 font-medium text-slate-500">Rp{p.harga.toLocaleString("id-ID")}</td>
              <td className="p-4">
                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                  p.status === 'Aktif' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {p.status}
                </span>
              </td>
              <td className="p-4 flex justify-center gap-3">
                <button className="text-blue-600 hover:text-blue-800 font-medium">Edit</button>
                <button className="text-red-600 hover:text-red-800 font-medium">Hapus</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    </>
  );
}