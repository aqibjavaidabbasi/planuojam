"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import Modal from "../custom/Modal"
import Input from "../custom/Input"
import UrlInput from "../custom/UrlInput"
import TextArea from "../custom/TextArea"
import Select from "../custom/Select"
import Button from "../custom/Button"
import type { category, ListingItem } from "@/types/pagesTypes"
import { useForm } from "react-hook-form"
import type { FieldError, PathValue } from "react-hook-form"
import ImageUploadModal from "./ImageUploadModal"
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
import { slugify, shortId } from "@/utils/helpers"
import { useLocale, useTranslations } from "next-intl"
import MapPickerModal from "./MapPickerModal"
import Image from "next/image"
import { getCompleteImageUrl } from "@/utils/helpers"
import { FaTrash, FaGripVertical } from "react-icons/fa6"
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { strapiImage } from "@/types/mediaTypes"

interface ListingItemModalProps {
  isOpen: boolean
  onClose: () => void
  onSaved?: (newListing?: ListingItem) => void
  setShowSubscriptionModal: (show: boolean) => void
}

const ErrorMessage = ({ error }: { error?: FieldError | { message?: string } }) => {
  if (!error) return null
  return <p className="text-red-500 text-sm mt-1">{(error as { message?: string }).message}</p>
}

// Sortable Media Item Component
function SortableMediaItem({ 
    id, 
    media, 
    onDelete, 
    isMain,
    tImage
}: { 
    id: number, 
    media: strapiImage, 
    onDelete: (id: number) => void,
    isMain: boolean,
    tImage: (key: string) => string
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };
    
    const imagePath = getCompleteImageUrl(media.url);
    const isVideo = media.mime?.startsWith('video/');

    return (
        <div 
            ref={setNodeRef} 
            style={style} 
            className={`relative group bg-gray-50 rounded-lg overflow-hidden border-2 h-[150px] ${isMain ? 'border-primary' : 'border-transparent'}`}
        >
            <div className="w-full h-full relative">
                 {isVideo ? (
                    <video src={imagePath} className="w-full h-full object-cover pointer-events-none" />
                  ) : (
                    <Image 
                        src={imagePath} 
                        alt={tImage("alt.portfolioMedia")} 
                        fill
                        className="object-cover pointer-events-none" 
                    />
                  )}
            </div>
            
            {/* Drag Handle */}
            <div 
                {...attributes} 
                {...listeners} 
                className="absolute top-2 left-2 p-2 bg-white/80 rounded cursor-grab active:cursor-grabbing hover:bg-white text-gray-700 z-10 opacity-70 hover:opacity-100"
            >
                <FaGripVertical />
            </div>

             {/* Delete Button */}
            <Button
                style="destructive"
                extraStyles="absolute top-2 right-2 opacity-90 group-hover:opacity-100 !p-2 !rounded-full z-10"
                onClick={() => onDelete(id)}
                aria-label={tImage("aria.deleteMedia")}
            >
                <FaTrash />
            </Button>

            {isMain && (
                <div className="absolute bottom-0 left-0 right-0 bg-primary/90 text-white text-xs py-1 text-center font-medium z-10">
                    {tImage("mainMedia")}
                </div>
            )}
        </div>
    );
}

const ListingItemModal: React.FC<ListingItemModalProps> = ({ isOpen, onClose, onSaved, setShowSubscriptionModal }) => {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const t = useTranslations('Modals.ListingItem')
  const tImage = useTranslations('ImageSection')
  const locale = useLocale();
  const [showSubscriptionHint, setShowSubscriptionHint] = useState(false)
  const [createdListingData, setCreatedListingData] = useState<ListingItem | undefined>(undefined)
  const [isImageUploadModalOpen, setIsImageUploadModalOpen] = useState(false)

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
      price: 0,
      description: "",
      workingSchedule: [],
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
  const [mediaItems, setMediaItems] = useState<strapiImage[]>([])

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
    options: states.map(s => {
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

  // Map picker modal states
  const [vendorPickerIndex, setVendorPickerIndex] = useState<number | null>(null)
  const [venuePickerOpen, setVenuePickerOpen] = useState(false)

  // DnD sensors for media ordering
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setMediaItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleMediaDelete = (id: number) => {
    setMediaItems(prev => prev.filter(item => item.id !== id));
  };

  
  const handleImageUploadSuccess = (uploadedImages: strapiImage[]) => {
    setMediaItems(prev => [...prev, ...uploadedImages]);
  };

  const handleOpenImageUpload = () => {
    setIsImageUploadModalOpen(true);
  };

  const handleCloseImageUpload = () => {
    setIsImageUploadModalOpen(false);
  };

  useEffect(() => {
    if (isOpen) {
      // Ensure errors cleared and defaults reset when opening
      setError(null)
    }
  }, [isOpen, reset])

  useEffect(() => {
    const controller = new AbortController();
    
    async function fetchChildren() {
      try {
        const res = await fetchChildCategories(serviceDocumentId || 'vendor', locale)
        if (!controller.signal.aborted) {
          setChildCategories(res)
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error('Error fetching child categories:', error);
        }
      }
    }
    
    fetchChildren()
    
    return () => {
      controller.abort();
    }
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

  // Working Schedule helpers
  const addWorkingSchedule = () => {
    const current = getValues("workingSchedule") || []
    const updated = [...current, { day: "monday", start: "09:00", end: "17:00" }]
    setValue("workingSchedule", updated as PathValue<CreateListingFormTypes, "workingSchedule">, { shouldDirty: true })
  }

  const removeWorkingSchedule = (index: number) => {
    const current = getValues("workingSchedule") || []
    const updated = current.filter((_, i) => i !== index)
    setValue("workingSchedule", updated as PathValue<CreateListingFormTypes, "workingSchedule">, { shouldDirty: true })
  }

  const timeToMinutes = (t: string) => {
    const [h, m] = t.split(":").map(Number)
    if (Number.isNaN(h) || Number.isNaN(m)) return NaN
    return h * 60 + m
  }

  const validateWorkingSchedule = () => {
    const ws = getValues("workingSchedule") || []
    // basic completeness and start < end
    for (const item of ws) {
      if (!item.day || !item.start || !item.end) {
        return t('workingSchedule.errors.completeAll')
      }
      const s = timeToMinutes(item.start)
      const e = timeToMinutes(item.end)
      if (Number.isNaN(s) || Number.isNaN(e)) return t('workingSchedule.errors.invalidTime')
      if (s >= e) return t('workingSchedule.errors.startBeforeEnd')
    }
    // conflict check per day (overlap)
    const byDay: Record<string, { s: number; e: number }[]> = {}
    ws.forEach(({ day, start, end }) => {
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
        if (cur.s < prev.e) return t('workingSchedule.errors.conflictDay', { day })
      }
    }
    return null
  }

  const onSubmit = async () => {
    setSubmitting(true)
    setError(null)
    setIsLoading(true);
    try {
      const payload = getValues()
      // Validate working schedule conflicts
      const wsError = validateWorkingSchedule()
      if (wsError) {
        setError(wsError)
        return
      }
      // Normalize workingSchedule time values to HH:mm:ss.SSS
      if (Array.isArray(payload.workingSchedule)) {
        const pad2 = (n: number) => String(n).padStart(2, '0')
        const norm = (t: string) => {
          // t may be HH:mm or HH:mm:ss or HH:mm:ss.SSS
          const parts = t.split(':')
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
        payload.workingSchedule = payload.workingSchedule.map((w) => ({
          day: w.day,
          start: norm(w.start || '00:00'),
          end: norm(w.end || '00:00'),
        }))
      }
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
      // Require at least 1 uploaded image
      if (mediaItems.length === 0) {
        setError(t('errors.noImage'))
        return
      }
      // Add media items to portfolio if there are any
      if (mediaItems.length > 0) {
        // Connect media by numeric id
        payload.portfolio = mediaItems.map(item => item.id)
      }
      // Set main image to first item in media order
      if (mediaItems.length > 0) {
        payload.mainImageId = mediaItems[0].id.toString()
      }
      // Add media ordering if media items exist
      if (mediaItems.length > 0) {
        const mediaOrderStr = mediaItems.map(item => item.id).join("-");
        payload.mediaOrder = mediaOrderStr;
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
      // workingHours removed in favor of workingSchedule (handled above)
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
                  ; (transformed as unknown as { city: { connect: string[] } }).city = { connect: [transformed.city] as string[] }
                } else {
                  delete (transformed as Record<string, unknown>).city
                }
                if (transformed.state) {
                  ; (transformed as unknown as { state: { connect: string[] } }).state = { connect: [transformed.state] as string[] }
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
              ; (loc as unknown as { city: { connect: string[] } }).city = { connect: [loc.city] as string[] }
            } else {
              delete (loc as Record<string, unknown>).city
            }
            if (loc.state) {
              ; (loc as unknown as { state: { connect: string[] } }).state = { connect: [loc.state] as string[] }
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

      //make sure listing status is draft at creation time
      payload.listingStatus = "draft"

      const data = {
        data: payload,
      }

      const createdListing = await createListing(data, locale)
      toast.success(t('toasts.created'))
      // Defer notifying parent until hint is acknowledged to avoid modal being closed externally
      setCreatedListingData(createdListing.data)
      setShowSubscriptionHint(true)
      reset()
      setSelectedCategory("")
      setEventTypesIds([])
      setError(null);
      setMediaItems([]);
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
    <>
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size={showSubscriptionHint ? "md" : "lg"}
      title={t('title')}
      footer={
        !showSubscriptionHint && (
            <div className="flex gap-3 justify-between flex-wrap">
              <div className="ml-auto flex gap-2">
              <Button 
                style="ghost" 
                onClick={onClose} 
                disabled={isWorking}
              >
                  {t('buttons.cancel')}
                </Button>
              <Button 
                style="primary" 
                type="submit" 
                form="listingForm" 
                disabled={isWorking}
              >
                  {submitting ? t('buttons.saving') : t('buttons.create')}
                </Button>
              </div>
            </div>
        )
      }
    >
      {error && (
        <div className="mb-4 p-3 rounded bg-red-50 text-red-700 border border-red-200">
          {error}
        </div>
      )}

      {!showSubscriptionHint && (
        <form 
          id="listingForm" 
          onSubmit={rhfHandleSubmit(onSubmit)} 
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-14"
        >
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
                placeholder={t('fields.title.placeholder')}
                disabled={isWorking}
                required
                {...register("title", { required: t('fields.title.required') })}
              />
              <ErrorMessage error={errors.title} />
            </div>
            <div className="col-span-2">
              <Input
                type="number"
                label={t('fields.price.label')}
                placeholder={t('fields.price.placeholder')}
                disabled={isWorking}
                min={0}
                required
                {...register("price", {
                  valueAsNumber: true,
                  min: { value: 0, message: t('fields.price.errors.min') },
                  max: { value: 1000000, message: t('fields.price.errors.max') },
                })}
              />
              <ErrorMessage error={errors.price} />
            </div>
            {/* Description */}
            <div className="col-span-2">
              <TextArea
                label={t('fields.description.label')}
                placeholder={t('fields.description.placeholder')}
                disabled={isWorking}
                required
                rows={4}
                {...register("description", { required: t('fields.description.required') })}
              />
              <ErrorMessage error={errors.description} />
            </div>
            <div className="col-span-2" >
              <UrlInput
                label={t('fields.websiteLink.label')}
                placeholder={t('fields.websiteLink.placeholder')}
                disabled={isWorking}
                showNormalizedUrl={true}
                {...register("websiteLink")}
              />
            </div>
            <div className="col-span-2" >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">{t('workingSchedule.title')}</h4>
                <Button type="button" style="secondary" disabled={isWorking} onClick={addWorkingSchedule}>
                  {t('workingSchedule.add')}
                </Button>
              </div>
              {(form.workingSchedule || []).map((it, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end mb-2">
                  <div className="md:col-span-2">
                    <Select
                      label={t('workingSchedule.day')}
                      disabled={isWorking}
                      value={it.day || ""}
                      onChange={(e) => {
                        const current = getValues("workingSchedule") || []
                        const updated = [...current]
                        updated[idx] = { ...(updated[idx] || {}), day: e.target.value as "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday" }
                        setValue("workingSchedule", updated, { shouldDirty: true })
                      }}
                      options={[
                        { label: t('workingSchedule.placeholder', { default: 'Select day' }) as string, value: '' },
                        { label: t('days.monday', { default: 'Monday' }), value: 'monday' },
                        { label: t('days.tuesday', { default: 'Tuesday' }), value: 'tuesday' },
                        { label: t('days.wednesday', { default: 'Wednesday' }), value: 'wednesday' },
                        { label: t('days.thursday', { default: 'Thursday' }), value: 'thursday' },
                        { label: t('days.friday', { default: 'Friday' }), value: 'friday' },
                        { label: t('days.saturday', { default: 'Saturday' }), value: 'saturday' },
                        { label: t('days.sunday', { default: 'Sunday' }), value: 'sunday' },
                      ]}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Input
                      type="time"
                      label={t('workingSchedule.start')}
                      placeholder={t('workingSchedule.startPlaceholder')}
                      disabled={isWorking}
                      value={it.start || ""}
                      onChange={(e) => {
                        const current = getValues("workingSchedule") || []
                        const updated = [...current]
                        updated[idx] = { ...(updated[idx] || {}), start: e.target.value }
                        setValue("workingSchedule", updated, { shouldDirty: true })
                      }}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Input
                      type="time"
                      label={t('workingSchedule.end')}
                      placeholder={t('workingSchedule.endPlaceholder')}
                      disabled={isWorking}
                      value={it.end || ""}
                      onChange={(e) => {
                        const current = getValues("workingSchedule") || []
                        const updated = [...current]
                        updated[idx] = { ...(updated[idx] || {}), end: e.target.value }
                        setValue("workingSchedule", updated, { shouldDirty: true })
                      }}
                    />
                  </div>
                  <div className="md:col-span-7">
                    <Button type="button" style="ghost" disabled={isWorking} onClick={() => removeWorkingSchedule(idx)} extraStyles="text-red-600 hover:text-red-700">
                      {t('buttons.remove')}
                    </Button>
                  </div>
                </div>
              ))}
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
                  placeholder={t('fields.about.placeholder')}
                  disabled={isWorking}
                  value={form.listingItem?.[0]?.about || ""}
                  onChange={(e) => updateListingItem("about", e.target.value)}
                />
                <Input
                  type="number"
                  label={t('fields.experienceYears.label')}
                  placeholder={t('fields.experienceYears.placeholder')}
                  disabled={isWorking}
                  min={0}
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
                    <div key={idx} className="grid grid-cols-2 gap-3 items-end mb-3">
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
                      <div className="col-span-2 !hidden">
                        <Input
                          type="number"
                          step="any"
                          min={-90}
                          max={90}
                          label={t('fields.latitude.label')}
                          placeholder={t('fields.latitude.placeholder')}
                          disabled
                          value={sa.latitude || ""}
                          onChange={(e) => {
                            const currentItems = getValues("listingItem") || []
                            const updatedItems = [...currentItems]
                            if (updatedItems[0]?.serviceArea) {
                              const raw = e.target.value
                              if (raw === "") {
                                updatedItems[0].serviceArea[idx] = {
                                  ...updatedItems[0].serviceArea[idx],
                                  latitude: "",
                                }
                              } else {
                                const n = Number(raw)
                                if (!Number.isNaN(n)) {
                                  const clamped = Math.max(-90, Math.min(90, n))
                                  updatedItems[0].serviceArea[idx] = {
                                    ...updatedItems[0].serviceArea[idx],
                                    latitude: String(clamped),
                                  }
                                }
                              }
                              setValue("listingItem", updatedItems, { shouldDirty: true })
                            }
                          }}
                        />
                      </div>
                      <div className="col-span-2 !hidden">
                        <Input
                          type="number"
                          step="any"
                          min={-180}
                          max={180}
                          label={t('fields.longitude.label')}
                          placeholder={t('fields.longitude.placeholder')}
                          disabled
                          value={sa.longitude || ""}
                          onChange={(e) => {
                            const currentItems = getValues("listingItem") || []
                            const updatedItems = [...currentItems]
                            if (updatedItems[0]?.serviceArea) {
                              const raw = e.target.value
                              if (raw === "") {
                                updatedItems[0].serviceArea[idx] = {
                                  ...updatedItems[0].serviceArea[idx],
                                  longitude: "",
                                }
                              } else {
                                const n = Number(raw)
                                if (!Number.isNaN(n)) {
                                  const clamped = Math.max(-180, Math.min(180, n))
                                  updatedItems[0].serviceArea[idx] = {
                                    ...updatedItems[0].serviceArea[idx],
                                    longitude: String(clamped),
                                  }
                                }
                              }
                              setValue("listingItem", updatedItems, { shouldDirty: true })
                            }
                          }}
                        />
                      </div>
                      <div className="col-span-2">
                        <div className="flex flex-col gap-3">
                          {/* <Button
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
                          </Button>    */}
                          <Button
                            type="button"
                            style="secondary"
                            disabled={isWorking}
                            onClick={() => setVendorPickerIndex(idx)}
                          >
                            {t('buttons.pickOnMap')}
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
                      placeholder={t('fields.address.placeholder')}
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
                  <div className="col-span-3 !hidden">
                    <Input
                      type="number"
                      step="any"
                      min={-90}
                      max={90}
                      label={t('fields.latitude.label')}
                      placeholder={t('fields.latitude.placeholder')}
                      disabled
                      value={form.listingItem?.[0]?.location?.latitude || ""}
                      onChange={(e) => {
                        const raw = e.target.value
                        if (raw === "") return updateListingItem("location.latitude", "")
                        const n = Number(raw)
                        if (Number.isNaN(n)) return
                        const clamped = Math.max(-90, Math.min(90, n))
                        // Fix rounding issue by using toFixed(6) for coordinates
                        updateListingItem("location.latitude", Number(clamped.toFixed(6)).toString())
                      }}
                    />
                  </div>
                  <div className="col-span-3 !hidden">
                    <Input
                      type="number"
                      step="any"
                      min={-180}
                      max={180}
                      label={t('fields.longitude.label')}
                      placeholder={t('fields.longitude.placeholder')}
                      disabled
                      value={form.listingItem?.[0]?.location?.longitude || ""}
                      onChange={(e) => {
                        const raw = e.target.value
                        if (raw === "") return updateListingItem("location.longitude", "")
                        const n = Number(raw)
                        if (Number.isNaN(n)) return
                        const clamped = Math.max(-180, Math.min(180, n))
                        // Fix rounding issue by using toFixed(6) for coordinates
                        updateListingItem("location.longitude", Number(clamped.toFixed(6)).toString())
                      }}
                    />
                  </div>
                  <div className="col-span-6 flex items-center gap-2 justify-center">
                    {/* <Button
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
                    </Button> */}
                    <Button
                      type="button"
                      style="secondary"
                      disabled={isWorking}
                      onClick={() => setVenuePickerOpen(true)}
                    >
                      {t('buttons.pickOnMap')}
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end mb-3">
                  <div className="col-span-2">
                    <Input
                      type="number"
                      min={0}
                      label={t('fields.capacity.label')}
                      placeholder={t('fields.capacity.placeholder')}
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
                      min={0}
                      disabled={isWorking}
                      label={t('fields.bookingDuration.label')}
                      placeholder={t('fields.bookingDuration.placeholder')}
                      value={form.listingItem?.[0]?.bookingDuration || ""}
                      onChange={(e) => updateListingItem("bookingDuration", Number(e.target.value))}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      min={0}
                      disabled={isWorking}
                      label={t('fields.minimumDuration.label')}
                      placeholder={t('fields.minimumDuration.placeholder')}
                      value={form.listingItem?.[0]?.minimumDuration || ""}
                      onChange={(e) => updateListingItem("minimumDuration", Number(e.target.value))}
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
                          placeholder={t('amenities.itemPlaceholder')}
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
          <div className="flex flex-col border-b-2 border-t-2 border-primary/20 py-4">
            <h3 className="text-lg font-semibold mb-2">{t('portfolio.title')} </h3>
            <p className="text-sm text-gray-600">{tImage('uploadHint', { size: '20MB' })}</p>
            <p className="text-sm text-gray-600 mb-4">{tImage('instructionHint')}</p>
            
            {/* Sortable Media Grid */}
            { mediaItems.length > 0 &&
            <DndContext 
              sensors={sensors} 
              collisionDetection={closestCenter} 
              onDragEnd={handleDragEnd}
            >
              <SortableContext 
                  items={mediaItems.map(i => i.id)} 
                  strategy={rectSortingStrategy}
              >
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      {mediaItems.map((item, index) => (
                          <SortableMediaItem
                              key={item.id}
                              id={item.id}
                              media={item}
                              onDelete={handleMediaDelete}
                              isMain={index === 0}
                              tImage={tImage}
                          />
                      ))}
                  </div>
              </SortableContext>
            </DndContext>}

            {/* Image Uploader */}
            <div className="mt-4">
              <Button 
                onClick={handleOpenImageUpload}
                disabled={isWorking}
                style="secondary"
                extraStyles="w-full"
              >
                Add Images/Videos
              </Button>
            </div>
          </div>
          {/* Contact */}
          <div className="border-b-2 border-primary/20 py-4">
            <h3 className="text-lg font-semibold mb-2">{t('contact.title')} </h3>
            <div className="flex flex-col gap-4">
              <div>
                <Input
                  type="email"
                  label={t('fields.email.label')}
                  placeholder={t('fields.email.placeholder')}
                  disabled={isWorking}
                  required
                  {...register("contact.email", {
                    required: "Email is required",
                    pattern: { value: /^\S+@\S+$/i, message: t('fields.email.message') },
                  })}
                />
                <ErrorMessage error={errors.contact?.email} />
              </div>
              <div>
                <Input type="text" label={t('fields.phone.label')} placeholder={t('fields.phone.placeholder')} disabled={isWorking} required {...register("contact.phone", { required: t('fields.phone.message') })} />
                <ErrorMessage error={errors.contact?.phone} />
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
      </form>)}
      {/* Vendor map picker (serviceArea by index) */}
      {vendorPickerIndex !== null && (
        <MapPickerModal
          isOpen={vendorPickerIndex !== null}
          onClose={() => setVendorPickerIndex(null)}
          initial={(() => {
            const sa = form.listingItem?.[0]?.serviceArea?.[vendorPickerIndex!]
            const lat = sa?.latitude && !isNaN(Number(sa.latitude)) ? Number(sa.latitude) : undefined
            const lng = sa?.longitude && !isNaN(Number(sa.longitude)) ? Number(sa.longitude) : undefined
            return { lat, lng }
          })()}
          onSelect={(lat, lng) => {
            const currentItems = getValues("listingItem") || []
            const updatedItems = [...currentItems]
            if (updatedItems[0]?.serviceArea && vendorPickerIndex !== null) {
              const idx = vendorPickerIndex
              updatedItems[0].serviceArea[idx] = {
                ...updatedItems[0].serviceArea[idx],
                latitude: String(lat),
                longitude: String(lng),
              }
              setValue("listingItem", updatedItems, { shouldDirty: true })
            }
            setVendorPickerIndex(null)
          }}
        />
      )}

      {/* Venue map picker (single location) */}
      {venuePickerOpen && (
        <MapPickerModal
          isOpen={venuePickerOpen}
          onClose={() => setVenuePickerOpen(false)}
          initial={(() => {
            const lat = form.listingItem?.[0]?.location?.latitude
            const lng = form.listingItem?.[0]?.location?.longitude
            return {
              lat: lat && !isNaN(Number(lat)) ? Number(lat) : undefined,
              lng: lng && !isNaN(Number(lng)) ? Number(lng) : undefined,
            }
          })()}
          onSelect={(lat, lng) => {
            updateListingItem("location.latitude", String(lat))
            updateListingItem("location.longitude", String(lng))
            setVenuePickerOpen(false)
          }}
        />
      )}
      
      {showSubscriptionHint &&
        <div className="w-full flex items-center justify-center flex-col gap-2 py-4">
          <p className="text-center tracking-wide">{t('subscriptionHint')}</p>
          <div className="flex gap-2 items-center justify-center">
            <Button
              style="ghost"
              onClick={() => {
                setShowSubscriptionHint(false)
                onSaved?.(createdListingData)
                onClose()
              }}
            >
              {t('later')}
            </Button>
            <Button
              style="secondary"
              onClick={() => {
                setShowSubscriptionHint(false)
                onSaved?.(createdListingData)
                onClose()
                setShowSubscriptionModal(true)
              }}
            >
              {t('pay')}
            </Button>
          </div>
        </div>
      }
    </Modal>

    {/* Image Upload Modal */}
    <ImageUploadModal
      isOpen={isImageUploadModalOpen}
      onClose={handleCloseImageUpload}
      onUploadSuccess={handleImageUploadSuccess}
    />
  </>
  );
};

export default ListingItemModal
