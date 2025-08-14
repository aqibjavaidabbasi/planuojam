"use client";
import Input from "@/components/custom/Input";
import Button from "@/components/ui/Button";
import { useAppDispatch } from "@/store/hooks";
import { loginUser } from "@/store/thunks/authThunks";
import { useRouter } from "next/navigation";
import React from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import toast from "react-hot-toast";

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

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    await toast.promise(
      dispatch(loginUser(data))
        .unwrap()
        .then(() => {
          router.push("/");
        }),
      {
        loading: "Logging in...",
        success: "Logged in successfully!",
        error: (err) => {
          // err is exactly what rejectWithValue() returned in the thunk
          if (typeof err === "string") return err;
          if (err && typeof err === "object" && "message" in err)
            return String(err.message);
          return "Login failed. Please try again.";
        },
      }
    );
  };
  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
      <div>
        <Input
          type="email"
          label="Email"
          placeholder="Enter your email"
          disabled={isSubmitting}
          {...register("identifier", {
            required: "Email is required",
            pattern: { value: /^\S+@\S+$/, message: "Invalid email" },
          })}
        />
        {errors.identifier && (
          <p className="text-red-500">{errors.identifier.message}</p>
        )}
      </div>
      <div>
        <Input
          label="Password"
          type="password"
          disabled={isSubmitting}
          placeholder="Enter your password"
          {...register("password", {
            required: "Password is required",
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
          forgot password?
        </Button>
      </div>

      <Button
        style="primary"
        extraStyles="!rounded-md w-full"
        type="submit"
        disabled={isSubmitting}
      >
        Sign in
      </Button>
    </form>
  );
}

export default LoginForm;
