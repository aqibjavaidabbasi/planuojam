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

function ProfileTab({ user }: { user: User | null }) {
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const [username, setUsername] = useState("");
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, watch, formState: {errors}, reset } = useForm()

  useEffect(function(){
    setUsername(user?.username ?? "");
  }, [user]);

  async function updateUsername(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!user) return;
    if (!username?.trim()) {
      toast.error("Username can not be empty");
      return;
    }
    if (username === user?.username) {
      return;
    }

    setLoading(true);
    await toast.promise(
      dispatch(updateUser({ id: user.id, username })).unwrap(),
      {
        loading: "Updating username...",
        success: "Username updated successfully",
        error: (err: any) =>
          (err && typeof err === "object" && "message" in err)
            ? String((err as any).message)
            : "Failed to update username",
      }
    ).finally(() => setLoading(false));
  }

  async function handlePasswordUpdate(data: any) {
    if (!user) {
      toast.error("User not found");
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
          loading: "Updating password...",
          success: "Password updated successfully",
          error: (err: any) =>
            err?.message || "Failed to update password",
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
          <h1 className="text-2xl font-bold text-gray-800">Profile Settings</h1>
          <p className="text-gray-600 mt-2">
            Manage your personal information and password.
          </p>
        </div>
        {/* Logout Button */}
        <Button
          style="destructive"
          onClick={()=>setIsLogoutModalOpen(true)}
          disabled={loading}
        >
          <TbLogout size={20} className="mr-3" />
          Logout
        </Button>
      </div>

      <div className="max-w-2xl">
        <form className="flex gap-3 items-end w-full" onSubmit={updateUsername}>
          <div className="w-full">
            <Input
              type="text"
              placeholder="username"
              label="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
            />
          </div>
          <Button
            style="primary"
            type='submit'
            extraStyles="!rounded-md !whitespace-nowrap"
            disabled={loading}
          >
            Save Username
          </Button>
        </form>
        {/* Password Update Section */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Update Password
          </h2>
          <form className="space-y-4" onSubmit={handleSubmit(handlePasswordUpdate)}>
            <Input
              type="password"
              label="Current password"
              placeholder="Enter your current password"
              {...register('currentPassword', {
                required: "Current password is required",
                minLength: {
                  value: 8,
                  message: "Password must be at least 8 characters"
                }
              })}
              disabled={loading}
            />
            {errors.currentPassword && (
              <p className="text-red-500 text-sm mt-1">
                {errors.currentPassword.message as string}
              </p>
            )}
            <Input
              type="password"
              label="New password"
              placeholder="Enter your new password"
              {...register('password', {
                required: "A new password is required",
                minLength: {
                  value: 8,
                  message: "Password must be at least 8 characters"
                }
              })}
              disabled={loading}
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">
                {errors.password.message as string}
              </p>
            )}
            <Input
              type="password"
              label="Confirm password"
              placeholder="Confirm your new password"
              disabled={loading}
              {...register('passwordConfirmation', {
                required: "Password confirm is required",
                minLength: {
                  value: 8,
                  message: "Password must be at least 8 characters"
                },
                validate: (value) =>
                  value === watch('password') || "Passwords do not match"
              })}
            />
            {errors.passwordConfirmation && (
              <p className="text-red-500 text-sm mt-1">
                {errors.passwordConfirmation.message as string}
              </p>
            )}
            <Button
              style="primary"
              extraStyles="!rounded-md"
              type="submit"
              disabled={loading}
            >
              Update password
            </Button>
          </form>
        </div>
      </div>

      <LogoutModal isOpen={isLogoutModalOpen} onClose={()=>setIsLogoutModalOpen(false)} />
    </div>
  );
}

export default ProfileTab;
