"use client";

import { useTransition, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export function PageTransitionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [showLoader, setShowLoader] = useState(false);

  // Show loader when transition is pending
  useEffect(() => {
    if (isPending) {
      setShowLoader(true);
    } else {
      // Hide loader with slight delay for smooth transition
      const timer = setTimeout(() => {
        setShowLoader(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isPending]);

  // Override router.push to use useTransition
  useEffect(() => {
    const originalPush = router.push;
    (router as any).push = function (href: string, options?: any) {
      startTransition(() => {
        originalPush.call(router, href, options);
      });
    };

    return () => {
      router.push = originalPush;
    };
  }, [router, startTransition]);

  return (
    <>
      {children}
      {showLoader && (
        <div className="fixed inset-0 z-[99999] bg-white/50 backdrop-blur-md flex items-center justify-center pointer-events-none animate-fade-in-soft">
          <div className="flex flex-col items-center gap-4">
            {/* Premium dual-ring spinner */}
            <div className="relative w-14 h-14">
              <div className="absolute inset-0 rounded-full border-2 border-slate-200/60" />
              <div
                className="absolute inset-0 rounded-full border-2 border-transparent border-t-indigo-600 border-r-indigo-500"
                style={{
                  animation: "spin 1.2s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite"
                }}
              />
              <div
                className="absolute inset-2 rounded-full border-2 border-transparent border-b-cyan-400"
                style={{
                  animation: "spin-reverse 0.8s linear infinite"
                }}
              />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-700 tracking-wide">Memuat halaman...</p>
              <p className="text-xs text-slate-500 mt-1">Jangan pergi dulu</p>
            </div>
          </div>
        </div>
      )}
      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes spin-reverse {
          from {
            transform: rotate(360deg);
          }
          to {
            transform: rotate(0deg);
          }
        }
      `}</style>
    </>
  );
}
