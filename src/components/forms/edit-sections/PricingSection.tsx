"use client"

import React, { useState } from "react"
import { useForm, type SubmitHandler } from "react-hook-form"
import Input from "../../custom/Input"
import UrlInput from "../../custom/UrlInput"
import Select from "../../custom/Select"
import Button from "../../custom/Button"
import { FaRegTrashAlt } from "react-icons/fa"
import { toast } from "react-hot-toast"
import { updateListing } from "@/services/listing"
import type { ListingItem } from "@/types/pagesTypes"
import { useTranslations } from "next-intl"

export type PlanFeature = { statement: string }
export type PlanCTA = { bodyText?: string; buttonUrl?: string; style?: "primary" | "secondary" | "ghost" }
export type PricingPlan = {
  name: string
  price: number
  isPopular?: boolean
  cta?: PlanCTA
  featuresList?: PlanFeature[]
}
export type OptionalAddon = { statement: string; price: number }
export type PricingPackagesForm = {
  sectionTitle?: string
  plans: PricingPlan[]
  optionalAddons?: OptionalAddon[]
}

export default function PricingSection({
  listing,
  onSaved,
}: {
  listing: ListingItem
  onSaved?: () => void
}) {
  const [submitting, setSubmitting] = useState(false)
  const form = useForm<PricingPackagesForm>({
    defaultValues: listing.pricingPackages || { sectionTitle: "", plans: [], optionalAddons: [] },
  })

  const addPlan = (plan: PricingPlan) => {
    const current = form.getValues("plans") || []
    form.setValue("plans", [...current, plan], { shouldDirty: true })
  }

  const removePlan = (index: number) => {
    const current = form.getValues("plans") || []
    form.setValue("plans", current.filter((_, i) => i !== index), { shouldDirty: true })
  }

  const addAddon = (addon: OptionalAddon) => {
    const current = form.getValues("optionalAddons") || []
    form.setValue("optionalAddons", [...current, addon], { shouldDirty: true })
  }

  const removeAddon = (index: number) => {
    const current = form.getValues("optionalAddons") || []
    form.setValue("optionalAddons", current.filter((_, i) => i !== index), { shouldDirty: true })
  }

  const onSubmit: SubmitHandler<PricingPackagesForm> = async (values) => {
    setSubmitting(true)
    try {
      // Frontend validation
      if (!values.plans || values.plans.length === 0) {
        throw new Error(t("errors.planRequired"))
      }
      for (const p of values.plans) {
        if (!p.name?.trim()) throw new Error(t("errors.planNameRequired"))
        if (p.price === undefined || p.price === null || isNaN(Number(p.price)) || Number(p.price) < 0) {
          throw new Error(t("errors.nonNegativePrice"))
        }
      }
      for (const a of values.optionalAddons || []) {
        if (!a.statement?.trim()) throw new Error(t("errors.addonStatementRequired"))
        if (a.price === undefined || a.price === null || isNaN(Number(a.price)) || Number(a.price) < 0) {
          throw new Error(t("errors.addonNonNegativePrice"))
        }
      }

      await updateListing(listing.documentId, { data: { pricingPackages: values } }, listing.locale)
      toast.success(t("toasts.updated"))
      onSaved?.()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : t("toasts.updateFailed"))
    } finally {
      setSubmitting(false)
    }
  }

  const isWorking = submitting
  // Subscribe to changes so UI re-renders when items are added/removed/edited
  const plans = form.watch("plans") || []
  const addons = form.watch("optionalAddons") || []
  const t = useTranslations("pricingSection")
  return (
    <div className="py-4">
      <h3 className="text-lg font-semibold mb-2">{t("labels.title")}</h3>
      <form onSubmit={form.handleSubmit(onSubmit)} id="pricingForm" className="flex flex-col gap-4">
        <Input type="text" label={t("sectiontitle")} disabled={isWorking} {...form.register("sectionTitle")} />

        <div className="flex flex-col gap-4 mt-2">
          {plans.map((p, idx) => (
            <div key={idx} className="flex flex-col gap-3">
              <div>
                <Input
                  type="text"
                  label={t("labels.planName")}
                  disabled={isWorking}
                  value={p.name || ""}
                  onChange={(e) => {
                    const list = [...(form.getValues("plans") || [])]
                    list[idx] = { ...list[idx], name: e.target.value }
                    form.setValue("plans", list, { shouldDirty: true })
                  }}
                />
              </div>
              <div>
                <Input
                  type="number"
                  label={t("labels.price")}
                  disabled={isWorking}
                  value={p.price ?? ""}
                  onChange={(e) => {
                    const list = [...(form.getValues("plans") || [])]
                    list[idx] = { ...list[idx], price: Number(e.target.value) }
                    form.setValue("plans", list, { shouldDirty: true })
                  }}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input
                  type="text"
                  label={t("labels.ctaBodyText")}
                  value={p.cta?.bodyText || ""}
                  onChange={(e) => {
                    const list = [...(form.getValues("plans") || [])]
                    list[idx] = { ...list[idx], cta: { ...list[idx].cta, bodyText: e.target.value as string } }
                    form.setValue("plans", list, { shouldDirty: true })
                  }}
                />
                <UrlInput
                  label={t("labels.ctaButtonUrl")}
                  disabled={isWorking}
                  showNormalizedUrl={true}
                  value={p.cta?.buttonUrl || ""}
                  onChange={(e) => {
                    const list = [...(form.getValues("plans") || [])]
                    list[idx] = { ...list[idx], cta: { ...list[idx].cta, buttonUrl: e.target.value as string } }
                    form.setValue("plans", list, { shouldDirty: true })
                  }}
                />
                <Select
                  label={t("labels.ctaStyle")}
                  disabled={isWorking}
                  value={p.cta?.style || "primary"}
                  onChange={(e) => {
                    const list = [...(form.getValues("plans") || [])]
                    list[idx] = { ...list[idx], cta: { ...list[idx].cta, style: e.target.value as "primary" | "secondary" | "ghost" } }
                    form.setValue("plans", list, { shouldDirty: true })
                  }}
                  options={[
                    { label: t("styleOptions.primary"), value: "primary" },
                    { label: t("styleOptions.secondary"), value: "secondary" },
                    { label: t("styleOptions.ghost"), value: "ghost" },
                  ]}
                />
              </div>
              <div>
                <div className="flex flex-col gap-2">
                  <h4 className="text-gray-500 font-medium tracking-wide">{t("labels.features")}</h4>
                  {(p.featuresList || []).map((feature, fIdx) => (
                    <div key={fIdx} className="grid grid-cols-12 items-end gap-2">
                      <div className="col-span-10">
                        <Input
                          type="text"
                          label={`${t("labels.features")} ${fIdx + 1}`}
                          value={feature.statement || ""}
                          onChange={(e) => {
                            const list = [...(form.getValues("plans") || [])]
                            const features = [...(list[idx].featuresList || [])]
                            features[fIdx] = { statement: e.target.value }
                            list[idx] = { ...list[idx], featuresList: features }
                            form.setValue("plans", list, { shouldDirty: true })
                          }}
                        />
                      </div>
                      <div className="col-span-2 flex justify-end">
                        <Button type="button" size="large" style="destructive" disabled={isWorking} onClick={() => {
                          const list = [...(form.getValues("plans") || [])]
                          const features = [...(list[idx].featuresList || [])]
                          features.splice(fIdx, 1)
                          list[idx] = { ...list[idx], featuresList: features }
                          form.setValue("plans", list, { shouldDirty: true })
                        }}>
                          <FaRegTrashAlt />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <div>
                    <Button type="button" style="secondary" disabled={isWorking} onClick={() => {
                      const list = [...(form.getValues("plans") || [])]
                      const features = [...(list[idx].featuresList || []), { statement: "" }]
                      list[idx] = { ...list[idx], featuresList: features }
                      form.setValue("plans", list, { shouldDirty: true })
                    }}>
                      {t("+addfeature")}
                    </Button>
                  </div>
                </div>
              </div>
              <div>
                <Button type="button" style="destructive" disabled={isWorking} size="large" onClick={() => removePlan(idx)}>
                  {t("labels.deletePlan")} <FaRegTrashAlt />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-2">
          <Button
            type="button"
            style="secondary"
            disabled={isWorking}
            onClick={() =>
              addPlan({
                name: "",
                price: 0,
                isPopular: false,
                cta: {
                  bodyText: "",
                  buttonUrl: "",
                  style: "primary",
                },
                featuresList: [],
              })
            }
          >
            {t("+addplan")}
          </Button>
        </div>

        <div className="mt-4">
          <h4 className="text-gray-500 font-medium tracking-wide">{t("optionaladdons")}:</h4>
          {addons.map((addon, idx) => (
            <div key={idx} className="flex flex-col gap-2 mb-2">
              <Input
                type="text"
                label={`${t("labels.addonStatement")} ${idx + 1}`}
                disabled={isWorking}
                value={addon.statement || ""}
                onChange={(e) => {
                  const list = [...(form.getValues("optionalAddons") || [])]
                  list[idx] = { ...list[idx], statement: e.target.value }
                  form.setValue("optionalAddons", list, { shouldDirty: true })
                }}
              />
              <div className="flex gap-2 items-end">
                <Input
                  type="number"
                  label={`${t("labels.addonPrice")} ${idx + 1}`}
                  disabled={isWorking}
                  value={addon.price ?? ""}
                  onChange={(e) => {
                    const list = [...(form.getValues("optionalAddons") || [])]
                    list[idx] = { ...list[idx], price: Number(e.target.value) }
                    form.setValue("optionalAddons", list, { shouldDirty: true })
                  }}
                />
                <Button type="button" style="destructive" size="large" disabled={isWorking} onClick={() => removeAddon(idx)}>
                  <FaRegTrashAlt />
                </Button>
              </div>
            </div>
          ))}
          <Button
            type="button"
            style="secondary"
            disabled={isWorking}
            onClick={() =>
              addAddon({
                statement: "",
                price: 0,
              })
            }
          >
            {t("+addoptionaladdon")}
          </Button>
        </div>

        <div className="flex justify-end mt-6">
          <Button style="primary" form="pricingForm" disabled={isWorking} type="submit">
            {submitting ? t("saving") : t("savechanges")}
          </Button>
        </div>
      </form>
    </div>
  )
}
