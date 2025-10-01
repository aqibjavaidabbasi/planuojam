"use client";

import React from "react";
import { FaGoogle } from "react-icons/fa";
import { FaFacebookF } from "react-icons/fa6";
import { useTranslations } from "next-intl";

type Props = {
  onGoogleClick?: () => void;
  onFacebookClick?: () => void;
  className?: string;
};

const SocialAuthButtons: React.FC<Props> = ({ onGoogleClick, onFacebookClick, className }) => {
  const t = useTranslations("Auth.Social");

  return (
    <div className={className ?? "mt-6"}>
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center">
          <span className="px-2 bg-white text-gray-500 text-sm">
            {t("orContinue")}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={onGoogleClick}
          className="w-full inline-flex items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 active:scale-[0.99] transition shadow-sm"
          aria-label={t("google")}
        >
          <FaGoogle className="text-[#DB4437]" />
          <span className="truncate">{t("google")}</span>
        </button>

        <button
          type="button"
          onClick={onFacebookClick}
          className="w-full inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white bg-[#1877F2] hover:bg-[#166FE5] active:scale-[0.99] transition shadow-sm"
          aria-label={t("facebook")}
        >
          <FaFacebookF />
          <span className="truncate">{t("facebook")}</span>
        </button>
      </div>
    </div>
  );
};

export default SocialAuthButtons;
