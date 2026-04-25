"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterUI() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // State Input
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // State UI
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [generalError, setGeneralError] = useState("");

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    if (value && !value.endsWith("@gmail.com")) {
      setEmailError("Email harus berakhir dengan @gmail.com");
    } else {
      setEmailError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setGeneralError("");
    
    // Validasi Password Match
    if (password !== confirmPassword) {
      setGeneralError("Password dan konfirmasi password tidak cocok");
      return;
    }

    setIsLoading(true);

    try {
        const response = await fetch(`${API_URL}/api/users/register`, { // Menggunakan API_URL dari env
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: username,
            email: email.toLowerCase(),
            password: password,
            role: "customer"
          }),
        });

      const result = await response.json();

      if (!response.ok) {
        // Menangkap error dari backend (StatusConflict, StatusBadRequest, dll)
        throw new Error(result.error || "Terjadi kesalahan saat mendaftar");
      }

      // Jika berhasil
      alert("Registrasi Berhasil! Silahkan login.");
      router.push("/login");

    } catch (err: any) {
      setGeneralError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-x-clip bg-slate-50 px-4 py-12 text-slate-900 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute -left-20 top-0 h-96 w-96 rounded-full bg-indigo-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-cyan-200/40 blur-3xl" />

      <div className="relative w-full max-w-sm space-y-8 rounded-3xl border border-white/50 bg-white/70 p-8 shadow-xl backdrop-blur-xl sm:p-10">
        <div className="text-center">
          <Link href="/" className="text-xl font-bold tracking-tight text-slate-900">RentalHub</Link>
          <h2 className="mt-6 text-2xl font-semibold tracking-tight text-slate-900">Buat akun baru</h2>
          
          {/* Notifikasi Error General */}
          {generalError && (
            <div className="mt-4 p-3 text-xs bg-red-100 text-red-600 rounded-xl font-bold">
              ⚠️ {generalError}
            </div>
          )}
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Username</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1 block w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="fathir_adzan"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Email (Gmail)</label>
              <input
                type="email"
                required
                value={email}
                onChange={handleEmailChange}
                className={`mt-1 block w-full rounded-xl border bg-white/80 px-4 py-3 text-sm focus:outline-none focus:ring-1 ${
                  emailError ? "border-red-400 focus:ring-red-500" : "border-slate-200 focus:ring-indigo-500"
                }`}
                placeholder="anda@gmail.com"
              />
              {emailError && <p className="mt-1 text-xs text-red-600 font-semibold">{emailError}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Password</label>
              <div className="relative mt-1">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-xl border border-slate-200 bg-white/80 py-3 pl-4 pr-12 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="Min. 8 karakter"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-xs text-slate-500 font-bold"
                >
                  {showPassword ? "HIDE" : "SHOW"}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Konfirmasi Password</label>
              <div className="relative mt-1">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full rounded-xl border border-slate-200 bg-white/80 py-3 pl-4 pr-12 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="Ulangi password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-xs text-slate-500 font-bold"
                >
                  {showConfirmPassword ? "HIDE" : "SHOW"}
                </button>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading || !!emailError || !email}
              className="flex w-full justify-center rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-indigo-700 disabled:opacity-50"
            >
              {isLoading ? "Memproses..." : "Daftar Sekarang"}
            </button>
          </div>
        </form>

        <p className="mt-10 text-center text-sm text-slate-600">
          Sudah punya akun?{" "}
          <Link href="/login" className="font-semibold text-indigo-600 hover:text-indigo-500">Masuk</Link>
        </p>
      </div>
    </main>
  );
}