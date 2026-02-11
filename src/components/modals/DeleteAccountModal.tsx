'use client'
import React, { useState } from "react";
import Modal from "../custom/Modal";
import Button from "../custom/Button";
import toast from "react-hot-toast";
import { AiOutlineWarning } from "react-icons/ai";
import { useTranslations } from "next-intl";



// function DeleteAccountModalChildren()... (unchanged)

interface DeleteAccountModalFooterProps {
    onClose: () => void;
}

function DeleteAccountModalFooter({ onClose }: DeleteAccountModalFooterProps) {
    const t = useTranslations('Modals.DeleteAccount')
    const [loading, setLoading] = useState(false);

    async function handleDelete() {
       setLoading(true);
       try {
         const { deleteAccount } = await import('@/services/authCustom');
         await deleteAccount();
         toast.success(t('toasts.deleted'));
         // Force hard reload or redirect to ensure state is cleared
         window.location.href = '/'; 
       } catch {
         toast.error(t('toasts.deleteFailed'));
       } finally {
         setLoading(false);
         onClose();
       }
    }

  return (
    <div className="flex w-full items-center justify-end gap-2.5 mt-2">
      <Button style="ghost" onClick={onClose} extraStyles="!px-5 !py-2" disabled={loading}>{t('cancel')}</Button>
      <Button style="destructive" onClick={handleDelete} extraStyles="!px-5 !py-2" disabled={loading}>{loading ? '...' : t('deleteCta')}</Button>
    </div>
  );
}

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function DeleteAccountModal({ isOpen, onClose }: DeleteAccountModalProps) {
  const t = useTranslations('Modals.DeleteAccount')
  
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <AiOutlineWarning className="text-red-500" />
          <span>{t('title')}</span>
        </div>
      }
      footer={<DeleteAccountModalFooter onClose={onClose} />}
      size="sm"
    >
      <div className="flex flex-col items-center justify-center text-center px-4 py-4">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
          <AiOutlineWarning size={36} className="text-red-500" />
        </div>
        <h2 className="text-lg font-semibold mb-2 text-gray-800">{t('confirmTitle')}</h2>
        <p className="text-gray-500 text-sm whitespace-pre-wrap">{t('confirmDesc')}</p>
      </div>
    </Modal>
  );
}

export default DeleteAccountModal;
