"use client"

import React, { useMemo, useState } from "react"
import { useFieldArray, useForm } from "react-hook-form"
import Input from "../../custom/Input"
import TextArea from "../../custom/TextArea"
import Select from "../../custom/Select"
import Button from "../../custom/Button"
import ToggleButton from "../../custom/ToggleButton"
import { toast } from "react-hot-toast"
import { updateListing } from "@/services/listing"
import type { ListingItem } from "@/types/pagesTypes"
import { useCities } from "@/context/CitiesContext"
import { useStates } from "@/context/StatesContext"
import { geocodePlace } from "@/utils/mapboxLocation"

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

  const defaultVendor: VendorForm = {
    about: (listing.listingItem as any)?.[0]?.about || "",
    experienceYears: (listing.listingItem as any)?.[0]?.experienceYears ?? undefined,
    serviceArea: ((listing.listingItem as any)?.[0]?.serviceArea || []) as ServiceArea[],
  }

  const defaultVenue: VenueForm = {
    location: {
      address: (listing.listingItem as any)?.[0]?.location?.address || "",
      city: (listing.listingItem as any)?.[0]?.location?.city || "",
      state: (listing.listingItem as any)?.[0]?.location?.state || "",
      latitude: (listing.listingItem as any)?.[0]?.location?.latitude || "",
      longitude: (listing.listingItem as any)?.[0]?.location?.longitude || "",
    },
    capacity: (listing.listingItem as any)?.[0]?.capacity ?? undefined,
    bookingDurationType: (listing.listingItem as any)?.[0]?.bookingDurationType || "",
    bookingDuration: (listing.listingItem as any)?.[0]?.bookingDuration ?? undefined,
    amneties: ((listing.listingItem as any)?.[0]?.amneties || []) as { text: string }[],
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
      toast.error("Each service area needs a city and state")
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
            const transformed: any = { ...sa }
            if (sa.city) transformed.city = { connect: [sa.city] }
            if (sa.state) transformed.state = { connect: [sa.state] }
            return transformed
          }),
        },
      ]
      await updateListing(listing.documentId, { data: { listingItem } })
      toast.success("Vendor details updated")
      onSaved?.()
    } catch (e: any) {
      toast.error(e?.message || "Failed to update vendor details")
    } finally {
      setSubmitting(false)
    }
  }

  const onSubmitVenue = async (values: VenueForm) => {
    setSubmitting(true)
    try {
      const next: any = {
        __component: "dynamic-blocks.venue",
      }
      if (values.location) next.location = { ...values.location }
      if (values.capacity) next.capacity = values.capacity
      if (values.bookingDurationType) next.bookingDurationType = values.bookingDurationType
      if (values.bookingDuration) next.bookingDuration = values.bookingDuration
      if (values.amneties && values.amneties.length > 0) next.amneties = values.amneties

      await updateListing(listing.documentId, { data: { listingItem: [next] } })
      toast.success("Venue details updated")
      onSaved?.()
    } catch (e: any) {
      toast.error(e?.message || "Failed to update venue details")
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

  return (
    <div className="py-4">
      <h3 className="text-lg font-semibold mb-4">{isVendor ? "Vendor" : "Venue"} Details</h3>
      {isVendor ? (
        <form onSubmit={submitVendor(onSubmitVendor)} className="flex flex-col gap-4">
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
                    label="City"
                    disabled={submitting}
                    value={vendorRHF.watch(`serviceArea.${idx}.city`) || ""}
                    onChange={(e) => vendorRHF.setValue(`serviceArea.${idx}.city`, e.target.value, { shouldDirty: true })}
                    options={[{ label: "Select City", value: "" }, ...cities.map((c) => ({ label: c.name, value: c.documentId }))]}
                  />
                </div>
                <div className="col-span-2">
                  <Select
                    label="State"
                    disabled={submitting}
                    value={vendorRHF.watch(`serviceArea.${idx}.state`) || ""}
                    onChange={(e) => vendorRHF.setValue(`serviceArea.${idx}.state`, e.target.value, { shouldDirty: true })}
                    options={[{ label: "Select State", value: "" }, ...states.map((s) => ({ label: s.name, value: s.documentId }))]}
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
            <Button style="primary" type="submit" disabled={submitting}>
              {submitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      ) : (
        <form onSubmit={submitVenue(onSubmitVenue)} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
            <div className="col-span-2">
              <Input type="text" label="Address" disabled={submitting} {...venueRegister("location.address")} />
            </div>
            <div className="col-span-2">
              <Select
                label="City"
                disabled={submitting}
                value={venueRHF.watch("location.city") || ""}
                onChange={(e) => venueRHF.setValue("location.city", e.target.value, { shouldDirty: true })}
                options={[{ label: "Select City", value: "" }, ...cities.map((c) => ({ label: c.name, value: c.documentId }))]}
              />
            </div>
            <div className="col-span-2">
              <Select
                label="State"
                disabled={submitting}
                value={venueRHF.watch("location.state") || ""}
                onChange={(e) => venueRHF.setValue("location.state", e.target.value, { shouldDirty: true })}
                options={[{ label: "Select State", value: "" }, ...states.map((s) => ({ label: s.name, value: s.documentId }))]}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
            <div className="col-span-2">
              <Input type="text" label="Latitude" disabled={submitting} {...venueRegister("location.latitude")} />
            </div>
            <div className="col-span-2">
              <Input type="text" label="Longitude" disabled={submitting} {...venueRegister("location.longitude")} />
            </div>
            <div className="col-span-2">
              <Button type="button" style="secondary" disabled={submitting} onClick={onFetchVenueCoords}>
                Fetch coordinates
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
            <div className="col-span-2">
              <Input type="number" label="Capacity" disabled={submitting} {...venueRegister("capacity", { valueAsNumber: true })} />
            </div>
            <div className="col-span-2">
              <Select
                label="Booking Duration Type"
                disabled={submitting}
                value={venueRHF.watch("bookingDurationType") || ""}
                onChange={(e) => venueRHF.setValue("bookingDurationType", e.target.value as any, { shouldDirty: true })}
                options={[{ label: "Select Duration Type", value: "" }, { label: "Per Day", value: "Per Day" }, { label: "Per Hour", value: "Per Hour" }]}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
            <div className="col-span-2">
              <Input type="number" label="Booking Duration" disabled={submitting} {...venueRegister("bookingDuration", { valueAsNumber: true })} />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-medium">Amenities</h4>
              <Button type="button" style="secondary" disabled={submitting} onClick={() => appendAmenity({ text: "" })}>
                Add Amenity
              </Button>
            </div>
            {amenities.map((field, idx) => (
              <div key={field.id} className="flex gap-2 items-end mb-2">
                <div className="flex-1">
                  <Input type="text" label={`Amenity ${idx + 1}`} disabled={submitting} {...venueRegister(`amneties.${idx}.text` as const)} />
                </div>
                <Button type="button" style="ghost" disabled={submitting} onClick={() => removeAmenity(idx)} extraStyles="text-red-600 hover:text-red-700">
                  Remove
                </Button>
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <Button style="primary" type="submit" disabled={submitting}>
              {submitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
