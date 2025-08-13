"use client";
import Checkbox from "@/components/custom/Checkbox";
import Input from "@/components/custom/Input";
import Select from "@/components/custom/Select";
import Button from "@/components/ui/Button";
import { useParentCategories } from "@/context/ParentCategoriesContext";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { useAppDispatch } from "@/store/hooks";
import { registerUser } from "@/store/thunks/authThunks";
import { getCompleteImageUrl } from "@/utils/helpers";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { BsCart3 } from "react-icons/bs";
import { TbTools } from "react-icons/tb";

type FormValues = {
  role: string;
  serviceType?: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  terms: boolean;
};

function RegisterPage() {
  const { siteSettings } = useSiteSettings();
  const { formState: { errors, isSubmitting }, handleSubmit, register, watch } = useForm<FormValues>();
  const { parentCategories } = useParentCategories();
  const dispatch = useAppDispatch();
  const router = useRouter();

    const onSubmit: SubmitHandler<FormValues> = async (data) => {
      //filter role, terms, confirm
      const filteredData = {
        serviceType: data.serviceType,
        username: data.username,
        email: data.email,
        password: data.password,
      }
      await toast.promise(
        dispatch(registerUser(filteredData))
          .unwrap()
          .then(() => {
            router.push('/auth/email-confirmation');
          }),
        {
          loading: 'Registering your data...',
          success: 'Registered successfully!',
          error: (err) => {
            // err is exactly what rejectWithValue() returned in the thunk
            if (typeof err === "string") return err;
            if (err && typeof err === "object" && "message" in err) return String(err.message);
            return "Login failed. Please try again.";
          },
        }
      );
    };

  return (
    <div className="flex items-center justify-center w-screen">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-4">
            <Image
              src={getCompleteImageUrl(siteSettings.siteLogo.url)}
              alt="site logo"
              width={80}
              height={80}
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Create Account</h1>
          <p className="text-gray-600 mt-2">Join our community today</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label className={`block text-sm font-medium mb-3 ${errors.role ? "text-red-500" : "text-gray-700"}`}>
                {errors.role ? "Please select a role" : "I want to join as:"}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="relative">
                  <input
                    type="radio"
                    value="public"
                    className="sr-only"
                    {...register('role', { required: true })}
                    disabled={isSubmitting}
                  />
                  <div className={`border-2 border-gray-200 rounded-lg p-4 ${isSubmitting ? "cursor-not-allowed opacity-60" : "cursor-pointer"} transition-all duration-200 hover:border-primary ${watch('role') === 'public' && "border-primary bg-primary/15"}`}>
                    <div className="text-center">
                      <div className="w-8 h-8 mx-auto mb-2 text-gray-600">
                        <BsCart3 size={20} />
                      </div>
                      <div className="font-medium text-gray-800">Buyer</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Find services
                      </div>
                    </div>
                  </div>
                </label>
                <label className="relative">
                  <input
                    type="radio"
                    value="provider"
                    className="sr-only"
                    {...register('role', { required: true })}
                    disabled={isSubmitting}
                  />
                  <div className={`border-2 border-gray-200 rounded-lg p-4 ${isSubmitting ? "cursor-not-allowed opacity-60" : "cursor-pointer"} transition-all duration-200 hover:border-primary ${watch('role') === 'provider' && "border-primary bg-primary/15"}`}>
                    <div className="text-center">
                      <div className="w-8 h-8 mx-auto mb-2 text-gray-600">
                        <TbTools size={20} />
                      </div>
                      <div className="font-medium text-gray-800">
                        Service Provider
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Offer services
                      </div>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {
              watch('role') === 'provider' &&
              <div className="flex flex-col gap-2.5"  
                style={{ transition: "max-height 0.7s linear" }}
              > 
                <label htmlFor="serviceType">Choose a service</label>
                <Select
                  options={parentCategories.map(cat => ({
                    value: cat.name,
                    label: cat.name,
                  }))}
                  disabled={isSubmitting}
                  {...register('serviceType', { required: true })}
                />
                {errors.serviceType && <p className="text-red-500">Service is required</p>}
              </div>
            }

            <div className="flex flex-col gap-2.5">
              <Input
                type="text"
                placeholder="Enter your username"
                label="username"
                disabled={isSubmitting}
                {...register('username', { required: true })}
              />
              {errors.username && <p className="text-red-500">Please enter a username</p>}
              <Input
                type="email"
                placeholder="Enter your email"
                label="Email"
                disabled={isSubmitting}
                {...register("email", {
                  required: "Email is required",
                  pattern: { value: /^\S+@\S+$/, message: "Invalid email" },
                })}
              />
              {errors.email && <p className="text-red-500">{errors?.email?.message}</p>}
              <Input
                type="password"
                placeholder="Enter a strong password"
                label="password"
                disabled={isSubmitting}
                {...register("password", {
                  required: "Password is required",
                  minLength: 8,
                })}
              />
              {errors.password && <p className="text-red-500">{errors?.password?.message}</p>}
              <Input
                type="password"
                placeholder="Confirm your password"
                label="Confirm password"
                disabled={isSubmitting}
                {...register("confirmPassword", {
                  required: "Password is required",
                  minLength: 8,
                  validate: (value) => value === watch("password"),
                })}
              />
              {errors.confirmPassword && <p className="text-red-500">{errors?.confirmPassword?.message}</p>}
            </div>

            <div className="">
              <Checkbox label={errors.terms ? "Please read and agree to our Terms of Service and Privacy Policy" : " I agree to the Terms of Service and Privacy Policy"} disabled={isSubmitting} />
            </div>

            <Button style="primary" type="submit" extraStyles="!rounded-md !w-full">
              Register
            </Button>
          </form>

          {/* <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                Or register with
              </span>
            </div>
          </div> */}

          {/* <GoogleButton label="Continue With Google" /> */}

          <div className="text-center mt-6">
            <p className="text-sm text-gray-600">
              Already have an account?
              <Link
                href="/auth/login"
                className="text-primary hover:underline font-medium transition-all ml-2"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
