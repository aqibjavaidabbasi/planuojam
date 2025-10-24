'use client'
import React, { useEffect, useMemo, useState } from "react";
import Input from "../custom/Input";
import Button from "../custom/Button";
import { User } from "@/types/common";
import { TbLogout } from "react-icons/tb";
import LogoutModal from "../modals/LogoutModal";
// removed redux dispatch import (no longer used)
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { AiOutlineCheckCircle, AiOutlineCloseCircle } from "react-icons/ai";
import { checkUsernameAvailability } from "@/services/auth";
import { customUpdatePassword, customUpdateProfile, customSetPasswordFirstTime } from "@/services/authCustom";
import { useAppDispatch } from "@/store/hooks";
import { setUser } from "@/store/slices/authSlice";

type PasswordForm = {
  currentPassword: string;
  password: string;
  passwordConfirmation: string;
};

type UserWithAuthFlags = User & {
  provider?: string;
  authProvider?: 'google' | 'facebook' | string;
  hasOwnPassword?: boolean;
  hasPasswordSet?: boolean;
};

function ProfileTab({ user }: { user: User | null }) {
  const dispatch = useAppDispatch();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<"unchecked" | "checking" | "available" | "taken">("unchecked");
  const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([]);
  const { register, handleSubmit, watch, formState: { errors }, reset } = useForm<PasswordForm>()
  const t = useTranslations('Profile.ProfileTab');
  const u = user as UserWithAuthFlags | null;
  const authProvider = u?.authProvider;
  const hasOwnPassword = Boolean(u?.hasOwnPassword || u?.hasPasswordSet);
  const isSocialProvider = authProvider === 'google' || authProvider === 'facebook';
  const isFirstTimePasswordSetup = isSocialProvider && !hasOwnPassword;

  // Password strength (same logic as register/reset pages)
  const newPasswordValue = watch('password') || "";
  const hasMinLen = newPasswordValue.length >= 8;
  const hasUpper = /[A-Z]/.test(newPasswordValue);
  const hasDigit = /\d/.test(newPasswordValue);
  const strengthScore = useMemo(() => {
    return [hasMinLen, hasUpper, hasDigit].filter(Boolean).length;
  }, [hasMinLen, hasUpper, hasDigit]);

  useEffect(function () {
    setUsername(user?.username ?? "");
    setUsernameStatus("unchecked");
    setUsernameSuggestions([]);
  }, [user]);

  async function updateUsername(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!user) return;
    if (!username?.trim()) {
      toast.error(t('errors.usernameEmpty'));
      return;
    }
    if (username === user?.username) {
      return;
    }
    if (usernameStatus !== 'available') {
      toast.error(t('errors.usernameNotAvailable', { default: 'Please confirm username availability' }));
      return;
    }

    setLoading(true);
    try {
      const resp = await toast.promise(
        customUpdateProfile({ username }),
        {
          loading: t('toasts.updatingUsername'),
          success: t('toasts.usernameUpdated'),
          error: (err: unknown) =>
            err && typeof err === "object" && "message" in err
              ? String((err as { message?: unknown }).message)
              : t('toasts.usernameUpdateFailed'),
        }
      );
      if (resp && typeof resp === 'object' && 'user' in resp) {
        // Update global user state so header/profile reflect immediately
        dispatch(setUser((resp as { user: unknown }).user));
      }
    } finally {
      setLoading(false);
    }
  }

  function onUsernameChangeReset() {
    if (usernameStatus !== 'unchecked') {
      setUsernameStatus('unchecked');
      setUsernameSuggestions([]);
    }
  }

  async function handleCheckUsername() {
    const uname = (username || '').trim();
    if (!uname) {
      toast.error(t('errors.usernameEmpty'));
      return;
    }
    if (user && uname === user.username) {
      setUsernameStatus('available');
      setUsernameSuggestions([]);
      return;
    }
    setUsernameStatus('checking');
    try {
      const res = await checkUsernameAvailability(uname);
      if (res.available) {
        setUsernameStatus('available');
        setUsernameSuggestions([]);
      } else {
        setUsernameStatus('taken');
        setUsernameSuggestions(res.suggestions || []);
      }
    } catch {
      setUsernameStatus('unchecked');
      toast.error(t('toasts.usernameUpdateFailed'));
    }
  }

  async function handlePasswordUpdate(data: PasswordForm) {
    if (!user) {
      toast.error(t('errors.userNotFound'));
      return;
    }
    setLoading(true);
    const payload = {
      currentPassword: data.currentPassword,
      newPassword: data.password,
    };
    try {
      await toast.promise(
        customUpdatePassword(payload),
        {
          loading: t('toasts.updatingPassword'),
          success: t('toasts.passwordUpdated'),
          error: (err: unknown) =>
            err && typeof err === "object" && "message" in err
              ? String((err as { message?: unknown }).message)
              : t('toasts.passwordUpdateFailed'),
        }
      );
    } finally {
      reset()
      setLoading(false);
    }
  }

  async function handleFirstTimePasswordCreate(data: PasswordForm) {
    if (!user) {
      toast.error(t('errors.userNotFound'));
      return;
    }
    setLoading(true);
    try {
      await toast.promise(
        customSetPasswordFirstTime({ newPassword: data.password }),
        {
          loading: t('toasts.updatingPassword'),
          success: t('toasts.passwordUpdated'),
          error: (err: unknown) =>
            err && typeof err === "object" && "message" in err
              ? String((err as { message?: unknown }).message)
              : t('toasts.passwordUpdateFailed'),
        }
      );
      // Optimistically mark password as set so the one-time section disappears
      if (u) {
        dispatch(setUser({ ...(u as User), ...( { hasOwnPassword: true } as Partial<User>) } as unknown as User));
      }
    } finally {
      reset();
      setLoading(false);
    }
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-start">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">{t('title')}</h1>
          <p className="text-gray-600 mt-2">
            {t('subtitle')}
          </p>
        </div>
        {/* Logout Button */}
        <Button
          style="destructive"
          onClick={() => setIsLogoutModalOpen(true)}
          disabled={loading}
        >
          <TbLogout size={20} className="sm:mr-3" />
          <span className="hidden sm:block" >
            {t('logout')}
          </span>
        </Button>
      </div>

      <div className="max-w-2xl">
        <form className="flex gap-3 items-end w-full" id="usernameForm" onSubmit={updateUsername}>
          <div className="w-full relative">
            <Input
              type="text"
              placeholder={t('usernamePlaceholder')}
              label={t('usernameLabel')}
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                onUsernameChangeReset();
              }}
              disabled={loading}
            />
            <div className="absolute -bottom-5 left-2 flex items-center justify-between">
              <button
                type="button"
                onClick={handleCheckUsername}
                className="text-xs text-primary hover:underline disabled:opacity-50 cursor-pointer"
                disabled={loading || !username}
              >
                {usernameStatus === 'checking' ? t('toasts.updatingUsername') : t('checkAvailability')}
              </button>
              {usernameStatus === 'available' && (
                <span className="flex items-center text-green-600 text-xs ml-3">
                  <AiOutlineCheckCircle className="mr-1" /> {t('usernameAvailable')}
                </span>
              )}
              {usernameStatus === 'taken' && (
                <span className="flex items-center text-red-600 text-xs ml-3">
                  <AiOutlineCloseCircle className="mr-1" /> {t('usernameTaken')}
                </span>
              )}
            </div>
          </div>
          <Button
            style="primary"
            type='submit'
            form="usernameForm"
            extraStyles="!rounded-md !whitespace-nowrap"
            disabled={loading || usernameStatus !== 'available'}
          >
            {t('saveUsername')}
          </Button>
        </form>
        {usernameStatus === 'taken' && usernameSuggestions.length > 0 && (
          <div className="text-xs text-gray-600 flex flex-wrap gap-2 mt-10">
            {usernameSuggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setUsername(s);
                  setUsernameStatus('unchecked');
                }}
                className="px-2 py-1 border rounded hover:bg-gray-50"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        {/* Password Section (first-time vs normal) */}
        {isFirstTimePasswordSetup ? (
          <div className="mt-12 pt-8 border-t border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              {t('password.updateTitle')}
            </h2>
            <form className="space-y-4" id="firstTimePasswordForm" onSubmit={handleSubmit(handleFirstTimePasswordCreate)}>
              <Input
                type="password"
                label={t('password.newLabel')}
                placeholder={t('password.newPlaceholder')}
                {...register('password', {
                  required: t('password.errors.newRequired'),
                  minLength: {
                    value: 8,
                    message: t('password.errors.minLength')
                  }
                })}
                disabled={loading}
              />
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
                    <span>{t('passwordCriteriaLength', { default: '8+ chars' })}</span>
                  </div>
                  <div className={`flex items-center gap-1 ${hasUpper ? "text-green-600" : "text-gray-500"}`}>
                    <AiOutlineCheckCircle className={`${hasUpper ? "opacity-100" : "opacity-40"}`} />
                    <span>{t('passwordCriteriaUpper', { default: '1 uppercase' })}</span>
                  </div>
                  <div className={`flex items-center gap-1 ${hasDigit ? "text-green-600" : "text-gray-500"}`}>
                    <AiOutlineCheckCircle className={`${hasDigit ? "opacity-100" : "opacity-40"}`} />
                    <span>{t('passwordCriteriaNumber', { default: '1 number' })}</span>
                  </div>
                </div>
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.password.message}
                </p>
              )}
              <Input
                type="password"
                label={t('password.confirmLabel')}
                placeholder={t('password.confirmPlaceholder')}
                disabled={loading}
                {...register('passwordConfirmation', {
                  required: t('password.errors.confirmRequired'),
                  minLength: {
                    value: 8,
                    message: t('password.errors.minLength')
                  },
                  validate: (value) =>
                    value === watch('password') || t('password.errors.noMatch')
                })}
              />
              {errors.passwordConfirmation && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.passwordConfirmation.message}
                </p>
              )}
              <Button
                style="primary"
                extraStyles="!rounded-md"
                type="submit"
                form="firstTimePasswordForm"
                disabled={loading}
              >
                {t('password.updateCta')}
              </Button>
            </form>
          </div>
        ) : (
          <div className="mt-12 pt-8 border-t border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              {t('password.updateTitle')}
            </h2>
            <form className="space-y-4" id="passwordForm" onSubmit={handleSubmit(handlePasswordUpdate)}>
              <Input
                type="password"
                label={t('password.currentLabel')}
                placeholder={t('password.currentPlaceholder')}
                {...register('currentPassword', {
                  required: t('password.errors.currentRequired'),
                  minLength: {
                    value: 8,
                    message: t('password.errors.minLength')
                  }
                })}
                disabled={loading}
              />
              {errors.currentPassword && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.currentPassword.message}
                </p>
              )}
              <Input
                type="password"
                label={t('password.newLabel')}
                placeholder={t('password.newPlaceholder')}
                {...register('password', {
                  required: t('password.errors.newRequired'),
                  minLength: {
                    value: 8,
                    message: t('password.errors.minLength')
                  }
                })}
                disabled={loading}
              />
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
                    <span>{t('passwordCriteriaLength', { default: '8+ chars' })}</span>
                  </div>
                  <div className={`flex items-center gap-1 ${hasUpper ? "text-green-600" : "text-gray-500"}`}>
                    <AiOutlineCheckCircle className={`${hasUpper ? "opacity-100" : "opacity-40"}`} />
                    <span>{t('passwordCriteriaUpper', { default: '1 uppercase' })}</span>
                  </div>
                  <div className={`flex items-center gap-1 ${hasDigit ? "text-green-600" : "text-gray-500"}`}>
                    <AiOutlineCheckCircle className={`${hasDigit ? "opacity-100" : "opacity-40"}`} />
                    <span>{t('passwordCriteriaNumber', { default: '1 number' })}</span>
                  </div>
                </div>
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.password.message}
                </p>
              )}
              <Input
                type="password"
                label={t('password.confirmLabel')}
                placeholder={t('password.confirmPlaceholder')}
                disabled={loading}
                {...register('passwordConfirmation', {
                  required: t('password.errors.confirmRequired'),
                  minLength: {
                    value: 8,
                    message: t('password.errors.minLength')
                  },
                  validate: (value) =>
                    value === watch('password') || t('password.errors.noMatch')
                })}
              />
              {errors.passwordConfirmation && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.passwordConfirmation.message}
                </p>
              )}
              <Button
                style="primary"
                extraStyles="!rounded-md"
                type="submit"
                form="passwordForm"
                disabled={loading}
              >
                {t('password.updateCta')}
              </Button>
            </form>
          </div>
        )}
      </div>

      <LogoutModal isOpen={isLogoutModalOpen} onClose={() => setIsLogoutModalOpen(false)} />
    </div>
  );
}

export default ProfileTab;

