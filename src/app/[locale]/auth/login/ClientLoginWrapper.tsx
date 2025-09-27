"use client";
import React, { useState } from "react";
import LoginForm from "./LoginForm";
import { Link } from "@/i18n/navigation";
import Modal from "@/components/custom/Modal";
import ForgotPasswordModal from "@/components/modals/ForgotPasswordModal";
import Image from "next/image";
import { getCompleteImageUrl } from "@/utils/helpers";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { useTranslations } from "next-intl";

function ClientLoginWrapper() {
  const [isOpen, setIsOpen] = useState(false);
  const { siteSettings } = useSiteSettings();
  const t = useTranslations("Auth.Login");

  return (
    <div className="w-full max-w-md">
        <div className="text-center mb-4">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-2 overflow-hidden relative">
            <Image
              alt="site logo"
              src={getCompleteImageUrl(siteSettings.siteLogo.url)}
              width={80}
              height={80}
              style={{ objectFit: "cover" }}
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">{t("title")}</h1>
          <p className="text-gray-600 mt-2">{t("subtitle")}</p>
        </div>
      <div className="bg-white rounded-2xl shadow-xl p-6">
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
