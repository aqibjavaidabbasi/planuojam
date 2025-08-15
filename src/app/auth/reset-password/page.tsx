"use client";
import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Input from "@/components/custom/Input";
import Button from "@/components/custom/Button";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { resetPassword } from "@/services/auth";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get("code") || "";

  // Add state to track if password reset is successful
  const [resetSuccess, setResetSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = async (data: Record<string, unknown>) => {
    const resetData = {
      code,
      password: data.password,
      passwordConfirmation: data.confirmPassword,
    };
    await toast.promise(
      resetPassword(resetData).then(() => setResetSuccess(true)),
      {
        loading: "Resetting your password...",
        success: "Password reset successfully! You can log in now",
        error: (err) => {
          if (typeof err === "string") return err;
          if (err && typeof err === "object" && "message" in err)
            return String(err.message);
          return "Password reset failed. Please try again.";
        },
      }
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8 flex flex-col gap-6">
        <h2 className="text-2xl font-bold text-center">Reset Password</h2>
        {resetSuccess ? (
          <div className="flex flex-col items-center gap-4">
            <div className="bg-green-100 border border-green-300 text-green-800 rounded p-4 w-full text-center">
              <p className="font-semibold mb-2">Password reset successfully!</p>
              <p className="mb-2">You can now log in with your new password.</p>
            </div>
            <Button
              type="button"
              style="primary"
              extraStyles="!w-full !rounded-md"
              onClick={() => router.push("/auth/login")}
            >
              Go to Login
            </Button>
          </div>
        ) : (
          <>
            <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
              <Input
                type="password"
                placeholder="New Password"
                disabled={isSubmitting}
                {...register("password", {
                  required: "Password is required",
                  minLength: {
                    value: 8,
                    message: "Password must be at least 8 characters",
                  },
                })}
                required
              />
              {errors.password?.message && (
                <div className="text-red-600 text-sm text-center">
                  {String(errors.password.message)}
                </div>
              )}
              <Input
                type="password"
                placeholder="Confirm New Password"
                disabled={isSubmitting}
                {...register("confirmPassword", {
                  required: "Please confirm your password",
                  validate: (value) =>
                    value === watch("password") || "Passwords do not match",
                })}
                required
              />
              {errors.confirmPassword?.message && (
                <div className="text-red-600 text-sm text-center">
                  {String(errors.confirmPassword.message)}
                </div>
              )}
              <Button
                type="submit"
                style="primary"
                extraStyles="!w-full !rounded-md"
                disabled={isSubmitting}
              >
                Reset Password
              </Button>
            </form>
            <div className="text-center text-sm text-muted-foreground">
              <Link
                href={isSubmitting ? "#" : "/auth/login"}
                className={`hover:underline ${isSubmitting ? "pointer-events-none opacity-50 cursor-not-allowed" : ""}`}
                tabIndex={isSubmitting ? -1 : 0}
                aria-disabled={isSubmitting}
                onClick={e => {
                  if (isSubmitting) e.preventDefault();
                }}
              >
                Back to Login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
