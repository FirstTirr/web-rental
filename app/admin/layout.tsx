"use client";
import React from 'react';
import SideBar from "@/components/admin/sideBar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f8fafc] flex text-slate-900">
      <SideBar /> 
      <main className="flex-1 lg:ml-72 p-8 md:p-12">
        {children}
      </main>
    </div>
  );
}