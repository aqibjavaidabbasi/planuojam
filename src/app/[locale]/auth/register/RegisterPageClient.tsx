"use client";
import Checkbox from "@/components/custom/Checkbox";
import Input from "@/components/custom/Input";
import Select from "@/components/custom/Select";
import Button from "@/components/custom/Button";
import { useParentCategories } from "@/context/ParentCategoriesContext";
import { useAppDispatch } from "@/store/hooks";
import { registerUser } from "@/store/thunks/authThunks";
import { Link, useRouter } from "@/i18n/navigation";
import React, { useMemo, useState, useEffect, useRef } from "react";
import { SubmitHandler, useForm, Controller } from "react-hook-form";
import toast from "react-hot-toast";
import { BsCart3 } from "react-icons/bs";
import { TbTools } from "react-icons/tb";
import { useTranslations } from "next-intl";
import SocialAuthButtons from "@/components/auth/SocialAuthButtons";
import { useLocale } from "next-intl";
import { AiOutlineCheckCircle, AiOutlineCloseCircle } from "react-icons/ai";
import { checkUsernameAvailability } from "@/services/auth";
import Logo from "@/components/global/Logo";
import { useSearchParams } from "next/navigation";
import { SUPPORTED_LOCALES } from "@/config/i18n";
import PhoneInputField from "@/components/custom/PhoneInputField";
import { isValidPhoneNumber } from "react-phone-number-input";

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
  role: string;
  serviceType?: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreement: boolean;
  phone?: string;
};

export default function RegisterPageClient() {
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    watch,
    setValue,
    control,
  } = useForm<FormValues>();
  const { parentCategories } = useParentCategories();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const t = useTranslations("Auth.Register");
  const tGlobal = useTranslations();
  const [isChecked, setIsChecked] = useState(false);
  const locale = useLocale();
  const [usernameStatus, setUsernameStatus] = useState<"unchecked" | "checking" | "available" | "taken">("unchecked");
  const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([]);
  const params = useSearchParams();
  const redirectParam = params.get("redirect");
  const rp = normalizeRedirect(redirectParam);
  const abortControllerRef = useRef<AbortController | null>(null);

  const currentUsername = watch("username");
  const passwordValue = watch("password") || "";
  const hasMinLen = passwordValue.length >= 8;
  const hasUpper = /[A-Z]/.test(passwordValue);
  const hasDigit = /\d/.test(passwordValue);
  const strengthScore = useMemo(() => {
    return [hasMinLen, hasUpper, hasDigit].filter(Boolean).length;
  }, [hasMinLen, hasUpper, hasDigit]);
  const isPasswordStrong = strengthScore === 3;
  const canRegister = useMemo(() => {
    // Require explicit availability confirmation and strong password
    return usernameStatus === "available" && isChecked && isPasswordStrong && !isSubmitting;
  }, [usernameStatus, isChecked, isPasswordStrong, isSubmitting]);

  // Automatic username availability check with debouncing
  useEffect(() => {
    const uname = (currentUsername || "").trim();
    
    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Reset status if username is empty
    if (!uname) {
      setUsernameStatus("unchecked");
      setUsernameSuggestions([]);
      return;
    }
    
    // Reset to unchecked immediately when username changes
    setUsernameStatus("unchecked");
    setUsernameSuggestions([]);
    
    // Debounce the API call
    const timeoutId = setTimeout(async () => {
      setUsernameStatus("checking");
      
      // Create new abort controller for this request
      const controller = new AbortController();
      abortControllerRef.current = controller;
      
      try {
        const res = await checkUsernameAvailability(uname, controller.signal);
        
        // Only update state if this request wasn't aborted
        if (!controller.signal.aborted) {
          if (res.available) {
            setUsernameStatus("available");
            setUsernameSuggestions([]);
          } else {
            setUsernameStatus("taken");
            setUsernameSuggestions(res.suggestions || []);
          }
        }
      } catch {
        // Only show error if request wasn't aborted
        if (!controller.signal.aborted) {
          setUsernameStatus("unchecked");
          // Don't show error toast for automatic checks to avoid annoying the user
        }
      }
    }, 600); // 600ms debounce delay
    
    // Cleanup function
    return () => {
      clearTimeout(timeoutId);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [currentUsername, t]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    if (!isChecked) {
      toast.error(t("tosNotAccepted"));
      return;
    }
    if (usernameStatus !== "available") {
      toast.error(t("usernameRequired"));
      return;
    }
    if (!isPasswordStrong) {
      toast.error(t("passwordTooWeak", { default: "Password is too weak (need 8+ chars, 1 uppercase, 1 number)" }));
      return;
    }
    if (data.password !== data.confirmPassword) {
      toast.error(t("passwordMismatch", { default: "Passwords do not match" }));
      return;
    }
    //filter role, terms, confirm
    const filteredData = {
      serviceType: data.serviceType,
      username: data.username,
      email: data.email,
      password: data.password,
      phone: watch('role') === 'provider' ? (data.phone || '').trim() : undefined,
    };
    await toast.promise(
      dispatch(registerUser(filteredData))
        .unwrap()
        .then(() => {
          try { sessionStorage.setItem('pendingEmail', data.email); } catch {}
          router.push(`/auth/email-confirmation?email=${encodeURIComponent(data.email)}`);
        }),
      {
        loading: t("registering"),
        success: t("registered"),
      error: (err) => {
        const key = (err as { error?: { key?: string } })?.error?.key || (typeof err === 'string' ? err : undefined);
        if (key) return tGlobal(key);
        if (typeof err === "string") return t(err);
        if (err && typeof err === "object" && "message" in err)
          return t(String(err.message));
        return t("registerFailed");
      },
      }
    );
  };

  return (
    <div className="flex items-center justify-center w-screen">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 mb- cursor-pointer" onClick={() => router.push("/")}>
            <Logo className="w-20 h-20" variant="sm" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">{t("title")}</h1>
          <p className="text-gray-600 mt-2">{t("subtitle")}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6">
          <form className="space-y-6" id="registerForm" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label
                className={`block text-sm font-medium mb-3 ${
                  errors.role ? "text-red-500" : "text-gray-700"
                }`}
              >
                {errors.role ? t("roleRequired") : t("joinAs")}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="relative">
                  <input
                    type="radio"
                    value="public"
                    className="sr-only"
                    {...register("role", { required: true })}
                    disabled={isSubmitting}
                  />
                  <div
                    className={`border-2 border-gray-200 rounded-lg p-2 md:p-4 ${
                      isSubmitting
                        ? "cursor-not-allowed opacity-60"
                        : "cursor-pointer"
                    } transition-all duration-200 hover:border-primary ${
                      watch("role") === "public" &&
                      "border-primary bg-primary/15"
                    }`}
                  >
                    <div className="text-center">
                      <div className="w-8 h-8 mx-auto mb-1 md:mb-2 text-gray-600">
                        <BsCart3 size={20} />
                      </div>
                      <div className="font-medium text-sm md:text-base text-gray-800">
                        {t("roleBuyer")}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {t("roleBuyerDesc")}
                      </div>
                    </div>
                  </div>
                </label>
                <label className="relative">
                  <input
                    type="radio"
                    value="provider"
                    className="sr-only"
                    {...register("role", { required: true })}
                    disabled={isSubmitting}
                  />
                  <div
                    className={`border-2 border-gray-200 rounded-lg p-2 md:p-4 ${
                      isSubmitting
                        ? "cursor-not-allowed opacity-60"
                        : "cursor-pointer"
                    } transition-all duration-200 hover:border-primary ${
                      watch("role") === "provider" &&
                      "border-primary bg-primary/15"
                    }`}
                  >
                    <div className="text-center">
                      <div className="w-8 h-8 mx-auto mb-1 md:mb-2 text-gray-600">
                        <TbTools size={20} />
                      </div>
                      <div className="font-medium text-sm md:text-base text-gray-800">
                        {t("roleProvider")}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {t("roleProviderDesc")}
                      </div>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {watch("role") === "provider" && (
              <div
                className="flex flex-col gap-2.5"
                style={{ transition: "max-height 0.7s linear" }}
              >
                <label htmlFor="serviceType">{t("chooseService")}</label>
                <Select
                  options={parentCategories.map((cat) => ({
                    value: cat.name,
                    label:
                      cat.localizations?.find((loc) => loc.locale === locale)?.name ||
                      cat.name,
                  }))}
                  disabled={isSubmitting}
                  {...register("serviceType", { required: true })}
                />
                {errors.serviceType && (
                  <p className="text-red-500">{t("serviceRequired")}</p>
                )}
                <Controller
                  control={control}
                  name="phone"
                  rules={{
                    validate: (val) => {
                      if (watch('role') !== 'provider') return true;
                      if (!val) return t("phoneRequired", { default: "Phone is required" });
                      if (!isValidPhoneNumber(String(val))) return t("phoneInvalid", { default: "Enter a valid phone" });
                      return true;
                    },
                  }}
                  render={({ field, fieldState }) => (
                    <PhoneInputField
                      label={t("phoneLabel", { default: "Phone" })}
                      placeholder={t("phonePlaceholder", { default: "+370 600 00000" })}
                      disabled={isSubmitting}
                      value={(field.value as string) || ''}
                      onChange={(v?: string | null) => field.onChange(v || "")}
                      error={fieldState.error ? String(fieldState.error.message) : undefined}
                    />
                  )}
                />
              </div>
            )}

            <div className="flex flex-col gap-2.5">
              <Input
                type="text"
                placeholder={t("usernamePlaceholder")}
                label={t("usernameLabel")}
                disabled={isSubmitting}
                {...register("username", { required: true })}
              />
              {/* Automatic availability status */}
              {currentUsername && currentUsername.trim() && (
                <div className="flex items-center justify-end mx-2 -mt-1">
                  {usernameStatus === "checking" && (
                    <span className="flex items-center text-gray-500 text-xs">
                      <svg className="animate-spin h-3 w-3 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {t("checkingAvailability", { default: "Checking..." })}
                    </span>
                  )}
                  {usernameStatus === "available" && (
                    <span className="flex items-center text-green-600 text-xs">
                      <AiOutlineCheckCircle className="mr-1" /> {t("usernameAvailable", { default: "Username is available" })}
                    </span>
                  )}
                  {usernameStatus === "taken" && (
                    <span className="flex items-center text-red-600 text-xs">
                      <AiOutlineCloseCircle className="mr-1" /> {t("usernameTaken", { default: "Username is taken" })}
                    </span>
                  )}
                </div>
              )}
              {errors.username && (
                <p className="text-red-500">{t("usernameRequired")}</p>
              )}
              {usernameStatus === "taken" && usernameSuggestions.length > 0 && (
                <div className="text-xs text-gray-600 flex flex-wrap gap-2">
                  {usernameSuggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        setValue("username", s, { shouldDirty: true, shouldTouch: true });
                        setUsernameStatus("unchecked");
                      }}
                      className="px-2 py-1 border rounded hover:bg-gray-50"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
              <Input
                type="email"
                placeholder={t("emailPlaceholder")}
                label={t("emailLabel")}
                disabled={isSubmitting}
                {...register("email", {
                  required: t("emailRequired"),
                  pattern: { value: /^\S+@\S+$/, message: t("emailInvalid") },
                })}
              />
              {errors.email && (
                <p className="text-red-500">{errors?.email?.message}</p>
              )}
              <Input
                type="password"
                placeholder={t("passwordPlaceholder")}
                label={t("passwordLabel")}
                disabled={isSubmitting}
                {...register("password", {
                  required: t("passwordRequired"),
                  minLength: { value: 8, message: t("passwordTooShort", { default: "Password must be at least 8 characters" }) },
                })}
              />
              {/* Password strength meter */}
              <div className="mt-1">
                <div className="h-2 w-full bg-gray-200 rounded">
                  <div
                    className={`h-2 rounded transition-all ${
                      strengthScore === 0
                        ? "w-0 bg-transparent"
                        : strengthScore === 1
                        ? "w-1/3 bg-red-500"
                        : strengthScore === 2
                        ? "w-2/3 bg-yellow-500"
                        : "w-full bg-green-500"
                    }`}
                  />
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-[11px] text-gray-600">
                  <div className={`flex items-center gap-1 ${hasMinLen ? "text-green-600" : "text-gray-500"}`}>
                    <AiOutlineCheckCircle className={`${hasMinLen ? "opacity-100" : "opacity-40"}`} />
                    <span>{t("passwordCriteriaLength", { default: "8+ chars" })}</span>
                  </div>
                  <div className={`flex items-center gap-1 ${hasUpper ? "text-green-600" : "text-gray-500"}`}>
                    <AiOutlineCheckCircle className={`${hasUpper ? "opacity-100" : "opacity-40"}`} />
                    <span>{t("passwordCriteriaUpper", { default: "1 uppercase" })}</span>
                  </div>
                  <div className={`flex items-center gap-1 ${hasDigit ? "text-green-600" : "text-gray-500"}`}>
                    <AiOutlineCheckCircle className={`${hasDigit ? "opacity-100" : "opacity-40"}`} />
                    <span>{t("passwordCriteriaNumber", { default: "1 number" })}</span>
                  </div>
                </div>
              </div>
              {errors.password && (
                <p className="text-red-500">{errors?.password?.message}</p>
              )}
              <Input
                type="password"
                placeholder={t("confirmPasswordPlaceholder")}
                label={t("confirmPasswordLabel")}
                disabled={isSubmitting}
                {...register("confirmPassword", {
                  required: t("confirmPasswordRequired"),
                  minLength: { value: 8, message: t("passwordTooShort", { default: "Password must be at least 8 characters" }) },
                  validate: (value) => value === watch("password") || t("passwordMismatch", { default: "Passwords do not match" }),
                })}
              />
              {errors.confirmPassword && (
                <p className="text-red-500">
                  {errors?.confirmPassword?.message}
                </p>
              )}
            </div>

            <div className="">
              <Checkbox
                label={
                  <>
                    <span className="mr-1">{t("agreePrefix", { default: "I agree to the" })}</span>
                    <Link href="/terms-of-service" className="text-primary hover:underline">
                      {t("termsOfService", { default: "Terms of Service" })}
                    </Link>
                    <span className="mx-1">{t("and", { default: "and" })}</span>
                    <Link href="/privacy-policy" className="text-primary hover:underline">
                      {t("privacyPolicy", { default: "Privacy Policy" })}
                    </Link>
                  </>
                }
                onChange={(e) => setIsChecked(e.target.checked)}
                checked={isChecked}
                disabled={isSubmitting}
              />
            </div>

            <Button
              type="submit"
              form="registerForm"
              style="primary"
              extraStyles="!rounded-md !w-full"
              disabled={!canRegister}
            >
              {t("registerCta")}
            </Button>
          </form>

          <SocialAuthButtons
            className="mt-6"
            onGoogleClick={() => {
              const svc = watch("serviceType");
              const phone = watch("phone")?.trim();
              const role = watch("role");
              if (!role) {
                toast.error(t("roleRequired"));
                return;
              }

              if (role === "provider" && !svc) {
                toast.error(t("serviceRequired"));
                return;
              }
              if (role === "provider" && (!phone || phone.length < 6)) {
                toast.error(t("phoneRequired", { default: "Phone is required" }));
                return;
              }
              if (!isChecked) {
                toast.error(t("tosRequired"));
                return;
              }
              const sp = new URLSearchParams({
                locale,
                mode: "register",
                serviceType: svc || "",
              });
              if (role === 'provider' && phone) sp.set('phone', phone);
              if (rp) {
                try { sessionStorage.setItem('postAuthRedirect', rp); } catch {}
                sp.set('redirect', rp);
              }
              window.location.href = `/api/auth/google?${sp.toString()}`;
            }}
            onFacebookClick={() => {
              const svc = watch("serviceType");
              const phone = watch("phone")?.trim();
              const role = watch("role");
              if (!role) {
                toast.error(t("roleRequired"));
                return;
              }
              if (role === "provider" && !svc) {
                toast.error(t("serviceRequired"));
                return;
              }
              if (role === "provider" && (!phone || phone.length < 6)) {
                toast.error(t("phoneRequired", { default: "Phone is required" }));
                return;
              }
              if (!isChecked) {
                toast.error(t("tosRequired"));
                return;
              }
              const sp = new URLSearchParams({
                locale,
                mode: "register",
                serviceType: svc || "",
              });
              if (role === 'provider' && phone) sp.set('phone', phone);
              if (rp) {
                try { sessionStorage.setItem('postAuthRedirect', rp); } catch {}
                sp.set('redirect', rp);
              }
              window.location.href = `/api/auth/facebook?${sp.toString()}`;
            }}
          />

          <div className="text-center mt-6">
            <p className="text-sm text-gray-600">
              {t("alreadyHaveAccount")}
              <Link
                href={`/auth/login${rp ? `?redirect=${encodeURIComponent(rp)}` : ''}`}
                className="text-primary hover:underline font-medium transition-all ml-2"
              >
                {t("signInHere")}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
