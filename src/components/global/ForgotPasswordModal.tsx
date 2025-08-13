"use client";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { getCompleteImageUrl } from "@/utils/helpers";
import Image from "next/image";
import React from "react";
import Input from "../custom/Input";
import Button from "../ui/Button";
import { useForm } from "react-hook-form";
import { forgotPassword } from "@/services/auth";
import toast from "react-hot-toast";

interface ForgotPasswordModalProps {
  onClose: () => void;
}

function ForgotPasswordModal({ onClose }: ForgotPasswordModalProps) {
  const { siteSettings } = useSiteSettings();
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm();

  async function onSubmit(data: Record<string, unknown>) {
    await toast.promise(
      forgotPassword(data).then(() => {
        onClose();
      }),
      {
        loading: "Sending email...",
        success: "Email Sent successfully!",
        error: (err) => {
          if (typeof err === "string") return err;
          if (err && typeof err === "object" && "message" in err)
            return String(err.message);
          return "Could not send email. Please try again.";
        },
      }
    );
  }

  return (
    <div>
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
        <h1 className="text-2xl font-bold mb-2">Reset Password</h1>
        <p className="text-sm">
          Enter your email address and we'll send you a link to reset your
          password
        </p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <Input
          type="email"
          label="email"
          placeholder="Enter your email"
          disabled={isSubmitting}
          {...register("email", {
            required: "Email is required",
            pattern: {
              value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
              message: "Invalid email address",
            },
          })}
        />
        {errors?.email?.message && (
          <p className="text-red-500 text-sm">
            {errors.email.message as string}
          </p>
        )}

        <Button
          style="secondary"
          type="submit"
          extraStyles="!w-full"
          disabled={isSubmitting}
        >
          Send Reset Link
        </Button>
      </form>
    </div>
  );
}

export default ForgotPasswordModal;
