import Link from "next/link";

const vehicleUnits = [
  { name: "Toyota Avanza", detail: "7 Seat • Manual/Automatic", price: "Rp350.000/hari" },
  { name: "Honda Brio", detail: "5 Seat • Automatic", price: "Rp300.000/hari" },
  { name: "Innova Reborn", detail: "7 Seat • Manual/Automatic", price: "Rp500.000/hari" },
];

const electronicUnits = [
  { name: "Laptop Core i5", detail: "8GB RAM • SSD 512GB", price: "Rp180.000/hari" },
  { name: "Kamera Mirrorless", detail: "24MP • Kit Lens", price: "Rp220.000/hari" },
  { name: "Proyektor Meeting", detail: "Full HD • 4000 Lumens", price: "Rp150.000/hari" },
];

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

type UnitCardProps = {
  name: string;
  detail: string;
  price: string;
  accent: string;
};

function UnitCard({ name, detail, price, accent }: UnitCardProps) {
  return (
    <article className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className={`mb-4 h-1 w-14 rounded-full ${accent}`} />
      <h3 className="text-base font-semibold tracking-tight text-slate-900">{name}</h3>
      <p className="mt-1 text-sm text-slate-600">{detail}</p>
      <p className="mt-4 text-sm font-semibold text-slate-900">{price}</p>
    </article>
  );
}

export default function Home() {
  return (
    <main id="beranda" className="relative min-h-screen overflow-x-clip bg-slate-50 text-slate-900">
      <div className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full bg-indigo-200/40 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-[28rem] h-72 w-72 rounded-full bg-cyan-200/40 blur-3xl" />

      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <p className="text-lg font-semibold tracking-tight text-slate-900">RentalHub</p>
          <nav className="hidden items-center gap-6 text-sm text-slate-600 md:flex">
            <a href="#beranda" className="transition hover:text-indigo-700">Beranda</a>
            <a href="#kategori" className="transition hover:text-indigo-700">Kategori</a>
            <a href="#unit" className="transition hover:text-indigo-700">Unit</a>
            <a href="#cara-sewa" className="transition hover:text-indigo-700">Cara Sewa</a>
          </nav>
          <Link
            href="/login"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
          >
            Login
          </Link>
        </div>
      </header>

      <section className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl flex-col justify-center gap-8 px-4 pb-16 pt-14 sm:px-6 lg:grid lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:px-8 lg:pb-24 lg:pt-20">
        <div className="space-y-6">
          <p className="inline-flex rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-700">
            Rental Kendaraan & Elektronik
          </p>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Lorem ipsum dolor sit amet, consectetur adipisicing elit. Rem, quo?
          </h1>
          <p className="max-w-xl text-slate-600">
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Ipsum nemo asperiores quisquam eligendi necessitatibus quam minus numquam tenetur facere. Facere?
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="#unit"
              className="rounded-lg bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700"
            >
              Lihat Semua Unit
            </a>
            <a
              href="#cara-sewa"
              className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-900 transition hover:border-indigo-300 hover:text-indigo-700"
            >
              Cara Pemesanan
            </a>
          </div>
        </div>

        <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">Highlights</p>
          <div className="mt-4 space-y-3">
            {trustPoints.map((point, index) => (
              <div key={point} className="flex items-start gap-3 rounded-xl bg-slate-50 px-3 py-3">
                <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-[11px] font-semibold text-indigo-700">
                  {index + 1}
                </span>
                <p className="text-sm text-slate-700">{point}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 p-4 text-white">
            <p className="text-xs uppercase tracking-wider text-indigo-100">Respon Admin</p>
            <p className="mt-1 text-lg font-semibold">&lt; 5 Menit di Jam Operasional</p>
          </div>
        </aside>
      </section>

      <section id="kategori" className="scroll-mt-16 flex min-h-screen w-full flex-col justify-center border-y border-slate-200 bg-white/70 px-4 py-14 backdrop-blur-sm sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-6xl">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold tracking-tight">Kategori Layanan</h2>
            <p className="mt-3 text-slate-600">Pilih tipe unit yang kamu butuhkan hari ini.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <article className="flex flex-col justify-center rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-10 text-center shadow-sm">
              <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-indigo-700">Kategori 01</p>
              <h2 className="text-2xl font-bold tracking-tight">Kendaraan</h2>
              <p className="mx-auto mt-4 max-w-sm text-slate-600">
                Untuk perjalanan dinas, antar jemput tamu, liburan keluarga hingga kebutuhan operasional harian.
              </p>
            </article>
            <article className="flex flex-col justify-center rounded-3xl border border-cyan-100 bg-gradient-to-br from-cyan-50 to-white p-10 text-center shadow-sm">
              <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-cyan-700">Kategori 02</p>
              <h2 className="text-2xl font-bold tracking-tight">Perangkat Elektronik</h2>
              <p className="mx-auto mt-4 max-w-sm text-slate-600">
                Peralatan profesional untuk meeting, workshop, produksi konten, dan kebutuhan event.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section id="unit" className="scroll-mt-16 mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-4 py-14 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold tracking-tight">Daftar Unit Populer</h2>
          <p className="mt-3 text-slate-600">Beberapa opsi yang sering dipesan pelanggan kami.</p>
        </div>
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-semibold tracking-tight">Unit Kendaraan</h2>
              <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">Top Pick</span>
            </div>
            <div className="grid gap-4">
              {vehicleUnits.map((unit) => (
                <UnitCard
                  key={unit.name}
                  name={unit.name}
                  detail={unit.detail}
                  price={unit.price}
                  accent="bg-indigo-500"
                />
              ))}
            </div>
          </div>

          <div>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-semibold tracking-tight">Unit Elektronik</h2>
              <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-700">Top Pick</span>
            </div>
            <div className="grid gap-4">
              {electronicUnits.map((unit) => (
                <UnitCard
                  key={unit.name}
                  name={unit.name}
                  detail={unit.detail}
                  price={unit.price}
                  accent="bg-cyan-500"
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="cara-sewa" className="scroll-mt-16 flex min-h-[70vh] w-full flex-col justify-center border-y border-slate-200 bg-white px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-6xl">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold tracking-tight">Cara Sewa</h2>
            <p className="mt-3 text-slate-600">Alur sederhana agar unit cepat sampai di tanganmu.</p>
          </div>
          <ol className="grid gap-6 md:grid-cols-3">
            {orderSteps.map((step, index) => (
              <li key={step} className="flex flex-col items-center rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center shadow-sm">
                <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 font-bold text-white shadow-md">
                  {index + 1}
                </span>
                <p className="text-lg font-semibold text-slate-900">{step}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="kontak" className="scroll-mt-16 flex min-h-[50vh] w-full flex-col justify-center px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-6xl">
          <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 px-6 py-14 text-center text-white sm:px-10 shadow-lg">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Butuh unit hari ini?</h2>
            <p className="mx-auto mt-4 max-w-2xl text-slate-200">
              Tim kami siap membantu merekomendasikan unit kosong dan memberikan harga terbaik untuk kebutuhanmu.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <a
                href="https://wa.me/6281234567890"
                className="rounded-full bg-white px-8 py-3 text-sm font-bold text-slate-900 transition hover:bg-slate-200"
              >
                Chat WhatsApp
              </a>
              <a
                href="tel:+6281234567890"
                className="rounded-full border-2 border-indigo-300/40 px-8 py-3 text-sm font-bold text-white transition hover:bg-white/10"
              >
                Telepon Admin
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
