"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";

export function Nav() {
  const pathname = usePathname();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const links = [
    { name: "Beranda", href: "/user" },
    { name: "Produk", href: "/user/product" },
    { name: "Syarat & Ketentuan", href: "/user/terms" },
    { name: "Cek pesanan", href: "/user/pesanan" },

  ];

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

  return (
    <header className="animate-fade-in-soft sticky top-0 z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
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
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="btn-soft focus-ring-soft flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 transition hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <span className="font-semibold uppercase">US</span>
          </button>

          {profileOpen && (
            <div className="animate-fade-up absolute right-0 mt-2 w-48 origin-top-right rounded-2xl border border-slate-200 bg-white py-2 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
              <div className="px-4 py-2 border-b border-slate-100 mb-2">
                <p className="text-sm font-medium text-slate-900">User Rental</p>
                <p className="text-xs text-slate-500">user@email.com</p>
              </div>
              <Link
                href="/user/profile"
                className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600"
                onClick={() => setProfileOpen(false)}
              >
                Profil Saya
              </Link>
              <Link
                href="/"
                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 font-medium"
                onClick={() => setProfileOpen(false)}
              >
                Keluar (Logout)
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
