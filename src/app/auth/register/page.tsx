"use client";
import GoogleButton from "@/components/custom/GoogleButton";
import Input from "@/components/custom/Input";
import Button from "@/components/ui/Button";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { getCompleteImageUrl } from "@/utils/helpers";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { BsCart3 } from "react-icons/bs";
import { TbTools } from "react-icons/tb";

function RegisterPage() {
  const { siteSettings } = useSiteSettings();
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
          <form className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                I want to join as:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="relative">
                  <input
                    type="radio"
                    name="userType"
                    value="buyer"
                    className="sr-only"
                  />
                  <div className="user-type-card border-2 border-gray-200 rounded-lg p-4 cursor-pointer transition-all duration-200 hover:border-primary">
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
                    name="userType"
                    value="provider"
                    className="sr-only"
                  />
                  <div className="user-type-card border-2 border-gray-200 rounded-lg p-4 cursor-pointer transition-all duration-200 hover:border-primary">
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

            <div className="flex flex-col gap-2.5">
              <Input
                type="text"
                placeholder="Enter your username"
                label="username"
              />
              <Input
                type="email"
                placeholder="Enter your email"
                label="Email"
              />
              <Input
                type="password"
                placeholder="Enter a strong password"
                label="password"
              />
              <Input
                type="password"
                placeholder="Confirm your password"
                label="Confirm password"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="terms"
                name="terms"
                required
                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary mt-1"
              />
              <label htmlFor="terms" className="ml-3 text-sm text-gray-600 flex items-center">
                I agree to the
                <Link
                  href="/terms-of-service"
                  className="text-primary hover:underline transition-all mx-2"
                >
                  Terms of Service
                </Link>
                and
                <Link
                  href="/privacy-policy"
                  className="text-primary hover:underline transition-all ml-2"
                >
                  Privacy Policy
                </Link>
              </label>
            </div>

            <Button style="primary" extraStyles="!rounded-md !w-full">
              Register
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                Or register with
              </span>
            </div>
          </div>

         <GoogleButton label="Continue With Google" />

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
