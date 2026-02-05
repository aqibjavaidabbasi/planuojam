"use client"

import React, { useEffect, useMemo, useState, useCallback } from "react"
import dynamic from "next/dynamic";
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
import { Location as MapLocation } from "@/components/global/MapboxMap";
import { useTranslations } from "next-intl"
const MapPickerModal = dynamic(() => import("@/components/modals/MapPickerModal"))
const MapboxMap = dynamic(() => import("@/components/global/MapboxMap"), { ssr: false })

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
  minimumDuration?: number
  amneties: { text: string }[]
}

export default function VendorVenueSection({ listing, onSaved }: { listing: ListingItem; onSaved?: () => void }) {
  // Use a more robust service type detection
  // First try to get from category serviceType, fallback to listing type
  const getServiceType = useCallback((): 'vendor' | 'venue' => {
    // Try to get serviceType from the listing's category
    if (listing.category?.serviceType) {
      return listing.category.serviceType as 'vendor' | 'venue';
    }
    // Fallback to listing.type with validation
    const type = (listing.type || "vendor").toLowerCase().trim();
    return type === 'venue' ? 'venue' : 'vendor';
  }, [listing.type, listing.category?.serviceType]);
  
  const isVendor = useMemo(() => getServiceType() === 'vendor', [getServiceType])
  const [submitting, setSubmitting] = useState(false)
  const { cities } = useCities()
  const { states } = useStates()
  const [vendorPickerIndex, setVendorPickerIndex] = useState<number | null>(null)
  const [venuePickerOpen, setVenuePickerOpen] = useState(false)

  const vendorSource = listing.listingItem.find(item => item.__component === "dynamic-blocks.vendor")

  // Start with minimal defaults; we'll reset with mapped values once cities/states are available
  const defaultVendor: VendorForm = {
    about: vendorSource ? vendorSource.about : "",
    experienceYears: vendorSource ? vendorSource.experienceYears : undefined,
    serviceArea: [],
  }

  const venueSource = listing.listingItem.find(item => item.__component === "dynamic-blocks.venue")

  const venueLoc = (venueSource?.location ?? {}) as Partial<{ address: string; city: { documentId: string }; state: { documentId: string }; latitude: number; longitude: number }>

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
    minimumDuration: venueSource ? venueSource.minimumDuration : undefined,
    amneties: venueSource?.amneties ?? [],
  }


  // Use two separate forms based on type
  const vendorRHF = useForm<VendorForm>({ defaultValues: defaultVendor })
  const venueRHF = useForm<VenueForm>({ defaultValues: defaultVenue })

  const { control: vendorControl, register: vendorRegister, handleSubmit: submitVendor } = vendorRHF
  const { control: venueControl, register: venueRegister, handleSubmit: submitVenue } = venueRHF

  const { fields: serviceAreas, append: appendSA, remove: removeSA } = useFieldArray({ control: vendorControl, name: "serviceArea" })
  const { fields: amenities, append: appendAmenity, remove: removeAmenity } = useFieldArray({ control: venueControl, name: "amneties" })

  // Watch values for map reactivity
  const watchedServiceAreas = vendorRHF.watch("serviceArea")
  const watchedVenueLocation = venueRHF.watch("location")
  const watchedCapacity = venueRHF.watch("capacity")

  const onSubmitVendor = async (values: VendorForm) => {
    // minimal validation
    if (values.serviceArea?.some(sa => !sa.city || !sa.state)) {
      toast.error(t("errors.cityStateRequired"))
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
            type ServiceAreaPayload = { city?: Relation; state?: Relation; latitude?: number; longitude?: number }
            const transformed: ServiceAreaPayload = {}
            if (sa.city) transformed.city = { connect: [sa.city] }
            if (sa.state) transformed.state = { connect: [sa.state] }
            if (sa.latitude) transformed.latitude = Number(sa.latitude)
            if (sa.longitude) transformed.longitude = Number(sa.longitude)
            return transformed
          }),
        },
      ]
      await updateListing(listing.documentId, { data: { listingItem } }, listing.locale)
      toast.success(t("toasts.updated"))
      onSaved?.()
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : t("toasts.updateFailed")
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
          latitude?: number
          longitude?: number
          city?: RelationUpdate
          state?: RelationUpdate
        }
        capacity?: number
        bookingDurationType?: VenueForm["bookingDurationType"]
        bookingDuration?: number
        minimumDuration?: number
        amneties?: { text: string }[]
      }

      const next: VenuePayload = { __component: "dynamic-blocks.venue" }

      // Build location safely and only include relation updates that are valid
      if (values.location) {
        const loc: VenuePayload["location"] = {}
        if (values.location.address != null) loc.address = values.location.address
        if (values.location.latitude != null) loc.latitude = Number(values.location.latitude)
        if (values.location.longitude != null) loc.longitude = Number(values.location.longitude)

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
      if (values.minimumDuration) next.minimumDuration = values.minimumDuration
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
      toast.success(t("toasts.updated"))
      onSaved?.()
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : t("toasts.updateFailed")
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  // const onFetchVendorCoords = async (idx: number) => {
  //   const cityId = vendorRHF.getValues(`serviceArea.${idx}.city`)
  //   const stateId = vendorRHF.getValues(`serviceArea.${idx}.state`)
  //   const cityName = cities.find((c) => c.documentId === cityId)?.name
  //   const stateName = states.find((s) => s.documentId === stateId)?.name
  //   const res = await geocodePlace(cityName, stateName)
  //   if (res) {
  //     vendorRHF.setValue(`serviceArea.${idx}.latitude`, String(res.lat), { shouldDirty: true })
  //     vendorRHF.setValue(`serviceArea.${idx}.longitude`, String(res.lng), { shouldDirty: true })
  //   }
  // }

  // const onFetchVenueCoords = async () => {
  //   const cityId = venueRHF.getValues("location.city")
  //   const stateId = venueRHF.getValues("location.state")
  //   const cityName = cities.find((c) => c.documentId === cityId)?.name
  //   const stateName = states.find((s) => s.documentId === stateId)?.name
  //   const res = await geocodePlace(cityName, stateName)
  //   if (res) {
  //     venueRHF.setValue("location.latitude", String(res.lat), { shouldDirty: true })
  //     venueRHF.setValue("location.longitude", String(res.lng), { shouldDirty: true })
  //   }
  // }

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
      minimumDuration: venueSource.minimumDuration ?? undefined,
      amneties: venueSource.amneties ?? [],
    })
  }, [venueSource, venueLoc.address, venueLoc.city, venueLoc.state, venueLoc.latitude, venueLoc.longitude, bookingType, venueRHF])

  const t = useTranslations("vendorvenueSection")

  // Get current locations for map display
  const getCurrentLocations = useMemo((): MapLocation[] => {
    const locations: MapLocation[] = []

    if (isVendor) {
      // Add vendor service areas
      const serviceAreasData = watchedServiceAreas || []
      serviceAreasData.forEach((sa: ServiceArea, index: number) => {
        if (sa.latitude && sa.longitude && !isNaN(Number(sa.latitude)) && !isNaN(Number(sa.longitude))) {
          const cityName = cities.find(c => c.documentId === sa.city)?.name || t("unknown")
          const stateName = states.find(s => s.documentId === sa.state)?.name || t("unknown")
          locations.push({
            id: index,
            name: `${cityName}, ${stateName}`,
            title: t("serviceArea"),
            username: "",
            description: t("serviceAreaDescription", { index: index + 1 }),
            category: { name: t("service"), type: "vendor" },
            position: { lat: Number(sa.latitude), lng: Number(sa.longitude) },
            address: `${cityName}, ${stateName}`,
            image: listing.portfolio[0],
            path: ""
          })
        }
      })
    } else {
      // Add venue location
      const venueLocation = watchedVenueLocation
      if (venueLocation?.latitude && venueLocation?.longitude &&
        !isNaN(Number(venueLocation.latitude)) && !isNaN(Number(venueLocation.longitude))) {
        const cityName = cities.find(c => c.documentId === venueLocation.city)?.name || t("unknown")
        const stateName = states.find(s => s.documentId === venueLocation.state)?.name || t("unknown")
        const address = venueLocation.address || `${cityName}, ${stateName}`
        locations.push({
          id: 0,
          name: address,
          title: t("venueLocation"),
          username: "",
          description: t("venueLocationDescription"),
          category: { name: t("venue"), type: "venue" },
          position: { lat: Number(venueLocation.latitude), lng: Number(venueLocation.longitude) },
          address: address,
          image: listing.portfolio[0],
          maximumCapacity: watchedCapacity,
          path: ""
        })
      }
    }

    return locations
  }, [isVendor, watchedServiceAreas, watchedVenueLocation, watchedCapacity, cities, states, t, listing.portfolio])

  return (
    <div className="py-4">
      <h3 className="text-lg font-semibold mb-4">{`${isVendor ? t("vendor") : t("venue")} ${t("details")}`}</h3>
      {isVendor ? (
        <form onSubmit={submitVendor(onSubmitVendor)} id="vendor-form" className="flex flex-col gap-4">
          <TextArea label={t("about")} disabled={submitting} {...vendorRegister("about")} />
          <Input type="number" label={t("experienceYears")} disabled={submitting} {...vendorRegister("experienceYears", { valueAsNumber: true })} />

          <div>
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-medium">{t("serviceareas")}</h4>
              <Button type="button" style="secondary" disabled={submitting} onClick={() => appendSA({ city: "", state: "", latitude: "", longitude: "" })}>
                {t("addservicearea")}
              </Button>
            </div>
            <p className="text-sm text-gray-500 mb-2">{t("serviceAreaHint")}</p>
            {serviceAreas.map((field, idx) => (
              <div key={field.id} className="flex flex-col gap-3 mb-3">
                <Select
                  label={t("citylabel")}
                  disabled={submitting}
                  required
                  value={vendorRHF.watch(`serviceArea.${idx}.city`) || ""}
                  onChange={(e) => vendorRHF.setValue(`serviceArea.${idx}.city`, e.target.value, { shouldDirty: true })}
                  options={[{ label: t("selectcity"), value: "" }, ...cities.sort((a, b) => b.priority - a.priority).map((c) => ({ label: c.name, value: c.documentId }))]}
                />
                <Select
                  label={t("statelabel")}
                  disabled={submitting}
                  required
                  value={vendorRHF.watch(`serviceArea.${idx}.state`) || ""}
                  onChange={(e) => vendorRHF.setValue(`serviceArea.${idx}.state`, e.target.value, { shouldDirty: true })}
                  options={[{ label: t("selectstate"), value: "" }, ...states.sort((a, b) => b.priority - a.priority).map((s) => ({ label: s.name, value: s.documentId }))]}
                />
                <div className="hidden!">
                  <Input
                    type="number"
                    step="any"
                    min={-90}
                    max={90}
                    label={t("latitude")}
                    disabled
                    {...vendorRegister(`serviceArea.${idx}.latitude` as const, {
                      validate: (v) => {
                        if (v == null || v === "") return true
                        const n = Number(v)
                        return (Number.isFinite(n) && n >= -90 && n <= 90) || t("errors.invalidLatitude")
                      },
                    })}
                  />
                  <Input
                    type="number"
                    step="any"
                    min={-180}
                    max={180}
                    label={t("longitude")}
                    disabled
                    {...vendorRegister(`serviceArea.${idx}.longitude` as const, {
                      validate: (v) => {
                        if (v == null || v === "") return true
                        const n = Number(v)
                        return (Number.isFinite(n) && n >= -180 && n <= 180) || t("errors.invalidLongitude")
                      },
                    })}
                  />
                </div>
                <div className="flex flex-col md:flex-row gap-3">
                  {/* <Button type="button" style="secondary" disabled={submitting} onClick={() => onFetchVendorCoords(idx)}>
                    {t("fetchcoordinates")}
                  </Button> */}
                  <Button type="button" style="secondary" disabled={submitting} onClick={() => setVendorPickerIndex(idx)}>
                    {t("picklocation")}
                  </Button>
                  <Button type="button" style="ghost" disabled={submitting} onClick={() => removeSA(idx)} extraStyles="text-red-600 hover:text-red-700">
                    {t("remove")}
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <Button style="primary" type="submit" form="vendor-form" disabled={submitting}>
              {submitting ? `${t("saving")}...` : t("savechanges")}
            </Button>
          </div>
        </form>
      ) : (
        <form onSubmit={submitVenue(onSubmitVenue)} id="venue-form" className="flex flex-col gap-4">
          <div className="flex gap-3 flex-col">
            <p className="text-sm text-gray-500 mt-2">{t("locationHint")}</p>
            <Input type="text" label={t("address")} disabled={submitting} {...venueRegister("location.address")} />
            <Select
              label={t("city")}
              disabled={submitting}
              value={venueRHF.watch("location.city") || ""}
              onChange={(e) => venueRHF.setValue("location.city", e.target.value, { shouldDirty: true })}
              options={[{ label: t("selectcity"), value: "" }, ...cities.sort((a, b) => b.priority - a.priority).map((c) => ({ label: c.name, value: c.documentId }))]}
            />
            <Select
              label={t("state")}
              disabled={submitting}
              value={venueRHF.watch("location.state") || ""}
              onChange={(e) => venueRHF.setValue("location.state", e.target.value, { shouldDirty: true })}
              options={[{ label: t("selectstate"), value: "" }, ...states.sort((a, b) => b.priority - a.priority).map((s) => ({ label: s.name, value: s.documentId }))]}
            />
          </div>
          <div className="flex gap-3 flex-col">
            <div className="hidden!">
              <Input
                type="number"
                step="any"
                min={-90}
                max={90}
                label={t("latitude")}
                disabled
                {...venueRegister("location.latitude", {
                  validate: (v) => {
                    if (v == null || v === "") return true
                    const n = Number(v)
                    return (Number.isFinite(n) && n >= -90 && n <= 90) || t("errors.invalidLatitude")
                  },
                })}
              />
              <Input
                type="number"
                step="any"
                min={-180}
                max={180}
                label={t("longitude")}
                disabled
                {...venueRegister("location.longitude", {
                  validate: (v) => {
                    if (v == null || v === "") return true
                    const n = Number(v)
                    return (Number.isFinite(n) && n >= -180 && n <= 180) || t("errors.invalidLongitude")
                  },
                })}
              />
            </div>
            <div className="flex flex-col md:flex-row gap-3">
              {/* <Button type="button" style="secondary" disabled={submitting} onClick={onFetchVenueCoords}>
                {t("fetchcoordinates")}
              </Button> */}
              <Button type="button" style="secondary" disabled={submitting} onClick={() => setVenuePickerOpen(true)}>
                {t("picklocation")}
              </Button>
            </div>
          </div>
          <div className="flex gap-3 flex-col">
            <Input type="number" label={t("capacity")} disabled={submitting} {...venueRegister("capacity", { valueAsNumber: true })} />
            <Select
              label={t("bookingdurationtype")}
              disabled={submitting}
              value={venueRHF.watch("bookingDurationType") || ""}
              onChange={(e) => venueRHF.setValue("bookingDurationType", e.target.value as VenueForm["bookingDurationType"], { shouldDirty: true })}
              options={[
                { label: t("selectdurationtype"), value: "" },
                { label: t("perday"), value: "Per Day" },
                { label: t("perhour"), value: "Per Hour" }
              ]}
            />
            <Input type="number" label={t("bookingduration")} disabled={submitting} {...venueRegister("bookingDuration", { valueAsNumber: true })} />
            <Input type="number" label={t("minimumDuration.label")} disabled={submitting} {...venueRegister("minimumDuration", { valueAsNumber: true })} />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <h4 className="font-medium">{t("amenities.title")}</h4>
                <div className="group relative">
                  <div className="absolute -right-6 -top-1 w-5 h-5 flex items-center justify-center">
                    <div className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center cursor-help">
                      <span className="text-xs">ℹ️</span>
                    </div>
                  </div>
                  <div className="invisible group-hover:visible absolute z-10 w-64 p-3 mt-8 bg-white border border-gray-200 rounded-lg shadow-lg">
                    <div className="text-sm text-gray-600">{t("amenities.tooltip")}</div>
                  </div>
                </div>
              </div>
              <Button type="button" style="secondary" disabled={submitting} onClick={() => appendAmenity({ text: "" })}>
                {t("amenities.add")}
              </Button>
            </div>
            {t("amenities.description") && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">{t("amenities.description")}</p>
              </div>
            )}
            {t("amenities.helperText") && (
              <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-600">{t("amenities.helperText")}</p>
              </div>
            )}
            {amenities.map((field, idx) => (
              <div key={field.id} className="flex gap-2 items-end mb-2">
                <div className="flex-1">
                  <Input type="text" label={t("amenities.itemLabel")} disabled={submitting} {...venueRegister(`amneties.${idx}.text` as const)} />
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

      {/* Location Preview Map */}
      {getCurrentLocations.length > 0 && (
        <div className="mt-6">
          <h4 className="font-medium mb-3">{t("locationPreview")}</h4>
          <p className="text-sm text-gray-500 mb-3">{t("locationPreviewHint")}</p>
          <div className="h-64 w-full border border-gray-200 rounded-lg overflow-hidden">
            <MapboxMap locations={getCurrentLocations} selectedPlace={null} />
          </div>
        </div>
      )}

      {/* Vendor Map Picker */}
      <MapPickerModal
        isOpen={vendorPickerIndex !== null}
        onClose={() => setVendorPickerIndex(null)}
        initial={(() => {
          const latStr = vendorRHF.getValues(`serviceArea.${vendorPickerIndex!}.latitude`)
          const lngStr = vendorRHF.getValues(`serviceArea.${vendorPickerIndex!}.longitude`)
          const lat = latStr && !isNaN(Number(latStr)) ? Number(latStr) : undefined
          const lng = lngStr && !isNaN(Number(lngStr)) ? Number(lngStr) : undefined
          return { lat, lng }
        })()}
        onSelect={(lat, lng) => {
          if (vendorPickerIndex !== null) {
            vendorRHF.setValue(`serviceArea.${vendorPickerIndex}.latitude`, String(lat), { shouldDirty: true })
            vendorRHF.setValue(`serviceArea.${vendorPickerIndex}.longitude`, String(lng), { shouldDirty: true })
          }
          setVendorPickerIndex(null)
        }}
      />
      {/* Venue Map Picker */}
      <MapPickerModal
        isOpen={venuePickerOpen}
        onClose={() => setVenuePickerOpen(false)}
        initial={(() => {
          const latStr = venueRHF.getValues("location.latitude")
          const lngStr = venueRHF.getValues("location.longitude")
          const lat = latStr && !isNaN(Number(latStr)) ? Number(latStr) : undefined
          const lng = lngStr && !isNaN(Number(lngStr)) ? Number(lngStr) : undefined
          return { lat, lng }
        })()}
        onSelect={(lat, lng) => {
          venueRHF.setValue("location.latitude", String(lat), { shouldDirty: true })
          venueRHF.setValue("location.longitude", String(lng), { shouldDirty: true })
          setVenuePickerOpen(false)
        }}
      />
    </div>
  )
}
