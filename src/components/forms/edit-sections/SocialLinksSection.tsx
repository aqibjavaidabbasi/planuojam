"use client"

import React, { useState } from "react"
import { useForm } from "react-hook-form"
import Input from "../../custom/Input"
import Select from "../../custom/Select"
import Button from "../../custom/Button"
import { FaRegTrashAlt } from "react-icons/fa"
import { toast } from "react-hot-toast"
import { updateListing } from "@/services/listing"
import type { ListingItem } from "@/types/pagesTypes"

type SocialLink = {
  platform:
    | "facebook"
    | "linkedin"
    | "youtube"
    | "instagram"
    | "tiktok"
    | "pinterest"
    | "twitter"
    | "thread"
    | "reddit"
    | ""
  link: string
  visible?: boolean
}

type SocialLinksForm = {
  optionalSectionTitle?: string
  socialLink: SocialLink[]
}

const ErrorMessage = ({ error }: { error?: any }) => {
  if (!error) return null
  return <p className="text-red-500 text-sm mt-1">{error.message}</p>
}

export default function SocialLinksSection({
  listing,
  onSaved,
}: {
  listing: ListingItem
  onSaved?: () => void
}) {
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    setValue,
    getValues,
    handleSubmit,
    formState: { errors },
  } = useForm<SocialLinksForm>({
    defaultValues: {
      optionalSectionTitle: (listing.socialLinks as any)?.optionalSectionTitle || "",
      socialLink: ((listing.socialLinks as any)?.socialLink || []) as SocialLink[],
    },
  })

  const addArrayItem = (path: keyof SocialLinksForm, item: any) => {
    const current = (getValues(path) as any[]) || []
    setValue(path, [...current, item], { shouldDirty: true })
  }

  const removeArrayItem = (path: keyof SocialLinksForm, index: number) => {
    const current = (getValues(path) as any[]) || []
    setValue(path, current.filter((_, i) => i !== index), { shouldDirty: true })
  }

  const onSubmit = async (values: SocialLinksForm) => {
    setSubmitting(true)
    try {
      // Frontend validation: every social link must have platform and link
      for (const s of values.socialLink || []) {
        if (!s.platform) throw new Error("Platform is required for each social link")
        if (!s.link || !/^https?:\/\//.test(s.link)) throw new Error("Valid URL is required for each social link")
      }

      await updateListing(listing.documentId, { data: { socialLinks: values } })
      toast.success("Social links updated")
      onSaved?.()
    } catch (e: any) {
      toast.error(e?.message || "Failed to update social links")
    } finally {
      setSubmitting(false)
    }
  }

  const isWorking = submitting

  return (
    <div className="py-4">
      <h3 className="text-lg font-semibold mb-2">Social Links</h3>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
        <Input
          type="text"
          label="Section Title"
          disabled={isWorking}
          {...register("optionalSectionTitle")}
        />
        <div className="flex flex-col gap-3 mt-2">
          {(getValues("socialLink") || []).map((s, idx) => (
            <div key={idx} className="grid grid-cols-1 md:grid-cols-8 gap-3 items-end">
              <div className="col-span-3">
                <Select
                  label="Platform"
                  disabled={isWorking}
                  value={s.platform}
                  onChange={(e) => {
                    const list = [...(getValues("socialLink") || [])]
                    list[idx] = { ...list[idx], platform: e.target.value as SocialLink["platform"] }
                    setValue("socialLink", list, { shouldDirty: true })
                  }}
                  options={[
                    { label: "Select Platform", value: "" },
                    { label: "Facebook", value: "facebook" },
                    { label: "LinkedIn", value: "linkedin" },
                    { label: "YouTube", value: "youtube" },
                    { label: "Instagram", value: "instagram" },
                    { label: "TikTok", value: "tiktok" },
                    { label: "Pinterest", value: "pinterest" },
                    { label: "Twitter", value: "twitter" },
                    { label: "Thread", value: "thread" },
                    { label: "Reddit", value: "reddit" },
                  ]}
                />
                <ErrorMessage error={errors.socialLink?.[idx]?.platform as any} />
              </div>
              <div className="col-span-3">
                <Input
                  type="url"
                  label="Link"
                  disabled={isWorking}
                  value={s.link}
                  onChange={(e) => {
                    const list = [...(getValues("socialLink") || [])]
                    list[idx] = { ...list[idx], link: e.target.value }
                    setValue("socialLink", list, { shouldDirty: true })
                  }}
                />
                <ErrorMessage error={errors.socialLink?.[idx]?.link as any} />
              </div>
              <div className="col-span-1">
                <Select
                  label="Visible"
                  disabled={isWorking}
                  value={String(s.visible ?? true)}
                  onChange={(e) => {
                    const list = [...(getValues("socialLink") || [])]
                    list[idx] = { ...list[idx], visible: e.target.value === "true" }
                    setValue("socialLink", list, { shouldDirty: true })
                  }}
                  options={[
                    { label: "Yes", value: "true" },
                    { label: "No", value: "false" },
                  ]}
                />
              </div>
              <div className="col-span-1 flex items-center justify-center">
                <Button
                  style="destructive"
                  size="large"
                  disabled={isWorking}
                  onClick={() => removeArrayItem("socialLink", idx)}
                  type="button"
                >
                  <FaRegTrashAlt />
                </Button>
              </div>
            </div>
          ))}
          <div>
            <Button
              style="secondary"
              disabled={isWorking}
              type="button"
              onClick={() => addArrayItem("socialLink", { platform: "", link: "", visible: true })}
            >
              + Add Social Link
            </Button>
          </div>
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
