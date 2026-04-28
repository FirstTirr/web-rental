"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { OrdersView } from "../../../components/user/orders-view";

const MapPicker = dynamic(() => import("../../../components/map-picker"), {
  ssr: false,
  loading: () => (
    <div className="h-[200px] w-full rounded-xl bg-slate-100 flex items-center justify-center text-sm font-medium text-slate-500 border border-slate-200">
      Memuat Peta Interaktif...
    </div>
  ),
});

type ProfileData = {
  username: string;
  email: string;
  address: string;
  phone_number: string;
  role: string;
  created_at: string;
};

type ApiResult = {
  data?: {
    username?: string;
    email?: string;
    phone_number?: string;
    address?: string;
    role?: string;
    created_at?: string;
  };
  message?: string;
  error?: string;
};

const defaultProfile: ProfileData = {
  username: "",
  email: "",
  address: "",
  phone_number: "",
  role: "",
  created_at: "",
};

const PROFILE_ENDPOINT_CANDIDATES = [
  "/api/users/profile",
  "/api/users/profile",
  "/api/users/profile",
  "/api/users/me",
];

async function parseApiResult(response: Response): Promise<ApiResult> {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return (await response.json()) as ApiResult;
  }

  const rawText = await response.text();
  return {
    error: rawText?.trim() || `Request gagal dengan status ${response.status}`,
  };
}

async function requestWithEndpointFallback(
  apiUrl: string,
  method: "GET" | "PUT",
  token: string,
  body?: unknown,
  preferredEndpoint?: string,
): Promise<{ response: Response; result: ApiResult; endpoint: string }> {
  const endpoints = preferredEndpoint
    ? [preferredEndpoint, ...PROFILE_ENDPOINT_CANDIDATES.filter((candidate) => candidate !== preferredEndpoint)]
    : PROFILE_ENDPOINT_CANDIDATES;

  let lastResponse: Response | null = null;
  let lastResult: ApiResult = { error: "Endpoint profile tidak ditemukan." };
  let lastEndpoint = endpoints[0] || "/api/users/profile";

  for (const endpoint of endpoints) {
    const response = await fetch(`${apiUrl}${endpoint}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });

    const result = await parseApiResult(response);
    lastResponse = response;
    lastResult = result;
    lastEndpoint = endpoint;

    if (response.status !== 404) {
      return { response, result, endpoint };
    }
  }

  if (lastResponse) {
    return { response: lastResponse, result: lastResult, endpoint: lastEndpoint };
  }

  throw new Error("Tidak dapat menghubungi endpoint profile.");
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData>(defaultProfile);
  const resolvedEndpointRef = useRef<string>(PROFILE_ENDPOINT_CANDIDATES[0]);
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const [loading, setLoading] = useState(Boolean(API_URL));
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const configError = API_URL ? "" : "Konfigurasi NEXT_PUBLIC_API_URL belum tersedia.";

  useEffect(() => {
    const fetchProfile = async () => {
      const apiUrl = API_URL;
      if (!apiUrl) return;

      try {
        setErrorMessage("");
        setLoading(true);

        const token = localStorage.getItem("token");
        if (!token) {
          setErrorMessage("Sesi tidak ditemukan, silakan login ulang.");
          router.push("/login");
          return;
        }

        const { response, result, endpoint } = await requestWithEndpointFallback(
          apiUrl,
          "GET",
          token,
          undefined,
          resolvedEndpointRef.current,
        );
        if (!response.ok) {
          throw new Error(result?.error || "Gagal mengambil profil user.");
        }

        resolvedEndpointRef.current = endpoint;

        const data = result?.data || {};
        setProfile({
          username: data.username || "",
          email: data.email || "",
          phone_number: data.phone_number || "",
          address: data.address || "",
          role: data.role || "",
          created_at: data.created_at || "",
        });
      } catch (error: unknown) {
        setErrorMessage(error instanceof Error ? error.message : "Gagal menyambung ke server.");
      } finally {
        setLoading(false);
      }
    };

    if (!API_URL) return;
    fetchProfile();
  }, [API_URL, router]);

  const handleChange = (key: keyof ProfileData, value: string) => {
    setSavedMessage("");
    setErrorMessage("");
    setProfile((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    const apiUrl = API_URL;
    if (!apiUrl) {
      setErrorMessage("Konfigurasi NEXT_PUBLIC_API_URL belum tersedia.");
      return;
    }

    try {
      setSaving(true);
      setSavedMessage("");
      setErrorMessage("");

      const token = localStorage.getItem("token");
      if (!token) {
        setErrorMessage("Sesi tidak ditemukan, silakan login ulang.");
        router.push("/login");
        return;
      }

      const { response, result, endpoint } = await requestWithEndpointFallback(
        apiUrl,
        "PUT",
        token,
        {
          username: profile.username,
          phone_number: profile.phone_number,
          address: profile.address,
        },
        resolvedEndpointRef.current,
      );
      if (!response.ok) {
        throw new Error(result?.error || "Gagal memperbarui profil user.");
      }

      resolvedEndpointRef.current = endpoint;

      const data = result?.data || {};
      setProfile((prev) => ({
        ...prev,
        username: data.username || prev.username,
        email: data.email || prev.email,
        phone_number: data.phone_number || "",
        address: data.address || "",
        role: data.role || prev.role,
        created_at: data.created_at || prev.created_at,
      }));
      setSavedMessage(result?.message || "Profil berhasil diperbarui.");
      setTimeout(() => setSavedMessage(""), 1800);
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : "Gagal menyambung ke server.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 pb-20">
      <section className="animate-fade-up rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Profil Saya
            </h1>
            <p className="mt-2 text-slate-600">
              Simpan alamat utama untuk mempercepat proses pemesanan.
            </p>
          </div>
          <Link
            href="/user/product"
            className="btn-soft focus-ring-soft inline-flex items-center justify-center rounded-xl bg-indigo-50 px-4 py-2.5 text-sm font-bold text-indigo-700 shadow-sm transition hover:bg-indigo-100 hover:text-indigo-800"
          >
            Lihat Katalog
          </Link>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-500 font-semibold">Memuat profil...</div>
        ) : (
          <div className="space-y-4 max-w-3xl">
            <div>
              <label
                htmlFor="username"
                className="mb-1.5 block text-sm font-semibold text-slate-700"
              >
                Username
              </label>
              <input
                id="username"
                type="text"
                value={profile.username}
                onChange={(e) => handleChange("username", e.target.value)}
                placeholder="Masukkan username"
                className="focus-ring-soft w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
                minLength={3}
                maxLength={50}
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-semibold text-slate-700"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={profile.email}
                readOnly
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500 outline-none"
              />
            </div>

          {/* Nomor Telepon */}
          <div>
            <label
              htmlFor="phone"
              className="mb-1.5 block text-sm font-semibold text-slate-700"
            >
              Nomor Telepon
            </label>
            <div className="flex rounded-xl border border-slate-200 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-indigo-300 focus-within:border-indigo-400 transition">
              <span className="flex items-center px-3 bg-slate-50 border-r border-slate-200 text-sm font-medium text-slate-500 select-none">
                +62
              </span>
              <input
                id="phone"
                type="tel"
                value={profile.phone_number}
                onChange={(e) => {
                  // Hanya angka
                  const val = e.target.value.replace(/\D/g, "");
                  handleChange("phone_number", val);
                }}
                placeholder="812-3456-7890"
                className="w-full px-4 py-3 text-sm text-slate-900 outline-none bg-white"
                inputMode="numeric"
                maxLength={14}
              />
            </div>
          </div>

          {/* Alamat */}
          <div>
            <label
              htmlFor="address"
              className="mb-1.5 block text-sm font-semibold text-slate-700"
            >
              Alamat Utama
            </label>
            <textarea
              id="address"
              rows={3}
              value={profile.address}
              onChange={(e) => handleChange("address", e.target.value)}
              placeholder="Isi alamat atau pilih titik di peta..."
              className="focus-ring-soft w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
            />
          </div>

          <MapPicker
            addressValue={profile.address}
            onAddressPicked={(addr) => handleChange("address", addr)}
          />
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            onClick={handleSave}
            disabled={loading || saving}
            className="btn-soft focus-ring-soft rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-indigo-700"
          >
            {saving ? "Menyimpan..." : "Simpan Profil"}
          </button>
          {savedMessage && (
            <span className="text-sm font-semibold text-green-600">
              {savedMessage}
            </span>
          )}
          {errorMessage && (
            <span className="text-sm font-semibold text-rose-600">
              {errorMessage}
            </span>
          )}
          {configError && !errorMessage && (
            <span className="text-sm font-semibold text-rose-600">
              {configError}
            </span>
          )}
        </div>
      </section>

      <section id="pesanan" className="mt-10 scroll-mt-24">
        <OrdersView embedded />
      </section>
    </main>
  );
}