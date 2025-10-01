"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import Modal from "../custom/Modal"
import Input from "../custom/Input"
import TextArea from "../custom/TextArea"
import Select from "../custom/Select"
import Checkbox from "../custom/Checkbox"
import Button from "../custom/Button"
import type { category } from "@/types/pagesTypes"
import { useForm } from "react-hook-form"
import type { FieldError, PathValue } from "react-hook-form"
import ImageUploader from "../custom/ImageUploader"
import MultiSelect from "../custom/MultiSelect"
import { useEventTypes } from "@/context/EventTypesContext"
import { useCities } from "@/context/CitiesContext"
import { useStates } from "@/context/StatesContext"
import { useParentCategories } from "@/context/ParentCategoriesContext"
import { fetchChildCategories } from "@/services/common"
import type { CreateListingFormTypes } from "@/types/createListingForm"
import toast from "react-hot-toast"
import { createListing } from "@/services/listing"
import { useAppSelector } from "@/store/hooks"
import { geocodePlace } from "@/utils/mapboxLocation"
import { slugify, shortId } from "@/utils/helpers"
import { useLocale, useTranslations } from "next-intl"

interface ListingItemModalProps {
  isOpen: boolean
  onClose: () => void
  onSaved?: () => void
}

const ErrorMessage = ({ error }: { error?: FieldError | { message?: string } }) => {
  if (!error) return null
  return <p className="text-red-500 text-sm mt-1">{(error as { message?: string }).message}</p>
}

const ListingItemModal: React.FC<ListingItemModalProps> = ({ isOpen, onClose, onSaved }) => {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const t = useTranslations('Modals.ListingItem')
  const tImage = useTranslations('ImageSection')
  const locale = useLocale()

  const {
    handleSubmit: rhfHandleSubmit,
    register,
    setValue,
    getValues,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateListingFormTypes>({
    defaultValues: {
      listingStatus: "draft",
      type: "vendor",
      featured: false,
      price: 0,
      description: "",
      listingItem: [
        {
          __component: "dynamic-blocks.vendor",
          about: "",
          experienceYears: 0,
          serviceArea: [],
        },
      ],
    },
  })
  const form = watch()
  const [imageIds, setImageIds] = useState<number[]>([])

  const { eventTypes } = useEventTypes()
  const eventTypeOptions = {
    options: eventTypes.map((e) => {
      const localized = locale === 'en'
        ? e.eventName
        : e.localizations.find((l) => l.locale === locale)?.eventName ?? e.eventName
      return { label: localized ?? '', value: e.documentId }
    }),
  }

  const { cities } = useCities()
  const cityOptions = {
    options: cities.map(c => {
      const localized = locale === 'en'
        ? c.name
        : c.localizations.find((l) => l.locale === locale)?.name
      return { label: localized ?? '', value: c.documentId }
    })
  }
  
  const { states } = useStates()
  const stateOptions = {
    options: states.map( s => {
      const localized = locale === 'en'
      ? s.name
      : s.localizations.find(s => s.locale === locale)?.name
      return { label: localized ?? '', value: s.documentId }
    })
  }

  const [eventTypesIds, setEventTypesIds] = useState<string[]>([])
  const { parentCategories } = useParentCategories()
  const [childCategories, setChildCategories] = useState<category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const { user } = useAppSelector((state) => state.auth)
  const [isLoading, setIsLoading] = useState(false);
  // Derive service type from the authenticated user; keep both raw and normalized forms
  const serviceTypeRaw = user?.serviceType || ''
  const serviceType = (serviceTypeRaw || 'vendor').toLowerCase() as 'vendor' | 'venue'
  const serviceDocumentId = parentCategories.find((category) => category.name.trim() === serviceTypeRaw)?.documentId

  useEffect(() => {
    if (isOpen) {
      // Ensure errors cleared and defaults reset when opening
      setError(null)
    }
  }, [isOpen, reset])

  useEffect(() => {
    async function fetchChildren() {
      const res = await fetchChildCategories(serviceDocumentId || 'vendor', locale)
      setChildCategories(res)
    }
    fetchChildren()
  }, [serviceDocumentId, locale])

  const isVendor = useMemo(() => serviceType === "vendor", [serviceType])

  const updateListingItem = (field: string, value: unknown, itemIndex = 0) => {
    const currentItems = getValues("listingItem") || []
    const updatedItems = [...currentItems]

    if (!updatedItems[itemIndex]) {
      updatedItems[itemIndex] = {
        __component: isVendor ? "dynamic-blocks.vendor" : "dynamic-blocks.venue",
      }
    }

    // Handle nested field updates
    const fieldParts = field.split(".")
    let target: Record<string, unknown> = updatedItems[itemIndex] as unknown as Record<string, unknown>

    for (let i = 0; i < fieldParts.length - 1; i++) {
      const part = fieldParts[i]
      const current = target[part]
      if (typeof current !== "object" || current === null) {
        target[part] = {}
      }
      target = target[part] as Record<string, unknown>
    }

    target[fieldParts[fieldParts.length - 1]] = value as unknown
    setValue("listingItem", updatedItems as PathValue<CreateListingFormTypes, "listingItem">, { shouldDirty: true })
  }

  const addServiceArea = () => {
    const currentItems = getValues("listingItem") || []
    const updatedItems = [...currentItems]

    if (!updatedItems[0]) {
      updatedItems[0] = { __component: "dynamic-blocks.vendor", serviceArea: [] }
    }

    if (!updatedItems[0].serviceArea) {
      updatedItems[0].serviceArea = []
    }

    updatedItems[0].serviceArea.push({
      city: "",
      state: "",
      latitude: "",
      longitude: "",
    })

    setValue("listingItem", updatedItems, { shouldDirty: true })
  }

  const removeServiceArea = (index: number) => {
    const currentItems = getValues("listingItem") || []
    const updatedItems = [...currentItems]

    if (updatedItems[0]?.serviceArea) {
      updatedItems[0].serviceArea = updatedItems[0].serviceArea.filter((_, i) => i !== index)
      setValue("listingItem", updatedItems, { shouldDirty: true })
    }
  }

  const addAmenity = () => {
    const currentItems = getValues("listingItem") || []
    const updatedItems = [...currentItems]

    if (!updatedItems[0]) {
      updatedItems[0] = { __component: "dynamic-blocks.venue", amneties: [] }
    }

    if (!updatedItems[0].amneties) {
      updatedItems[0].amneties = []
    }

    updatedItems[0].amneties.push({ text: "" })
    setValue("listingItem", updatedItems, { shouldDirty: true })
  }

  const removeAmenity = (index: number) => {
    const currentItems = getValues("listingItem") || []
    const updatedItems = [...currentItems]

    if (updatedItems[0]?.amneties) {
      updatedItems[0].amneties = updatedItems[0].amneties.filter((_, i) => i !== index)
      setValue("listingItem", updatedItems, { shouldDirty: true })
    }
  }

  const onSubmit = async () => {
    setSubmitting(true)
    setError(null)
    setIsLoading(true);
    try {
      const payload = getValues()
      // Validate user service type and enforce into payload
      const st = (user?.serviceType || '').toLowerCase()
      if (st !== 'vendor' && st !== 'venue') {
        throw new Error(t('errors.invalidServiceType'))
      }
      payload.type = st as 'vendor' | 'venue'
      if (user) {
        // Wrap user relation
        payload.user = user.documentId
      }
      if (imageIds.length === 0 && imageIds.length > 0) {
        setError(t('errors.noImage'))
        return
      }
      //add image ids to portfolio if there are any
      if (imageIds.length > 0) {
        // Connect media by numeric id
        payload.portfolio = imageIds
      }
      //   add event types ids to payload if there are any
      if (eventTypesIds.length > 0) {
        payload.eventTypes = {
          set: [...eventTypesIds],
        }
      }
      if (selectedCategory) {
        // Wrap category relation
        payload.category = selectedCategory
      }
      //if working hours is NAN then make it disappaer from payload
      if (form.workingHours && isNaN(form.workingHours)) {
        delete payload.workingHours
      }
      // ensure listingItem component type matches the enforced type
      if (payload.listingItem) {
        if (serviceType === "vendor") {
          payload.listingItem.map((item) => (item.__component = "dynamic-blocks.vendor"))
        } else {
          payload.listingItem.map((item) => (item.__component = "dynamic-blocks.venue"))
        }
      }

      if (payload.listingItem) {
        type ListingItemType = CreateListingFormTypes["listingItem"][number]
        payload.listingItem = payload.listingItem.map((item): ListingItemType => {
          let next: ListingItemType = {
            ...(item as ListingItemType),
            __component: serviceType === "vendor" ? "dynamic-blocks.vendor" : "dynamic-blocks.venue",
          }

          // Transform vendor serviceArea city/state to relation connects
          const serviceArea = next.serviceArea
          if (Array.isArray(serviceArea)) {
            next = {
              ...next,
              serviceArea: serviceArea.map((sa) => {
                const transformed = { ...(sa || {}) }
                if (transformed.city) {
                  // backend expects relation connect
                  ;(transformed as unknown as { city: { connect: string[] } }).city = { connect: [transformed.city] as string[] }
                } else {
                  delete (transformed as Record<string, unknown>).city
                }
                if (transformed.state) {
                  ;(transformed as unknown as { state: { connect: string[] } }).state = { connect: [transformed.state] as string[] }
                } else {
                  delete (transformed as Record<string, unknown>).state
                }
                return transformed as NonNullable<ListingItemType["serviceArea"]>[number]
              }),
            }
          }

          // Transform venue location city/state to relation connects (backend updated to relations)
          if (next.location && typeof next.location === 'object') {
            const loc = { ...next.location }
            if (loc.city) {
              ;(loc as unknown as { city: { connect: string[] } }).city = { connect: [loc.city] as string[] }
            } else {
              delete (loc as Record<string, unknown>).city
            }
            if (loc.state) {
              ;(loc as unknown as { state: { connect: string[] } }).state = { connect: [loc.state] as string[] }
            } else {
              delete (loc as Record<string, unknown>).state
            }
            next = { ...next, location: loc as ListingItemType["location"] }
          }

          //only include about, experience years and serviceArea for vendor and the rest for venue
          if (serviceType === "vendor") {
            delete (next as { location?: unknown }).location
            delete (next as { capacity?: unknown }).capacity
            delete (next as { amneties?: unknown }).amneties
            delete (next as { bookingDuration?: unknown }).bookingDuration
            delete (next as { bookingDurationType?: unknown }).bookingDurationType
          } else {
            delete (next as { about?: unknown }).about
            delete (next as { experienceYears?: unknown }).experienceYears
            delete (next as { serviceArea?: unknown }).serviceArea
          }

          return next
        })
      }

      // set slug using title with a short unique suffix to avoid collisions within the same locale
      payload.slug = `${slugify(payload.title)}-${shortId(6)}`

      // set locale from current app locale
      payload.locale = locale

      const data = {
        data: payload,
      }

      await createListing(data, locale)
      toast.success(t('toasts.created'))
      onSaved?.()
      onClose()
      reset()
      setSelectedCategory("")
      setEventTypesIds([])
      setError(null);
      setImageIds([]);
    } catch (e: unknown) {
      const message = e && typeof e === 'object' && 'message' in e ? String((e as { message?: unknown }).message) : t('toasts.failed')
      setError(message)
      toast.error(t('toasts.fixErrors'))
    } finally {
      setSubmitting(false)
      setIsLoading(false);
    }
  }

  const isWorking = submitting || isLoading

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title={t('title')}
      footer={
        <div className="flex gap-3 justify-between flex-wrap">
          <div className="ml-auto flex gap-2">
            <Button style="ghost" onClick={onClose} disabled={isWorking}>
              {t('buttons.cancel')}
            </Button>
            <Button style="primary" type="submit" form="listingForm" disabled={isWorking}>
              {submitting ? t('buttons.saving') : t('buttons.create')}
            </Button>
          </div>
        </div>
      }
    >
      {error && <div className="mb-4 p-3 rounded bg-red-50 text-red-700 border border-red-200">{error}</div>}

      <form id="listingForm" onSubmit={rhfHandleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-2 gap-6  mt-14 ">
        {/* left side */}
        <div>
          {/* Basic Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b-2 border-t-2 border-primary/20 py-4">
            <div className="col-span-2">
              <h3 className="text-lg font-semibold mb-2">{t('sections.basicDetails')}</h3>
            </div>
            <div className="col-span-2">
              <Input
                type="text"
                label={t('fields.title.label')}
                disabled={isWorking}
                required={true}
                {...register("title", { required: t('fields.title.required') })}
              />
              <ErrorMessage error={errors.title} />
            </div>
            <div className="flex items-end" >
              <Select
                placeholder={t('fields.listingStatus.placeholder')}
                disabled={isWorking}
                {...register("listingStatus", { required: t('fields.listingStatus.required') })}
                options={[
                  { label: t('fields.listingStatus.options.draft'), value: "draft" },
                  { label: t('fields.listingStatus.options.published'), value: "published" },
                  { label: t('fields.listingStatus.options.pendingReview'), value: "pending review" },
                  { label: t('fields.listingStatus.options.archived'), value: "archived" },
                ]}
              />
              <ErrorMessage error={errors.listingStatus} />
            </div>
            <div>
              <Input
                type="number"
                label={t('fields.price.label')}
                disabled={isWorking}
                {...register("price", {
                  valueAsNumber: true,
                  min: { value: 0, message: t('fields.price.errors.min') },
                  max: { value: 1000000, message: t('fields.price.errors.max') },
                })}
              />
              <ErrorMessage error={errors.price} />
            </div>
            <div className="flex items-center mt-6">
              <Checkbox
                label={t('fields.featured.label')}
                checked={watch("featured")}
                onChange={(e) => setValue("featured", e.target.checked)}
                disabled={isWorking}
              />
            </div>
            {/* Description */}
            <div className="col-span-2">
              <TextArea
                label={t('fields.description.label')}
                placeholder={t('fields.description.placeholder')}
                disabled={isWorking}
                rows={4}
                {...register("description", { required: t('fields.description.required') })}
              />
              <ErrorMessage error={errors.description} />
            </div>
            <div>
              <Input
                type="text"
                label={t('fields.websiteLink.label')}
                disabled={isWorking}
                {...register("websiteLink", {
                  pattern: { value: /^(https?:\/\/)?(www\.)?[a-zA-Z0-9-]+(\.[a-zA-Z]{2,})(\/[^\s]*)?$/
                  , message: t('fields.websiteLink.errors.invalid') },
                })}
              />
              <ErrorMessage error={errors.websiteLink} />
            </div>
            <div>
              <Input
                type="number"
                label={t('fields.workingHours.label')}
                disabled={isWorking}
                {...register("workingHours", {
                  valueAsNumber: true,
                  min: { value: 1, message: t('fields.workingHours.errors.min') },
                  max: { value: 24, message: t('fields.workingHours.errors.max') },
                })}
              />
              <ErrorMessage error={errors.workingHours} />
            </div>
          </div>

          {/* Vendor/Venue specific */}
          <div className="border-b-2 border-primary/20 py-4">
            <h3 className="text-lg font-semibold mb-2">{isVendor ? t('sections.vendorDetails') : t('sections.venueDetails')}</h3>
            <p className="text-gray-500 font-medium text-sm tracking-wide mb-2">
              {t('serviceArea.helpText')}
            </p>
            {isVendor ? (
              <div className="flex flex-col gap-4">
                <TextArea
                  label={t('fields.about.label')}
                  disabled={isWorking}
                  value={form.listingItem?.[0]?.about || ""}
                  onChange={(e) => updateListingItem("about", e.target.value)}
                />
                <Input
                  type="number"
                  label={t('fields.experienceYears.label')}
                  disabled={isWorking}
                  value={form.listingItem?.[0]?.experienceYears || ""}
                  onChange={(e) => updateListingItem("experienceYears", Number(e.target.value))}
                />
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium">{t('serviceArea.title')}</h4>
                    <Button type="button" style="secondary" disabled={isWorking} onClick={addServiceArea}>
                      {t('serviceArea.add')}
                    </Button>
                  </div>
                  {(form.listingItem?.[0]?.serviceArea || []).map((sa, idx) => (
                    <div key={idx} className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end mb-3">
                      <div className="col-span-2">
                        <Select
                          label={t('fields.city.label')}
                          value={sa.city || ""}
                          disabled={isWorking}
                          onChange={(e) => {
                            const currentItems = getValues("listingItem") || []
                            const updatedItems = [...currentItems]
                            if (updatedItems[0]?.serviceArea) {
                              updatedItems[0].serviceArea[idx] = {
                                ...updatedItems[0].serviceArea[idx],
                                city: e.target.value,
                              }
                              setValue("listingItem", updatedItems, { shouldDirty: true })
                            }
                          }}
                          options={[{ label: t('fields.city.placeholder'), value: "" }, ...cityOptions.options]}
                        />
                      </div>
                      <div className="col-span-2">
                        <Select
                          label={t('fields.state.label')}
                          value={sa.state || ""}
                          disabled={isWorking}
                          onChange={(e) => {
                            const currentItems = getValues("listingItem") || []
                            const updatedItems = [...currentItems]
                            if (updatedItems[0]?.serviceArea) {
                              updatedItems[0].serviceArea[idx] = {
                                ...updatedItems[0].serviceArea[idx],
                                state: e.target.value,
                              }
                              setValue("listingItem", updatedItems, { shouldDirty: true })
                            }
                          }}
                          options={[{ label: t('fields.state.placeholder'), value: "" }, ...stateOptions.options]}
                        />
                      </div>
                      <div className="col-span-1">
                        <Input
                          type="text"
                          label={t('fields.latitude.label')}
                          disabled={isWorking}
                          value={sa.latitude || ""}
                          onChange={(e) => {
                            const currentItems = getValues("listingItem") || []
                            const updatedItems = [...currentItems]
                            if (updatedItems[0]?.serviceArea) {
                              updatedItems[0].serviceArea[idx] = {
                                ...updatedItems[0].serviceArea[idx],
                                latitude: e.target.value,
                              }
                              setValue("listingItem", updatedItems, { shouldDirty: true })
                            }
                          }}
                        />
                      </div>
                      <div className="col-span-1">
                        <Input
                          type="text"
                          label={t('fields.longitude.label')}
                          disabled={isWorking}
                          value={sa.longitude || ""}
                          onChange={(e) => {
                            const currentItems = getValues("listingItem") || []
                            const updatedItems = [...currentItems]
                            if (updatedItems[0]?.serviceArea) {
                              updatedItems[0].serviceArea[idx] = {
                                ...updatedItems[0].serviceArea[idx],
                                longitude: e.target.value,
                              }
                              setValue("listingItem", updatedItems, { shouldDirty: true })
                            }
                          }}
                        />
                      </div>
                      <div className="col-span-6">
                        <div className="flex gap-3">
                          <Button
                            type="button"
                            style="secondary"
                            disabled={isWorking}
                            onClick={async () => {
                              const currentItems = (getValues("listingItem") || []) as CreateListingFormTypes["listingItem"]
                              if (!currentItems[0]) return
                              const updatedItems = [...currentItems]
                              if (!updatedItems[0].serviceArea) {
                                updatedItems[0].serviceArea = []
                              }
                              const saItem = updatedItems[0].serviceArea[idx]
                              if (!saItem) return
                              const cityName = cities.find((c) => c.documentId === saItem.city)?.name
                              const stateName = states.find((s) => s.documentId === saItem.state)?.name
                              const res = await geocodePlace(cityName, stateName)
                              if (res) {
                                updatedItems[0].serviceArea[idx] = {
                                  ...saItem,
                                  latitude: String(res.lat),
                                  longitude: String(res.lng),
                                }
                                setValue("listingItem", updatedItems, { shouldDirty: true })
                              }
                            }}
                          >
                            {t('buttons.fetchCoordinates')}
                          </Button>
                          <Button
                            type="button"
                            style="ghost"
                            disabled={isWorking}
                            onClick={() => removeServiceArea(idx)}
                            extraStyles="text-red-600 hover:text-red-700"
                          >
                            {t('buttons.remove')}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end mb-3">
                  <div className="col-span-2">
                    <Input
                      type="text"
                      label={t('fields.address.label')}
                      disabled={isWorking}
                      value={form.listingItem?.[0]?.location?.address || ""}
                      onChange={(e) => updateListingItem("location.address", e.target.value)}
                    />
                  </div>
                  <div className="col-span-2">
                    <Select
                      label={t('fields.city.label')}
                      disabled={isWorking}
                      value={form.listingItem?.[0]?.location?.city || ""}
                      onChange={(e) => updateListingItem("location.city", e.target.value)}
                      options={[{ label: t('fields.city.placeholder'), value: "" }, ...cities.map((c) => ({ label: c.name, value: c.documentId }))]}
                    />
                  </div>
                  <div className="col-span-2">
                    <Select
                      label={t('fields.state.label')}
                      disabled={isWorking}
                      value={form.listingItem?.[0]?.location?.state || ""}
                      onChange={(e) => updateListingItem("location.state", e.target.value)}
                      options={[{ label: t('fields.state.placeholder'), value: "" }, ...states.map((s) => ({ label: s.name, value: s.documentId }))]}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end mb-3">
                  <div className="col-span-2">
                    <Input
                      type="text"
                      label={t('fields.latitude.label')}
                      disabled={isWorking}
                      value={form.listingItem?.[0]?.location?.latitude || ""}
                      onChange={(e) => updateListingItem("location.latitude", e.target.value)}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="text"
                      label={t('fields.longitude.label')}
                      disabled={isWorking}
                      value={form.listingItem?.[0]?.location?.longitude || ""}
                      onChange={(e) => updateListingItem("location.longitude", e.target.value)}
                    />
                  </div>
                  <div className="col-span-2">
                    <Button
                      type="button"
                      style="secondary"
                      disabled={isWorking}
                      onClick={async () => {
                        const cityId = form.listingItem?.[0]?.location?.city
                        const stateId = form.listingItem?.[0]?.location?.state
                        const cityName = cities.find((c) => c.documentId === cityId)?.name
                        const stateName = states.find((s) => s.documentId === stateId)?.name
                        const res = await geocodePlace(cityName, stateName)
                        if (res) {
                          updateListingItem("location.latitude", String(res.lat))
                          updateListingItem("location.longitude", String(res.lng))
                        }
                      }}
                    >
                      {t('buttons.fetchCoordinates')}
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end mb-3">
                  <div className="col-span-2">
                    <Input
                      type="number"
                      label={t('fields.capacity.label')}
                      disabled={isWorking}
                      value={form.listingItem?.[0]?.capacity || ""}
                      onChange={(e) => updateListingItem("capacity", Number(e.target.value))}
                    />
                  </div>
                  <div className="col-span-2">
                    <Select
                      label={t('fields.bookingDurationType.label')}
                      disabled={isWorking}
                      value={form.listingItem?.[0]?.bookingDurationType || ""}
                      onChange={(e) => updateListingItem("bookingDurationType", e.target.value)}
                      options={[
                        { label: t('fields.bookingDurationType.placeholder'), value: "" },
                        { label: t('fields.bookingDurationType.options.perDay'), value: "Per Day" },
                        { label: t('fields.bookingDurationType.options.perHour'), value: "Per Hour" },
                      ]}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end mb-3">
                  <div className="col-span-2">
                    <Input
                      type="number"
                      disabled={isWorking}
                      label={t('fields.bookingDuration.label')}
                      value={form.listingItem?.[0]?.bookingDuration || ""}
                      onChange={(e) => updateListingItem("bookingDuration", Number(e.target.value))}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium">{t('amenities.title')}</h4>
                    <Button type="button" disabled={isWorking} style="secondary" onClick={addAmenity}>
                      {t('amenities.add')}
                    </Button>
                  </div>
                  {(form.listingItem?.[0]?.amneties || []).map((amenity, idx) => (
                    <div key={idx} className="flex gap-2 items-end mb-2">
                      <div className="flex-1">
                        <Input
                          type="text"
                          disabled={isWorking}
                          label={`${t('amenities.itemLabel')} ${idx + 1}`}
                          value={amenity.text || ""}
                          onChange={(e) => {
                            const currentItems = getValues("listingItem") || []
                            const updatedItems = [...currentItems]
                            if (updatedItems[0]?.amneties) {
                              updatedItems[0].amneties[idx] = {
                                ...updatedItems[0].amneties[idx],
                                text: e.target.value,
                              }
                              setValue("listingItem", updatedItems, { shouldDirty: true })
                            }
                          }}
                        />
                      </div>
                      <Button
                        type="button"
                        style="ghost"
                        disabled={isWorking}
                        onClick={() => removeAmenity(idx)}
                        extraStyles="text-red-600 hover:text-red-700"
                      >
                        {t('buttons.remove')}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* right side */}
        <div>
          {/* images */}
          <div className="flex flex-col gap-2 border-b-2 border-t-2 border-primary/20 py-4">
            <h3 className="text-lg font-semibold mb-2">{t('portfolio.title')} </h3>
            <p className="text-sm text-gray-600">{tImage('uploadHint', { size: '20MB' })}</p>
            <ImageUploader setImageIds={setImageIds} disabled={isWorking} />
            {imageIds.length > 0 && <p className="text-gray-500 font-medium text-sm" >{t('portfolio.imageUploaded')} </p> }
          </div>
          {/* Contact */}
          <div className="border-b-2 border-primary/20 py-4">
            <h3 className="text-lg font-semibold mb-2">{t('contact.title')} </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="col-span-2">
                <Input
                  type="email"
                  label={t('fields.email.label')}
                  disabled={isWorking}
                  {...register("contact.email", {
                    required: "Email is required",
                    pattern: { value: /^\S+@\S+$/i, message: t('fields.email.message') },
                  })}
                />
                <ErrorMessage error={errors.contact?.email} />
              </div>
              <div>
                <Input type="text" label={t('fields.phone.label')} disabled={isWorking} {...register("contact.phone", { required: t('fields.phone.message') })} />
                <ErrorMessage error={errors.contact?.phone} />
              </div>
              <div className="col-span-3">
                <Input
                  type="text"
                  disabled={isWorking}
                  label={t('fields.address.label')}
                  {...register("contact.address", { required: t('fields.address.message')})}
                />
                <ErrorMessage error={errors.contact?.address} />
              </div>
            </div>
          </div>
          {/* Event Types (IDs or documentIds depending on your API) */}
          <div className="border-b-2 border-primary/20 py-4">
            <h3 className="text-lg font-semibold mb-2"> {t('eventTypes.title')} </h3>
            <div className="flex flex-col gap-3">
              <MultiSelect
                disabled={isWorking}
                options={eventTypeOptions.options}
                value={eventTypesIds}
                onChange={(selected) => setEventTypesIds(selected)}
                placeholder={t('fields.chooseEventType.label')}
              />
              <ErrorMessage error={errors.eventTypes} />
            </div>
          </div>

          {/* Category (free text or id depending on your API) */}
          <div className="border-b-2 border-primary/20 py-4">
            <h3 className="text-lg font-semibold mb-2">{t('sections.category')}</h3>
            <Select
              options={childCategories.map((c) => ({ label: c.name, value: c.documentId }))}
              value={selectedCategory}
              disabled={isWorking}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedCategory(e.target.value)}
              label={t('fields.chooseCategory.label')}
              placeholder={t('fields.chooseCategory.placeholder')}
            />
            <ErrorMessage error={errors.category} />
          </div>
        </div>
      </form>
    </Modal>
  )
}

export default ListingItemModal
