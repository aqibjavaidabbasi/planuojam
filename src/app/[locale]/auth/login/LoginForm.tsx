"use client";
import Input from "@/components/custom/Input";
import Button from "@/components/custom/Button";
import { useAppDispatch } from "@/store/hooks";
import { loginUser } from "@/store/thunks/authThunks";
import { useRouter } from "@/i18n/navigation";
import React, { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";
import SocialAuthButtons from "@/components/auth/SocialAuthButtons";
import { useLocale } from "next-intl";
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

type FormValues = {
  identifier: string;
  password: string;
};

interface LoginFormProps {
  setIsOpen: (isOpen: boolean) => void;
}

function LoginForm({ setIsOpen }: LoginFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const t = useTranslations("Auth.Login");
  const tGlobal = useTranslations();
  const locale = useLocale();
  const [showUnconfirmed, setShowUnconfirmed] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string>("");
  const params = useSearchParams();
  const errorParam = params.get("error") || params.get("errorMessage");
  const socialErrorCode = errorParam ? errorParam.toUpperCase() : null;
  const [showSocialError, setShowSocialError] = useState<boolean>(!!socialErrorCode);
  const socialErrorMessage = (() => {
    switch (socialErrorCode) {
      case "EMAIL_REQUIRED":
      case "MISSING_EMAIL":
        return t("socialEmailRequired");
      case "USER_NOT_FOUND":
        return t("socialUserNotFound");
      case "INTERNAL_ERROR":
        return t("socialInternalError");
      default:
        return t("loginFailed");
    }
  })();

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    await toast.promise(
      dispatch(loginUser({ email: data.identifier, password: data.password }))
        .unwrap()
        .then((user) => {
          const rp = normalizeRedirect(params.get("redirect"));
          if (rp) {
            router.push(rp);
            return;
          }
          const u = user as { serviceType: string | null } | undefined;
          if (u?.serviceType === null) {
            router.push('/profile?tab=bookings');
          } else {
            router.push('/profile?tab=my-listings');
          }
        }),
      {
        loading: t("loggingIn"),
        success: t("loggedIn"),
        error: (err) => {
          const key = (err as { error?: { key?: string } })?.error?.key || (typeof err === 'string' ? err : undefined);
          if (key === 'Errors.Auth.emailNotConfirmed') {
            setShowUnconfirmed(true);
            setPendingEmail(data.identifier);
            try { sessionStorage.setItem('pendingEmail', data.identifier); } catch {}
            return tGlobal(key);
          }
          if (key) return tGlobal(key);
          if (typeof err === "string") return t(err);
          if (err && typeof err === "object" && "message" in (err as Record<string, unknown>))
            return t(String((err as Record<string, unknown>).message));
          return t("loginFailed");
        },
      }
    );
  };
  return (
    <form className="space-y-3.5" id="loginForm" onSubmit={handleSubmit(onSubmit)}>
      {showSocialError && socialErrorCode && (
        <div className="rounded-md border border-red-300 bg-red-50 text-red-800 p-3 text-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="pr-2">{socialErrorMessage}</div>
            <Button
              style="link"
              type="button"
              onClick={() => {
                setShowSocialError(false);
                try {
                  const sp = new URLSearchParams(params.toString());
                  sp.delete("error");
                  sp.delete("errorMessage");
                  const q = sp.toString();
                  router.replace(`/auth/login${q ? `?${q}` : ""}`);
                } catch {}
              }}
            >
              {t("dismiss", { default: "Dismiss" })}
            </Button>
          </div>
        </div>
      )}
      <div>
        <Input
          type="email"
          label={t("emailLabel")}
          placeholder={t("emailPlaceholder")}
          disabled={isSubmitting}
          {...register("identifier", {
            required: t("emailRequired"),
            pattern: { value: /^\S+@\S+$/, message: t("emailInvalid") },
          })}
        />
        {errors.identifier && (
          <p className="text-red-500">{errors.identifier.message}</p>
        )}
      </div>
      <div>
        <Input
          label={t("passwordLabel")}
          type="password"
          disabled={isSubmitting}
          placeholder={t("passwordPlaceholder")}
          {...register("password", {
            required: t("passwordRequired"),
            minLength: { value: 8, message: t("passwordTooShort", { default: "Password must be at least 8 characters" }) },
          })}
        />

        {errors.password && (
          <p className="text-red-500">{errors.password.message}</p>
        )}
      </div>
      {showUnconfirmed && (
        <div className="rounded-md border border-amber-300 bg-amber-50 text-amber-900 p-3 text-sm">
          <div className="mb-2">{tGlobal('Errors.Auth.emailNotConfirmed')}</div>
          <div className="flex gap-2">
            <Button
              style="primary"
              type="button"
              extraStyles="!rounded-md !py-1 !px-3"
              onClick={() => {
                const url = '/auth/email-confirmation' + (pendingEmail ? `?email=${encodeURIComponent(pendingEmail)}` : '');
                router.push(url);
              }}
            >
              {t("goToConfirm", { default: "Confirm email" })}
            </Button>
            <Button
              style="link"
              type="button"
              onClick={() => setShowUnconfirmed(false)}
            >
              {t("dismiss", { default: "Dismiss" })}
            </Button>
          </div>
        </div>
      )}
      <div className="flex items-center justify-center">
        <Button
          style="link"
          disabled={isSubmitting}
          onClick={() => setIsOpen(true)}
        >
          {t("forgotPassword")}
        </Button>
      </div>

      <Button
        style="primary"
        extraStyles="!rounded-md w-full"
        type="submit"
        form="loginForm"
        disabled={isSubmitting}
      >
        {t("signIn")}
      </Button>

      <SocialAuthButtons
        className="mt-4"
        onGoogleClick={() => {
          try {
            const rp = normalizeRedirect(params.get("redirect"));
            if (rp) {
              try { sessionStorage.setItem('postAuthRedirect', rp); } catch {}
            }
            const sp = new URLSearchParams({ locale, mode: "login" });
            if (rp) sp.set('redirect', rp);
            window.location.href = `/api/auth/google?${sp.toString()}`;
          } catch (e) {
            console.log(e)
            toast.error(t("loginFailed"));
          }
        }}
        onFacebookClick={() => {
          try {
            const rp = normalizeRedirect(params.get("redirect"));
            if (rp) {
              try { sessionStorage.setItem('postAuthRedirect', rp); } catch {}
            }
            const sp = new URLSearchParams({ locale, mode: "login" });
            if (rp) sp.set('redirect', rp);
            window.location.href = `/api/auth/facebook?${sp.toString()}`;
          } catch (e) {
            console.log(e)
            toast.error(t("loginFailed"));
          }
        }}
      />
    </form>
  );
}

export default LoginForm;
