"use client";

import Link from "next/link";
import { useState } from "react";

export default function RegisterUI() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    
    if (value && !value.endsWith("@gmail.com")) {
      setEmailError("Email harus berakhir dengan @gmail.com");
    } else {
      setEmailError("");
    }
  };
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-x-clip bg-slate-50 px-4 py-12 text-slate-900 sm:px-6 lg:px-8">
      {/* Decorative background elements */}
      <div className="pointer-events-none absolute -left-20 top-0 h-96 w-96 rounded-full bg-indigo-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-cyan-200/40 blur-3xl" />

      <div className="relative w-full max-w-sm space-y-8 rounded-3xl border border-white/50 bg-white/70 p-8 shadow-xl backdrop-blur-xl sm:p-10">
        <div className="text-center">
          <Link href="/" className="text-xl font-bold tracking-tight text-slate-900">
            RentalHub
          </Link>
          <h2 className="mt-6 text-2xl font-semibold tracking-tight text-slate-900">
            Buat akun baru
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Daftar untuk mulai menyewa unit pilihanmu.
          </p>
        </div>

        <form className="mt-8 space-y-5" action="#" method="POST">
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700">
                Nama Lengkap
              </label>
              <div className="mt-1">
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  className="block w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="Username"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                Alamat Email (Gmail)
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={handleEmailChange}
                  className={`block w-full rounded-xl border bg-white/80 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 ${
                    emailError
                      ? "border-red-400 focus:border-red-500 focus:ring-red-500"
                      : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"
                  }`}
                  placeholder="anda@gmail.com"
                />
                {emailError && <p className="mt-1 text-xs text-red-600 font-semibold">{emailError}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                Password
              </label>
              <div className="relative mt-1">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  className="block w-full rounded-xl border border-slate-200 bg-white/80 py-3 pl-4 pr-12 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="Password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-slate-500 hover:text-indigo-600 focus:outline-none"
                >
                  {showPassword ? "Sembunyikan" : "Lihat"}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-slate-700">
                Konfirmasi Password
              </label>
              <div className="relative mt-1">
                <input
                  id="confirm-password"
                  name="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  className="block w-full rounded-xl border border-slate-200 bg-white/80 py-3 pl-4 pr-12 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="Konfirmasi Password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-slate-500 hover:text-indigo-600 focus:outline-none"
                >
                  {showConfirmPassword ? "Sembunyikan" : "Lihat"}
                </button>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={!!emailError || !email}
              className="flex w-full justify-center rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Daftar Sekarang
            </button>
          </div>
        </form>

        <p className="mt-10 text-center text-sm text-slate-600">
          Sudah punya akun?{" "}
          <Link href="/login" className="font-semibold text-indigo-600 hover:text-indigo-500 transition">
            Masuk
          </Link>
        </p>
      </div>
    </main>
  );
}
