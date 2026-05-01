import Link from "next/link";
import ProductCard from "../components/user/product-card"; // Pastikan path benar

// Tipe data untuk sinkronisasi dengan API
interface ProductItem {
  id: number | string;
  name: string;
  price_per_day: number;
  photo_url: string;
  category?: string;
  item_instances?: any[];
}

export default async function Home() {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  let products: ProductItem[] = [];
  let testimonials: Array<{ id: number; username: string; product_name: string; rating: number; comment: string }> = [];

  // 1. Fetch data dari API
  if (backendUrl) {
    try {
      const res = await fetch(`${backendUrl}/api/products`, {
        cache: "no-store", // Agar data selalu terbaru
      });

      if (res.ok) {
        const jsonResponse = await res.json();
        products = Array.isArray(jsonResponse?.data) ? jsonResponse.data : [];
      }
    } catch (err) {
      console.error("Gagal mengambil data API:", err);
    }
  }

  if (backendUrl) {
    const reviewEndpoints = [
      `${backendUrl}/api/reviews?limit=6&page=1`,
      `${backendUrl}/api/admin/reviews?limit=6&page=1`,
    ];

    for (const endpoint of reviewEndpoints) {
      try {
        const resReview = await fetch(endpoint, { cache: "no-store" });
        if (!resReview.ok) continue;
        const json = await resReview.json();
        const rows = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
        if (rows.length > 0) {
          testimonials = rows;
          break;
        }
      } catch {
        continue;
      }
    }
  }

  // 2. Filter produk berdasarkan kategori (asumsi ada field category di API kamu)
  // Jika tidak ada field category, kamu bisa menyesuaikan logika filternya
  const vehicleUnits = products.filter(p => 
    p.category?.toLowerCase().includes("kendaraan") || p.name.toLowerCase().includes("avanza")
  ).slice(0, 3);

  const electronicUnits = products.filter(p => 
    p.category?.toLowerCase().includes("elektronik") || p.name.toLowerCase().includes("laptop")
  ).slice(0, 3);

  const trustPoints = [
    "Unit siap pakai & terverifikasi",
    "Harga transparan sebelum checkout",
    "Support cepat lewat WhatsApp",
    "Fleksibel untuk personal dan bisnis",
  ];

  const orderSteps = [
    "Pilih unit kendaraan atau elektronik",
    "Konfirmasi durasi dan jadwal",
    "Pembayaran selesai, unit langsung siap",
  ];

  return (
    <main id="beranda" className="relative min-h-screen overflow-x-clip bg-slate-50 text-slate-900">
      {/* Background Decor */}
      <div className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full bg-indigo-200/40 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-[28rem] h-72 w-72 rounded-full bg-cyan-200/40 blur-3xl" />

      {/* Header Tetap Sama */}
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <p className="text-xl font-black tracking-tighter italic uppercase text-slate-900">
            Rental<span className="text-indigo-600">Hub</span>
          </p>
          <nav className="hidden items-center gap-6 text-[10px] font-black uppercase tracking-widest text-slate-500 md:flex">
            <a href="#beranda" className="transition hover:text-indigo-700">Beranda</a>
            <a href="#unit" className="transition hover:text-indigo-700">Unit</a>
            <a href="#cara-sewa" className="transition hover:text-indigo-700">Cara Sewa</a>
          </nav>
          <Link
            href="/login"
            className="rounded-xl bg-indigo-600 px-6 py-2 text-xs font-black uppercase tracking-widest text-white transition hover:bg-indigo-700 shadow-lg shadow-indigo-100"
          >
            Login
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl flex-col justify-center gap-12 px-4 pb-16 pt-14 sm:px-6 lg:grid lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:px-8">
        <div className="space-y-8">
          <p className="inline-flex rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1 text-[10px] font-black uppercase tracking-widest text-indigo-700">
            Premium Rental Service
          </p>
          <h1 className="text-5xl font-black leading-none tracking-tighter sm:text-7xl uppercase italic">
            Sewa Apapun <br /> <span className="text-indigo-600 underline">Tanpa Ribet.</span>
          </h1>
          <p className="max-w-xl text-lg font-medium text-slate-500 italic">
            Solusi praktis untuk kebutuhan kendaraan dan perangkat elektronik profesional dengan jaminan unit prima.
          </p>
          <div className="flex flex-wrap gap-4">
            <a href="#unit" className="rounded-2xl bg-slate-900 px-8 py-4 text-xs font-black uppercase tracking-widest text-white transition hover:bg-indigo-600 shadow-xl">
              Lihat Katalog
            </a>
          </div>
        </div>

        <aside className="rounded-[3rem] border border-white bg-white/50 backdrop-blur-xl p-8 shadow-2xl">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Why Choose Us</p>
          <div className="space-y-4">
            {trustPoints.map((point, index) => (
              <div key={point} className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm border border-slate-50">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-xs font-black text-white">
                  {index + 1}
                </span>
                <p className="text-sm font-bold text-slate-700 italic">{point}</p>
              </div>
            ))}
          </div>
        </aside>
      </section>

      {/* Dinamic Unit Section */}
      <section id="unit" className="scroll-mt-16 mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-4 py-24 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h2 className="text-4xl font-black tracking-tighter uppercase italic">Daftar Unit Populer</h2>
          <p className="mt-3 font-medium text-slate-500 italic">Data diambil langsung secara real-time dari sistem kami.</p>
        </div>

        {products.length === 0 ? (
          <div className="rounded-[3rem] border-2 border-dashed border-slate-200 p-20 text-center">
            <p className="font-black uppercase tracking-widest text-slate-400">Gagal terhubung ke API / Produk Kosong</p>
          </div>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {products.slice(0, 6).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* Cara Sewa Section */}
      <section id="cara-sewa" className="scroll-mt-16 bg-white border-y border-slate-100 py-24">
        <div className="mx-auto w-full max-w-6xl px-4">
          <div className="mb-16 text-center">
            <h2 className="text-4xl font-black tracking-tighter uppercase italic">Cara Sewa</h2>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {orderSteps.map((step, index) => (
              <div key={step} className="group flex flex-col items-center rounded-[2.5rem] bg-slate-50 p-10 text-center transition hover:bg-indigo-600">
                <span className="mb-6 flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-white text-2xl font-black text-slate-900 shadow-xl group-hover:scale-110 transition-all">
                  {index + 1}
                </span>
                <p className="text-lg font-black uppercase tracking-tighter group-hover:text-white transition-colors">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-20">
        <div className="mb-12 text-center">
          <h2 className="text-4xl font-black tracking-tighter uppercase italic">Apa Kata Penyewa</h2>
          <p className="mt-3 font-medium text-slate-500 italic">Ulasan asli dari pengguna yang sudah menyelesaikan transaksi rental.</p>
        </div>
        {testimonials.length === 0 ? (
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 text-center text-slate-400 font-bold uppercase text-sm">Belum ada ulasan terbaru.</div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {testimonials.slice(0, 6).map((review) => (
              <div key={review.id} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">{review.username || "Penyewa"} • {review.product_name || "Produk"}</p>
                <p className="mt-2 text-amber-500 font-black">{Array.from({ length: Number(review.rating || 0) }).map((_, i) => <span key={i}>★</span>)}</p>
                <p className="mt-3 text-sm font-medium text-slate-700 italic">{review.comment || "User tidak menambahkan komentar."}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Footer / CTA */}
      <section className="py-24 px-4">
        <div className="mx-auto max-w-6xl rounded-[3.5rem] bg-slate-900 p-12 text-center text-white shadow-3xl">
          <h2 className="text-3xl font-black uppercase italic md:text-5xl tracking-tighter">Siap Sewa Sekarang?</h2>
          <p className="mt-6 text-slate-400 font-medium italic">Hubungi admin kami untuk respon super cepat di bawah 5 menit.</p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <a href="https://wa.me/6281266591758" className="rounded-2xl bg-indigo-600 px-10 py-4 text-xs font-black uppercase tracking-widest transition hover:bg-white hover:text-slate-900 shadow-xl">
              WhatsApp Admin
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
