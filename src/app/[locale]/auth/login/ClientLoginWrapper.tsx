"use client";
import React, { useState } from "react";
import LoginForm from "./LoginForm";
import { Link, useRouter } from "@/i18n/navigation";
import Modal from "@/components/custom/Modal";
import ForgotPasswordModal from "@/components/modals/ForgotPasswordModal";
import { useTranslations } from "next-intl";
import Logo from "@/components/global/Logo";
import { useSearchParams } from "next/navigation";
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

function ClientLoginWrapper() {
  const [isOpen, setIsOpen] = useState(false);
  const t = useTranslations("Auth.Login");
  const router = useRouter();
  const params = useSearchParams();
  const redirectParam = params.get("redirect");
  const rp = normalizeRedirect(redirectParam);

  return (
    <div className="w-full max-w-md h-full">
        <div className="text-center mb-4">
          <div className="inline-flex items-center justify-center mb-2 overflow-hidden relative">
            <Logo className="w-20 h-20" variant="sm" onClick={() => router.push("/")} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">{t("title")}</h1>
          <p className="text-gray-600 mt-2">{t("subtitle")}</p>
        </div>
      <div className="bg-white rounded-2xl shadow-xl p-6 mb-5">
        <LoginForm setIsOpen={setIsOpen} />

        <div className="text-center mt-4">
          <p className="text-sm text-gray-600">
            {t("noAccount")} {" "}
            <Link
              href={`/auth/register${rp ? `?redirect=${encodeURIComponent(rp)}` : ''}`}
              className={`text-primary font-medium transition-colors ml-2 hover:underline`}
            >
              {t("signUpHere")}
            </Link>
          </p>
        </div>
      </div>
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} >
        <ForgotPasswordModal onClose={() => setIsOpen(false)} />
      </Modal>
    </div>
  );
}

export default ClientLoginWrapper;
