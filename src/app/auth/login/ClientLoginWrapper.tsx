"use client";
import React, { useState } from "react";
import LoginForm from "./LoginForm";
import Link from "next/link";
import Modal from "@/components/custom/Modal";
import ForgotPasswordModal from "@/components/global/ForgotPasswordModal";
import Image from "next/image";
import { getCompleteImageUrl } from "@/utils/helpers";
import { useSiteSettings } from "@/context/SiteSettingsContext";

function ClientLoginWrapper() {
  const [isOpen, setIsOpen] = useState(false);
  const { siteSettings } = useSiteSettings();
  return (
    <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-4 overflow-hidden relative">
            <Image
              alt="site logo"
              src={getCompleteImageUrl(siteSettings.siteLogo.url)}
              width={80}
              height={80}
              style={{ objectFit: "cover" }}
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Welcome Back</h1>
          <p className="text-gray-600 mt-2">Sign in to your account</p>
        </div>
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <LoginForm setIsOpen={setIsOpen} />

        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Don't have an account?
            {/* 
          Links (<Link> or <a>) cannot be truly disabled in HTML. 
          You can simulate a disabled state by preventing navigation and styling it as disabled.
          Example below disables the link when isSubmitting is true.
        */}
            <Link
              href="/auth/register"
              className={`text-primary font-medium transition-colors ml-2 hover:underline`}
            >
              Sign up here
            </Link>
          </p>
        </div>
      </div>
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <ForgotPasswordModal onClose={() => setIsOpen(false)} />
      </Modal>
    </div>
  );
}

export default ClientLoginWrapper;
