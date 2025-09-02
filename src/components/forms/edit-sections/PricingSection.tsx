"use client"

import React, { useState } from "react"
import { useForm, type SubmitHandler } from "react-hook-form"
import Input from "../../custom/Input"
import Select from "../../custom/Select"
import Button from "../../custom/Button"
import ToggleButton from "../../custom/ToggleButton"
import { FaRegTrashAlt } from "react-icons/fa"
import { toast } from "react-hot-toast"
import { updateListing } from "@/services/listing"
import type { ListingItem } from "@/types/pagesTypes"

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
        throw new Error("Please add at least one plan")
      }
      for (const p of values.plans) {
        if (!p.name?.trim()) throw new Error("Each plan must have a name")
        if (p.price === undefined || p.price === null || isNaN(Number(p.price)) || Number(p.price) < 0) {
          throw new Error("Each plan must have a non-negative price")
        }
        if (p.cta?.buttonUrl && !/^https?:\/\//.test(p.cta.buttonUrl)) {
          throw new Error("CTA Button URL must be a valid URL starting with http or https")
        }
      }
      for (const a of values.optionalAddons || []) {
        if (!a.statement?.trim()) throw new Error("Each addon must have a statement")
        if (a.price === undefined || a.price === null || isNaN(Number(a.price)) || Number(a.price) < 0) {
          throw new Error("Each addon must have a non-negative price")
        }
      }

      await updateListing(listing.documentId, { data: { pricingPackages: values } })
      toast.success("Pricing updated")
      onSaved?.()
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to update pricing"
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  const isWorking = submitting
  const plans = form.getValues("plans") || []
  const addons = form.getValues("optionalAddons") || []

  return (
    <div className="py-4">
      <h3 className="text-lg font-semibold mb-2">Pricing Packages</h3>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input type="text" label="Section Title" disabled={isWorking} {...form.register("sectionTitle")} />

        <div className="flex flex-col gap-4 mt-2">
          {plans.map((p, idx) => (
            <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
              <div className="col-span-2">
                <Input
                  type="text"
                  label="Plan Name"
                  disabled={isWorking}
                  value={p.name || ""}
                  onChange={(e) => {
                    const list = [...(form.getValues("plans") || [])]
                    list[idx] = { ...list[idx], name: e.target.value }
                    form.setValue("plans", list, { shouldDirty: true })
                  }}
                />
              </div>
              <div className="col-span-1">
                <Input
                  type="number"
                  label="Price"
                  disabled={isWorking}
                  value={p.price ?? ""}
                  onChange={(e) => {
                    const list = [...(form.getValues("plans") || [])]
                    list[idx] = { ...list[idx], price: Number(e.target.value) }
                    form.setValue("plans", list, { shouldDirty: true })
                  }}
                />
              </div>
              <div className="col-span-1 flex items-center justify-end gap-2">
                <ToggleButton
                  onLabel="Popular"
                  offLabel="Normal"
                  defaultOn={!!p.isPopular}
                  disabled={isWorking}
                  onToggle={(v) => {
                    const list = [...(form.getValues("plans") || [])]
                    list[idx] = { ...list[idx], isPopular: v }
                    form.setValue("plans", list, { shouldDirty: true })
                  }}
                />
              </div>
              <div className="col-span-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input
                  type="text"
                  label="CTA Body Text"
                  value={p.cta?.bodyText || ""}
                  onChange={(e) => {
                    const list = [...(form.getValues("plans") || [])]
                    list[idx] = { ...list[idx], cta: { ...list[idx].cta, bodyText: e.target.value as string } }
                    form.setValue("plans", list, { shouldDirty: true })
                  }}
                />
                <Input
                  type="text"
                  label="CTA Button URL"
                  disabled={isWorking}
                  value={p.cta?.buttonUrl || ""}
                  onChange={(e) => {
                    const list = [...(form.getValues("plans") || [])]
                    list[idx] = { ...list[idx], cta: { ...list[idx].cta, buttonUrl: e.target.value as string } }
                    form.setValue("plans", list, { shouldDirty: true })
                  }}
                />
                <Select
                  label="CTA Style"
                  disabled={isWorking}
                  value={p.cta?.style || "primary"}
                  onChange={(e) => {
                    const list = [...(form.getValues("plans") || [])]
                    list[idx] = { ...list[idx], cta: { ...list[idx].cta, style: e.target.value as "primary" | "secondary" | "ghost" } }
                    form.setValue("plans", list, { shouldDirty: true })
                  }}
                  options={[
                    { label: "Primary", value: "primary" },
                    { label: "Secondary", value: "secondary" },
                    { label: "Ghost", value: "ghost" },
                  ]}
                />
              </div>
              <div className="col-span-4">
                <div className="flex flex-col gap-2">
                  <h4 className="text-gray-500 font-medium tracking-wide">Features</h4>
                  {(p.featuresList || []).map((feature, fIdx) => (
                    <div key={fIdx} className="grid grid-cols-12 items-end gap-2">
                      <div className="col-span-10">
                        <Input
                          type="text"
                          label={`Feature ${fIdx + 1}`}
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
                      + Add Feature
                    </Button>
                  </div>
                </div>
              </div>
              <div className="col-span-4 flex justify-between">
                <div />
                <Button type="button" style="destructive" disabled={isWorking} size="large" onClick={() => removePlan(idx)}>
                  <FaRegTrashAlt />
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
            + Add Plan
          </Button>
        </div>

        <div className="mt-4">
          <h4 className="text-gray-500 font-medium tracking-wide">Optional Addons:</h4>
          {addons.map((addon, idx) => (
            <div key={idx} className="flex gap-2 mb-2 items-end">
              <Input
                type="text"
                label={`Addon Statement ${idx + 1}`}
                disabled={isWorking}
                value={addon.statement || ""}
                onChange={(e) => {
                  const list = [...(form.getValues("optionalAddons") || [])]
                  list[idx] = { ...list[idx], statement: e.target.value }
                  form.setValue("optionalAddons", list, { shouldDirty: true })
                }}
              />
              <Input
                type="number"
                label={`Addon Price ${idx + 1}`}
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
            + Add Optional Addon
          </Button>
        </div>

        <div className="flex justify-end mt-6">
          <Button style="primary" disabled={isWorking} type="submit">
            {submitting ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  )
}
