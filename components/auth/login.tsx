"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginUI() {
  const router = useRouter();
  
  // State Input
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // State UI
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
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
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/login`, { 
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.toLowerCase(),
          password: password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Gagal masuk. Cek email dan password.");
      }

      // 1. Ambil Token dari response
      const token = result.data.token;
      if (!token) throw new Error("Token tidak ditemukan dalam response.");

      // 2. PROSES DECODE JWT (Terjemahkan Token)
      // JWT format: Header.Payload.Signature
      // Kita ambil bagian tengah (Payload) yang berisi claims (role, email, exp, dll)
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/"); // Fix base64 format
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );

      const decodedToken = JSON.parse(jsonPayload);
      
      // 3. Ambil role dari payload (sesuai "role" di claims backend Go kamu)
      const roleFromToken = decodedToken.role;

      if (!roleFromToken) {
        throw new Error("Role tidak ditemukan di dalam token.");
      }

      // 4. Simpan ke LocalStorage
      localStorage.setItem("token", token);
      localStorage.setItem("role", roleFromToken);

      alert(`Login Berhasil! Role dari Token: ${roleFromToken}`);
      
      // 5. Redirect sesuai Role
      const lowerRole = roleFromToken.toLowerCase();
      if (lowerRole === "admin") {
        router.push("/admin");
      } else {
        router.push("/user");
      }

      router.refresh();

    } catch (err: any) {
      // Menangkap error decode atau error network
      setGeneralError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-x-clip bg-slate-50 px-4 py-12 text-slate-900 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute -left-20 top-0 h-96 w-96 rounded-full bg-indigo-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-cyan-200/40 blur-3xl" />

      <div className="relative w-full max-sm space-y-8 rounded-3xl border border-white/50 bg-white/70 p-8 shadow-xl backdrop-blur-xl sm:p-10">
        <div className="text-center">
          <Link href="/" className="text-xl font-bold tracking-tight text-slate-900">RentalHub</Link>
          <h2 className="mt-6 text-2xl font-semibold tracking-tight text-slate-900">Selamat datang kembali</h2>
          
          {generalError && (
            <div className="mt-4 p-3 text-xs bg-red-100 text-red-600 rounded-xl font-bold">
              ⚠️ {generalError}
            </div>
          )}
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Alamat Email (Gmail)</label>
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
                  placeholder="Masukkan password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-xs text-slate-500 font-bold hover:text-indigo-600"
                >
                  {showPassword ? "HIDE" : "SHOW"}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !!emailError || !email}
            className="flex w-full justify-center rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-indigo-700 disabled:opacity-50"
          >
            {isLoading ? "Memproses Token..." : "Masuk"}
          </button>
        </form>

        <p className="mt-10 text-center text-sm text-slate-600">
          Belum punya akun?{" "}
          <Link href="/register" className="font-semibold text-indigo-600 hover:text-indigo-500">Daftar sekarang</Link>
        </p>
      </div>
    </main>
  );
}