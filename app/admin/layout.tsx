"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import SideBar from "../../components/admin/sideBar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
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
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 overflow-x-hidden lg:flex">
      <SideBar /> 
      <main className="w-full min-w-0 flex-1 p-4 pt-4 sm:p-6 sm:pt-6 md:p-8 lg:ml-72 lg:p-10">
        {children}
      </main>
    </div>
  );
}