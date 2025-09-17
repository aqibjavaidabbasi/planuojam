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

export default function ImagesSection({ listing, onSaved }: { listing: ListingItem; onSaved?: () => void }) {
  const [imageIds, setImageIds] = useState<number[]>([])
  const [submitting, setSubmitting] = useState(false)
  const t=useTranslations("ImageSection")
  const onSubmit = async () => {
    if (imageIds.length === 0) {
      toast.error("Please upload at least one image")
      return
    }
    setSubmitting(true)
    try {
      await updateListing(listing.documentId, { data: { portfolio: imageIds } })
      toast.success("Images saved")
      onSaved?.()
      setImageIds([])
    } catch (e: unknown) {
      toast.error((e as Error)?.message || "Failed to save images")
    } finally {
      setSubmitting(false)
    }
  }

  console.log(listing.portfolio)
 
  return (
    <div className="py-4">
      <div className="flex gap-2 items-center ">
        {listing.portfolio?.map((image, id) => {
          const imagePath = getCompleteImageUrl(image.url); 
          return <Image key={id} src={imagePath} alt="Portfolio image" width={200} height={200} />
        })}
      </div>
      <h3 className="text-lg font-semibold mb-2">{t("addportfolioimages")}</h3>
      <div className="flex flex-col gap-2">
        <ImageUploader setImageIds={setImageIds} disabled={submitting} />
        {imageIds.length > 0 && <p className="text-gray-500 font-medium text-sm">{imageIds.length} image(s) ready to save</p>}
        <div className="flex justify-end mt-2">
          <Button style="primary" onClick={onSubmit} disabled={submitting}>
            {submitting ? t("saving"): t("saveImages")}
          </Button>
        </div>
      </div>
    </div>
  )
}
