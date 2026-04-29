"use client";
import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import ProductCard from "../../../components/user/product-card";
import { Search, Sparkles, Box, ArrowRight, ChevronDown, Filter } from "lucide-react";

export default function ProductPage() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<number | string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  // State untuk Dropdown
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // Tutup dropdown jika klik di luar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = { "Authorization": `Bearer ${token}` };
        const [resP, resC] = await Promise.all([
          fetch(`${API_URL}/api/products`, { headers }),
          fetch(`${API_URL}/api/categories`, { headers })
        ]);
        const dataP = await resP.json();
        const dataC = await resC.json();
        setProducts(dataP.data || dataP || []);
        setCategories(dataC.data || dataC || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (API_URL) fetchData();
  }, [API_URL]);

  const filtered = useMemo(() => {
    return products.filter(p => {
      const prodCatId = p.category_id || p.category?.id;
      const matchCat = activeCategory === "all" || String(prodCatId) === String(activeCategory);
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [products, activeCategory, searchQuery]);

  // Cari nama kategori yang sedang aktif untuk label dropdown
  const activeCategoryName = useMemo(() => {
    if (activeCategory === "all") return "Semua Unit";
    const found = categories.find(c => String(c.id) === String(activeCategory));
    return found ? found.name : "Semua Unit";
  }, [activeCategory, categories]);

  return (
    <main className="min-h-screen bg-[#FDFDFD]">
      {/* HEADER & SEARCH */}
      <section className="relative pt-20 pb-12">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-blue-600">
            <Sparkles className="h-3 w-3" /> Exclusive Rental Collection
          </div>
          <h1 className="mb-10 text-5xl font-black tracking-tighter text-slate-900 md:text-7xl uppercase">
            Pilih Unit, <span className="text-blue-600">Mulai Akselerasi.</span>
          </h1>
          
          <div className="mx-auto max-w-2xl relative z-20">
            <div className="flex items-center shadow-xl shadow-blue-100/50 rounded-2xl overflow-hidden bg-white border border-slate-100 p-1.5 focus-within:ring-4 focus-within:ring-blue-50/50 transition-all">
              <div className="flex items-center flex-1 px-4">
                <Search className="h-5 w-5 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Cari unit..."
                  className="w-full bg-transparent px-4 py-3 text-sm font-bold outline-none text-slate-800"
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DROPDOWN CATEGORY */}
      <nav className="sticky top-[64px] z-40 bg-white/80 backdrop-blur-md border-b border-slate-100 py-4">
        <div className="mx-auto max-w-6xl px-4 flex justify-center">
          <div className="relative w-full max-w-[250px]" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-3 shadow-sm transition-all hover:border-blue-400 active:scale-95"
            >
              <div className="flex items-center gap-3">
                <Filter className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-black uppercase tracking-widest text-slate-700">
                  {activeCategoryName}
                </span>
              </div>
              <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-300 ${isDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute left-0 mt-2 w-full origin-top animate-in fade-in zoom-in duration-200 rounded-2xl border border-slate-100 bg-white p-2 shadow-2xl z-[100]">
                <button
                  onClick={() => { setActiveCategory("all"); setIsDropdownOpen(false); }}
                  className={`w-full rounded-xl px-4 py-3 text-left text-[11px] font-black uppercase tracking-widest transition-colors ${activeCategory === "all" ? "bg-blue-600 text-white" : "text-slate-500 hover:bg-slate-50 hover:text-blue-600"}`}
                >
                  Semua Unit
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => { setActiveCategory(cat.id); setIsDropdownOpen(false); }}
                    className={`w-full rounded-xl px-4 py-3 text-left text-[11px] font-black uppercase tracking-widest transition-colors ${String(activeCategory) === String(cat.id) ? "bg-blue-600 text-white" : "text-slate-500 hover:bg-slate-50 hover:text-blue-600"}`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* PRODUCT GRID */}
      <section className="mx-auto max-w-6xl px-4 py-16 relative z-10">
        {loading ? (
          <div className="flex py-20 justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /></div>
        ) : filtered.length === 0 ? (
          <div className="rounded-[2.5rem] border-2 border-dashed border-slate-200 py-32 text-center bg-white">
            <Box className="mx-auto mb-4 h-12 w-12 text-slate-200" />
            <p className="text-xs font-black uppercase text-slate-400 tracking-widest">Tidak ada unit</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((product) => (
              <div key={product.id} className="relative group">
                <div className="absolute -inset-[1px] rounded-[2.2rem] bg-gradient-to-tr from-blue-500 to-cyan-400 opacity-0 transition duration-300 group-hover:opacity-100 blur-[1px]" />
                <div className="relative bg-white rounded-[2.1rem] overflow-hidden transition-all duration-500 group-hover:-translate-y-3 shadow-sm">
                   <ProductCard 
                     product={product} 
                     onDetail={() => router.push(`/user/product/${product.id}`)} 
                   />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}