"use client";

import ProductTable from "../../../components/admin/barang/productTable";

export default function Page() {
  return (
    <div className="space-y-8">
       <h1 className="text-3xl font-black text-slate-900 tracking-tight">Manajemen Barang</h1>
       <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
         <ProductTable />
       </div>
    </div>
  );
}