"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RatingUI({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return alert("Pilih bintang terlebih dahulu!");
    
    setIsSubmitting(true);
    // Logika kirim ke API simulasi
    setTimeout(() => {
      alert("Terima kasih atas rating Anda!");
      setIsSubmitting(false);
      router.push("/user/orders");
    }, 1500);
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-x-clip bg-slate-50 px-4 py-12 text-slate-900">
      {/* Background Ornaments (Senada dengan Login UI) */}
      <div className="pointer-events-none absolute -left-20 top-0 h-96 w-96 rounded-full bg-indigo-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-cyan-200/40 blur-3xl" />

      <div className="relative w-full max-w-md space-y-8 rounded-[2.5rem] border border-white/50 bg-white/80 p-8 shadow-2xl backdrop-blur-xl sm:p-12">
        <div className="text-center">
          <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase leading-tight italic">
            Beri <span className="text-indigo-600">Rating</span>
          </h2>
          <p className="mt-2 text-sm font-medium text-slate-500 italic">Pengalaman Anda sangat berarti bagi kami</p>
          <p className="mt-1 text-[10px] font-black text-indigo-500 uppercase tracking-widest leading-none">ORDER ID: #{orderId}</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-10 space-y-8">
          {/* Star Selection */}
          <div className="flex flex-col items-center gap-4">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Pilih Bintang</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHover(star)}
                  onMouseLeave={() => setHover(0)}
                  className="transition-transform active:scale-90"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className={`h-10 w-10 transition-colors ${
                      star <= (hover || rating) ? "text-yellow-400" : "text-slate-200"
                    }`}
                  >
                    <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                  </svg>
                </button>
              ))}
            </div>
          </div>

          {/* Comment Input */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 mb-2">
              Komentar (Opsional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Ceritakan pengalaman Anda menyewa unit ini..."
              rows={4}
              className="block w-full rounded-2xl border border-slate-100 bg-slate-50/50 p-5 text-sm font-bold transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 italic"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 rounded-2xl border border-slate-200 py-4 text-xs font-black uppercase tracking-widest text-slate-500 transition hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || rating === 0}
              className="flex-[2] rounded-2xl bg-indigo-600 py-4 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-indigo-200 transition-all hover:bg-indigo-700 hover:-translate-y-1 active:translate-y-0 disabled:opacity-50"
            >
              {isSubmitting ? "Mengirim..." : "Kirim Rating"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}