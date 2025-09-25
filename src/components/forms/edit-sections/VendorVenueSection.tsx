"use client"

import React, { useEffect, useMemo, useState } from "react"
import { useFieldArray, useForm } from "react-hook-form"
import Input from "../../custom/Input"
import TextArea from "../../custom/TextArea"
import Select from "../../custom/Select"
import Button from "../../custom/Button"
import { toast } from "react-hot-toast"
import { updateListing } from "@/services/listing"
import type { ListingItem } from "@/types/pagesTypes"
import { useCities } from "@/context/CitiesContext"
import { useStates } from "@/context/StatesContext"
import { geocodePlace } from "@/utils/mapboxLocation"
import { useTranslations } from "next-intl"

// Vendor form
type ServiceArea = { city?: string; state?: string; latitude?: string; longitude?: string }
export type VendorForm = {
  about?: string
  experienceYears?: number
  serviceArea: ServiceArea[]
}

// Venue form
type Location = { address?: string; city?: string; state?: string; latitude?: string; longitude?: string }
export type VenueForm = {
  location: Location
  capacity?: number
  bookingDurationType?: "Per Day" | "Per Hour" | ""
  bookingDuration?: number
  amneties: { text: string }[]
}

export default function VendorVenueSection({ listing, onSaved }: { listing: ListingItem; onSaved?: () => void }) {
  const isVendor = useMemo(() => (listing.type || "vendor").toLowerCase() === "vendor", [listing.type])
  const [submitting, setSubmitting] = useState(false)
  const { cities } = useCities()
  const { states } = useStates()
  
  const vendorSource = listing.listingItem.find(item => item.__component === "dynamic-blocks.vendor")

  // Start with minimal defaults; we'll reset with mapped values once cities/states are available
  const defaultVendor: VendorForm = {
    about: vendorSource ? vendorSource.about : "",
    experienceYears: vendorSource ? vendorSource.experienceYears : undefined,
    serviceArea: [],
  }

  const venueSource = listing.listingItem.find(item => item.__component === "dynamic-blocks.venue")

  const venueLoc = (venueSource?.location ?? {}) as Partial<{ address: string; city: {documentId: string}; state: {documentId: string}; latitude: number; longitude: number }>

  const bookingTypeRaw = venueSource?.bookingDurationType
  const bookingType: VenueForm["bookingDurationType"] = bookingTypeRaw === "Per Day" || bookingTypeRaw === "Per Hour" ? bookingTypeRaw : ""

  const defaultVenue: VenueForm = {
    location: {
      address: venueLoc.address ?? "",
      city: venueLoc.city?.documentId ?? "",
      state: venueLoc.state?.documentId ?? "",
      latitude: venueLoc.latitude != null ? String(venueLoc.latitude) : "",
      longitude: venueLoc.longitude != null ? String(venueLoc.longitude) : "",
    },
    capacity: venueSource ? venueSource.capacity : undefined,
    bookingDurationType: bookingType,
    bookingDuration: venueSource ? venueSource.bookingDuration : undefined,
    amneties: venueSource?.amneties ?? [],
  }


  // Use two separate forms based on type
  const vendorRHF = useForm<VendorForm>({ defaultValues: defaultVendor })
  const venueRHF = useForm<VenueForm>({ defaultValues: defaultVenue })

  const { control: vendorControl, register: vendorRegister, handleSubmit: submitVendor } = vendorRHF
  const { control: venueControl, register: venueRegister, handleSubmit: submitVenue } = venueRHF

  const { fields: serviceAreas, append: appendSA, remove: removeSA } = useFieldArray({ control: vendorControl, name: "serviceArea" })
  const { fields: amenities, append: appendAmenity, remove: removeAmenity } = useFieldArray({ control: venueControl, name: "amneties" })

  const onSubmitVendor = async (values: VendorForm) => {
    // minimal validation
    if (values.serviceArea?.some(sa => !sa.city || !sa.state)) {
      toast.error(t("errors.cityStateRequired", { default: "Each service area needs a city and state" }))
      return
    }
    setSubmitting(true)
    try {
      const listingItem = [
        {
          __component: "dynamic-blocks.vendor",
          about: values.about,
          experienceYears: values.experienceYears,
          serviceArea: (values.serviceArea || []).map((sa) => {
            type Relation = { connect: string[] }
            type ServiceAreaPayload = { city?: Relation; state?: Relation; latitude?: string; longitude?: string }
            const transformed: ServiceAreaPayload = {}
            if (sa.city) transformed.city = { connect: [sa.city] }
            if (sa.state) transformed.state = { connect: [sa.state] }
            if (sa.latitude) transformed.latitude = sa.latitude
            if (sa.longitude) transformed.longitude = sa.longitude
            return transformed
          }),
        },
      ]
      await updateListing(listing.documentId, { data: { listingItem } }, listing.locale)
      toast.success(t("toasts.updated", { default: "Vendor/Venue details updated" }))
      onSaved?.()
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : t("toasts.updateFailed", { default: "Failed to update Vendor/Venue details" })
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  const onSubmitVenue = async (values: VenueForm) => {
    setSubmitting(true)
    try {
      type RelationUpdate = { connect?: string[]; set?: string[]; disconnect?: string[] }
      type VenuePayload = {
        __component: "dynamic-blocks.venue"
        location?: {
          address?: string
          latitude?: string
          longitude?: string
          city?: RelationUpdate
          state?: RelationUpdate
        }
        capacity?: number
        bookingDurationType?: VenueForm["bookingDurationType"]
        bookingDuration?: number
        amneties?: { text: string }[]
      }

      const next: VenuePayload = { __component: "dynamic-blocks.venue" }

      // Build location safely and only include relation updates that are valid
      if (values.location) {
        const loc: VenuePayload["location"] = {}
        if (values.location.address != null) loc.address = values.location.address
        if (values.location.latitude != null) loc.latitude = values.location.latitude
        if (values.location.longitude != null) loc.longitude = values.location.longitude

        // Determine if city/state were modified by the user
        const dirty = venueRHF.formState.dirtyFields
        const cityDirty = !!dirty?.location?.city
        const stateDirty = !!dirty?.location?.state

        // City relation update
        const cityId = values.location.city?.trim() || ""
        if (cityId) {
          loc.city = { connect: [cityId] }
        } else if (cityDirty) {
          // Field cleared by user -> nullify relation
          loc.city = { set: [] }
        }

        // State relation update
        const stateId = values.location.state?.trim() || ""
        if (stateId) {
          loc.state = { connect: [stateId] }
        } else if (stateDirty) {
          // Field cleared by user -> nullify relation
          loc.state = { set: [] }
        }

        if (Object.keys(loc).length) next.location = loc
      }
      if (values.capacity) next.capacity = values.capacity
      if (values.bookingDurationType) next.bookingDurationType = values.bookingDurationType
      if (values.bookingDuration) next.bookingDuration = values.bookingDuration
      // Handle amneties (repeatable component with required text)
      if (Array.isArray(values.amneties)) {
        const cleaned = values.amneties
          .map((a) => ({ text: (a?.text ?? "").trim() }))
          .filter((a) => a.text.length > 0)
        if (cleaned.length > 0) {
          next.amneties = cleaned
        } else {
          // If user modified amenities and removed them all, explicitly clear
          const dirty = venueRHF.formState.dirtyFields
          const amnetiesDirty = !!dirty?.amneties
          if (amnetiesDirty) {
            next.amneties = []
          }
        }
      }

      await updateListing(listing.documentId, { data: { listingItem: [next] } }, listing.locale)
      toast.success(t("toasts.updated", { default: "Vendor/Venue details updated" }))
      onSaved?.()
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : t("toasts.updateFailed", { default: "Failed to update Vendor/Venue details" })
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  const onFetchVendorCoords = async (idx: number) => {
    const cityId = vendorRHF.getValues(`serviceArea.${idx}.city`)
    const stateId = vendorRHF.getValues(`serviceArea.${idx}.state`)
    const cityName = cities.find((c) => c.documentId === cityId)?.name
    const stateName = states.find((s) => s.documentId === stateId)?.name
    const res = await geocodePlace(cityName, stateName)
    if (res) {
      vendorRHF.setValue(`serviceArea.${idx}.latitude`, String(res.lat))
      vendorRHF.setValue(`serviceArea.${idx}.longitude`, String(res.lng))
    }
  }

  const onFetchVenueCoords = async () => {
    const cityId = venueRHF.getValues("location.city")
    const stateId = venueRHF.getValues("location.state")
    const cityName = cities.find((c) => c.documentId === cityId)?.name
    const stateName = states.find((s) => s.documentId === stateId)?.name
    const res = await geocodePlace(cityName, stateName)
    if (res) {
      venueRHF.setValue("location.latitude", String(res.lat))
      venueRHF.setValue("location.longitude", String(res.lng))
    }
  }

  // Map backend vendor service areas (Place + numeric lat/lng) to form-friendly values (ids + string lat/lng)
  useEffect(() => {
    if (!vendorSource) return
    const mapped = (vendorSource.serviceArea || []).map((sa) => {
      const cityName = sa?.city?.name
      const stateName = sa?.state?.name
      const cityId = cityName ? (cities.find((c) => c.name === cityName)?.documentId ?? "") : ""
      const stateId = stateName ? (states.find((s) => s.name === stateName)?.documentId ?? "") : ""
      return {
        city: cityId,
        state: stateId,
        latitude: sa?.latitude != null ? String(sa.latitude) : "",
        longitude: sa?.longitude != null ? String(sa.longitude) : "",
      }
    })
    vendorRHF.reset({
      about: vendorSource.about ?? "",
      experienceYears: vendorSource.experienceYears ?? undefined,
      serviceArea: mapped,
    })
  }, [vendorSource, cities, states, vendorRHF])

  // Helper to safely extract a documentId (as string) from various possible shapes without using `any`
  const getDocumentId = (val: unknown): string => {
    if (typeof val === 'string') return val
    if (val && typeof val === 'object') {
      const maybe = val as { documentId?: unknown }
      if (typeof maybe.documentId === 'string') return maybe.documentId
    }
    return ""
  }

  // Map backend venue location (names + numeric lat/lng) to form-friendly values (documentIds + string lat/lng)
  useEffect(() => {
    if (!venueSource) return
    // Prefer documentId from populated relations if present; else fallback to whatever is stored on venueLoc
    const rawVenueCity = (venueSource.location as { city?: unknown } | undefined)?.city
    const rawVenueState = (venueSource.location as { state?: unknown } | undefined)?.state
    const cityId = getDocumentId(rawVenueCity) || getDocumentId(venueLoc.city)
    const stateId = getDocumentId(rawVenueState) || getDocumentId(venueLoc.state)

    venueRHF.reset({
      location: {
        address: venueLoc.address ?? "",
        city: cityId,
        state: stateId,
        latitude: venueLoc.latitude != null ? String(venueLoc.latitude) : "",
        longitude: venueLoc.longitude != null ? String(venueLoc.longitude) : "",
      },
      capacity: venueSource.capacity ?? undefined,
      bookingDurationType: bookingType,
      bookingDuration: venueSource.bookingDuration ?? undefined,
      amneties: venueSource.amneties ?? [],
    })
  }, [venueSource, venueLoc.address, venueLoc.city, venueLoc.state, venueLoc.latitude, venueLoc.longitude, bookingType, venueRHF])

   const t=useTranslations("vendorvenueSection")
  return (
    <div className="py-4">
      <h3 className="text-lg font-semibold mb-4">{isVendor ? "Vendor" : "Venue"}{t("details")}</h3>
      {isVendor ? (
        <form onSubmit={submitVendor(onSubmitVendor)} id="vendor-form" className="flex flex-col gap-4">
          <TextArea label="About" disabled={submitting} {...vendorRegister("about")} />
          <Input type="number" label="Experience Years" disabled={submitting} {...vendorRegister("experienceYears", { valueAsNumber: true })} />

          <div>
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-medium">Service Areas</h4>
              <Button type="button" style="secondary" disabled={submitting} onClick={() => appendSA({ city: "", state: "", latitude: "", longitude: "" })}>
                Add Service Area
              </Button>
            </div>
            {serviceAreas.map((field, idx) => (
              <div key={field.id} className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end mb-3">
                <div className="col-span-2">
                  <Select
                    label={t("citylabel")}
                    disabled={submitting}
                    value={vendorRHF.watch(`serviceArea.${idx}.city`) || ""}
                    onChange={(e) => vendorRHF.setValue(`serviceArea.${idx}.city`, e.target.value, { shouldDirty: true })}
                    options={[{ label: t("selectcity"), value: "" }, ...cities.map((c) => ({ label: c.name, value: c.documentId }))]}
                  />
                </div>
                <div className="col-span-2">
                  <Select
                    label={t("statelabel")}
                    disabled={submitting}
                    value={vendorRHF.watch(`serviceArea.${idx}.state`) || ""}
                    onChange={(e) => vendorRHF.setValue(`serviceArea.${idx}.state`, e.target.value, { shouldDirty: true })}
                    options={[{ label: t("selectstate"), value: "" }, ...states.map((s) => ({ label: s.name, value: s.documentId }))]}
                  />
                </div>
                <div className="col-span-1">
                  <Input type="text" label="Latitude" disabled={submitting} {...vendorRegister(`serviceArea.${idx}.latitude` as const)} />
                </div>
                <div className="col-span-1">
                  <Input type="text" label="Longitude" disabled={submitting} {...vendorRegister(`serviceArea.${idx}.longitude` as const)} />
                </div>
                <div className="col-span-6 flex gap-3">
                  <Button type="button" style="secondary" disabled={submitting} onClick={() => onFetchVendorCoords(idx)}>
                    Fetch coordinates
                  </Button>
                  <Button type="button" style="ghost" disabled={submitting} onClick={() => removeSA(idx)} extraStyles="text-red-600 hover:text-red-700">
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <Button style="primary" type="submit" form="vendor-form" disabled={submitting}>
              {submitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      ) : (
        <form onSubmit={submitVenue(onSubmitVenue)} id="venue-form" className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
            <div className="col-span-2">
              <Input type="text" label={t("address")} disabled={submitting} {...venueRegister("location.address")} />
            </div>
            <div className="col-span-2">
              <Select
                label={t("city")}
                disabled={submitting}
                value={venueRHF.watch("location.city") || ""}
                onChange={(e) => venueRHF.setValue("location.city", e.target.value, { shouldDirty: true })}
                options={[{ label: "Select City", value: "" }, ...cities.map((c) => ({ label: c.name, value: c.documentId }))]}
              />
            </div>
            <div className="col-span-2">
              <Select
                label={t("state")}
                disabled={submitting}
                value={venueRHF.watch("location.state") || ""}
                onChange={(e) => venueRHF.setValue("location.state", e.target.value, { shouldDirty: true })}
                options={[{ label: "Select State", value: "" }, ...states.map((s) => ({ label: s.name, value: s.documentId }))]}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
            <div className="col-span-2">
              <Input type="text" label={t("latitude")} disabled={submitting} {...venueRegister("location.latitude")} />
            </div>
            <div className="col-span-2">
              <Input type="text" label={t("longitude")} disabled={submitting} {...venueRegister("location.longitude")} />
            </div>
            <div className="col-span-2">
              <Button type="button" style="secondary" disabled={submitting} onClick={onFetchVenueCoords}>
                {t("fetchcoordinates")}
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
            <div className="col-span-2">
              <Input type="number" label={t("capacity")} disabled={submitting} {...venueRegister("capacity", { valueAsNumber: true })} />
            </div>
            <div className="col-span-2">
              <Select
                label={t("bookingdurationtype")}
                disabled={submitting}
                value={venueRHF.watch("bookingDurationType") || ""}
                onChange={(e) => venueRHF.setValue("bookingDurationType", e.target.value as VenueForm["bookingDurationType"], { shouldDirty: true })}
                options={[{ label: "Select Duration Type", value: "" }, { label: "Per Day", value: "Per Day" }, { label: "Per Hour", value: "Per Hour" }]}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
            <div className="col-span-2">
              <Input type="number" label={t("bookingduration")} disabled={submitting} {...venueRegister("bookingDuration", { valueAsNumber: true })} />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-medium">{t("amenities")}</h4>
              <Button type="button" style="secondary" disabled={submitting} onClick={() => appendAmenity({ text: "" })}>
              {t("adamenity")}
              </Button>
            </div>
            {amenities.map((field, idx) => (
              <div key={field.id} className="flex gap-2 items-end mb-2">
                <div className="flex-1">
                  <Input type="text" label={`Amenity ${idx + 1}`} disabled={submitting} {...venueRegister(`amneties.${idx}.text` as const)} />
                </div>
                <Button type="button" style="ghost" disabled={submitting} onClick={() => removeAmenity(idx)} extraStyles="text-red-600 hover:text-red-700">
                  {t("remove")}
                </Button>
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <Button style="primary" type="submit" form="venue-form" disabled={submitting}>
              {submitting ? t("saving") : t("savechanges")}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
