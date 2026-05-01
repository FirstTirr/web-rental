"use client";

import { useEffect, useState, useCallback } from "react";
import { 
  deleteMyReview, 
  fetchMyReviews, 
  formatDate, 
  getAuthToken, 
  updateMyReview, 
  type UserReviewRow 
} from "../../lib/rental-api";

export function MyReviewsView() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const [reviews, setReviews] = useState<UserReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<UserReviewRow | null>(null);
  const [draftRating, setDraftRating] = useState(0);
  const [draftComment, setDraftComment] = useState("");
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!API_URL) return;
    
    const token = getAuthToken();
    if (!token) {
      setError("Silakan login untuk melihat ulasan Anda.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { rows } = await fetchMyReviews(API_URL, token, { page: 1, limit: 50 });
      setReviews(rows);
    } catch (err) {
      console.error("Fetch Error:", err);
      setError("Gagal memuat ulasan pribadi.");
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    void load();
  }, [load]);

  const openEdit = (review: UserReviewRow) => {
    setEditing(review);
    setDraftRating(Number(review.rating || 0));
    setDraftComment(review.comment || "");
  };

  const submitEdit = async () => {
    if (!editing || !API_URL) return;
    if (draftRating < 1 || draftRating > 5) return alert("Rating harus 1-5.");
    
    setActionLoading(editing.id);
    try {
      const token = getAuthToken();
      const result = await updateMyReview(API_URL, token, editing.id, {
        rating: draftRating,
        comment: draftComment,
      });

      if (!result.response.ok) {
        throw new Error((result.json?.error as string) || "Gagal update.");
      }
      
      setEditing(null);
      await load();
    } catch (e: any) {
      alert(e?.message || "Gagal update ulasan.");
    } finally {
      setActionLoading(null);
    }
  };

  const removeReview = async (reviewId: number) => {
    if (!API_URL) return;
    if (!confirm("Hapus ulasan ini secara permanen?")) return;
    
    setActionLoading(reviewId);
    try {
      const token = getAuthToken();
      const result = await deleteMyReview(API_URL, token, reviewId);
      
      if (!result.response.ok) {
        throw new Error((result.json?.error as string) || "Gagal menghapus.");
      }
      await load();
    } catch (e: any) {
      alert(e?.message || "Gagal menghapus ulasan.");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <section className="pt-8 pb-20 px-4 sm:px-0">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl italic uppercase">Ulasan Saya</h1>
        <p className="mt-2 text-slate-600 font-medium">Riwayat rating dan komentar yang sudah Anda berikan.</p>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-24 text-center bg-white rounded-3xl border border-slate-100 shadow-sm text-slate-400 font-bold uppercase tracking-widest animate-pulse">
          Memuat Data...
        </div>
      ) : reviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[3rem] border-2 border-dashed border-slate-100 text-slate-400 text-center">
          <p className="text-lg font-black uppercase tracking-tighter italic">Belum ada ulasan yang ditemukan</p>
          <p className="text-xs font-medium mt-1">Ulasan Anda akan muncul setelah Anda memberikan rating pada pesanan.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-xl shadow-slate-50 transition-hover hover:shadow-indigo-50/50">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-lg font-black text-slate-900 tracking-tight">{review.product_name}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">{formatDate(review.created_at)}</p>
                </div>
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={i < Number(review.rating) ? "text-amber-400" : "text-slate-200"}>★</span>
                  ))}
                </div>
              </div>
              <p className="mt-4 text-sm text-slate-700 leading-relaxed font-medium bg-slate-50/50 p-4 rounded-2xl border border-slate-50">
                {review.comment || <span className="italic text-slate-400">Tidak ada komentar.</span>}
              </p>
              <div className="mt-5 flex gap-3">
                <button 
                  onClick={() => openEdit(review)} 
                  disabled={!!actionLoading}
                  className="rounded-xl border border-indigo-100 bg-indigo-50/50 px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-indigo-700 hover:bg-indigo-100 transition-colors disabled:opacity-50"
                >
                  Edit Review
                </button>
                <button 
                  onClick={() => removeReview(review.id)} 
                  disabled={!!actionLoading}
                  className="rounded-xl border border-rose-100 bg-rose-50/50 px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-rose-700 hover:bg-rose-100 transition-colors disabled:opacity-50"
                >
                  {actionLoading === review.id ? "..." : "Hapus"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL EDIT */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="w-full max-w-md rounded-[2.5rem] bg-white p-8 shadow-2xl">
            <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase italic">Update Ulasan</h3>
            <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">{editing.product_name}</p>

            <div className="mt-8">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Beri Rating Baru</p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button 
                    key={star} 
                    type="button" 
                    onClick={() => setDraftRating(star)} 
                    className={`text-3xl transition-transform active:scale-90 ${star <= draftRating ? "text-amber-400" : "text-slate-200"}`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Tulis Komentar</p>
              <textarea 
                value={draftComment} 
                onChange={(e) => setDraftComment(e.target.value)} 
                rows={4} 
                placeholder="Apa pendapatmu sekarang?"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all" 
              />
            </div>

            <div className="mt-8 flex gap-3">
              <button 
                onClick={() => setEditing(null)} 
                className="flex-1 rounded-2xl border border-slate-200 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50"
              >
                Batal
              </button>
              <button 
                onClick={submitEdit} 
                disabled={!!actionLoading} 
                className="flex-1 rounded-2xl bg-slate-900 py-4 text-[10px] font-black uppercase tracking-widest text-white hover:bg-emerald-600 transition-all disabled:opacity-50 shadow-lg shadow-slate-200"
              >
                {actionLoading === editing.id ? "Proses..." : "Update Sekarang"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}