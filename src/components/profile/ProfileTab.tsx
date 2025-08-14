import React from "react";
import Input from "../custom/Input";
import Button from "../ui/Button";
import { User } from "@/types/common";
import { TbLogout } from "react-icons/tb";

function ProfileTab({ user }: { user: User | null }) {
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
        <Button style="destructive">
          <TbLogout size={20} className="mr-3" />
          Logout
        </Button>
      </div>

      <div className="max-w-2xl">
        <form className="space-y-6">
          <div>
            <Input
              type="text"
              placeholder="username"
              label="username"
              defaultValue={user?.username}
            />
          </div>
          <div>
            <Input
              type="email"
              placeholder="email@email.com"
              label="Email"
              disabled
              defaultValue={user?.email}
            />
          </div>
          <Button style="primary" extraStyles="!rounded-md" type="submit">
            Save Changes
          </Button>
        </form>
        {/* Password Update Section */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Update Password
          </h2>
          <form className="space-y-4">
            <Input
              type="password"
              label="current password"
              placeholder="Enter your current password"
            />
            <Input
              type="password"
              label="New password"
              placeholder="Enter your new password"
            />
            <Input
              type="password"
              label="Confirm password"
              placeholder="Confirm your new password"
            />
            <Button style="primary" extraStyles="!rounded-md" type="submit">
              Update password
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ProfileTab;
