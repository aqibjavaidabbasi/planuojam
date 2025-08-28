"use client"

import React, { useState } from "react"
import { useForm } from "react-hook-form"
import Input from "../../custom/Input"
import Button from "../../custom/Button"
import { toast } from "react-hot-toast"
import { updateListing } from "@/services/listing"
import type { ListingItem } from "@/types/pagesTypes"

export type ContactForm = {
  email: string
  phone: string
  address: string
}

export default function ContactSection({ listing, onSaved }: { listing: ListingItem; onSaved?: () => void }) {
  const [submitting, setSubmitting] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ContactForm>({
    defaultValues: {
      email: (listing.contact as any)?.email || "",
      phone: (listing.contact as any)?.phone || "",
      address: (listing.contact as any)?.address || "",
    },
  })

  const onSubmit = async (values: ContactForm) => {
    setSubmitting(true)
    try {
      await updateListing(listing.documentId, { data: { contact: values } })
      toast.success("Contact updated")
      onSaved?.()
    } catch (e: any) {
      toast.error(e?.message || "Failed to update contact")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="py-4">
      <h3 className="text-lg font-semibold mb-2">Contact</h3>
      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="col-span-2">
          <Input
            type="email"
            label="Email"
            disabled={submitting}
            {...register("email", { required: "Email is required", pattern: { value: /^\S+@\S+$/i, message: "Invalid email format" } })}
          />
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <Input type="text" label="Phone" disabled={submitting} {...register("phone", { required: "Phone is required" })} />
          {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>}
        </div>
        <div className="col-span-3">
          <Input type="text" label="Address" disabled={submitting} {...register("address", { required: "Address is required" })} />
          {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address.message}</p>}
        </div>
        <div className="col-span-3 flex justify-end mt-2">
          <Button style="primary" type="submit" disabled={submitting}>
            {submitting ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  )
}
