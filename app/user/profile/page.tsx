"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { OrdersView } from "../../../components/user/orders-view";

const MapPicker = dynamic(() => import("../../../components/map-picker"), {
  ssr: false,
  loading: () => (
    <div className="h-[200px] w-full rounded-xl bg-slate-100 flex items-center justify-center text-sm font-medium text-slate-500 border border-slate-200">
      Memuat Peta Interaktif...
    </div>
  ),
});

type ProfileData = {
  address: string;
  phone: string;
};

const defaultProfile: ProfileData = {
  address: "",
  phone: "",
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData>(defaultProfile);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("rental_profile");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setProfile({
          address: parsed.address || "",
          phone: parsed.phone || "",
        });
      } catch {
        setProfile(defaultProfile);
      }
    }
  }, []);

  const handleChange = (key: keyof ProfileData, value: string) => {
    setSaved(false);
    setProfile((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    localStorage.setItem("rental_profile", JSON.stringify(profile));
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 pb-20">
      <section className="animate-fade-up rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Profil Saya
            </h1>
            <p className="mt-2 text-slate-600">
              Simpan alamat utama untuk mempercepat proses pemesanan.
            </p>
          </div>
          <Link
            href="/user/product"
            className="btn-soft focus-ring-soft inline-flex items-center justify-center rounded-xl bg-indigo-50 px-4 py-2.5 text-sm font-bold text-indigo-700 shadow-sm transition hover:bg-indigo-100 hover:text-indigo-800"
          >
            Lihat Katalog
          </Link>
        </div>

        <div className="space-y-4 max-w-3xl">
          {/* Nomor Telepon */}
          <div>
            <label
              htmlFor="phone"
              className="mb-1.5 block text-sm font-semibold text-slate-700"
            >
              Nomor Telepon
            </label>
            <div className="flex rounded-xl border border-slate-200 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-indigo-300 focus-within:border-indigo-400 transition">
              <span className="flex items-center px-3 bg-slate-50 border-r border-slate-200 text-sm font-medium text-slate-500 select-none">
                +62
              </span>
              <input
                id="phone"
                type="tel"
                value={profile.phone}
                onChange={(e) => {
                  // Hanya angka
                  const val = e.target.value.replace(/\D/g, "");
                  handleChange("phone", val);
                }}
                placeholder="812-3456-7890"
                className="w-full px-4 py-3 text-sm text-slate-900 outline-none bg-white"
                inputMode="numeric"
                maxLength={14}
              />
            </div>
          </div>

          {/* Alamat */}
          <div>
            <label
              htmlFor="address"
              className="mb-1.5 block text-sm font-semibold text-slate-700"
            >
              Alamat Utama
            </label>
            <textarea
              id="address"
              rows={3}
              value={profile.address}
              onChange={(e) => handleChange("address", e.target.value)}
              placeholder="Isi alamat atau pilih titik di peta..."
              className="focus-ring-soft w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
            />
          </div>

          <MapPicker
            addressValue={profile.address}
            onAddressPicked={(addr) => handleChange("address", addr)}
          />
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            onClick={handleSave}
            className="btn-soft focus-ring-soft rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-indigo-700"
          >
            Simpan Profil
          </button>
          {saved && (
            <span className="text-sm font-semibold text-green-600">
              Profil berhasil disimpan.
            </span>
          )}
        </div>
      </section>

      <section id="pesanan" className="mt-10 scroll-mt-24">
        <OrdersView embedded />
      </section>
    </main>
  );
}