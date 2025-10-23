"use client";
import React, { useState } from "react";
import LoginForm from "./LoginForm";
import { Link, useRouter } from "@/i18n/navigation";
import Modal from "@/components/custom/Modal";
import ForgotPasswordModal from "@/components/modals/ForgotPasswordModal";
import { useTranslations } from "next-intl";
import Logo from "@/components/global/Logo";

function ClientLoginWrapper() {
  const [isOpen, setIsOpen] = useState(false);
  const t = useTranslations("Auth.Login");
  const router = useRouter();

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
              href={`/auth/register`}
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
