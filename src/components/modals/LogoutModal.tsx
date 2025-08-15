'use client'
import React from "react";
import Modal from "../custom/Modal";
import Button from "../custom/Button";
import { useAppDispatch } from "@/store/hooks";
import toast from "react-hot-toast";
import { logout } from "@/store/slices/authSlice";
import { TbLogout } from "react-icons/tb";
import { useRouter } from "next/navigation";

function LogoutModalChildren() {
  return (
    <div className="flex flex-col items-center justify-center text-center px-2 py-2">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
        <TbLogout size={36} className="text-red-500" />
      </div>
      <h2 className="text-lg font-semibold mb-2 text-gray-800">Are you sure you want to logout?</h2>
      <p className="text-gray-500 text-sm">
        You will be logged out of your account and redirected to the login page.
      </p>
    </div>
  );
}

interface LogoutModalFooterProps {
    onClose: () => void;
}

function LogoutModalFooter({ onClose }: LogoutModalFooterProps) {
    const dispatch = useAppDispatch();
    const router = useRouter()

    async function logoutUser() {
       dispatch(logout());
       toast.success("Logged out successfully!");
       onClose();
       router.push('/auth/login')
    }

  return (
    <div className="flex w-full items-center justify-end gap-2.5 mt-2">
      <Button style="ghost" onClick={onClose} extraStyles="!px-5 !py-2">Cancel</Button>
      <Button style="destructive" onClick={logoutUser} extraStyles="!px-5 !py-2">Logout</Button>
    </div>
  );
}

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function LogoutModal({ isOpen, onClose }: LogoutModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <span className="flex items-center gap-2">
          <TbLogout className="text-red-500" />
          <span>Logout</span>
        </span>
      }
      footer={<LogoutModalFooter onClose={onClose} />}
      size="sm"
    >
      <LogoutModalChildren />
    </Modal>
  );
}

export default LogoutModal;
