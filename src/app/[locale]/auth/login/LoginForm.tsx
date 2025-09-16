"use client";
import Input from "@/components/custom/Input";
import Button from "@/components/custom/Button";
import { useAppDispatch } from "@/store/hooks";
import { loginUser } from "@/store/thunks/authThunks";
import { useRouter } from "@/i18n/navigation";
import React from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";

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

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    await toast.promise(
      dispatch(loginUser(data))
        .unwrap()
        .then((user: any) => {
          // Redirect based on role
          if (user?.serviceType === null) {
            router.push('/profile?tab=bookings');
          } else {
            router.push('/profile?tab=my-listings');
          }
        }),
      {
        loading: t("loggingIn"),
        success: t("loggedIn"),
        error: (err) => {
          // err is exactly what rejectWithValue() returned in the thunk
          if (typeof err === "string") return err;
          if (err && typeof err === "object" && "message" in err)
            return String(err.message);
          return t("loginFailed");
        },
      }
    );
  };
  return (
    <form className="space-y-6" id="loginForm" onSubmit={handleSubmit(onSubmit)}>
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
            minLength: 8,
          })}
        />

        {errors.password && (
          <p className="text-red-500">{errors.password.message}</p>
        )}
      </div>
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
    </form>
  );
}

export default LoginForm;
