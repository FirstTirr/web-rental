"use client";

import React, { useEffect, useState, useCallback } from "react";
import { getAuthToken } from "../../lib/rental-api";

interface AdminUsersResponse {
  username: string;
  email: string;
  address: string;
  phone_number: string;
}

export default function UserAkun() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const [users, setUsers] = useState<AdminUsersResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // State untuk menyimpan user yang dipilih untuk ditampilkan di modal
  const [selectedUser, setSelectedUser] = useState<AdminUsersResponse | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/api/admin/users`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Gagal mengambil data user");

      const data = await response.json();
      setUsers(data.data || data); 
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    if (API_URL) fetchUsers();
  }, [API_URL, fetchUsers]);

  return (
    <div className="space-y-8 w-full max-w-6xl mx-auto px-4 py-8 text-slate-900">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tighter italic uppercase">
            Manajemen User
          </h1>
          <p className="text-slate-500 font-medium">Daftar pelanggan yang terdaftar di sistem rental.</p>
        </div>
        <button 
          onClick={fetchUsers}
          className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl text-xs font-black uppercase tracking-widest transition-all"
        >
          Refresh Data
        </button>
      </header>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl font-bold text-sm flex items-center gap-2">
          <span>⚠️</span> {error}
        </div>
      )}

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">User</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Kontak</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Alamat</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center text-slate-400 font-bold italic animate-pulse">
                    MENGAMBIL DATA PELANGGAN...
                  </td>
                </tr>
              ) : users.length > 0 ? (
                users.map((user, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-black text-sm uppercase">
                          {user.username.charAt(0)}
                        </div>
                        <div>
                          <p className="font-black text-slate-800">{user.username}</p>
                          <p className="text-[10px] font-black text-blue-500 uppercase tracking-tighter">Customer ID #{idx + 101}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-sm font-bold text-slate-700">{user.email}</p>
                      <p className="text-xs text-slate-400 font-medium">{user.phone_number}</p>
                    </td>
                    <td className="px-8 py-6 text-sm text-slate-500 font-medium max-w-[200px] truncate">
                      {user.address || "-"}
                    </td>
                    <td className="px-8 py-6 text-center">
                      <button 
                        onClick={() => setSelectedUser(user)}
                        className="px-6 py-2.5 text-[10px] font-black uppercase bg-slate-900 text-white rounded-xl hover:bg-blue-600 transition-all shadow-lg shadow-slate-200"
                      >
                        Detail
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center text-slate-300 font-bold italic uppercase tracking-widest">
                    Belum ada pelanggan terdaftar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DETAIL USER */}
      {selectedUser && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="p-8 pb-0 flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-3xl bg-slate-900 text-white flex items-center justify-center text-2xl font-black uppercase">
                  {selectedUser.username.charAt(0)}
                </div>
                <div>
                  <h2 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900">Detail Profil</h2>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Informasi Lengkap User</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedUser(null)}
                className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1">Username</label>
                  <p className="font-bold text-slate-800">{selectedUser.username}</p>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1">Email</label>
                  <p className="font-bold text-slate-800">{selectedUser.email}</p>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1">Nomor HP</label>
                  <p className="font-bold text-slate-800">{selectedUser.phone_number}</p>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1">Status Akun</label>
                  <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-600 text-[10px] font-black uppercase rounded-lg">Aktif</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1">Alamat Domisili</label>
                <p className="text-slate-600 leading-relaxed font-medium">
                  {selectedUser.address || "Alamat belum dilengkapi oleh pengguna."}
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-8 pt-0 flex gap-3">
              <button 
                onClick={() => setSelectedUser(null)}
                className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-all"
              >
                Tutup
              </button>
              <button 
                className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-blue-600 transition-all shadow-lg shadow-slate-200"
                onClick={() => {
                   window.location.href = `mailto:${selectedUser.email}`;
                }}
              >
                Kirim Email
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}