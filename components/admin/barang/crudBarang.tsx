"use client";
import React, { useState, useEffect, useRef } from 'react';

type CrudProductData = {
  id?: number | string;
  name?: string;
  category_id?: number | string;
  specifications?: Array<{ key: string; value: string }> | string;
  photo_url?: string;
  price_per_day?: number | string;
  description?: string;
};

const PRODUCT_PREFIX_STORAGE_KEY = "admin_product_prefix_map_v1";

function sanitizePrefix(prefix: string): string {
  const cleaned = prefix.toLowerCase().replace(/[^a-z0-9]/g, "");
  return cleaned.slice(0, 6) || "prd";
}

function loadPrefixMap(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const raw = window.localStorage.getItem(PRODUCT_PREFIX_STORAGE_KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed ? (parsed as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function savePrefixForProduct(productId: string | number, prefix: string): void {
  if (typeof window === "undefined") return;
  const safePrefix = sanitizePrefix(prefix);
  const map = loadPrefixMap();
  map[String(productId)] = safePrefix;
  window.localStorage.setItem(PRODUCT_PREFIX_STORAGE_KEY, JSON.stringify(map));
}

interface CrudBarangProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'tambah' | 'edit' | 'hapus' | 'detail';
  data?: CrudProductData;
  onEdit?: () => void;
  refreshData?: () => void;
}

type CategoryItem = { id: number; name: string };

async function parseJsonSafe(response: Response): Promise<Record<string, unknown>> {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) return {};
  try {
    return (await response.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

async function requestProductMutationWithFallback(args: {
  apiUrl: string;
  token: string | null;
  method: "PUT" | "DELETE";
  productId: number | string;
  body?: FormData;
}): Promise<Response> {
  const candidates = [
    `${args.apiUrl}/api/admin/products/${args.productId}`,
    `${args.apiUrl}/api/products/${args.productId}`,
  ];
  let lastResponse: Response | null = null;
  for (const url of candidates) {
    const response = await fetch(url, {
      method: args.method,
      headers: { ...(args.token ? { Authorization: `Bearer ${args.token}` } : {}) },
      ...(args.body ? { body: args.body } : {}),
    });
    lastResponse = response;
    if (response.status !== 404) return response;
  }
  if (lastResponse) return lastResponse;
  throw new Error("Gagal menghubungi endpoint produk");
}

export default function CrudBarang({ isOpen, onClose, mode, data, onEdit, refreshData }: CrudBarangProps) {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [specs, setSpecs] = useState<Array<{ key: string; value: string }>>([{ key: '', value: '' }]);
  const [uniquePrefix, setUniquePrefix] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // STATE BARU UNTUK CONTROLLED INPUT (AGAR BISA DIEDIT SAAT PINDAH DARI DETAIL KE EDIT)
  const [formValues, setFormValues] = useState({
    name: "",
    price: "",
    description: ""
  });
  
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const IMAGE_API = `${API_URL}/api/images/products`;

  useEffect(() => {
    const fetchCategories = async () => {
      if (!API_URL) return;
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/api/categories`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const catData = await parseJsonSafe(res);
          const dataArray = Array.isArray(catData?.data)
            ? (catData.data as CategoryItem[])
            : Array.isArray(catData)
              ? (catData as unknown as CategoryItem[])
              : [];
          setCategories(dataArray);
        }
      } catch (err) { 
        console.error("Gagal mengambil kategori:", err); 
      }
    };
    if (isOpen) fetchCategories();
  }, [isOpen, API_URL]);

  useEffect(() => {
    if ((mode === 'edit' || mode === 'detail') && data) {
      try {
        const rawSpecs = typeof data.specifications === 'string' ? JSON.parse(data.specifications) : data.specifications;
        setSpecs(Array.isArray(rawSpecs) ? rawSpecs : [{ key: '', value: '' }]);
      } catch { setSpecs([{ key: '', value: '' }]); }

      setSelectedCategoryId(data.category_id?.toString() || "");
      
      // SINKRONISASI KE STATE FORM
      setFormValues({
        name: data.name || "",
        price: data.price_per_day?.toString() || "",
        description: data.description || ""
      });

      if (data.id) {
        const map = loadPrefixMap();
        setUniquePrefix(map[String(data.id)] || "");
      }

      if (data.photo_url) {
        const fileName = data.photo_url.split('/').pop();
        setPreviewUrl(`${IMAGE_API}/${fileName}`);
      } else { setPreviewUrl(null); }
    } else {
      setSpecs([{ key: '', value: '' }]);
      setSelectedCategoryId("");
      setFormValues({ name: "", price: "", description: "" });
      setPhoto(null);
      setPreviewUrl(null);
      setUniquePrefix("");
    }
  }, [mode, data, isOpen, IMAGE_API]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!API_URL) return alert("API URL tidak ditemukan");
    setLoading(true);

    const formData = new FormData();
    const token = localStorage.getItem("token");

    formData.append("category_id", selectedCategoryId);
    formData.append("name", formValues.name);
    formData.append("price_per_day", formValues.price);
    formData.append("description", formValues.description);
    formData.append("specifications", JSON.stringify(specs));
    if (photo) formData.append("photo", photo);

    try {
      const res = mode === 'tambah'
        ? await fetch(`${API_URL}/api/products`, {
            method: 'POST',
            headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
            body: formData,
          })
        : await requestProductMutationWithFallback({
            apiUrl: API_URL!, 
            token,
            method: "PUT",
            productId: data?.id!,
            body: formData,
          });

      const result = await parseJsonSafe(res);
      if (!res.ok) throw new Error(String(result?.error || "Gagal menyimpan"));

      if (uniquePrefix.trim() !== "") {
        const id = mode === 'tambah' ? (result?.data as any)?.id : data?.id;
        savePrefixForProduct(id, uniquePrefix);
      }

      alert("Berhasil!");
      onClose();
      if (refreshData) refreshData();
    } catch (err: any) {
      alert(err.message);
    } finally { setLoading(false); }
  };

  const handleDelete = async () => {
    if (!data?.id || !API_URL) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await requestProductMutationWithFallback({
        apiUrl: API_URL!,
        token,
        method: "DELETE",
        productId: data.id,
      });
      if (!res.ok) throw new Error("Gagal hapus");
      alert("Terhapus!");
      onClose();
      if (refreshData) refreshData();
    } catch (err: any) { alert(err.message); }
    finally { setLoading(false); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <h2 className="text-2xl font-black text-slate-900">
            {mode === 'edit' ? 'Edit Barang' : mode === 'detail' ? 'Detail Produk' : 'Tambah Produk'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-rose-500 font-black text-xl">✕</button>
        </div>

        {mode === 'hapus' ? (
          <div className="p-10 text-center">
            <div className="mx-auto h-20 w-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center text-3xl mb-6">🗑️</div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">Hapus Barang?</h2>
            <p className="text-sm text-slate-500 mb-8">Data <span className="font-bold">{data?.name}</span> akan dihapus permanen.</p>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={onClose} className="py-4 rounded-2xl bg-slate-100 font-bold text-slate-500">Batal</button>
              <button onClick={handleDelete} disabled={loading} className="py-4 rounded-2xl bg-rose-600 text-white font-bold">{loading ? "..." : "Ya, Hapus"}</button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="overflow-y-auto flex-1">
            <div className="p-8 space-y-8">
              <div className="space-y-4 text-center">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block text-left">Foto Produk *</label>
                <div className="flex flex-col items-center gap-4">
                  <div className="w-40 h-40 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl overflow-hidden flex items-center justify-center relative shadow-inner">
                    {previewUrl ? <img src={previewUrl} className="w-full h-full object-cover" /> : <span className="text-2xl">📸</span>}
                  </div>
                  {mode !== 'detail' && (
                    <input type="file" accept="image/*" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) { setPhoto(file); setPreviewUrl(URL.createObjectURL(file)); }
                    }} className="text-xs text-slate-500 cursor-pointer" />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Kategori *</label>
                  <select 
                    value={selectedCategoryId} 
                    onChange={(e) => setSelectedCategoryId(e.target.value)} 
                    required 
                    disabled={mode === 'detail'} 
                    className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold outline-none focus:ring-2 ring-blue-500/20"
                  >
                    <option value="">Pilih Kategori</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Nama Barang</label>
                  <input 
                    value={formValues.name}
                    onChange={(e) => setFormValues({...formValues, name: e.target.value})}
                    readOnly={mode === 'detail'} 
                    type="text" 
                    required 
                    className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none font-bold" 
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Harga Sewa / Hari (Rp)</label>
                  <input 
                    value={formValues.price}
                    onChange={(e) => setFormValues({...formValues, price: e.target.value})}
                    readOnly={mode === 'detail'} 
                    type="number" 
                    required 
                    className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none font-bold text-blue-600 focus:ring-2 ring-blue-500/20" 
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Specifications</label>
                  {mode !== 'detail' && <button type="button" onClick={() => setSpecs([...specs, { key: '', value: '' }])} className="text-blue-600 text-[10px] font-black uppercase tracking-tighter hover:underline">+ Add Spec</button>}
                </div>
                {specs.map((spec, index) => (
                  <div key={index} className="flex gap-3 items-center animate-in fade-in slide-in-from-left-2">
                    <input value={spec.key} readOnly={mode === 'detail'} onChange={(e) => { const n = [...specs]; n[index].key = e.target.value; setSpecs(n); }} placeholder="Key" className="flex-1 p-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none font-medium text-sm" />
                    <input value={spec.value} readOnly={mode === 'detail'} onChange={(e) => { const n = [...specs]; n[index].value = e.target.value; setSpecs(n); }} placeholder="Value" className="flex-1 p-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none font-medium text-sm" />
                    {mode !== 'detail' && <button type="button" onClick={() => setSpecs(specs.filter((_, i) => i !== index))} className="p-4 text-rose-400 hover:text-rose-600 transition-colors">🗑️</button>}
                  </div>
                ))}
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Deskripsi</label>
                <textarea 
                  value={formValues.description}
                  onChange={(e) => setFormValues({...formValues, description: e.target.value})}
                  readOnly={mode === 'detail'} 
                  rows={3} 
                  className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none font-medium resize-none text-sm" 
                />
              </div>
            </div>

            <div className="p-8 border-t border-slate-100 bg-slate-50/50 grid grid-cols-2 gap-4 sticky bottom-0 z-10">
              <button onClick={onClose} type="button" className="py-4 rounded-2xl bg-white border border-slate-200 text-slate-500 font-bold hover:bg-slate-50 transition-colors">Batal</button>
              {mode !== 'detail' ? (
                <button type="submit" disabled={loading} className={`py-4 rounded-2xl text-white font-bold shadow-xl transition-all active:scale-95 ${mode === 'edit' ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-100' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-100'}`}>
                  {loading ? "Memproses..." : mode === 'edit' ? 'Update Data' : 'Simpan Barang'}
                </button>
              ) : (
                <button onClick={onEdit} type="button" className="py-4 rounded-2xl bg-slate-900 text-white font-bold hover:bg-black shadow-xl shadow-slate-200 transition-all active:scale-95">Edit Data</button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}