"use client";

import React, { useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";
import { fetchUser } from "@/services/auth";
import { useAppDispatch } from "@/store/hooks";
import { setUser } from "@/store/slices/authSlice";

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
        if (error) {
          console.error("Social login error:", error);
          toast.error(t("loginFailed"));
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

        // Navigate similarly to email/password flow
        if (user?.serviceType === null) {
          router.replace(`/profile?tab=bookings`);
        } else {
          router.replace(`/profile?tab=my-listings`);
        }
        toast.success(t("loggedIn"));
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
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="text-sm text-gray-600">{t("loggingIn")}</div>
    </div>
  );
}
