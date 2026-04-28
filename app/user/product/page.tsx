"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProductCard from "../../../components/user/product-card";

export default function ProductPage() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const headers = {
          "Content-Type": "application/json",
          "Accept": "application/json",
          ...(token && { "Authorization": `Bearer ${token}` })
        };

        const [resProd, resCat] = await Promise.all([
          fetch(`${API_URL}/api/products`, { headers }),
          fetch(`${API_URL}/api/categories`, { headers })
        ]);

        const dataProd = await resProd.json();
        const dataCat = await resCat.json();

        // Ambil data array dengan aman
        const finalProducts = dataProd.data || dataProd || [];
        const finalCategories = dataCat.data || dataCat || [];

        setProducts(Array.isArray(finalProducts) ? finalProducts : []);
        setCategories(Array.isArray(finalCategories) ? finalCategories : []);

        if (resCat.status === 401 || resProd.status === 401) {
          setError("Sesi habis, silakan login ulang.");
        }
      } catch (err) {
        setError("Gagal menyambung ke server.");
      } finally {
        setLoading(false);
      }
    };
    if (API_URL) fetchAllData();
  }, [API_URL]);

  const goToDetail = (id: any) => {
    // Pastikan path ini sesuai dengan folder detail kamu
    // Misal folder kamu: app/user/product/[id]/page.tsx
    router.push(`/user/product/${id}`);
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="animate-fade-up mb-14 text-center max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">Katalog Produk</h1>
        <p className="mt-4 text-base text-slate-600">Temukan pilihan unit berkualitas.</p>
      </div>

      {loading ? (
        <div className="text-center py-20 font-bold text-slate-400">Memuat data...</div>
      ) : error ? (
        <div className="text-center py-20 text-rose-600 font-bold">{error}</div>
      ) : (
        categories.map((cat, index) => {
          const filteredItems = products.filter(p => (p.category_id == cat.id) || (p.category?.id == cat.id));
          if (filteredItems.length === 0) return null;

          return (
            <section key={cat.id} className="mb-14">
              <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-sm">
                  {String(index + 1).padStart(2, '0')}
                </span>
                {cat.name}
              </h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredItems.map(p => (
                  <ProductCard key={p.id} product={p} onDetail={() => goToDetail(p.id)} />
                ))}
              </div>
            </section>
          );
        })
      )}
    </main>
  );
}