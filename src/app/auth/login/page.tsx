"use client";
import Checkbox from "@/components/custom/Checkbox";
import GoogleButton from "@/components/custom/GoogleButton";
import Input from "@/components/custom/Input";
import Button from "@/components/ui/Button";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { fetchUser, login } from "@/services/auth";
import { useAppDispatch } from "@/store/hooks";
import { loginUser } from "@/store/slices/authSlice";
import { getCompleteImageUrl } from "@/utils/helpers";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import { useForm, SubmitHandler } from "react-hook-form";

type FormValues = {
  identifier: string;
  password: string;
};

function LoginPage() {
  const { siteSettings } = useSiteSettings();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>();
  const router = useRouter();
  const dispatch = useAppDispatch();

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    try{
      await dispatch(loginUser(data)).unwrap()
      router.push('/');
    }catch(err){
      console.log("error",err);
    }
  };
  return (
    <div className="flex items-center justify-center h-dvh w-screen max-w-screen">
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
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>

            <Input
              type="email"
              label="Email"
              placeholder="Enter your email"
              {...register("identifier", {
                required: "Email is required",
                pattern: { value: /^\S+@\S+$/, message: "Invalid email" },
              })}
              />
              {errors.identifier && <p className="text-red-500">{errors.identifier.message}</p>}
              </div>
              <div>

            <Input
              label="Password"
              type="password"
              placeholder="Enter your password"
              {...register("password", {
                required: "Password is required",
                minLength: 8,
              })}
              />

              {errors.password && <p className="text-red-500">{errors.password.message}</p>}
              </div>
            <div className="flex items-center justify-between">
              <Checkbox label="Remember Me" />
              <Link
                href={""}
                className="text-sm text-primary hover:underline transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              style="primary"
              extraStyles="!rounded-md w-full"
              type="submit"
            >
              Sign in
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                Or continue with
              </span>
            </div>
          </div>

          <GoogleButton label="Continue With Google" />

          <div className="text-center mt-6">
            <p className="text-sm text-gray-600">
              Don't have an account?
              <Link
                href="/auth/register"
                className="text-primary font-medium transition-colors ml-2 hover:underline"
              >
                Sign up here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
