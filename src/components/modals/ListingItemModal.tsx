"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import Modal from "../custom/Modal"
import Input from "../custom/Input"
import TextArea from "../custom/TextArea"
import Select from "../custom/Select"
import Checkbox from "../custom/Checkbox"
import Button from "../custom/Button"
import type { FAQ, category } from "@/types/pagesTypes"
import { useForm } from "react-hook-form"
import ToggleButton from "../custom/ToggleButton"
import ImageUploader from "../custom/ImageUploader"
import MultiSelect from "../custom/MultiSelect"
import { useEventTypes } from "@/context/EventTypesContext"
import { useCities } from "@/context/CitiesContext"
import { useStates } from "@/context/StatesContext"
import { useParentCategories } from "@/context/ParentCategoriesContext"
import { fetchChildCategories } from "@/services/common"
import type { CreateListingFormTypes } from "@/types/createListingForm"
import { FaRegTrashAlt } from "react-icons/fa"
import toast from "react-hot-toast"
import { createListing } from "@/services/listing"
import { useAppSelector } from "@/store/hooks"
import { geocodePlace } from "@/utils/mapboxLocation"
import { slugify } from "@/utils/helpers"

interface ListingItemModalProps {
  isOpen: boolean
  onClose: () => void
  onSaved?: () => void
}

const ErrorMessage = ({ error }: { error?: any }) => {
  if (!error) return null
  return <p className="text-red-500 text-sm mt-1">{error.message}</p>
}

const ListingItemModal: React.FC<ListingItemModalProps> = ({ isOpen, onClose, onSaved }) => {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
  const { cities } = useCities()
  const { states } = useStates()
  const [eventTypesIds, setEventTypesIds] = useState<string[]>([])
  const { parentCategories } = useParentCategories()
  const [childCategories, setChildCategories] = useState<category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const { user } = useAppSelector((state) => state.auth)
  const [isLoading, setIsLoading] = useState(false);
  const [categoryOptions, setCategoryOptions] = useState<category[]>([]);

  //filter parent categories and remove everything that is not as per user type
  useEffect(() => {
    if (user) {
      const filteredCategories = parentCategories.filter((category) => category.name === user.serviceType)
      setCategoryOptions(filteredCategories)
    }
  }, [parentCategories, user])

  useEffect(() => {
    if (isOpen) {
      // Ensure errors cleared and defaults reset when opening
      setError(null)
    }
  }, [isOpen, reset])

  useEffect(() => {
    async function fetchChildren() {
      const res = await fetchChildCategories(form.type)
      setChildCategories(res)
    }
    fetchChildren()
  }, [form.type])

  const isVendor = useMemo(() => (form?.type || "vendor").toLowerCase() === "vendor", [form?.type])

  const updateField = (path: string, value: any) => {
    setValue(path as any, value, { shouldDirty: true })
  }

  const addArrayItem = (path: string, item: any) => {
    const current = (getValues(path as any) as any[]) || []
    setValue(path as any, [...current, item], { shouldDirty: true })
  }

  const removeArrayItem = (path: string, index: number) => {
    const current = (getValues(path as any) as any[]) || []
    const next = current.filter((_, i) => i !== index)
    setValue(path as any, next, { shouldDirty: true })
  }

  const updateListingItem = (field: string, value: any, itemIndex = 0) => {
    const currentItems = getValues("listingItem") || []
    const updatedItems = [...currentItems]

    if (!updatedItems[itemIndex]) {
      updatedItems[itemIndex] = {
        __component: isVendor ? "dynamic-blocks.vendor" : "dynamic-blocks.venue",
      }
    }

    // Handle nested field updates
    const fieldParts = field.split(".")
    let target: any = updatedItems[itemIndex]

    for (let i = 0; i < fieldParts.length - 1; i++) {
      const part = fieldParts[i]
      if (!target[part]) {
        target[part] = {}
      }
      target = target[part]
    }

    target[fieldParts[fieldParts.length - 1]] = value
    setValue("listingItem", updatedItems, { shouldDirty: true })
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
      if (user) {
        // Wrap user relation
        payload.user = user.documentId
      }
      if (imageIds.length === 0 && imageIds.length > 0) {
        setError("Please upload at least one image")
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
      //if user has selected a type add the type to the listing item as well
      if (form.type) {
        if (form.type === "vendor") {
          payload.listingItem.map((item) => (item.__component = "dynamic-blocks.vendor"))
        } else if (form.type === "venue") {
          payload.listingItem.map((item) => (item.__component = "dynamic-blocks.venue"))
        } else if (form.type !== "vendor" && form.type !== "venue") {
          throw new Error("Please select a valid service type")
        }
      }

      if (form.type && payload.listingItem) {
        payload.listingItem = payload.listingItem.map((item: any) => {
          const next: any = {
            ...item,
            __component: form.type === "vendor" ? "dynamic-blocks.vendor" : "dynamic-blocks.venue",
          }

          // Transform vendor serviceArea city/state to relation connects
          if (Array.isArray(next.serviceArea)) {
            next.serviceArea = next.serviceArea.map((sa: any) => {
              const transformed: any = { ...sa }
              if (sa?.city) {
                transformed.city = { connect: [sa.city] }
              } else {
                // Remove empty city field to avoid validation error
                delete transformed.city
              }
              if (sa?.state) {
                transformed.state = { connect: [sa.state] }
              } else {
                // Remove empty state field to avoid validation error
                delete transformed.state
              }
              return transformed
            })
          }

          // Transform venue location city/state to relation connects (backend updated to relations)
          if (next.location) {
            const loc: any = { ...next.location }
            if (loc.city) {
              loc.city = { connect: [loc.city] }
            } else {
              delete loc.city
            }
            if (loc.state) {
              loc.state = { connect: [loc.state] }
            } else {
              delete loc.state
            }
            next.location = loc
          }

          //only include about, experience years and serviceArea for vendor and the rest for venue,...delete the fields depending on the type...
          if (form.type === "vendor") {
            delete next.location
            delete next.capacity
            delete next.amneties
            delete next.bookingDuration
            delete next.bookingDurationType
          } else {
            delete next.about
            delete next.experienceYears
            delete next.serviceArea
          }

          return next
        })
      }

      //set slug using title
      payload.slug = `${slugify(payload.title)}-${payload?.locale ?? 'en'}-${Date.now()}`

      //set locale --later we will do it dynamically but for now hard code it
      payload.locale = 'en'

      const data = {
        data: payload,
      }

      const res = await createListing(data)
      toast.success("Listing Created successfully")
      onSaved?.()
      onClose()
      reset()
      setSelectedCategory("")
      setEventTypesIds([])
      setError("");
      setImageIds([]);
    } catch (e: any) {
      setError(e?.message || "Failed to save listing")
      toast.error("Please fix the errors in the form")
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
      title={"Create Listing"}
      footer={
        <div className="flex gap-3 justify-between flex-wrap">
          <div className="ml-auto flex gap-2">
            <Button style="ghost" onClick={onClose} disabled={isWorking}>
              Cancel
            </Button>
            <Button style="primary" onClick={rhfHandleSubmit(onSubmit)} disabled={isWorking}>
              {submitting ? "Saving..." : "Create"}
            </Button>
          </div>
        </div>
      }
    >
      {error && <div className="mb-4 p-3 rounded bg-red-50 text-red-700 border border-red-200">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6  mt-14 ">
        {/* left side */}
        <div>
          {/* Basic Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b-2 border-t-2 border-primary/20 py-4">
            <div className="col-span-2">
              <h3 className="text-lg font-semibold mb-2">Basic Details</h3>
            </div>
            <div className="col-span-2">
              <Input
                type="text"
                label="Title"
                disabled={isWorking}
                required={true}
                {...register("title", { required: "Title is required" })}
              />
              <ErrorMessage error={errors.title} />
            </div>
            <div>
              <Select
                placeholder="Select Type"
                disabled={isWorking}
                {...register("type", { required: "Type is required" })}
                options={categoryOptions.map((category) => ({
                  label: category.name,
                  value: category.name,
                }))}
              />
              <ErrorMessage error={errors.type} />
            </div>
            <div>
              <Select
                placeholder="Listing Status"
                disabled={isWorking}
                {...register("listingStatus", { required: "Listing status is required" })}
                options={[
                  { label: "Draft", value: "draft" },
                  { label: "Published", value: "published" },
                  { label: "Pending Review", value: "pending review" },
                  { label: "Archived", value: "archived" },
                ]}
              />
              <ErrorMessage error={errors.listingStatus} />
            </div>
            <div>
              <Input
                type="number"
                label="Price"
                disabled={isWorking}
                {...register("price", {
                  valueAsNumber: true,
                  min: { value: 0, message: "Price must be positive" },
                  max: { value: 1000000, message: "Price must be less than 1000000" },
                })}
              />
              <ErrorMessage error={errors.price} />
            </div>
            <div className="flex items-center mt-6">
              <Checkbox
                label="Featured"
                checked={watch("featured")}
                onChange={(e) => setValue("featured", e.target.checked)}
                disabled={isWorking}
              />
            </div>
            {/* Description */}
            <div className="col-span-2">
              <TextArea
                label="Description"
                placeholder="Description"
                disabled={isWorking}
                rows={4}
                {...register("description", { required: "Description is required" })}
              />
              <ErrorMessage error={errors.description} />
            </div>
            <div>
              <Input
                type="url"
                label="Website Link"
                disabled={isWorking}
                {...register("websiteLink", {
                  pattern: { value: /^https?:\/\/.+/, message: "Please enter a valid URL" },
                })}
              />
              <ErrorMessage error={errors.websiteLink} />
            </div>
            <div>
              <Input
                type="number"
                label="Working Hours (per day)"
                disabled={isWorking}
                {...register("workingHours", {
                  valueAsNumber: true,
                  min: { value: 1, message: "Working hours must be at least 1" },
                  max: { value: 24, message: "Working hours cannot exceed 24" },
                })}
              />
              <ErrorMessage error={errors.workingHours} />
            </div>
          </div>

          {/* Vendor/Venue specific */}
          <div className="border-b-2 border-primary/20 py-4">
            <h3 className="text-lg font-semibold mb-2">{isVendor ? "Vendor" : "Venue"} Details</h3>
            <p className="text-gray-500 font-medium text-sm tracking-wide mb-2">
              (Add a city, state (county/province) for this service area. Add coordinates manually or fetch using the
              "fetch coordinates" button to get coordinates.)
            </p>
            {isVendor ? (
              <div className="flex flex-col gap-4">
                <TextArea
                  label="About"
                  disabled={isWorking}
                  value={form.listingItem?.[0]?.about || ""}
                  onChange={(e) => updateListingItem("about", e.target.value)}
                />
                <Input
                  type="number"
                  label="Experience Years"
                  disabled={isWorking}
                  value={form.listingItem?.[0]?.experienceYears || ""}
                  onChange={(e) => updateListingItem("experienceYears", Number(e.target.value))}
                />
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium">Service Areas</h4>
                    <Button type="button" style="secondary" disabled={isWorking} onClick={addServiceArea}>
                      Add Service Area
                    </Button>
                  </div>
                  {(form.listingItem?.[0]?.serviceArea || []).map((sa, idx) => (
                    <div key={idx} className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end mb-3">
                      <div className="col-span-2">
                        <Select
                          label="City"
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
                          options={[{ label: "Select City", value: "" }, ...cities.map((c) => ({ label: c.name, value: c.documentId }))]}
                        />
                      </div>
                      <div className="col-span-2">
                        <Select
                          label="State"
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
                          options={[{ label: "Select State", value: "" }, ...states.map((s) => ({ label: s.name, value: s.documentId }))]}
                        />
                      </div>
                      <div className="col-span-1">
                        <Input
                          type="text"
                          label="Latitude"
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
                          label="Longitude"
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
                              const currentItems = (getValues("listingItem") || []) as any[]
                              if (!currentItems[0] || !currentItems[0].serviceArea) return
                              const updatedItems = [...currentItems]
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
                            Fetch coordinates
                          </Button>
                          <Button
                            type="button"
                            style="ghost"
                            disabled={isWorking}
                            onClick={() => removeServiceArea(idx)}
                            extraStyles="text-red-600 hover:text-red-700"
                          >
                            Remove
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
                      label="Address"
                      disabled={isWorking}
                      value={form.listingItem?.[0]?.location?.address || ""}
                      onChange={(e) => updateListingItem("location.address", e.target.value)}
                    />
                  </div>
                  <div className="col-span-2">
                    <Select
                      label="City"
                      disabled={isWorking}
                      value={form.listingItem?.[0]?.location?.city || ""}
                      onChange={(e) => updateListingItem("location.city", e.target.value)}
                      options={[{ label: "Select City", value: "" }, ...cities.map((c) => ({ label: c.name, value: c.documentId }))]}
                    />
                  </div>
                  <div className="col-span-2">
                    <Select
                      label="State"
                      disabled={isWorking}
                      value={form.listingItem?.[0]?.location?.state || ""}
                      onChange={(e) => updateListingItem("location.state", e.target.value)}
                      options={[{ label: "Select State", value: "" }, ...states.map((s) => ({ label: s.name, value: s.documentId }))]}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end mb-3">
                  <div className="col-span-2">
                    <Input
                      type="text"
                      label="Latitude"
                      disabled={isWorking}
                      value={form.listingItem?.[0]?.location?.latitude || ""}
                      onChange={(e) => updateListingItem("location.latitude", e.target.value)}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="text"
                      label="Longitude"
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
                      Fetch coordinates
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end mb-3">
                  <div className="col-span-2">
                    <Input
                      type="number"
                      label="Capacity"
                      disabled={isWorking}
                      value={form.listingItem?.[0]?.capacity || ""}
                      onChange={(e) => updateListingItem("capacity", Number(e.target.value))}
                    />
                  </div>
                  <div className="col-span-2">
                    <Select
                      label="Booking Duration Type"
                      disabled={isWorking}
                      value={form.listingItem?.[0]?.bookingDurationType || ""}
                      onChange={(e) => updateListingItem("bookingDurationType", e.target.value)}
                      options={[
                        { label: "Select Duration Type", value: "" },
                        { label: "Per Day", value: "Per Day" },
                        { label: "Per Hour", value: "Per Hour" },
                      ]}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end mb-3">
                  <div className="col-span-2">
                    <Input
                      type="number"
                      disabled={isWorking}
                      label="Booking Duration"
                      value={form.listingItem?.[0]?.bookingDuration || ""}
                      onChange={(e) => updateListingItem("bookingDuration", Number(e.target.value))}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium">Amenities</h4>
                    <Button type="button" disabled={isWorking} style="secondary" onClick={addAmenity}>
                      Add Amenity
                    </Button>
                  </div>
                  {(form.listingItem?.[0]?.amneties || []).map((amenity, idx) => (
                    <div key={idx} className="flex gap-2 items-end mb-2">
                      <div className="flex-1">
                        <Input
                          type="text"
                          disabled={isWorking}
                          label={`Amenity ${idx + 1}`}
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
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Hot Deal  */}
          <div className="border-b-2 border-primary/20 py-4 hidden">
            <div className="flex justify-between items-center w-full">
              <h3 className="text-lg font-semibold mb-2">Hot Deal</h3>
              <ToggleButton
                onLabel="YES"
                offLabel="NO"
                disabled={isWorking}
                defaultOn={form.hotDeal?.enableHotDeal ?? false}
                onToggle={(state) => updateField("hotDeal.enableHotDeal", state)}
              />
            </div>
            {form.hotDeal?.enableHotDeal && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    type="date"
                    label="Start Date"
                    disabled={isWorking}
                    value={form.hotDeal?.startDate || ""}
                    onChange={(e) => updateField("hotDeal.startDate", e.target.value)}
                  />
                  <Input
                    type="date"
                    label="Last Date"
                    disabled={isWorking}
                    value={form.hotDeal?.lastDate || ""}
                    onChange={(e) => updateField("hotDeal.lastDate", e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                  <Input
                    type="text"
                    label="Deal Note"
                    disabled={isWorking}
                    value={form.hotDeal?.dealNote || ""}
                    onChange={(e) => updateField("hotDeal.dealNote", e.target.value)}
                  />
                  <div className="flex items-end">
                    <Select
                      label="Discount Type"
                      disabled={isWorking}
                      value={form.hotDeal?.discount?.discountType || "Flat Rate"}
                      onChange={(e: any) => updateField("hotDeal.discount.discountType", e.target.value)}
                      options={[
                        { label: "Flat Rate", value: "Flat Rate" },
                        { label: "Percentage", value: "Percentage" },
                      ]}
                    />
                  </div>
                  {form.hotDeal?.discount?.discountType === "Flat Rate" && (
                    <Input
                      type="number"
                      label="Flat Rate Price"
                      disabled={isWorking}
                      value={form.hotDeal?.discount?.flatRatePrice ?? ""}
                      onChange={(e) => updateField("hotDeal.discount.flatRatePrice", Number(e.target.value))}
                    />
                  )}
                  {form.hotDeal?.discount?.discountType === "Percentage" && (
                    <Input
                      type="number"
                      label="Percentage"
                      disabled={isWorking}
                      value={form.hotDeal?.discount?.percentage ?? ""}
                      onChange={(e) => updateField("hotDeal.discount.percentage", Number(e.target.value))}
                    />
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* right side */}
        <div>
          {/* images */}
          <div className="flex flex-col gap-2 border-b-2 border-t-2 border-primary/20 py-4">
            <h3 className="text-lg font-semibold mb-2">Add Portfolio Images</h3>
            <ImageUploader setImageIds={setImageIds} disabled={isWorking} />
            {imageIds.length > 0 && <p className="text-gray-500 font-medium text-sm" >Images have ben uploaded</p> }
          </div>
          {/* Contact */}
          <div className="border-b-2 border-primary/20 py-4">
            <h3 className="text-lg font-semibold mb-2">Contact</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="col-span-2">
                <Input
                  type="email"
                  label="Email"
                  disabled={isWorking}
                  {...register("contact.email", {
                    required: "Email is required",
                    pattern: { value: /^\S+@\S+$/i, message: "Invalid email format" },
                  })}
                />
                <ErrorMessage error={errors.contact?.email as any} />
              </div>
              <div>
                <Input type="text" label="Phone" disabled={isWorking} {...register("contact.phone", { required: "Phone is required" })} />
                <ErrorMessage error={errors.contact?.phone as any} />
              </div>
              <div className="col-span-3">
                <Input
                  type="text"
                  disabled={isWorking}
                  label="Address"
                  {...register("contact.address", { required: "Address is required" })}
                />
                <ErrorMessage error={errors.contact?.address as any} />
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div className="border-b-2 border-primary/20 py-4 hidden">
            <h3 className="text-lg font-semibold mb-2">Social Links</h3>
            <Input
              type="text"
              label="Section Title"
              disabled={isWorking}
              value={form.socialLinks?.optionalSectionTitle || ""}
              onChange={(e) => updateField("socialLinks.optionalSectionTitle", e.target.value)}
            />
            <div className="flex flex-col gap-3 mt-2">
              {(form.socialLinks?.socialLink || []).map((s, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-8 gap-3 items-end">
                  <div className="col-span-3">
                    <Select
                      label="Platform"
                      disabled={isWorking}
                      value={s.platform || ""}
                      onChange={(e) => {
                        const list = [...(form.socialLinks?.socialLink || [])]
                        list[idx] = {
                          ...list[idx],
                          platform: e.target.value as
                            | "facebook"
                            | "linkedin"
                            | "youtube"
                            | "instagram"
                            | "tiktok"
                            | "pinterest"
                            | "twitter"
                            | "thread"
                            | "reddit",
                        }
                        updateField("socialLinks.socialLink", list)
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
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="url"
                      label="Link"
                      disabled={isWorking}
                      value={s.link || ""}
                      onChange={(e) => {
                        const list = [...(form.socialLinks?.socialLink || [])]
                        list[idx] = { ...list[idx], link: e.target.value }
                        updateField("socialLinks.socialLink", list)
                      }}
                    />
                  </div>
                  <div className="col-span-2">
                    <Select
                      label="Show this icon"
                      disabled={isWorking}
                      value={String(s.visible ?? true)}
                      onChange={(e) => {
                        const list = [...(form.socialLinks?.socialLink || [])]
                        list[idx] = { ...list[idx], visible: e.target.value === "true" }
                        updateField("socialLinks.socialLink", list)
                      }}
                      options={[
                        { label: "Yes", value: "true" },
                        { label: "No", value: "false" },
                      ]}
                    />
                  </div>
                  <div className="col-span-1 flex items-center justify-center">
                    <Button
                      style="ghost"
                      size="large"
                      disabled={isWorking}
                      extraStyles="!p-0 !w-8 !h-8 !text-red-500 hover:!text-red-300 focus:!text-red-300 hover:!bg-transparent focus:!bg-transparent hover:!border-transparent focus:!border-transparent"
                      onClick={() => removeArrayItem("socialLinks.socialLink", idx)}
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
                  onClick={() =>
                    addArrayItem("socialLinks.socialLink", {
                      platform: "",
                      link: "",
                      visible: true,
                    })
                  }
                >
                  + Add Social Link
                </Button>
              </div>
            </div>
          </div>
          {/* FAQs */}
          <div className="border-b-2 border-primary/20 py-4 hidden">
            <h3 className="text-lg font-semibold mb-2">FAQs</h3>
            <Input
              type="text"
              label="Section Title"
              disabled={isWorking}
              value={form.FAQs?.sectionTitle || ""}
              onChange={(e) => updateField("FAQs.sectionTitle", e.target.value)}
            />
            <div className="flex flex-col gap-3 mt-2">
              {(form.FAQs?.items || []).map((f: Partial<FAQ>, idx: number) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                  <div className="col-span-2">
                    <Input
                      type="text"
                      label="Question"
                      disabled={isWorking}
                      value={f.question || ""}
                      onChange={(e) => {
                        const list = [...(form.FAQs?.items || [])] as Partial<FAQ>[]
                        list[idx] = { ...(list[idx] || {}), question: e.target.value } as Partial<FAQ>
                        updateField("FAQs.items", list)
                      }}
                    />
                  </div>
                  <Button
                    style="ghost"
                    size="large"
                    disabled={isWorking}
                    extraStyles="!p-0 !w-8 !h-8 !text-red-500 hover:!text-red-300 focus:!text-red-300 hover:!bg-transparent focus:!bg-transparent hover:!border-transparent focus:!border-transparent"
                    onClick={() => removeArrayItem("FAQs.items", idx)}
                  >
                    <FaRegTrashAlt />
                  </Button>
                  <div className="col-span-3">
                    <TextArea
                      label="Answer"
                      disabled={isWorking}
                      rows={5}
                      value={f.answer || ""}
                      onChange={(e) => {
                        const list = [...(form.FAQs?.items || [])] as Partial<FAQ>[]
                        list[idx] = { ...(list[idx] || {}), answer: e.target.value } as Partial<FAQ>
                        updateField("FAQs.items", list)
                      }}
                    />
                  </div>
                </div>
              ))}
              <div>
                <Button style="secondary"disabled={isWorking} onClick={() => addArrayItem("FAQs.items", { question: "", answer: "" })}>
                  + Add FAQ
                </Button>
              </div>
            </div>
          </div>
          {/* Event Types (IDs or documentIds depending on your API) */}
          <div className="border-b-2 border-primary/20 py-4">
            <h3 className="text-lg font-semibold mb-2">Event Types</h3>
            <div className="flex flex-col gap-3">
              <MultiSelect
              disabled={isWorking}
                options={eventTypes.map((e) => ({ label: e.eventName, value: e.documentId }))}
                value={eventTypesIds}
                onChange={(selected) => setEventTypesIds(selected)}
                placeholder="Choose event types"
              />
              <ErrorMessage error={errors.eventTypes} />
            </div>
          </div>

          {/* Category (free text or id depending on your API) */}
          <div className="border-b-2 border-primary/20 py-4">
            <h3 className="text-lg font-semibold mb-2">Category</h3>
            <Select
              options={childCategories.map((c) => ({ label: c.name, value: c.documentId }))}
              value={selectedCategory}
              disabled={isWorking}
              onChange={(e: any) => setSelectedCategory(e.target.value)}
              label="Choose category"
              placeholder="Choose category"
            />
            <ErrorMessage error={errors.category} />
          </div>

          {/* Pricing Packages */}
          <div className="border-b-2 border-primary/20 py-4 hidden">
            <h3 className="text-lg font-semibold mb-2">Pricing Packages</h3>
            <Input
              type="text"
              label="Section Title"
              disabled={isWorking}
              value={form.pricingPackages?.sectionTitle || ""}
              onChange={(e) => updateField("pricingPackages.sectionTitle", e.target.value)}
            />
            <div className="flex flex-col gap-4 mt-2">
              {(form.pricingPackages?.plans || []).map((p, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                  <div className="col-span-2">
                    <Input
                      type="text"
                      label="Name"
                      disabled={isWorking}
                      value={p.name || ""}
                      onChange={(e) => {
                        const list = [...(form.pricingPackages?.plans || [])]
                        list[idx] = { ...list[idx], name: e.target.value }
                        updateField("pricingPackages.plans", list)
                      }}
                    />
                  </div>
                  <Input
                    type="number"
                    label="Price"
                    disabled={isWorking}
                    value={p.price ?? ""}
                    onChange={(e) => {
                      const list = [...(form.pricingPackages?.plans || [])]
                      list[idx] = { ...list[idx], price: Number(e.target.value) }
                      updateField("pricingPackages.plans", list)
                    }}
                  />
                  <div className="col-span-1 flex items-center justify-end gap-2">
                    <p>Popular:</p>
                    <ToggleButton
                      defaultOn={!!p.isPopular}
                      disabled={isWorking}
                      onToggle={(v) => {
                        const list = [...(form.pricingPackages?.plans || [])]
                        list[idx] = { ...list[idx], isPopular: v }
                        updateField("pricingPackages.plans", list)
                      }}
                    />
                  </div>
                  <div className="col-span-4 mt-3">
                    <p className="text-gray-500 font-medium tracking-wide">Add Custom CTA (Call To Action) button:</p>
                  </div>
                  <div className="col-span-4 grid grid-cols-1 md:grid-cols-3 items-end gap-3">
                    <Input
                      type="text"
                      disabled={isWorking}
                      label="CTA Body Text"
                      value={p.cta?.bodyText || ""}
                      onChange={(e) => {
                        const list = [...(form.pricingPackages?.plans || [])]
                        list[idx] = {
                          ...list[idx],
                          cta: { ...list[idx].cta, bodyText: e.target.value as string },
                        }
                        updateField("pricingPackages.plans", list)
                      }}
                    />
                    <Input
                      type="text"
                      label="CTA Button URL"
                      disabled={isWorking}
                      value={p.cta?.buttonUrl || ""}
                      onChange={(e) => {
                        const list = [...(form.pricingPackages?.plans || [])]
                        list[idx] = {
                          ...list[idx],
                          cta: { ...list[idx].cta, buttonUrl: e.target.value as string },
                        }
                        updateField("pricingPackages.plans", list)
                      }}
                    />
                    <Select
                      label="CTA Style"
                      disabled={isWorking}
                      value={p.cta?.style || "primary"}
                      onChange={(e) => {
                        const list = [...(form.pricingPackages?.plans || [])]
                        list[idx] = {
                          ...list[idx],
                          cta: { ...list[idx].cta, style: e.target.value as "primary" | "secondary" },
                        }
                        updateField("pricingPackages.plans", list)
                      }}
                      options={[
                        { label: "Primary", value: "primary" },
                        { label: "Secondary", value: "secondary" },
                      ]}
                    />
                  </div>
                  <div className="col-span-1 md:col-span-4">
                    <h4 className="text-gray-500 font-medium tracking-wide">Features List:</h4>
                    {(p.featuresList || []).map((feature, fIdx) => (
                      <div key={fIdx} className="flex gap-2 mb-2 items-end w-full">
                        <div className="flex-1">
                          <Input
                            type="text"
                            disabled={isWorking}
                            label={`Feature ${fIdx + 1}`}
                            value={feature.statement || ""}
                            onChange={(e) => {
                              const list = [...(form.pricingPackages?.plans || [])]
                              const features = [...(list[idx].featuresList || [])]
                              features[fIdx] = { statement: e.target.value }
                              list[idx] = { ...list[idx], featuresList: features }
                              updateField("pricingPackages.plans", list)
                            }}
                          />
                        </div>
                        <Button
                          size="large"
                          disabled={isWorking}
                          extraStyles="!p-0 !w-8 !h-8 !text-red-500 hover:!text-red-300 focus:!text-red-300 hover:!bg-transparent focus:!bg-transparent hover:!border-transparent focus:!border-transparent"
                          style="ghost"
                          onClick={() => {
                            const list = [...(form.pricingPackages?.plans || [])]
                            const features = [...(list[idx].featuresList || [])]
                            features.splice(fIdx, 1)
                            list[idx] = { ...list[idx], featuresList: features }
                            updateField("pricingPackages.plans", list)
                          }}
                        >
                          <FaRegTrashAlt />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div className="col-span-4 flex items-end justify-between gap-2">
                    <Button
                      style="secondary"
                      disabled={isWorking}
                      onClick={() => {
                        const list = [...(form.pricingPackages?.plans || [])]
                        const features = [...(list[idx].featuresList || []), { statement: "" }]
                        list[idx] = { ...list[idx], featuresList: features }
                        updateField("pricingPackages.plans", list)
                      }}
                    >
                      + Add Feature
                    </Button>
                    <Button
                      style="ghost"
                      disabled={isWorking}
                      size="large"
                      extraStyles="!p-0 !w-8 !h-8 !text-red-500 hover:!text-red-300 focus:!text-red-300 hover:!bg-transparent focus:!bg-transparent hover:!border-transparent focus:!border-transparent"
                      onClick={() => removeArrayItem("pricingPackages.plans", idx)}
                    >
                      <FaRegTrashAlt />
                    </Button>
                  </div>
                </div>
              ))}
              <Button
                style="secondary"
                disabled={isWorking}
                onClick={() =>
                  addArrayItem("pricingPackages.plans", {
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
              {(form.pricingPackages?.optionalAddons || []).map((addon, idx) => (
                <div key={idx} className="flex gap-2 mb-2 items-end">
                  <Input
                    type="text"
                    disabled={isWorking}
                    label={`Addon Statement ${idx + 1}`}
                    value={addon.statement || ""}
                    onChange={(e) => {
                      const list = [...(form.pricingPackages?.optionalAddons || [])]
                      list[idx] = { ...list[idx], statement: e.target.value }
                      updateField("pricingPackages.optionalAddons", list)
                    }}
                  />
                  <Input
                    type="number"
                    disabled={isWorking}
                    label={`Addon Price ${idx + 1}`}
                    value={addon.price ?? ""}
                    onChange={(e) => {
                      const list = [...(form.pricingPackages?.optionalAddons || [])]
                      list[idx] = { ...list[idx], price: Number(e.target.value) }
                      updateField("pricingPackages.optionalAddons", list)
                    }}
                  />
                  <Button
                    style="ghost"
                    disabled={isWorking}
                    size="large"
                    extraStyles="!p-0 !w-8 !h-8 !text-red-500 hover:!text-red-300 focus:!text-red-300 hover:!bg-transparent focus:!bg-transparent hover:!border-transparent focus:!border-transparent"
                    onClick={() => removeArrayItem("pricingPackages.optionalAddons", idx)}
                  >
                    <FaRegTrashAlt />
                  </Button>
                </div>
              ))}
              <Button
                style="secondary"
                disabled={isWorking}
                onClick={() =>
                  addArrayItem("pricingPackages.optionalAddons", {
                    statement: "",
                    price: 0,
                  })
                }
              >
                + Add Optional Addon
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default ListingItemModal
