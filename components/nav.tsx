"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";

interface UserProfile {
  name: string;
  email: string;
}

type ProfileApiResult = {
  data?: {
    username?: string;
    name?: string;
    email?: string;
  };
  message?: string;
  error?: string;
};

const PROFILE_ENDPOINT_CANDIDATES = [
  "/api/users/profile",
  "/api/profile",
  "/api/users/me",
];

async function parseProfileResult(response: Response): Promise<ProfileApiResult> {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return (await response.json()) as ProfileApiResult;
  }

  const rawText = await response.text();
  return {
    error: rawText?.trim() || `Request gagal dengan status ${response.status}`,
  };
}

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const links = [
    { name: "Beranda", href: "/user" },
    { name: "Produk", href: "/user/product" },
    { name: "Syarat & Ketentuan", href: "/user/terms" },
    { name: "Cek pesanan", href: "/user/pesanan" },
    { name: "History Pesanan", href: "/user/history" },
    { name: "Ulasan", href: "/user/reviews" },
  ];

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token || !API_URL) return;

        for (const endpoint of PROFILE_ENDPOINT_CANDIDATES) {
          const res = await fetch(`${API_URL}${endpoint}`, {
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`,
            },
          });

          if (res.status === 404) continue;

          const result = await parseProfileResult(res);
          if (res.ok && result.data) {
            const data = result.data;
            setUser({ 
              name: data.username || data.name || "User", 
              email: data.email || "" 
            });
            return;
          }
        }
      } catch (err) {
        console.error("Gagal mengambil data profil:", err);
      }
    };

    fetchProfile();
  }, [API_URL]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setProfileOpen(false);
    router.push("/");
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getInitial = (name: string) => {
    if (!name) return "U";
    return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto grid h-16 w-full max-w-6xl grid-cols-3 items-center px-4 sm:px-6 lg:px-8">
        
        {/* LOGO */}
        <div className="flex justify-start">
          <Link href="/user" className="text-lg font-bold text-indigo-700">
            RentalHub
          </Link>
        </div>

        {/* NAVIGASI DESKTOP */}
        <nav className="hidden items-center justify-center gap-6 text-sm font-medium md:flex">
          {links.map((link) => {
            // Perbaikan Logika isActive agar tidak overlap
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`relative z-10 px-1 py-1 transition-colors hover:text-indigo-700 ${
                  isActive ? "text-indigo-700 font-bold" : "text-slate-600"
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* PROFILE & MOBILE TRIGGER */}
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-700 md:hidden"
          >
            {mobileOpen ? (
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>

          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 transition hover:bg-indigo-200"
            >
              <span className="text-xs font-bold uppercase">
                {user ? getInitial(user.name) : "..."}
              </span>
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-2xl border border-slate-200 bg-white py-2 shadow-xl">
                <div className="px-4 py-2 border-b border-slate-100 mb-1">
                  <p className="text-sm font-bold text-slate-900 truncate">{user?.name}</p>
                  <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
                </div>
                <Link
                  href="/user/profile"
                  className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  onClick={() => setProfileOpen(false)}
                >
                  Profil Saya
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-semibold"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MOBILE MENU */}
      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white p-4 md:hidden">
          <nav className="flex flex-col gap-2">
            {links.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`rounded-xl px-4 py-3 text-sm font-medium ${
                  pathname === link.href ? "bg-indigo-50 text-indigo-700" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}