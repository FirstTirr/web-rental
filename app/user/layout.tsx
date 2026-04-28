"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Nav } from "../../components/nav";

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAllowed, setIsAllowed] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login");
      return;
    }
    setIsAllowed(true);
  }, [router]);

  if (!isAllowed) return null;

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-x-clip text-slate-900">
      {/* Dekorasi Konsisten */}
      <div className="pointer-events-none absolute -left-20 top-20 h-[30rem] w-[30rem] rounded-full bg-indigo-200/30 blur-[100px]" />
      <div className="pointer-events-none absolute -right-20 top-[40rem] h-[30rem] w-[30rem] rounded-full bg-cyan-200/30 blur-[100px]" />
      
      <Nav />
      {/* Konten tiap halaman anak (page) */}
      <div className="relative z-10 w-full pt-8 pb-16">
        {children}
      </div>
    </div>
  );
}