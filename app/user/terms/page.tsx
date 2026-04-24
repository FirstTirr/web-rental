import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <Link href="/user" className="animate-fade-up mb-6 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition">
        &larr; Kembali
      </Link>
      
      <div className="animate-fade-up-delay rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-12 prose prose-slate max-w-none prose-h2:text-indigo-700 prose-a:text-indigo-600">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl mb-8">Syarat dan Ketentuan RentalHub</h1>
        
        <h2>1. Persyaratan Peminjaman</h2>
        <p>Setiap pelanggan wajib menyerahkan identitas asli (E-KTP/Paspor/SIM yang masih berlaku) pada saat pengambilan unit. Untuk penyewaan kendaraan, wajib melampirkan SIM A/C yang sesuai.</p>
        
        <h2>2. Sistem Tarif dan Diskon</h2>
        <ul>
          <li>Tarif sewa dihitung per 24 jam penuh untuk setiap unit.</li>
          <li>Keterlambatan pengembalian unit (lebih dari 2 jam) akan dikenakan biaya over-time (OT) sebesar 10% per jam dari harga dasar sewa.</li>
        </ul>
        <p><strong>Diskon Durasi:</strong> Nikmati potongan harga otomatis jika sewa jangka panjang.</p>
        <table>
          <thead>
            <tr><th>Lama Sewa</th><th>Potongan</th></tr>
          </thead>
          <tbody>
            <tr><td>1 Minggu (7-13 hari)</td><td>3%</td></tr>
            <tr><td>2 Minggu (14-20 hari)</td><td>5%</td></tr>
            <tr><td>3 Minggu (21-29 hari)</td><td>7%</td></tr>
            <tr><td>1 Bulan (30+ hari)</td><td>15%</td></tr>
          </tbody>
        </table>
        
        <h2>3. Kerusakan & Kehilangan</h2>
        <p>Unit yang rusak atau hilang selama durasi peminjaman menjadi tanggung jawab penuh penyewa, dan biaya perbaikan/penggantian akan dibebankan sesuai nota perbaikan resmi (berlaku asuransi jika ada tambahan asuransi).</p>
      </div>
    </main>
  );
}