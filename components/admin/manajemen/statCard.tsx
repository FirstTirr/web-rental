import React from 'react';

// Gunakan 'export default function' agar terbaca sebagai fungsi, bukan objek
export default function StatCard({ label, value, color = "text-slate-900" }: { 
  label: string; 
  value: string; 
  color?: string 
}) {
  return (
    <article className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm text-gray-700">
      <p className="text-sm text-slate-500 font-medium mb-1">{label}</p>
      <h2 className={`text-xl sm:text-2xl font-bold break-words ${color}`}>{value}</h2>
    </article>
  );
}