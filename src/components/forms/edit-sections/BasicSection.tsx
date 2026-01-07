"use client"

import React, { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import Input from "../../custom/Input"
import UrlInput from "../../custom/UrlInput"
import TextArea from "../../custom/TextArea"
import Select from "../../custom/Select"
import Button from "../../custom/Button"
import { toast } from "react-hot-toast"
import { updateListing } from "@/services/listing"
import { fetchTagsByIds } from "@/services/tags"
import type { ListingItem } from "@/types/pagesTypes"
import { useTranslations, useLocale } from "use-intl"
import { StripeProductAttributes } from "@/app/api/stripe-products/route"
import TagInput from "../../custom/TagInput"

export type BasicForm = {
  title: string
  price?: number
  description: string;
  tagDocumentIds: string[]
  videos: { url: string }[]
  websiteLink?: string
  workingSchedule?: { day: "" | "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday"; start: string; end: string }[]
}

export default function BasicSection({ listing, onSaved }: { listing: ListingItem; onSaved?: () => void }) {
  const [submitting, setSubmitting] = useState(false)
  const [priceRange, setPriceRange] = useState<{ min: number; max: number } | null>(null)
  const [loadingSubscription, setLoadingSubscription] = useState(true)
  const t = useTranslations("basicSelectionForm")
  const tModal = useTranslations("Modals.ListingItem")
  const locale = useLocale()

  const { register, handleSubmit, watch, setValue, getValues, formState: { errors } } = useForm<BasicForm>({
    defaultValues: {
      title: listing.title || "",
      price: (listing.price as number) ?? undefined,
      description: listing.description || "",
      tagDocumentIds: listing.tagDocumentIds || [],
      videos: listing.videos || [],
      websiteLink: listing.websiteLink || "",
      workingSchedule: listing.workingSchedule || [],
    },
  })


  // Populate tags if listing has tagDocumentIds
  useEffect(() => {
    const populateTags = async () => {
      if (listing?.tagDocumentIds?.length) {
        try {
          const tags = await fetchTagsByIds(listing.tagDocumentIds as string[], locale);
          // Update the listing object with populated tags
          listing.tags = tags;
        } catch (error) {
          console.error("Error populating tags:", error);
        }
      }
    };
    populateTags();
  }, [listing, locale]);

  // Fetch active subscription and price range
  useEffect(() => {
    const fetchSubscriptionPriceRange = async () => {
      try {
        setLoadingSubscription(true)
        // Fetch active subscription for this listing
        const subResponse = await fetch(`/api/subscription-status?listingDocId=${listing.documentId}`)
        const subData = await subResponse.json()

        if (subData.hasActiveSubscription && subData.subscriptions?.length > 0) {
          const subscription = subData.subscriptions[0]
          const stripePriceId = subscription.stripePriceId

          // Fetch all stripe products to find matching price range
          const productsResponse = await fetch('/api/stripe-products')
          const productsData = await productsResponse.json()
          const products: StripeProductAttributes[] = Array.isArray(productsData) ? productsData : productsData.data || []

          // Find the product that matches the subscription's price ID
          const matchingProduct = products.find(p => p.stripePriceId === stripePriceId)

          if (matchingProduct) {
            const min = matchingProduct.minListingPrice ?? 0
            const max = matchingProduct.maxListingPrice ?? Infinity
            setPriceRange({ min, max })
          }
        }
      } catch (error) {
        console.error("Error fetching subscription:", error)
      } finally {
        setLoadingSubscription(false)
      }
    }

    fetchSubscriptionPriceRange()
  }, [listing.documentId, locale])

  function timeToMinutes(t: string) {
    const [h, m] = (t || "").split(":").map(Number)
    if (Number.isNaN(h) || Number.isNaN(m)) return NaN
    return h * 60 + m
  }

  const onSubmit = async (values: BasicForm) => {
    setSubmitting(true)
    try {
      const payload = {
        ...values,
      }
      if (values.videos) {
        payload.videos = values.videos.map(({ url }) => ({ url }));
      }
      if (values.websiteLink === "") delete payload.websiteLink
      if (values.price == null || isNaN(values.price)) delete payload.price
      
      // Validate price against subscription range
      if (priceRange && values.price != null && !isNaN(values.price)) {
        if (values.price < priceRange.min) {
          setSubmitting(false)
          return toast.error(t("errors.priceBelowMin", { min: priceRange.min, default: `Price must be at least ${priceRange.min}` }))
        }
        if (values.price > priceRange.max) {
          setSubmitting(false)
          return toast.error(t("errors.priceAboveMax", { max: priceRange.max, default: `Price must not exceed ${priceRange.max}` }))
        }
      }
      // validate workingSchedule
      if (Array.isArray(values.workingSchedule)) {
        for (const item of values.workingSchedule) {
          if (!item?.day || !item?.start || !item?.end) {
            setSubmitting(false)
            return toast.error(tModal("workingSchedule.errors.completeAll", { default: "Please complete all working schedule fields." }))
          }
          const s = timeToMinutes(item.start)
          const e = timeToMinutes(item.end)
          if (Number.isNaN(s) || Number.isNaN(e)) {
            setSubmitting(false)
            return toast.error(tModal("workingSchedule.errors.invalidTime", { default: "Invalid time format in working schedule." }))
          }
          if (s >= e) {
            setSubmitting(false)
            return toast.error(tModal("workingSchedule.errors.startBeforeEnd", { default: "Start time must be earlier than end time." }))
          }
        }
        // conflict check per day
        const byDay: Record<string, { s: number; e: number }[]> = {}
        values.workingSchedule.forEach(({ day, start, end }) => {
          const s = timeToMinutes(start)
          const e = timeToMinutes(end)
          byDay[day] = byDay[day] || []
          byDay[day].push({ s, e })
        })
        for (const day of Object.keys(byDay)) {
          const ranges = byDay[day].sort((a, b) => a.s - b.s)
          for (let i = 1; i < ranges.length; i++) {
            const prev = ranges[i - 1]
            const cur = ranges[i]
            if (cur.s < prev.e) {
              setSubmitting(false)
              return toast.error(tModal("workingSchedule.errors.conflictDay", { default: `Conflicting schedule entries on ${day}.`, day }))
            }
          }
        }
        // normalize time format to HH:mm:ss.SSS for backend
        const pad2 = (n: number) => String(n).padStart(2, '0')
        const norm = (t: string) => {
          const parts = (t || '').split(':')
          const hh = parts[0] || '00'
          const mm = parts[1] || '00'
          let ss = '00'
          let ms = '000'
          if (parts[2]) {
            const sub = parts[2].split('.')
            ss = sub[0] || '00'
            ms = (sub[1] || '000').slice(0, 3).padEnd(3, '0')
          }
          return `${pad2(Number(hh))}:${pad2(Number(mm))}:${pad2(Number(ss))}.${ms}`
        }
        payload.workingSchedule = values.workingSchedule.map(w => ({
          day: w.day,
          start: norm(w.start),
          end: norm(w.end),
        }))
      }
      await updateListing(listing.documentId, { data: payload }, listing.locale)
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
      <div className="flex flex-col gap-4">
          <h3 className="text-lg font-semibold mb-2">{t("basicDetails")}</h3>
        <div>
          <Input type="text" label={t("title")} disabled={submitting} required {...register("title", { required: t("errors.titleRequired") })} />
          {errors.title && (<p className="text-red-500 text-sm mt-1">{String(errors.title.message)}</p>)}
        </div>
        <div>
          <Input 
            type="number" 
            label={t("price")} 
            disabled={submitting || loadingSubscription} 
            {...register("price", { 
              valueAsNumber: true, 
              min: { value: priceRange?.min ?? 0, message: t("errors.pricePositive") },
              max: priceRange && priceRange.max !== Infinity ? { value: priceRange.max, message: t("errors.priceAboveMax", { max: priceRange.max }) } : undefined
            })} 
          />
          {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price.message}</p>}
          {priceRange && !loadingSubscription && (
            <p className="text-blue-600 text-xs mt-1">
              {t("priceRangeHint", { 
                min: priceRange.min, 
                max: priceRange.max === Infinity ? "∞" : priceRange.max,
                default: `Allowed range: ${priceRange.min} - ${priceRange.max === Infinity ? "∞" : priceRange.max}` 
              })}
            </p>
          )}
          {loadingSubscription && (
            <p className="text-gray-500 text-xs mt-1">{t("loadingPriceRange", { default: "Loading price constraints..." })}</p>
          )}
        </div>
        <div className="col-span-2">
          <TextArea 
            label={t("description")} 
            placeholder={t("titleDescription")} 
            rows={4} 
            disabled={submitting} 
            required
            {...register("description", { required: t("errors.descriptionRequired") })} 
          />
          {errors.description && <p className="text-red-500 text-sm mt-1">{String(errors.description.message)}</p>}
        </div>
        <div className="col-span-2" >
          <UrlInput
            label={t('websitelink')}
            disabled={submitting}
            showNormalizedUrl={true}
            {...register("websiteLink")}
          />
        </div>
        {/* Tags Section */}
        <div className="col-span-2">
          <label className="block text-sm font-medium mb-1">{t("tags") || "Tags"}</label>
          <TagInput
            selectedTagIds={watch("tagDocumentIds") || []}
            onTagsChange={(tagIds) => setValue("tagDocumentIds", tagIds, { shouldDirty: true })}
            disabled={submitting}
            maxTags={10}
            locale={locale}
          />
        </div>
        
        {/* Videos Section */}
        <div className="col-span-2">
          <label className="block text-sm font-medium mb-1">{t("videos") || "Videos"}</label>
          <div className="space-y-2">
            {watch("videos")?.map((video, idx) => (
              <div key={idx} className="flex gap-2">
                <Input
                  type="url"
                  placeholder={t("videoUrlPlaceholder") || "YouTube URL..."}
                  {...register(`videos.${idx}.url`, {
                    pattern: {
                      value: /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/,
                      message: t("errors.invalidYouTubeUrl") || "Invalid YouTube URL"
                    }
                  })}
                />
                <Button
                  type="button"
                  style="secondary"
                  onClick={() => {
                    const currentVideos = getValues("videos") || []
                    setValue("videos", currentVideos.filter((_, i) => i !== idx), { shouldDirty: true })
                  }}
                >
                  {t("remove") || "Remove"}
                </Button>
              </div>
            ))}
            {(watch("videos") || []).length < 5 && (
              <Button
                type="button"
                style="secondary"
                onClick={() => {
                  const currentVideos = getValues("videos") || []
                  setValue("videos", [...currentVideos, { url: "" }], { shouldDirty: true })
                }}
              >
                {t("addVideo") || "Add Video"}
              </Button>
            )}
          </div>
        </div>
        {/* Working Schedule Editor */}
        <div className="col-span-2">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium">{tModal('workingSchedule.title', { default: 'Working schedule' })}</h4>
            <Button type="button" style="secondary" disabled={submitting} onClick={() => {
              const current = getValues('workingSchedule') || []
              setValue('workingSchedule', [...current, { day: '', start: '', end: '' }], { shouldDirty: true })
            }}>
              {tModal('workingSchedule.add', { default: 'Add entry' })}
            </Button>
          </div>
          {(watch('workingSchedule') || []).map((it, idx) => (
            <div key={idx} className="grid grid-cols-1 md:grid-cols-7 gap-3 items-end mb-2">
              <div className="md:col-span-3">
                <Select
                  label={tModal('workingSchedule.day')}
                  disabled={submitting}
                  value={it?.day || ''}
                  onChange={(e) => {
                    const current = getValues('workingSchedule') || []
                    const updated = [...current]
                    updated[idx] = { ...(updated[idx] || {}), day: e.target.value as "" | "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday" }
                    setValue('workingSchedule', updated, { shouldDirty: true })
                  }}
                  options={[
                    { label: tModal('workingSchedule.placeholder', { default: 'Select day' }) as string, value: '' },
                    { label: tModal('days.monday', { default: 'Monday' }), value: 'monday' },
                    { label: tModal('days.tuesday', { default: 'Tuesday' }), value: 'tuesday' },
                    { label: tModal('days.wednesday', { default: 'Wednesday' }), value: 'wednesday' },
                    { label: tModal('days.thursday', { default: 'Thursday' }), value: 'thursday' },
                    { label: tModal('days.friday', { default: 'Friday' }), value: 'friday' },
                    { label: tModal('days.saturday', { default: 'Saturday' }), value: 'saturday' },
                    { label: tModal('days.sunday', { default: 'Sunday' }), value: 'sunday' },
                  ]}
                />
              </div>
              <div className="md:col-span-2">
                <Input
                  type="time"
                  label={tModal('workingSchedule.start', { default: 'Start' })}
                  disabled={submitting}
                  value={it?.start || ''}
                  onChange={(e) => {
                    const current = getValues('workingSchedule') || []
                    const updated = [...current]
                    updated[idx] = { ...(updated[idx] || {}), start: e.target.value }
                    setValue('workingSchedule', updated, { shouldDirty: true })
                  }}
                />
              </div>
              <div className="md:col-span-2">
                <Input
                  type="time"
                  label={tModal('workingSchedule.end', { default: 'End' })}
                  disabled={submitting}
                  value={it?.end || ''}
                  onChange={(e) => {
                    const current = getValues('workingSchedule') || []
                    const updated = [...current]
                    updated[idx] = { ...(updated[idx] || {}), end: e.target.value }
                    setValue('workingSchedule', updated, { shouldDirty: true })
                  }}
                />
              </div>
              <div className="md:col-span-1">
                <Button type="button" style="ghost" disabled={submitting} onClick={() => {
                  const current = getValues('workingSchedule') || []
                  const updated = current.filter((_, i) => i !== idx)
                  setValue('workingSchedule', updated, { shouldDirty: true })
                }}>
                  {tModal('buttons.remove', { default: 'Remove' })}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-end mt-4">
        <Button style="primary" onClick={handleSubmit(onSubmit)} disabled={submitting}>
          {submitting ? t("saving") : t("savechanges")}
        </Button>
      </div>
    </div>
  )
}
