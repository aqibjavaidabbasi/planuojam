"use client"

import React, { useState } from "react"
import { useForm, Controller } from "react-hook-form"
import Input from "../../custom/Input"
import Button from "../../custom/Button"
import { toast } from "react-hot-toast"
import { updateListing } from "@/services/listing"
import type { ListingItem } from "@/types/pagesTypes"
import { useTranslations } from "next-intl"
import PhoneInputField from "@/components/custom/PhoneInputField"
import { isValidPhoneNumber } from "react-phone-number-input"

export type ContactForm = {
  email: string
  phone: string
  address: string
}

export default function ContactSection({ listing, onSaved }: { listing: ListingItem; onSaved?: () => void }) {
  const [submitting, setSubmitting] = useState(false)
  const t=useTranslations("contactSections")
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ContactForm>({
    defaultValues: {
      email: (listing.contact)?.email || "",
      phone: (listing.contact)?.phone && isValidPhoneNumber((listing.contact)?.phone) ? (listing.contact)?.phone : "",
      address: (listing.contact)?.address || "",
    },
  })

  const onSubmit = async (values: ContactForm) => {
    setSubmitting(true)
    try {
      await updateListing(listing.documentId, { data: { contact: values } }, listing.locale)
      toast.success(t("toasts.updated"))
      onSaved?.()
    } catch (e: unknown) {
      toast.error((e as Error)?.message || t("toasts.updateFailed"))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="py-4">
      <h3 className="text-lg font-semibold mb-2">{t("title")}</h3>
      <form onSubmit={handleSubmit(onSubmit)} id="contactForm" className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="col-span-2">
          <Input
            type="email"
            label={t("email")}
            disabled={submitting}
            {...register("email", { required: t("errors.emailRequired"), pattern: { value: /^\S+@\S+$/i, message: t("errors.invalidEmail") } })}
          />
          {errors.email && <p className="text-red-500 text-sm mt-1">{String(errors.email.message)}</p>}
        </div>
        <div>
          <Controller
            name="phone"
            rules={{ required: t("errors.phoneRequired") }}
            control={control}
            render={({ field }) => (
              <PhoneInputField
                label={t("phone")}
                disabled={submitting}
                value={field.value}
                onChange={(val?: string) => field.onChange(val || "")}
              />
            )}
          />
          {errors.phone && <p className="text-red-500 text-sm mt-1">{String(errors.phone.message)}</p>}
        </div>
        <div className="col-span-3">
          <Input type="text" label={t("address")} disabled={submitting} {...register("address", { required: t("errors.addressRequired") })} />
          {errors.address && <p className="text-red-500 text-sm mt-1">{String(errors.address.message)}</p>}
        </div>
        <div className="col-span-3 flex justify-end mt-2">
          <Button style="primary" type="submit" form="contactForm" disabled={submitting}>
            {submitting ? t("saving") : t("savechanges")}
          </Button>
        </div>
      </form>
    </div>
  )
}
