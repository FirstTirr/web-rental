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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.toLowerCase(),
          password: password,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Gagal masuk.");

      const token = result.data.token;
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64).split("").map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)).join("")
      );

      const decodedToken = JSON.parse(jsonPayload);
      const roleFromToken = decodedToken.role;

      localStorage.setItem("token", token);
      localStorage.setItem("role", roleFromToken);

      const lowerRole = roleFromToken.toLowerCase();
      router.push(lowerRole === "admin" ? "/admin" : "/user");
      router.refresh();

    } catch (err: any) {
      setGeneralError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-x-clip bg-slate-50 px-4 py-12 text-slate-900 sm:px-6 lg:px-8">
      {/* Background Ornaments */}
      <div className="pointer-events-none absolute -left-20 top-0 h-96 w-96 rounded-full bg-indigo-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-cyan-200/40 blur-3xl" />

      {/* Container Form - Fix: max-w-md agar tidak gepeng */}
      <div className="relative w-full max-w-md space-y-8 rounded-[2.5rem] border border-white/50 bg-white/80 p-8 shadow-2xl backdrop-blur-xl sm:p-12">
        <div className="text-center">
          <Link href="/" className="text-2xl font-black tracking-tighter text-slate-900 italic uppercase">
            Rental<span className="text-indigo-600">Hub</span>
          </Link>
          <h2 className="mt-8 text-3xl font-black tracking-tight text-slate-900 uppercase leading-tight">
            Selamat datang kembali
          </h2>
          <p className="mt-2 text-sm font-medium text-slate-500 italic">Silakan masuk ke akun Anda</p>
          
          {generalError && (
            <div className="mt-6 p-4 text-xs bg-red-50 border border-red-100 text-red-600 rounded-2xl font-bold">
              ⚠️ {generalError}
            </div>
          )}
        </div>

        <form className="mt-10 space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-5">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 mb-2">
                Alamat Email (Gmail)
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={handleEmailChange}
                className={`block w-full rounded-2xl border bg-slate-50/50 px-5 py-4 text-sm font-bold transition-all focus:outline-none focus:ring-2 ${
                  emailError 
                    ? "border-red-200 focus:ring-red-500/20" 
                    : "border-slate-100 focus:border-indigo-500 focus:ring-indigo-500/20"
                }`}
                placeholder="anda@gmail.com"
              />
              {emailError && <p className="mt-2 text-[10px] text-red-600 font-black italic uppercase ml-1">{emailError}</p>}
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-2xl border border-slate-100 bg-slate-50/50 py-4 pl-5 pr-14 text-sm font-bold transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="Masukkan password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-5 text-[10px] text-slate-400 font-black hover:text-indigo-600 uppercase tracking-tighter"
                >
                  {showPassword ? "HIDE" : "SHOW"}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !!emailError || !email}
            className="group relative flex w-full justify-center rounded-2xl bg-indigo-600 px-4 py-4 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-indigo-200 transition-all hover:bg-indigo-700 hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 disabled:translate-y-0"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Processing...
              </span>
            ) : "Masuk Sekarang"}
          </button>
        </form>

        <p className="mt-8 text-center text-xs font-bold text-slate-500 uppercase tracking-tighter">
          Belum punya akun?{" "}
          <Link href="/register" className="text-indigo-600 hover:underline ml-1">Daftar sekarang</Link>
        </p>
      </div>
    </main>
  );
}