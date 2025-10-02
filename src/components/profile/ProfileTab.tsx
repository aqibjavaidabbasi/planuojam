'use client'
import React, { useEffect, useState } from "react";
import Input from "../custom/Input";
import Button from "../custom/Button";
import { User } from "@/types/common";
import { TbLogout } from "react-icons/tb";
import LogoutModal from "../modals/LogoutModal";
import { useAppDispatch } from "@/store/hooks";
import { updateUser } from "@/store/thunks/authThunks";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { AiOutlineCheckCircle, AiOutlineCloseCircle } from "react-icons/ai";
import { checkUsernameAvailability } from "@/services/auth";

type PasswordForm = {
  currentPassword: string;
  password: string;
  passwordConfirmation: string;
};

function ProfileTab({ user }: { user: User | null }) {
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const [username, setUsername] = useState("");
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<"unchecked" | "checking" | "available" | "taken">("unchecked");
  const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([]);
  const { register, handleSubmit, watch, formState: { errors }, reset } = useForm<PasswordForm>()
  const t = useTranslations('Profile.ProfileTab');

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
    await toast.promise(
      dispatch(updateUser({ id: user.id, username })).unwrap(),
      {
        loading: t('toasts.updatingUsername'),
        success: t('toasts.usernameUpdated'),
        error: (err: unknown) =>
          err && typeof err === "object" && "message" in err
            ? String((err as { message?: unknown }).message)
            : t('toasts.usernameUpdateFailed'),
      }
    ).finally(() => setLoading(false));
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
      password: data.password,
      passwordConfirmation: data.passwordConfirmation,
    };
    try {
      const { updateUserPassword } = await import("@/services/auth");
      await toast.promise(
        updateUserPassword(payload),
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
                {usernameStatus === 'checking' ? t('toasts.updatingUsername') : t('checkAvailability', { default: 'Check availability' })}
              </button>
              {usernameStatus === 'available' && (
                <span className="flex items-center text-green-600 text-xs">
                  <AiOutlineCheckCircle className="mr-1" /> {t('usernameAvailable', { default: 'Username is available' })}
                </span>
              )}
              {usernameStatus === 'taken' && (
                <span className="flex items-center text-red-600 text-xs">
                  <AiOutlineCloseCircle className="mr-1" /> {t('usernameTaken', { default: 'Username is taken' })}
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
        {/* Password Update Section */}
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
      </div>

      <LogoutModal isOpen={isLogoutModalOpen} onClose={() => setIsLogoutModalOpen(false)} />
    </div>
  );
}

export default ProfileTab;

