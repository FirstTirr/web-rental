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
  "/api/users/profile",
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
  ];

  // Fetch data profile user
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        if (!API_URL) return;

        let lastResult: ProfileApiResult = {};

        for (const endpoint of PROFILE_ENDPOINT_CANDIDATES) {
          const res = await fetch(`${API_URL}${endpoint}`, {
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              "Authorization": `Bearer ${token}`,
            },
          });

          const result = await parseProfileResult(res);
          lastResult = result;

          if (res.status === 404) {
            continue;
          }

          if (!res.ok) {
            throw new Error(result?.error || "Gagal mengambil profil.");
          }

          const data = result?.data || {};
          const name = data.username || data.name || "";
          const email = data.email || "";
          setUser({ name, email });
          return;
        }

        if (lastResult?.data) {
          const name = lastResult.data.username || lastResult.data.name || "";
          const email = lastResult.data.email || "";
          setUser({ name, email });
        }
      } catch (err) {
        console.error("Gagal mengambil data profil:", err);
      }
    };

    fetchProfile();
  }, [API_URL]);

  // Fungsi Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    setProfileOpen(false);
    router.push("/");
  };

  // Close dropdown if clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fungsi untuk mendapatkan inisial nama (Contoh: Fathir Adzan -> FA)
  const getInitial = (name: string) => {
    if (!name) return "US";
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <header className="animate-fade-in-soft sticky top-0 z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Link href="/user" className="text-lg font-bold tracking-tight text-indigo-700">
          RentalHub
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
          {links.map((link) => {
            const isActive = pathname === link.href || (link.href !== "/user" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`focus-ring-soft rounded-md px-1 py-0.5 transition hover:text-indigo-700 ${isActive ? "text-indigo-700" : ""}`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setMobileOpen((prev) => !prev)}
            className="btn-soft focus-ring-soft inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:border-indigo-200 hover:text-indigo-700 md:hidden"
            aria-label="Buka menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? (
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>

          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="btn-soft focus-ring-soft flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 transition hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              <span className="font-semibold uppercase">
                {user ? getInitial(user.name) : "..."}
              </span>
            </button>

            {profileOpen && (
              <div className="animate-fade-up absolute right-0 mt-2 w-48 origin-top-right rounded-2xl border border-slate-200 bg-white py-2 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <div className="px-4 py-2 border-b border-slate-100 mb-2">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {user?.name || "Memuat..."}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {user?.email || "..."}
                  </p>
                </div>
                <Link
                  href="/user/profile"
                  className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600"
                  onClick={() => setProfileOpen(false)}
                >
                  Profil Saya
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 font-medium"
                >
                  Keluar (Logout)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-slate-200/80 bg-white px-4 py-3 md:hidden">
          <nav className="mx-auto flex w-full max-w-6xl flex-col gap-1 text-sm font-medium text-slate-700">
            {links.map((link) => {
              const isActive = pathname === link.href || (link.href !== "/user" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => {
                    setMobileOpen(false);
                    setProfileOpen(false);
                  }}
                  className={`rounded-xl px-3 py-2 transition ${isActive ? "bg-indigo-50 text-indigo-700" : "hover:bg-slate-50"}`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}