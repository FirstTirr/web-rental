export type RentalStatus =
  | "pending"
  | "approved"
  | "active"
  | "completed"
  | "overdue"
  | "canceled"
  | "expired";

export interface AdminRentalResponse {
  id: number;
  user_id: number;
  username: string;
  item_instance_id: number;
  start_date: string;
  end_date: string;
  actual_return_date?: string | null;
  rental_status: RentalStatus;
  rental_fee: string;
  late_fee: string;
  created_at: string;
  product_name: string;
}

export interface RentalHistoryResponse {
  id: number;
  user_id: number;
  item_instance_id: number;
  start_date: string;
  end_date: string;
  actual_return_date?: string | null;
  rental_status: RentalStatus;
  rental_fee: string;
  late_fee: string;
  created_at: string;
  product_name: string;
  product_photo_url?: string | null;
}

export interface RentalMonthlySummary {
  total_revenue: string;
  total_late_fees: string;
  total_units_rented: number;
  total_transactions: number;
}

type JsonRecord = Record<string, unknown>;

const DEFAULT_HEADERS: HeadersInit = {
  "Content-Type": "application/json",
  "Accept": "application/json",
};

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("token");
}

export function buildAuthHeaders(token?: string | null, extra?: HeadersInit): HeadersInit {
  return {
    ...DEFAULT_HEADERS,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(extra || {}),
  };
}

async function safeJson(response: Response): Promise<JsonRecord> {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) return {};
  try {
    return (await response.json()) as JsonRecord;
  } catch {
    return {};
  }
}

async function requestWithFallback(candidates: Array<{ url: string; init: RequestInit }>) {
  let lastResponse: Response | null = null;
  let lastError: unknown = null;

  for (const candidate of candidates) {
    try {
      const response = await fetch(candidate.url, candidate.init);
      lastResponse = response;

      if (response.ok) {
        return { response, json: await safeJson(response), url: candidate.url };
      }

      if (response.status !== 404 && response.status !== 405) {
        return { response, json: await safeJson(response), url: candidate.url };
      }
    } catch (error) {
      lastError = error;
    }
  }

  if (lastResponse) {
    return { response: lastResponse, json: await safeJson(lastResponse), url: candidates.at(-1)?.url || "" };
  }

  throw lastError instanceof Error ? lastError : new Error("Gagal menghubungi backend");
}

export async function fetchAdminRentals(apiUrl: string, token?: string | null, params?: { status?: string; userId?: number }) {
  const search = new URLSearchParams();
  if (params?.status) search.set("status", params.status);
  if (typeof params?.userId === "number") search.set("user_id", String(params.userId));

  const query = search.toString();
  const basePaths = ["/api/admin/rentals"];

  const candidates = basePaths.map((path) => ({
    url: `${apiUrl}${path}${query ? `?${query}` : ""}`,
    init: { method: "GET", headers: buildAuthHeaders(token) },
  }));

  const result = await requestWithFallback(candidates);
  const rows = Array.isArray(result.json.data) ? result.json.data : Array.isArray(result.json) ? result.json : [];
  const meta = result.json.meta && typeof result.json.meta === "object" ? (result.json.meta as Record<string, unknown>) : null;
  return { rows, meta, response: result.response };
}

export async function fetchRentalReport(apiUrl: string, token?: string | null, params?: { status?: string; userId?: number }) {
  const search = new URLSearchParams();
  if (params?.status) search.set("status", params.status);
  if (typeof params?.userId === "number") search.set("user_id", String(params.userId));

  const query = search.toString();
  const basePaths = ["/api/admin/rentals/report"];
  const candidates = basePaths.map((path) => ({
    url: `${apiUrl}${path}${query ? `?${query}` : ""}`,
    init: { method: "GET", headers: buildAuthHeaders(token) },
  }));

  const result = await requestWithFallback(candidates);
  const summary = result.json.summary && typeof result.json.summary === "object" ? result.json.summary as JsonRecord : null;
  const rows = Array.isArray(result.json.data) ? result.json.data : [];
  const meta = result.json.meta && typeof result.json.meta === "object" ? (result.json.meta as Record<string, unknown>) : null;
  return { summary, rows, meta, response: result.response };
}

export async function fetchMyRentalHistory(apiUrl: string, token?: string | null, params?: { page?: number; limit?: number }) {
  const search = new URLSearchParams();
  if (typeof params?.page === "number") search.set("page", String(params.page));
  if (typeof params?.limit === "number") search.set("limit", String(params.limit));

  const query = search.toString();
  const basePaths = ["/api/rentals"];
  const candidates = basePaths.map((path) => ({
    url: `${apiUrl}${path}${query ? `?${query}` : ""}`,
    init: { method: "GET", headers: buildAuthHeaders(token) },
  }));

  const result = await requestWithFallback(candidates);
  const rows = Array.isArray(result.json.data) ? result.json.data : Array.isArray(result.json) ? result.json : [];
  const meta = result.json.meta && typeof result.json.meta === "object" ? (result.json.meta as Record<string, unknown>) : null;
  return { rows, meta, response: result.response };
}

async function mutateRentalStatus(apiUrl: string, token: string | null, path: string, body?: Record<string, unknown>) {
  const response = await fetch(`${apiUrl}${path}`, {
    method: "PUT",
    headers: buildAuthHeaders(token),
    body: body ? JSON.stringify(body) : undefined,
  });

  return { response, json: await safeJson(response), url: `${apiUrl}${path}` };
}

export async function approveRental(apiUrl: string, token: string | null, rentalId: number) {
  return mutateRentalStatus(apiUrl, token, `/api/admin/rentals/${rentalId}/approve`);
}

export async function rejectRental(apiUrl: string, token: string | null, rentalId: number) {
  return mutateRentalStatus(apiUrl, token, `/api/admin/rentals/${rentalId}/reject`);
}

export async function activateRental(apiUrl: string, token: string | null, rentalId: number) {
  return mutateRentalStatus(apiUrl, token, `/api/admin/rentals/${rentalId}/activate`);
}

export async function returnRental(apiUrl: string, token: string | null, rentalId: number, actualReturnDate: string) {
  return mutateRentalStatus(apiUrl, token, `/api/admin/rentals/${rentalId}/return`, { actual_return_date: actualReturnDate });
}

export async function cancelRental(apiUrl: string, token: string | null, rentalId: number) {
  return mutateRentalStatus(apiUrl, token, `/api/rentals/${rentalId}/cancel`);
}

export function formatIdr(value: string | number | null | undefined) {
  const numeric = typeof value === "string" ? Number(value) : value ?? 0;
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number.isFinite(numeric as number) ? Number(numeric) : 0);
}

export function formatDate(value: string | Date | null | undefined) {
  if (!value) return "-";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function getRentalDurationDays(startDate: string | Date, endDate: string | Date) {
  const start = startDate instanceof Date ? startDate : new Date(startDate);
  const end = endDate instanceof Date ? endDate : new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 1;
  const diff = end.getTime() - start.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return Math.max(days, 1);
}

export function rentalStatusLabel(status: string) {
  const normalized = status.toLowerCase();
  if (normalized === "approved") return { label: "Disetujui", className: "bg-emerald-100 text-emerald-700" };
  if (normalized === "active") return { label: "Aktif", className: "bg-blue-100 text-blue-700" };
  if (normalized === "completed") return { label: "Selesai tepat waktu", className: "bg-slate-100 text-slate-700" };
  if (normalized === "overdue") return { label: "Selesai Terlambat", className: "bg-rose-100 text-rose-700" };
  if (normalized === "canceled") return { label: "Ditolak", className: "bg-rose-100 text-rose-700" };
  if (normalized === "expired") return { label: "Expired", className: "bg-amber-100 text-amber-700" };
  return { label: "Pending", className: "bg-indigo-100 text-indigo-700" };
}
