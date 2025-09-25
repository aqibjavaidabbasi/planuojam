"use client"

import React, { useState } from "react"
import { useForm, type FieldError } from "react-hook-form"
import Input from "../../custom/Input"
import Select from "../../custom/Select"
import Button from "../../custom/Button"
import { FaRegTrashAlt } from "react-icons/fa"
import { toast } from "react-hot-toast"
import { updateListing } from "@/services/listing"
import type { ListingItem } from "@/types/pagesTypes"
import { useTranslations } from "next-intl"

type SocialLink = {
  id?: number
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

const ErrorMessage = ({ error }: { error?: FieldError }) => {
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

  const initialSocialLinks: SocialLink[] = Array.isArray((listing.socialLinks as unknown as { socialLink?: unknown })?.socialLink)
    ? ((listing.socialLinks as unknown as { socialLink?: SocialLink[] }).socialLink ?? [])
    : []

  const {
    register,
    setValue,
    getValues,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SocialLinksForm>({
    defaultValues: {
      optionalSectionTitle: (listing.socialLinks)?.optionalSectionTitle || "",
      socialLink: initialSocialLinks,
    },
  })

  // Subscribe to changes so UI re-renders when items are added/removed/edited
  const socialLinks = watch("socialLink")

  const addSocialLink = (item: SocialLink) => {
    const current = getValues("socialLink") || []
    setValue("socialLink", [...current, item], { shouldDirty: true })
  }

  const removeSocialLink = (index: number) => {
    const current = getValues("socialLink") || []
    setValue("socialLink", current.filter((_, i) => i !== index), { shouldDirty: true })
  }

  const onSubmit = async (values: SocialLinksForm) => {
    setSubmitting(true)
    try {
      // Frontend validation: every social link must have platform and link
      for (const s of values.socialLink || []) {
        if (!s.platform) throw new Error(t("errors.platformRequired"))
        if (!s.link || !/^https?:\/\//.test(s.link)) throw new Error(t("errors.validUrlRequired"))
      }

      // Build a clean payload for Strapi: only include allowed fields
      const cleanSocialLinks = (values.socialLink || []).map((s) => {
        const out: { platform: SocialLink["platform"]; link: string; visible?: boolean } = {
          platform: s.platform,
          link: s.link,
        }
        if (typeof s.visible === 'boolean') out.visible = s.visible
        return out
      })

      const payload = {
        optionalSectionTitle: values.optionalSectionTitle || "",
        socialLink: cleanSocialLinks,
      }

      await updateListing(listing.documentId, { data: { socialLinks: payload } }, listing.locale)
      toast.success(t("toasts.updated"))
      onSaved?.()
    } catch (e: unknown) {
      const raw = e instanceof Error ? e.message : t("toasts.updateFailed")
      // If we threw a translation key (Option A), resolve it from the Errors namespace
      if (typeof raw === 'string' && raw.startsWith('Errors.')) {
        const subKey = raw.replace(/^Errors\./, '')
        toast.error(tErrors(subKey))
      } else {
        toast.error(raw)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const isWorking = submitting
  const t = useTranslations("socialLinkSection")
  const tErrors = useTranslations('Errors')
  return (
    <div className="py-4">
      <h3 className="text-lg font-semibold mb-2">{t("title")}</h3>
      <form onSubmit={handleSubmit(onSubmit)} id="socialLinksForm" className="flex flex-col gap-3">
        <Input
          type="text"
          label={t("sectiontitle")}
          disabled={isWorking}
          {...register("optionalSectionTitle")}
        />
        <div className="flex flex-col gap-3 mt-2">
          {(socialLinks || []).map((s, idx) => (
            <div key={idx} className="grid grid-cols-1 md:grid-cols-8 gap-3 items-end">
              <div className="col-span-3">
                <Select
                  label={t("platformLabel")}
                  disabled={isWorking}
                  value={s.platform}
                  onChange={(e) => {
                    const list = [...(socialLinks || [])]
                    list[idx] = { ...list[idx], platform: e.target.value as SocialLink["platform"] }
                    setValue("socialLink", list, { shouldDirty: true })
                  }}
                  options={[
                    { label: t("selectPlatform"), value: "" },
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
                <ErrorMessage error={errors.socialLink?.[idx]?.platform} />
              </div>
              <div className="col-span-3">
                <Input
                  type="url"
                  label={t("link")}
                  disabled={isWorking}
                  value={s.link}
                  onChange={(e) => {
                    const list = [...(socialLinks || [])]
                    list[idx] = { ...list[idx], link: e.target.value }
                    setValue("socialLink", list, { shouldDirty: true })
                  }}
                />
                <ErrorMessage error={errors.socialLink?.[idx]?.link} />
              </div>
              <div className="col-span-1">
                <Select
                  label={t("visible")}
                  disabled={isWorking}
                  value={String(s.visible ?? true)}
                  onChange={(e) => {
                    const list = [...(socialLinks || [])]
                    list[idx] = { ...list[idx], visible: e.target.value === "true" }
                    setValue("socialLink", list, { shouldDirty: true })
                  }}
                  options={[
                    { label: t("yes"), value: "true" },
                    { label: t("no"), value: "false" },
                  ]}
                />
              </div>
              <div className="col-span-1 flex items-center justify-center">
                <Button
                  style="destructive"
                  size="large"
                  disabled={isWorking}
                  onClick={() => removeSocialLink(idx)}
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
              onClick={() => addSocialLink({ platform: "", link: "", visible: true })}
            >
              {t("+addsociallink")}
            </Button>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <Button style="primary" form="socialLinksForm" disabled={isWorking} type="submit">
            {submitting ? t("saving") : t("savechanges")}
          </Button>
        </div>
      </form>
    </div>
  )
}
