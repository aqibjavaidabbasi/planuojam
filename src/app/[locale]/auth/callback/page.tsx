"use client";

import React, { useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";
import { fetchUser } from "@/services/auth";
import { useAppDispatch } from "@/store/hooks";
import { setUser } from "@/store/slices/authSlice";
import { SUPPORTED_LOCALES } from "@/config/i18n";

function normalizeRedirect(p: string | null): string | null {
  if (!p || typeof p !== 'string') return null;
  if (!p.startsWith('/')) return null;
  for (const loc of SUPPORTED_LOCALES) {
    if (p === `/${loc}`) return '/';
    if (p.startsWith(`/${loc}/`)) return p.slice(loc.length + 1);
  }
  return p;
}

function getTokenFromHashOrQuery(): string | null {
  if (typeof window === "undefined") return null;
  // Some providers may return token in hash (e.g., #access_token=...)
  const hash = window.location.hash || "";
  if (hash.startsWith("#")) {
    const hashParams = new URLSearchParams(hash.slice(1));
    const hashToken = hashParams.get("access_token") || hashParams.get("jwt");
    if (hashToken) return hashToken;
  }
  return null;
}

function getErrorFromHashOrQuery(): string | null {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash || "";
  if (hash.startsWith("#")) {
    const hashParams = new URLSearchParams(hash.slice(1));
    const hashError = hashParams.get("error") || hashParams.get("errorMessage");
    if (hashError) return hashError;
  }
  return null;
}

export default function AuthCallbackPage() {
  const params = useSearchParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const t = useTranslations("Auth.Login");

  const { jwt, error } = useMemo(() => {
    const err = params.get("error") || params.get("errorMessage") || undefined;
    const tokenFromQuery = params.get("access_token") || params.get("jwt") || undefined;
    return { jwt: tokenFromQuery, error: err } as { jwt?: string; error?: string };
  }, [params]);

  useEffect(() => {
    async function handleCallback() {
      try {
        const errorFromHash = getErrorFromHashOrQuery();
        const effectiveError = error || errorFromHash || undefined;
        if (effectiveError) {
          console.error("Social login error:", effectiveError);
          const code = (effectiveError || "").toUpperCase();
          switch (code) {
            case "EMAIL_REQUIRED":
              toast.error(t("socialEmailRequired"));
              break;
            case "USER_NOT_FOUND":
              toast.error(t("socialUserNotFound"));
              break;
            case "INTERNAL_ERROR":
              toast.error(t("socialInternalError"));
              break;
            default:
              toast.error(t("loginFailed"));
          }
          router.replace(`/auth/login`);
          return;
        }

        let token = jwt || getTokenFromHashOrQuery();
        if (!token) {
          // As a fallback, try reading from typical param names used by Strapi
          const tkn = params.get("token") || params.get("accessToken");
          token = tkn || null;
        }
        if (!token) {
          toast.error(t("loginFailed"));
          router.replace(`/auth/login`);
          return;
        }

        // Persist token
        localStorage.setItem("token", token);
        // Fetch user profile
        const user = await fetchUser(token);
        dispatch(setUser(user));

        const rawRedirect = params.get("redirect") || (typeof window !== "undefined" ? (sessionStorage.getItem('postAuthRedirect') || null) : null);
        const rp = normalizeRedirect(rawRedirect);
        if (rp) {
          try { if (typeof window !== 'undefined') sessionStorage.removeItem('postAuthRedirect'); } catch {}
          router.replace(rp);
        } else {
          if (user?.serviceType === null) {
            router.replace(`/profile?tab=bookings`);
          } else {
            router.replace(`/profile?tab=my-listings`);
          }
        }
      } catch (e) {
        console.error(e);
        toast.error(t("loginFailed"));
        router.replace(`/auth/login`);
      }
    }

    handleCallback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="h-screen w-screen flex items-center justify-center" style={{background: "linear-gradient(135deg, #000 0%, #1a1a1a 50%, #000 100%)",}} >
      <div className="text-xl text-primary font-bold tracking-wider" style={{animation: "textGlow 3s ease-in-out infinite alternate",textShadow: "0 0 20px rgba(204, 146, 47, 0.5)"}} >{t("loggingIn")}</div>
    </div>
  );
}
