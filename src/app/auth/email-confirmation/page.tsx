"use client";
import React, { useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/custom/Input";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useAppSelector } from "@/store/hooks";
import { useRouter } from "next/navigation";
import { emailConfirmation, resendEmailConfirmation } from "@/services/auth";

function EmailConfirmationPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);
  const [emailConfirm, setEmailConfirmed] = useState(false);

  const handleResend = async () => {
    const data = {
      email: user?.email,
    };
    await toast.promise(resendEmailConfirmation(data), {
      loading: "sending confirmation email...",
      success: "Confirmation email successfully!",
      error: (err) => {
        // err is exactly what rejectWithValue() returned in the thunk
        if (typeof err === "string") return err;
        if (err && typeof err === "object" && "message" in err)
          return String(err.message);
        return "We failed to send confirmation email. Please try again.";
      },
    });
  };

  async function onSubmit(data: Record<string, string>) {
    const confirmationToken = data?.confirmation;

    await toast.promise(
      emailConfirmation(confirmationToken).then(() => {
          setEmailConfirmed(true); // set state on success
        }),
      {
        loading: "Confirming your email...",
        success: "Confirmed your email successfully! You can log in to continue",
        error: (err) => {
          // err is exactly what rejectWithValue() returned in the thunk
          if (typeof err === "string") return err;
          if (err && typeof err === "object" && "message" in err)
            return String(err.message);
          return "Email confirmation failed. Please try again.";
        },
      }
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8 flex flex-col gap-6">
        <h2 className="text-2xl font-bold text-center">Email Confirmation</h2>
        <div className="text-center text-base">
          <span>
            Please confirm your email address to activate your account.
          </span>
          <br />
          <span className="text-muted-foreground text-sm">
            If you did not receive the confirmation email, you can resend it
            below.
          </span>
        </div>
        {emailConfirm ? (
          <div className="bg-green-100 border border-green-300 text-green-800 rounded p-4 text-center flex items-center justify-center">
            <p className="font-semibold mb-2">Email confirmed successfully!</p>
            <p className="mb-2">You can now log in to your account.</p>
            <Button onClick={()=>router.push('/auth/login')} type="button" style="link">
                Login
              </Button>
          </div>
        ) : (
          <>
            <div>
              <form
                action=""
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <Input
                  type="text"
                  label="Confirmation Token"
                  placeholder="Enter confirmation token from email"
                  {...register("confirmation", {
                    required: "Confirmation token is required",
                  })}
                />
                {errors.confirmation && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.confirmation.message as string}
                  </p>
                )}
                <Button type="submit" style="primary" extraStyles="!w-full mt-4">
                  Confirm Email
                </Button>
              </form>
            </div>
            <div className="w-full flex items-center justify-center">
              <Button onClick={handleResend} type="button" style="link">
                Resend Confirmation Email
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default EmailConfirmationPage;
