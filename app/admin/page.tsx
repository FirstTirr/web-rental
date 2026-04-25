"use client";
import Dashboard from "../../components/admin/manajemen/dashboard";

export default function AdminPage() {
  // Kita "paksa" tampilkan dashboard di route /admin
  return <Dashboard activeTab="dashboard" setActiveTab={() => {}} />;
}