"use client"

import React, { useState } from "react"
import { useFieldArray, useForm } from "react-hook-form"
import Input from "../../custom/Input"
import Button from "../../custom/Button"
import { FaRegTrashAlt } from "react-icons/fa"
import { toast } from "react-hot-toast"
import { updateListing } from "@/services/listing"
import type { ListingItem } from "@/types/pagesTypes"
import { useTranslations } from "next-intl"

export type FAQItem = { question: string; answer: string }
export type FAQsForm = { sectionTitle?: string; items: FAQItem[] }

export default function FAQsSection({ listing, onSaved }: { listing: ListingItem; onSaved?: () => void }) {
  const [submitting, setSubmitting] = useState(false)
  const { register, control, handleSubmit, formState: { errors } } = useForm<FAQsForm>({
    defaultValues: {
      sectionTitle: (listing.FAQs)?.sectionTitle || "",
      items: ((listing.FAQs)?.items || [{ question: "", answer: "" }]) as FAQItem[],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: "items" })
  const t = useTranslations("FAQsSection")

  const onSubmit = async (values: FAQsForm) => {
    if (!values.items || values.items.length === 0) {
      toast.error(t("errors.addAtLeastOne"))
      return
    }
    const hasInvalid = values.items.some((i) => !i.question?.trim() || !i.answer?.trim())
    if (hasInvalid) {
      toast.error(t("errors.eachNeedsQnA"))
      return
    }

    setSubmitting(true)
    try {
      await updateListing(listing.documentId, { data: { FAQs: values } }, listing.locale)
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
      <form onSubmit={handleSubmit(onSubmit)} id="faqsForm" className="flex flex-col gap-4">
        <Input type="text" label={t("sectiontitle")} disabled={submitting} {...register("sectionTitle")} />

        <div className="flex flex-col gap-3">
          {fields.map((field, idx) => (
            <div key={field.id} className={`grid grid-cols-12 gap-3 w-full items-end`}>
              <div className="col-span-12 md:col-span-5">
                <Input
                  type="text"
                  label={`${t("question")} ${idx + 1}`}
                  disabled={submitting}
                  {...register(`items.${idx}.question` as const, {
                    required: t("errors.questionRequired", { index: idx + 1 }) as string,
                  })}
                />
              </div>
              <div className="col-span-12 md:col-span-6">
                <Input
                  type="text"
                  label={`${t("answer")} ${idx + 1}`}
                  disabled={submitting}
                  {...register(`items.${idx}.answer` as const, {
                    required: t("errors.answerRequired", { index: idx + 1 }) as string,
                  })}
                />
              </div>
              <div className="col-span-12 md:col-span-1">
                <Button type="button" style="destructive" disabled={submitting} onClick={() => remove(idx)}>
                  <FaRegTrashAlt />
                </Button>
              </div>
              <div className="col-span-12">
                {errors.items?.[idx]?.question && <p className="text-red-500 text-sm">{String(errors.items[idx]?.question?.message)}</p>}
                {errors.items?.[idx]?.answer && <p className="text-red-500 text-sm">{String(errors.items[idx]?.answer?.message)}</p>}
              </div>
            </div>
          ))}
          <Button type="button" style="secondary" disabled={submitting} onClick={() => append({ question: "", answer: "" })}>
            {t("+addFAQ")}
          </Button>
        </div>

        <div className="flex justify-end">
          <Button style="primary" type="submit" form="faqsForm" disabled={submitting}>
            {submitting ? t("saving") : t("savechanges")}
          </Button>
        </div>
      </form>
    </div>
  )
}
