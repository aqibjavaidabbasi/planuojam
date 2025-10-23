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
      if (!form.discount) {
        errors.push(t('errors.flatRateMin'))
      } else if (form.discount.discountType === "Flat Rate") {
        const v = form.discount.flatRatePrice
        if (v == null || Number.isNaN(v) || v < 0) errors.push(t('errors.flatRateMin'))
      } else if (form.discount.discountType === "Percentage") {
        const v = form.discount.percentage
        if (v == null || Number.isNaN(v) || v < 0 || v > 100) errors.push(t('errors.percentageRange'))
      }
    }
    return errors
  }, [form, t])

  function sanitizeHotDeal(values: HotDealForm): HotDealForm {
    const cleanedDiscount = values.discount
      ? {
          discountType: values.discount.discountType,
          flatRatePrice: values.discount.flatRatePrice,
          percentage: values.discount.percentage,
        }
      : undefined
    const cleaned: HotDealForm = {
      enableHotDeal: values.enableHotDeal,
      startDate: values.startDate || undefined,
      lastDate: values.lastDate || undefined,
      dealNote: values.dealNote || undefined,
      discount: cleanedDiscount,
    }
    return cleaned
  }

  const onSubmit = async (values: HotDealForm) => {
    if (values.enableHotDeal) {
      if (validate.length) {
        toast.error(validate[0])
        return
      }
    }
    setSubmitting(true)
    try {
      const payload = sanitizeHotDeal(values)
      await updateListing(listing.documentId, { data: { hotDeal: payload } }, listing.locale)
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
        <h3 className="text-lg font-semibold mb-2">{t('labels.title')}</h3>
        <ToggleButton
          onLabel={t('toggles.yes')}
          offLabel={t('toggles.no')}
          disabled={submitting}
          defaultOn={form.enableHotDeal}
          onToggle={(state) => setValue("enableHotDeal", state, { shouldDirty: true })}
        />
      </div>

      {form.enableHotDeal && (
        <form onSubmit={handleSubmit(onSubmit)} id="hotDealForm" className="flex flex-col gap-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input type="date" label={t('labels.startDate')} disabled={submitting} {...register("startDate", { required: true })} />
            <Input type="date" label={t('labels.lastDate')} disabled={submitting} {...register("lastDate", { required: true })} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input type="text" label={t('labels.dealNote')} disabled={submitting} {...register("dealNote")} />
            <div className="flex items-end">
              <Select
                label={t('labels.discountType')}
                disabled={submitting}
                value={form.discount?.discountType || "Flat Rate"}
                onChange={(e) => setValue("discount.discountType", e.target.value === "Flat Rate" ? "Flat Rate" : "Percentage", { shouldDirty: true })}
                options={[
                  { label: t('labels.flatRate'), value: "Flat Rate" },
                  { label: t('labels.percentage'), value: "Percentage" },
                ]}
              />
            </div>
            {form.discount?.discountType === "Flat Rate" && (
              <Input type="number" label={t('labels.flatRatePrice')} disabled={submitting} {...register("discount.flatRatePrice", { valueAsNumber: true, min: 0 })} />
            )}
            {form.discount?.discountType === "Percentage" && (
              <Input type="number" label={t('labels.percentageValue')} disabled={submitting} {...register("discount.percentage", { valueAsNumber: true, min: 0, max: 100 })} />
            )}
          </div>
          <div className="flex justify-end mt-2">
            <Button style="primary" type="submit" form="hotDealForm" disabled={submitting}>
              {submitting ? t('actions.saving') : t('actions.saveChanges')}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
