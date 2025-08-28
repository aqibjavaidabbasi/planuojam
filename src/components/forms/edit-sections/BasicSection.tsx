"use client"

import React, { useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import Input from "../../custom/Input"
import TextArea from "../../custom/TextArea"
import Select from "../../custom/Select"
import Checkbox from "../../custom/Checkbox"
import Button from "../../custom/Button"
import { toast } from "react-hot-toast"
import { updateListing } from "@/services/listing"
import type { ListingItem } from "@/types/pagesTypes"

export type BasicForm = {
  title: string
  type: string
  listingStatus: "draft" | "published" | "pending review" | "archived"
  price?: number
  featured?: boolean
  description: string
  websiteLink?: string
  workingHours?: number
}

export default function BasicSection({ listing, onSaved }: { listing: ListingItem; onSaved?: () => void }) {
  const [submitting, setSubmitting] = useState(false)

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<BasicForm>({
    defaultValues: {
      title: listing.title || "",
      type: (listing.type as any) || "vendor",
      listingStatus: (listing.listingStatus as any) || "draft",
      price: (listing.price as any) ?? undefined,
      featured: listing.featured || false,
      description: listing.description || "",
      websiteLink: listing.websiteLink || "",
      workingHours: (listing.workingHours as any) ?? undefined,
    },
  })

  const onSubmit = async (values: BasicForm) => {
    setSubmitting(true)
    try {
      const payload: any = { ...values }
      delete payload.listingStatus;
      delete payload.type;
      if (values.websiteLink === "") delete payload.websiteLink
      if (values.price == null || isNaN(values.price as any)) delete payload.price
      if (values.workingHours == null || isNaN(values.workingHours as any)) delete payload.workingHours
      await updateListing(listing.documentId, { data: payload })
      toast.success("Basic details updated")
      onSaved?.()
    } catch (e: any) {
      toast.error(e?.message || "Failed to update basic details")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="py-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="col-span-2">
          <h3 className="text-lg font-semibold mb-2">Basic Details</h3>
        </div>
        <div className="col-span-2">
          <Input type="text" label="Title" disabled={submitting} required {...register("title", { required: "Title is required" })} />
          {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
        </div>
        <div>
          <Select
            disabled
            value={listing.type}
            options={[{ label: listing.type, value: listing.type }]}
          />
          {errors.type && <p className="text-red-500 text-sm mt-1">{errors.type.message as any}</p>}
        </div>
        <div>
          <Select
            disabled={listing.listingStatus === "published" || listing.listingStatus === "rejected" || submitting}
            {...register("listingStatus", { required: "Listing status is required" })}
            options={[
              { label: "Draft", value: "draft" },
              { label: "Published", value: "published" },
              { label: "Pending Review", value: "pending review" },
              { label: "Rejected", value: "rejected" },
            ]}
          />
          {errors.listingStatus && <p className="text-red-500 text-sm mt-1">{errors.listingStatus.message as any}</p>}
        </div>
        <div>
          <Input type="number" label="Price" disabled={submitting} {...register("price", { valueAsNumber: true, min: { value: 0, message: "Price must be positive" } })} />
          {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price.message as any}</p>}
        </div>
        <div className="flex items-center mt-6">
          <Checkbox label="Featured" checked={!!watch("featured")} onChange={(e) => setValue("featured", e.target.checked)} disabled={submitting} />
        </div>
        <div className="col-span-2">
          <TextArea label="Description" placeholder="Description" rows={4} disabled={submitting} {...register("description", { required: "Description is required" })} />
          {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message as any}</p>}
        </div>
        <div>
          <Input type="url" label="Website Link" disabled={submitting} {...register("websiteLink", { pattern: { value: /^https?:\/\/.+/, message: "Please enter a valid URL" } })} />
          {errors.websiteLink && <p className="text-red-500 text-sm mt-1">{errors.websiteLink.message as any}</p>}
        </div>
        <div>
          <Input type="number" label="Working Hours (per day)" disabled={submitting} {...register("workingHours", { valueAsNumber: true, min: { value: 1, message: "Min 1" }, max: { value: 24, message: "Max 24" } })} />
          {errors.workingHours && <p className="text-red-500 text-sm mt-1">{errors.workingHours.message as any}</p>}
        </div>
      </div>
      <div className="flex justify-end mt-4">
        <Button style="primary" onClick={handleSubmit(onSubmit)} disabled={submitting}>
          {submitting ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  )
}
