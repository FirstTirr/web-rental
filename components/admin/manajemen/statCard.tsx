import React from 'react';

// Gunakan 'export default function' agar terbaca sebagai fungsi, bukan objek
export default function StatCard({ label, value, color = "text-slate-900" }: { 
  label: string; 
  value: string; 
  color?: string 
}) {
  return (
    <article className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-gray-700">
      <p className="text-sm text-slate-500 font-medium mb-1">{label}</p>
      <h2 className={`text-2xl font-bold ${color}`}>{value}</h2>
    </article>
  );
}