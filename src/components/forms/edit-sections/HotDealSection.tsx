"use client"

import React, { useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import Input from "../../custom/Input"
import Select from "../../custom/Select"
import ToggleButton from "../../custom/ToggleButton"
import Button from "../../custom/Button"
import { toast } from "react-hot-toast"
import { updateListing } from "@/services/listing"
import type { ListingItem } from "@/types/pagesTypes"
import { useTranslations } from "next-intl"

export type Discount = {
  discountType: "Flat Rate" | "Percentage"
  flatRatePrice?: number
  percentage?: number
}

export type HotDealForm = {
  enableHotDeal: boolean
  startDate?: string
  lastDate?: string
  dealNote?: string
  discount?: Discount
}

export default function HotDealSection({ listing, onSaved }: { listing: ListingItem; onSaved?: () => void }) {
  const [submitting, setSubmitting] = useState(false)
  const t = useTranslations('hotDealSection')
  const { register, watch, setValue, handleSubmit } = useForm<HotDealForm>({
    defaultValues: {
      enableHotDeal: (listing.hotDeal)?.enableHotDeal ?? false,
      startDate: (listing.hotDeal)?.startDate || "",
      lastDate: (listing.hotDeal)?.lastDate || "",
      dealNote: (listing.hotDeal)?.dealNote || "",
      discount: (listing.hotDeal)?.discount || { discountType: "Flat Rate" },
    },
  })

  const form = watch()

  const validate = useMemo(() => {
    const errors: string[] = []
    if (form.enableHotDeal) {
      if (!form.startDate) errors.push(t('errors.startRequired'))
      if (!form.lastDate) errors.push(t('errors.lastRequired'))
      if (form.discount?.discountType === "Flat Rate") {
        if (form.discount?.flatRatePrice == null || form.discount.flatRatePrice < 0) errors.push(t('errors.flatRateMin'))
      } else if (form.discount?.discountType === "Percentage") {
        if (form.discount?.percentage == null || form.discount.percentage < 0 || form.discount.percentage > 100)
          errors.push(t('errors.percentageRange'))
      }
    }
    return errors
  }, [form, t])

  const onSubmit = async (values: HotDealForm) => {
    if (values.enableHotDeal) {
      if (validate.length) {
        toast.error(validate[0])
        return
      }
    }
    setSubmitting(true)
    try {
      await updateListing(listing.documentId, { data: { hotDeal: values } }, listing.locale)
      toast.success(t('toasts.updated'))
      onSaved?.()
    } catch (e: unknown) {
      toast.error((e as Error)?.message || t('toasts.updateFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="py-4">
      <div className="flex justify-between items-center w-full">
        <h3 className="text-lg font-semibold mb-2">Hot Deal</h3>
        <ToggleButton
          onLabel="YES"
          offLabel="NO"
          disabled={submitting}
          defaultOn={form.enableHotDeal}
          onToggle={(state) => setValue("enableHotDeal", state, { shouldDirty: true })}
        />
      </div>

      {form.enableHotDeal && (
        <form onSubmit={handleSubmit(onSubmit)} id="hotDealForm" className="flex flex-col gap-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input type="date" label="Start Date" disabled={submitting} {...register("startDate", { required: true })} />
            <Input type="date" label="Last Date" disabled={submitting} {...register("lastDate", { required: true })} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input type="text" label="Deal Note" disabled={submitting} {...register("dealNote")} />
            <div className="flex items-end">
              <Select
                label="Discount Type"
                disabled={submitting}
                value={form.discount?.discountType || "Flat Rate"}
                onChange={(e) => setValue("discount.discountType", e.target.value === "Flat Rate" ? "Flat Rate" : "Percentage", { shouldDirty: true })}
                options={[
                  { label: "Flat Rate", value: "Flat Rate" },
                  { label: "Percentage", value: "Percentage" },
                ]}
              />
            </div>
            {form.discount?.discountType === "Flat Rate" && (
              <Input type="number" label="Flat Rate Price" disabled={submitting} {...register("discount.flatRatePrice", { valueAsNumber: true, min: 0 })} />
            )}
            {form.discount?.discountType === "Percentage" && (
              <Input type="number" label="Percentage" disabled={submitting} {...register("discount.percentage", { valueAsNumber: true, min: 0, max: 100 })} />
            )}
          </div>
          <div className="flex justify-end mt-2">
            <Button style="primary" type="submit" form="hotDealForm" disabled={submitting}>
              {submitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
