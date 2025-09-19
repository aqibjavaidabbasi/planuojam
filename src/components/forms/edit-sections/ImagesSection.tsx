"use client"

import React, { useState } from "react"
import Button from "../../custom/Button"
import ImageUploader from "../../custom/ImageUploader"
import { toast } from "react-hot-toast"
import { updateListing } from "@/services/listing"
import type { ListingItem } from "@/types/pagesTypes"
import Image from "next/image"
import { getCompleteImageUrl } from "@/utils/helpers"
import { useTranslations } from "next-intl"
import Modal from "@/components/custom/Modal"
import { FaTrash } from "react-icons/fa6"

export default function ImagesSection({ listing, onSaved }: { listing: ListingItem; onSaved?: () => void }) {
  const [imageIds, setImageIds] = useState<number[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [imageToDelete, setImageToDelete] = useState<{ id: number; url?: string } | null>(null)
  const t=useTranslations("ImageSection")
  const onSubmit = async () => {
    if (imageIds.length === 0) {
      toast.error(t("errors.noImage"))
      return
    }
    setSubmitting(true)
    try {
      //persist existing images
      const finalImageArray = [...listing.portfolio?.map(img => img.id) ?? [], ...imageIds]
      await updateListing(listing.documentId, { data: { portfolio: finalImageArray } }, listing.locale)
      toast.success(t("toasts.saved"))
      onSaved?.()
      setImageIds([])
    } catch (e: unknown) {
      toast.error((e as Error)?.message || t("toasts.saveFailed"))
    } finally {
      setSubmitting(false)
    }
  }

  const handleRequestDelete = (img: { id: number; url?: string }) => {
    setImageToDelete(img)
    setIsConfirmOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!imageToDelete) return
    setDeleting(true)
    try {
      const remainingIds = listing.portfolio?.map(img => img.id).filter(id => id !== imageToDelete.id) ?? []
      await updateListing(listing.documentId, { data: { portfolio: remainingIds } }, listing.locale)
      toast.success(t("toasts.removed"))
      setIsConfirmOpen(false)
      setImageToDelete(null)
      onSaved?.()
    } catch (e: unknown) {
      toast.error((e as Error)?.message || t("toasts.removeFailed"))
    } finally {
      setDeleting(false)
    }
  }
 
  return (
    <div className="py-4">
      <p className="text-sm text-gray-600 mb-2">{t("uploadHint", { size: "20MB" })}</p>
      <div className="flex gap-2 items-center ">
        {listing.portfolio?.map((image, id) => {
          const imagePath = getCompleteImageUrl(image.url);
          return (
            <div key={id} className="relative group">
              <Image src={imagePath} alt="Portfolio image" width={200} height={200} className="rounded" />
              <Button
                style="destructive"
                extraStyles="absolute top-1 right-1 opacity-90 group-hover:opacity-100 !p-2 !rounded-full"
                onClick={() => handleRequestDelete({ id: image.id, url: image.url })}
                aria-label="Delete image"
              >
                <FaTrash />
              </Button>
            </div>
          )
        })}
      </div>
      <h3 className="text-lg font-semibold mb-2">{t("addportfolioimages")}</h3>
      <div className="flex flex-col gap-2">
        <ImageUploader setImageIds={setImageIds} disabled={submitting} />
        {imageIds.length > 0 && <p className="text-gray-500 font-medium text-sm">{t("readyToSave", { count: imageIds.length })}</p>}
        <div className="flex justify-end mt-2">
          <Button style="primary" onClick={onSubmit} disabled={submitting}>
            {submitting ? t("saving"): t("saveImages")}
          </Button>
        </div>
      </div>

      <Modal
        isOpen={isConfirmOpen}
        onClose={() => !deleting && setIsConfirmOpen(false)}
        title={t("modal.deleteTitle")}
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button style="secondary" onClick={() => setIsConfirmOpen(false)} disabled={deleting}>
              {t("modal.cancel")}
            </Button>
            <Button style="destructive" onClick={handleConfirmDelete} disabled={deleting}>
              {deleting ? t("modal.deleting") : t("modal.delete")}
            </Button>
          </div>
        }
      >
        <p>{t("modal.confirm")}</p>
      </Modal>
    </div>
  )
}
