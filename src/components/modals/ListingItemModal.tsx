import React, { useEffect, useMemo, useState } from "react";
import Modal from "../custom/Modal";
import Input from "../custom/Input";
import TextArea from "../custom/TextArea";
import Select from "../custom/Select";
import Checkbox from "../custom/Checkbox";
import Button from "../custom/Button";
import { ListingItem, Vendor, Venue, ServiceArea, Discount, FAQ, Plans, SocialLink } from "@/types/pagesTypes";
import { deleteAPI, postAPIWithToken, putAPI } from "@/services/api";
import { useForm } from "react-hook-form";

// Helper types for form state (allow partials for create flows)
type ListingItemForm = Partial<ListingItem> & {
    listingItem?: Array<Partial<Venue> | Partial<Vendor>>;
    eventTypes?: Array<{ documentId?: string; id?: number } | any>;
    category?: any;
};

interface ListingItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    // Strapi REST endpoint, e.g. "listing-items"
    endpoint: string;
    // Optional existing listing for edit/delete
    initialData?: ListingItem;
    // Callbacks
    onSaved?: (saved: any) => void;
    onDeleted?: () => void;
}

const ListingItemModal: React.FC<ListingItemModalProps> = ({
    isOpen,
    onClose,
    endpoint,
    initialData,
    onSaved,
    onDeleted,
}) => {
    const isEdit = !!initialData?.id;
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const initialDataCopy = {
        title: initialData?.title || "",
        slug: initialData?.slug || "",
        description: initialData?.description || "",
        type: initialData?.type || "vendor",
        featured: initialData?.featured ?? false,
        price: initialData?.price ?? undefined,
        listingStatus: initialData?.listingStatus || "Draft",
        category: initialData?.category || undefined,
        contact: initialData?.contact || { email: "", phone: "", address: "" },
        websiteLink: initialData?.websiteLink || "",
        workingHours: initialData?.workingHours ?? undefined,
        socialLinks: initialData?.socialLinks || { optionalSectionTitle: "", socialLink: [] },
        eventTypes: initialData?.eventTypes || [],
        pricingPackages: initialData?.pricingPackages || {
            sectionTitle: "",
            plans: [],
            optionalAddons: [],
        },
        FAQs: initialData?.FAQs || { sectionTitle: "", numberOfColumns: 1, items: [] },
        hotDeal: initialData?.hotDeal || {
            enableHotDeal: false,
            startDate: "",
            lastDate: "",
            dealNote: "",
            discount: { discountType: "Flat Rate", percentage: 0, flatRatePrice: 0 } as Discount,
        },
        listingItem: initialData?.listingItem || [
            { __component: "dynamic-blocks.vendor", about: "", experienceYears: 0, serviceArea: [] as ServiceArea[] },
        ],
    }

    const {
        handleSubmit: rhfHandleSubmit,
        setValue,
        getValues,
        watch,
        reset,
    } = useForm<ListingItemForm>({
        defaultValues: initialDataCopy
    });
    const form = watch();

    useEffect(() => {
        if (isOpen) {
            // Ensure errors cleared and defaults reset when opening
            setError(null);
            reset(initialDataCopy);
        }
    }, [isOpen, initialData, reset]);

    useEffect(() => {
        if (form.type === "venue" && (form.listingItem?.[0]?.__component !== "dynamic-blocks.venue")) {
            updateField("listingItem", [
                {
                    __component: "dynamic-blocks.venue",
                    id: initialData?.listingItem?.[0]?.id ?? 0, // Preserve id if editing
                    capacity: 0,
                    bookingDurationType: "",
                    bookingDuration: 0,
                    location: { address: "", city: "", country: "", latitude: 0, longitude: 0, id: 0 },
                    amneties: [],
                },
            ]);
        } else if (form.type === "vendor" && (form.listingItem?.[0]?.__component !== "dynamic-blocks.vendor")) {
            updateField("listingItem", [
                {
                    __component: "dynamic-blocks.vendor",
                    id: initialData?.listingItem?.[0]?.id ?? 0,
                    about: "",
                    experienceYears: 0,
                    serviceArea: [],
                },
            ]);
        }
    }, [form.type, initialData]);

    const isVendor = useMemo(() => (form?.type || "vendor").toLowerCase() === "vendor", [form?.type]);

    const updateField = (path: string, value: any) => {
        setValue(path as any, value, { shouldDirty: true });
    };

    const addArrayItem = (path: string, item: any) => {
        const current = (getValues(path as any) as any[]) || [];
        setValue(path as any, [...current, item], { shouldDirty: true });
    };

    const removeArrayItem = (path: string, index: number) => {
        const current = (getValues(path as any) as any[]) || [];
        const next = current.filter((_, i) => i !== index);
        setValue(path as any, next, { shouldDirty: true });
    };

    const onSubmit = async () => {
        setSubmitting(true);
        setError(null);
        try {
            const payload = getValues(); // Adjust to { data: payload } if your API requires
            console.log(payload)
            // let res;
            // if (isEdit && initialData?.id) {
            //     res = await putAPI(`${endpoint}/${initialData.id}`, payload);
            // } else {
            //     res = await postAPIWithToken(endpoint, payload);
            // }
            // onSaved?.(res);
            onClose();
        } catch (e: any) {
            setError(e?.message || "Failed to save listing");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!isEdit || !initialData?.id) return;
        setSubmitting(true);
        setError(null);
        try {
            await deleteAPI(`${endpoint}/${initialData.id}`);
            onDeleted?.();
            onClose();
        } catch (e: any) {
            setError(e?.message || "Failed to delete listing");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size="lg"
            title={isEdit ? "Edit Listing" : "Create Listing"}
            footer={
                <div className="flex gap-3 justify-between flex-wrap">
                    <div className="flex gap-2">
                        {isEdit && (
                            <Button style="secondary" onClick={handleDelete} disabled={submitting}>
                                Delete
                            </Button>
                        )}
                    </div>
                    <div className="ml-auto flex gap-2">
                        <Button style="ghost" onClick={onClose} disabled={submitting}>
                            Cancel
                        </Button>
                        <Button style="primary" onClick={rhfHandleSubmit(onSubmit)} disabled={submitting}>
                            {submitting ? "Saving..." : isEdit ? "Save" : "Create"}
                        </Button>
                    </div>
                </div>
            }
        >
            {error && (
                <div className="mb-4 p-3 rounded bg-red-50 text-red-700 border border-red-200">
                    {error}
                </div>
            )}

            {/* Basic Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-14">
                <div className="col-span-2">
                    <Input
                        type="text"
                        label="Title"
                        value={form.title || ""}
                        onChange={(e) => updateField("title", e.target.value)}
                    />
                </div>
                <Input
                    type="text"
                    label="Slug"
                    value={form.slug || ""}
                    onChange={(e) => updateField("slug", e.target.value)}
                />
                <Input
                    type="number"
                    label="Price"
                    value={form.price ?? ""}
                    onChange={(e) => updateField("price", Number(e.target.value))}
                />
                <Select
                    placeholder="Select Type"
                    value={form.type || "vendor"}
                    onChange={(e: any) => updateField("type", e.target.value)}
                    options={[
                        { label: "Vendor", value: "vendor" },
                        { label: "Venue", value: "venue" },
                    ]}
                />
                <Select
                    placeholder="Listing Status"
                    value={form.listingStatus || "Draft"}
                    onChange={(e: any) => updateField("listingStatus", e.target.value)}
                    options={[
                        { label: "Draft", value: "Draft" },
                        { label: "Published", value: "Published" },
                    ]}
                />
                <div className="flex items-center mt-6">
                    <Checkbox
                        label="Featured"
                        checked={!!form.featured}
                        onChange={(e: any) => updateField("featured", e.target.checked)}
                    />
                </div>
            </div>

            <div className="mt-4">
                <TextArea
                    label="Description"
                    placeholder="Description"
                    value={form.description || ""}
                    onChange={(e) => updateField("description", e.target.value)}
                    rows={4}
                />
            </div>

            {/* Contact */}
            <div className="mt-6">
                <h3 className="text-lg font-semibold mb-2">Contact</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                        type="email"
                        label="Email"
                        value={form.contact?.email || ""}
                        onChange={(e) => updateField("contact.email", e.target.value)}
                    />
                    <Input
                        type="text"
                        label="Phone"
                        value={form.contact?.phone || ""}
                        onChange={(e) => updateField("contact.phone", e.target.value)}
                    />
                    <Input
                        type="text"
                        label="Address"
                        value={form.contact?.address || ""}
                        onChange={(e) => updateField("contact.address", e.target.value)}
                    />
                </div>
            </div>

            {/* Links and Hours */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                    type="url"
                    label="Website Link"
                    value={form.websiteLink || ""}
                    onChange={(e) => updateField("websiteLink", e.target.value)}
                />
                <Input
                    type="number"
                    label="Working Hours (per day)"
                    value={form.workingHours ?? ""}
                    onChange={(e) => updateField("workingHours", Number(e.target.value))}
                />
            </div>

            {/* Social Links */}
            <div className="mt-6">
                <h3 className="text-lg font-semibold mb-2">Social Links</h3>
                <Input
                    type="text"
                    label="Section Title"
                    value={form.socialLinks?.optionalSectionTitle || ""}
                    onChange={(e) => updateField("socialLinks.optionalSectionTitle", e.target.value)}
                />
                <div className="mt-2 flex flex-col gap-3">
                    {((form.socialLinks?.socialLink || []) as Partial<SocialLink>[]).map((s: Partial<SocialLink>, idx) => (
                        <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                            <Input
                                type="text"
                                label="Platform"
                                value={s.platform || ""}
                                onChange={(e) => {
                                    const list = [...(form.socialLinks?.socialLink || [])] as Partial<SocialLink>[];
                                    list[idx] = { ...(list[idx] || {}), platform: e.target.value } as Partial<SocialLink>;
                                    updateField("socialLinks.socialLink", list);
                                }}
                            />
                            <Input
                                type="url"
                                label="Link"
                                value={s.link || ""}
                                onChange={(e) => {
                                    const list = [...(form.socialLinks?.socialLink || [])] as Partial<SocialLink>[];
                                    list[idx] = { ...(list[idx] || {}), link: e.target.value } as Partial<SocialLink>;
                                    updateField("socialLinks.socialLink", list);
                                }}
                            />
                            <Select
                                placeholder="Show This Icon?"
                                value={String(s.visible ?? true)}
                                onChange={(e: any) => {
                                    const list = [...(form.socialLinks?.socialLink || [])] as Partial<SocialLink>[];
                                    list[idx] = { ...(list[idx] || {}), visible: e.target.value === "true" } as Partial<SocialLink>;
                                    updateField("socialLinks.socialLink", list);
                                }}
                                options={[{ label: "Yes", value: "true" }, { label: "No", value: "false" }]}
                            />
                            <Button style="ghost" onClick={() => removeArrayItem("socialLinks.socialLink", idx)}>Remove</Button>
                        </div>
                    ))}
                    <div>
                        <Button style="secondary" onClick={() => addArrayItem("socialLinks.socialLink", { platform: "", link: "", visible: true })}>
                            + Add Social Link
                        </Button>
                    </div>
                </div>
            </div>

            {/* Pricing Packages */}
            <div className="mt-8">
                <h3 className="text-lg font-semibold mb-2">Pricing Packages</h3>
                <Input
                    type="text"
                    label="Section Title"
                    value={form.pricingPackages?.sectionTitle || ""}
                    onChange={(e) => updateField("pricingPackages.sectionTitle", e.target.value)}
                />
                <div className="flex flex-col gap-4 mt-2">
                    {(form.pricingPackages?.plans || []).map((p: Partial<Plans>, idx: number) => (
                        <div key={idx} className="border rounded p-3 grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                            <Input type="text" label="Name" value={p.name || ""} onChange={(e) => {
                                const list = [...(form.pricingPackages?.plans || [])] as Partial<Plans>[];
                                list[idx] = { ...(list[idx] || {}), name: e.target.value } as Partial<Plans>;
                                updateField("pricingPackages.plans", list);
                            }} />
                            <Input type="number" label="Price" value={p.price ?? ""} onChange={(e) => {
                                const list = [...(form.pricingPackages?.plans || [])] as Partial<Plans>[];
                                list[idx] = { ...(list[idx] || {}), price: Number(e.target.value) } as Partial<Plans>;
                                updateField("pricingPackages.plans", list);
                            }} />
                            <Select placeholder="Popular" value={String(p.isPopular ?? false)} onChange={(e: any) => {
                                const list = [...(form.pricingPackages?.plans || [])] as Partial<Plans>[];
                                list[idx] = { ...(list[idx] || {}), isPopular: e.target.value === "true" } as Partial<Plans>;
                                updateField("pricingPackages.plans", list);
                            }} options={[{ label: "No", value: "false" }, { label: "Yes", value: "true" }]} />
                            <Button style="ghost" onClick={() => removeArrayItem("pricingPackages.plans", idx)}>Remove Plan</Button>
                        </div>
                    ))}
                    <div>
                        <Button style="secondary" onClick={() => addArrayItem("pricingPackages.plans", { name: "", price: 0, isPopular: false, cta: { __component: 'dynamic-blocks.call-to-action', id: 0, bodyText: '', buttonUrl: '', style: 'primary' }, featuresList: [] })}>
                            + Add Plan
                        </Button>
                    </div>
                </div>
            </div>

            {/* FAQs */}
            <div className="mt-8">
                <h3 className="text-lg font-semibold mb-2">FAQs</h3>
                <Input
                    type="text"
                    label="Section Title"
                    value={form.FAQs?.sectionTitle || ""}
                    onChange={(e) => updateField("FAQs.sectionTitle", e.target.value)}
                />
                <div className="flex flex-col gap-3 mt-2">
                    {(form.FAQs?.items || []).map((f: Partial<FAQ>, idx: number) => (
                        <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                            <div className="col-span-2">
                                <Input type="text" label="Question" value={f.question || ""} onChange={(e) => {
                                    const list = [...(form.FAQs?.items || [])] as Partial<FAQ>[];
                                    list[idx] = { ...(list[idx] || {}), question: e.target.value } as Partial<FAQ>;
                                    updateField("FAQs.items", list);
                                }} />
                            </div>
                            <Button style="ghost" onClick={() => removeArrayItem("FAQs.items", idx)}>Remove</Button>
                            <div className="col-span-3" >
                                <TextArea label="Answer" rows={5} value={f.answer || ""} onChange={(e) => {
                                    const list = [...(form.FAQs?.items || [])] as Partial<FAQ>[];
                                    list[idx] = { ...(list[idx] || {}), answer: e.target.value } as Partial<FAQ>;
                                    updateField("FAQs.items", list);
                                }} />
                            </div>
                        </div>
                    ))}
                    <div>
                        <Button style="secondary" onClick={() => addArrayItem("FAQs.items", { question: "", answer: "" })}>
                            + Add FAQ
                        </Button>
                    </div>
                </div>
            </div>

            {/* Hot Deal */}
            <div className="mt-8">
                <h3 className="text-lg font-semibold mb-2">Hot Deal</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input type="date" label="Start Date" value={form.hotDeal?.startDate || ""} onChange={(e) => updateField("hotDeal.startDate", e.target.value)} />
                    <Input type="date" label="Last Date" value={form.hotDeal?.lastDate || ""} onChange={(e) => updateField("hotDeal.lastDate", e.target.value)} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">

                    <Input
                        type="text"
                        label="Deal Note"
                        value={form.hotDeal?.dealNote || ""}
                        onChange={(e) => updateField("hotDeal.dealNote", e.target.value)}
                    />
                    <div className="flex items-end">
                        <Select
                            placeholder="Discount Type"
                            value={form.hotDeal?.discount?.discountType || "Flat Rate"}
                            onChange={(e: any) => updateField("hotDeal.discount.discountType", e.target.value)}
                            options={[{ label: "Flat Rate", value: "Flat Rate" }, { label: "Percentage", value: "Percentage" }]}
                        />
                    </div>
                    {form.hotDeal?.discount?.discountType === "Flat Rate" && <Input
                        type="number"
                        label="Flat Rate Price"
                        value={form.hotDeal?.discount?.flatRatePrice ?? ""}
                        onChange={(e) => updateField("hotDeal.discount.flatRatePrice", Number(e.target.value))}
                    />}
                    {form.hotDeal?.discount?.discountType === "Percentage" && <Input
                        type="number"
                        label="Percentage"
                        value={form.hotDeal?.discount?.percentage ?? ""}
                        onChange={(e) => updateField("hotDeal.discount.percentage", Number(e.target.value))}
                    />}
                    <Select
                        placeholder="Enable"
                        value={String(form.hotDeal?.enableHotDeal ?? false)}
                        onChange={(e: any) => updateField("hotDeal.enableHotDeal", e.target.value === "true")}
                        options={[{ label: "No", value: "false" }, { label: "Yes", value: "true" }]}
                    />
                </div>
            </div>

            {/* Vendor/Venue specific */}
            <div className="mt-8">
                <h3 className="text-lg font-semibold mb-2">{isVendor ? "Vendor" : "Venue"} Details</h3>
                {isVendor ? (
                    <div className="flex flex-col gap-4">
                        <TextArea
                            label="About"
                            value={(form.listingItem?.[0] as Partial<Vendor> | undefined)?.about || ""}
                            onChange={(e) => {
                                const arr = [...(form.listingItem || [])];
                                const vendor: Partial<Vendor> & { __component: "dynamic-blocks.vendor"; id: number } = {
                                    __component: "dynamic-blocks.vendor",
                                    id: (arr[0] as Partial<Vendor>)?.id ?? 0, // Preserve existing id or default to 0
                                    ...(arr[0] as Partial<Vendor> || {}),
                                    about: e.target.value,
                                };
                                arr[0] = vendor as Vendor & Partial<Vendor>;
                                updateField("listingItem", arr);
                            }}
                        />

                        <Input
                            type="number"
                            label="Experience Years"
                            value={(form.listingItem?.[0] as Partial<Vendor> | undefined)?.experienceYears ?? ""}
                            onChange={(e) => {
                                const arr = [...(form.listingItem || [])];
                                const vendor: Partial<Vendor> & { __component: "dynamic-blocks.vendor"; id: number } = {
                                    __component: "dynamic-blocks.vendor",
                                    id: (arr[0] as Partial<Vendor>)?.id ?? 0,
                                    ...(arr[0] as Partial<Vendor> || {}),
                                    experienceYears: Number(e.target.value),
                                };
                                arr[0] = vendor as Vendor & Partial<Vendor>;
                                updateField("listingItem", arr);
                            }}
                        />

                        <div>
                            <h4 className="font-medium mb-2">Service Areas</h4>
                            {(((form.listingItem?.[0] as Partial<Vendor> | undefined)?.serviceArea as ServiceArea[]) || []).map(
                                (sa, idx) => (
                                    <div key={idx} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end mb-3">
                                        <Input
                                            type="text"
                                            label="City"
                                            value={(sa.city as any)?.name || ""}
                                            onChange={(e) => {
                                                const serviceAreas = [...((form.listingItem?.[0] as Partial<Vendor>)?.serviceArea || [])];
                                                serviceAreas[idx] = { ...serviceAreas[idx], city: { name: e.target.value } } as ServiceArea;
                                                const arr = [...(form.listingItem || [])];
                                                const vendor: Partial<Vendor> & { __component: "dynamic-blocks.vendor"; id: number } = {
                                                    __component: "dynamic-blocks.vendor",
                                                    id: (arr[0] as Partial<Vendor>)?.id ?? 0,
                                                    ...(arr[0] as Partial<Vendor> || {}),
                                                    serviceArea: serviceAreas,
                                                };
                                                arr[0] = vendor as Vendor & Partial<Vendor>;
                                                updateField("listingItem", arr);
                                            }}
                                        />
                                        <Input
                                            type="text"
                                            label="State"
                                            value={(sa.state as any)?.name || ""}
                                            onChange={(e) => {
                                                const serviceAreas = [...((form.listingItem?.[0] as Partial<Vendor>)?.serviceArea || [])];
                                                serviceAreas[idx] = { ...serviceAreas[idx], state: { name: e.target.value } } as ServiceArea;
                                                const arr = [...(form.listingItem || [])];
                                                const vendor: Partial<Vendor> & { __component: "dynamic-blocks.vendor"; id: number } = {
                                                    __component: "dynamic-blocks.vendor",
                                                    id: (arr[0] as Partial<Vendor>)?.id ?? 0,
                                                    ...(arr[0] as Partial<Vendor> || {}),
                                                    serviceArea: serviceAreas,
                                                };
                                                arr[0] = vendor as Vendor & Partial<Vendor>;
                                                updateField("listingItem", arr);
                                            }}
                                        />
                                        <Input
                                            type="number"
                                            label="Latitude"
                                            value={sa.latitude ?? ""}
                                            onChange={(e) => {
                                                const serviceAreas = [...((form.listingItem?.[0] as Partial<Vendor>)?.serviceArea || [])];
                                                serviceAreas[idx] = { ...serviceAreas[idx], latitude: Number(e.target.value) } as ServiceArea;
                                                const arr = [...(form.listingItem || [])];
                                                const vendor: Partial<Vendor> & { __component: "dynamic-blocks.vendor"; id: number } = {
                                                    __component: "dynamic-blocks.vendor",
                                                    id: (arr[0] as Partial<Vendor>)?.id ?? 0,
                                                    ...(arr[0] as Partial<Vendor> || {}),
                                                    serviceArea: serviceAreas,
                                                };
                                                arr[0] = vendor  as Vendor & Partial<Vendor>;
                                                updateField("listingItem", arr);
                                            }}
                                        />
                                        <Input
                                            type="number"
                                            label="Longitude"
                                            value={sa.longitude ?? ""}
                                            onChange={(e) => {
                                                const serviceAreas = [...((form.listingItem?.[0] as Partial<Vendor>)?.serviceArea || [])];
                                                serviceAreas[idx] = { ...serviceAreas[idx], longitude: Number(e.target.value) } as ServiceArea;
                                                const arr = [...(form.listingItem || [])];
                                                const vendor: Partial<Vendor> & { __component: "dynamic-blocks.vendor"; id: number } = {
                                                    __component: "dynamic-blocks.vendor",
                                                    id: (arr[0] as Partial<Vendor>)?.id ?? 0,
                                                    ...(arr[0] as Partial<Vendor> || {}),
                                                    serviceArea: serviceAreas,
                                                };
                                                arr[0] = vendor as Vendor & Partial<Vendor>;
                                                updateField("listingItem", arr);
                                            }}
                                        />
                                        <Button
                                            style="ghost"
                                            onClick={() => {
                                                const serviceAreas = [...((form.listingItem?.[0] as Partial<Vendor>)?.serviceArea || [])].filter(
                                                    (_, i) => i !== idx
                                                );
                                                const arr = [...(form.listingItem || [])];
                                                const vendor: Partial<Vendor> & { __component: "dynamic-blocks.vendor"; id: number } = {
                                                    __component: "dynamic-blocks.vendor",
                                                    id: (arr[0] as Partial<Vendor>)?.id ?? 0,
                                                    ...(arr[0] as Partial<Vendor> || {}),
                                                    serviceArea: serviceAreas,
                                                };
                                                arr[0] = vendor as Vendor & Partial<Vendor>;
                                                updateField("listingItem", arr);
                                            }}
                                        >
                                            Remove
                                        </Button>
                                    </div>
                                )
                            )}
                            <Button
                                style="secondary"
                                onClick={() => {
                                    const serviceAreas = [
                                        ...((form.listingItem?.[0] as Partial<Vendor>)?.serviceArea || []),
                                        { city: { name: "" }, state: { name: "" }, latitude: 0, longitude: 0 },
                                    ];
                                    const arr = [...(form.listingItem || [])];
                                    const vendor: Partial<Vendor> & { __component: "dynamic-blocks.vendor"; id: number } = {
                                        __component: "dynamic-blocks.vendor",
                                        id: (arr[0] as Partial<Vendor>)?.id ?? 0,
                                        ...(arr[0] as Partial<Vendor> || {}),
                                        serviceArea: serviceAreas,
                                    };
                                    arr[0] = vendor as Vendor & Partial<Vendor>;
                                    updateField("listingItem", arr);
                                }}
                            >
                                + Add Service Area
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        <Input
                            type="number"
                            label="Capacity"
                            value={(form.listingItem?.[0] as Partial<Venue> | undefined)?.capacity ?? ""}
                            onChange={(e) => {
                                const arr = [...(form.listingItem || [])];
                                const venue: Partial<Venue> & { __component: "dynamic-blocks.venue"; id: number } = {
                                    __component: "dynamic-blocks.venue",
                                    id: (arr[0] as Partial<Venue>)?.id ?? 0,
                                    ...(arr[0] as Partial<Venue> || {}),
                                    capacity: Number(e.target.value),
                                };
                                arr[0] = venue;
                                updateField("listingItem", arr);
                            }}
                        />
                        <Input
                            type="text"
                            label="Booking Duration Type"
                            value={(form.listingItem?.[0] as Partial<Venue> | undefined)?.bookingDurationType || ""}
                            onChange={(e) => {
                                const arr = [...(form.listingItem || [])];
                                const venue: Partial<Venue> & { __component: "dynamic-blocks.venue"; id: number } = {
                                    __component: "dynamic-blocks.venue",
                                    id: (arr[0] as Partial<Venue>)?.id ?? 0,
                                    ...(arr[0] as Partial<Venue> || {}),
                                    bookingDurationType: e.target.value,
                                };
                                arr[0] = venue;
                                updateField("listingItem", arr);
                            }}
                        />
                        <Input
                            type="number"
                            label="Booking Duration"
                            value={(form.listingItem?.[0] as Partial<Venue> | undefined)?.bookingDuration ?? ""}
                            onChange={(e) => {
                                const arr = [...(form.listingItem || [])];
                                const venue: Partial<Venue> & { __component: "dynamic-blocks.venue"; id: number } = {
                                    __component: "dynamic-blocks.venue",
                                    id: (arr[0] as Partial<Venue>)?.id ?? 0,
                                    ...(arr[0] as Partial<Venue> || {}),
                                    bookingDuration: Number(e.target.value),
                                };
                                arr[0] = venue;
                                updateField("listingItem", arr);
                            }}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                            <Input
                                type="text"
                                label="Address"
                                value={(form.listingItem?.[0] as Partial<Venue> | undefined)?.location?.address || ""}
                                onChange={(e) => {
                                    const arr = [...(form.listingItem || [])];
                                    const venue: Partial<Venue> & { __component: "dynamic-blocks.venue"; id: number } = {
                                        __component: "dynamic-blocks.venue",
                                        id: (arr[0] as Partial<Venue>)?.id ?? 0,
                                        ...(arr[0] as Partial<Venue> || {}),
                                    };
                                    const loc = {
                                        ...(venue.location || { address: "", city: "", country: "", latitude: 0, longitude: 0, id: 0 }),
                                        address: e.target.value,
                                    };
                                    venue.location = loc;
                                    arr[0] = venue;
                                    updateField("listingItem", arr);
                                }}
                            />
                            <Input
                                type="text"
                                label="City"
                                value={(form.listingItem?.[0] as Partial<Venue> | undefined)?.location?.city || ""}
                                onChange={(e) => {
                                    const arr = [...(form.listingItem || [])];
                                    const venue: Partial<Venue> & { __component: "dynamic-blocks.venue"; id: number } = {
                                        __component: "dynamic-blocks.venue",
                                        id: (arr[0] as Partial<Venue>)?.id ?? 0,
                                        ...(arr[0] as Partial<Venue> || {}),
                                    };
                                    const loc = {
                                        ...(venue.location || { address: "", city: "", country: "", latitude: 0, longitude: 0, id: 0 }),
                                        city: e.target.value,
                                    };
                                    venue.location = loc;
                                    arr[0] = venue;
                                    updateField("listingItem", arr);
                                }}
                            />
                            <Input
                                type="text"
                                label="Country"
                                value={(form.listingItem?.[0] as Partial<Venue> | undefined)?.location?.country || ""}
                                onChange={(e) => {
                                    const arr = [...(form.listingItem || [])];
                                    const venue: Partial<Venue> & { __component: "dynamic-blocks.venue"; id: number } = {
                                        __component: "dynamic-blocks.venue",
                                        id: (arr[0] as Partial<Venue>)?.id ?? 0,
                                        ...(arr[0] as Partial<Venue> || {}),
                                    };
                                    const loc = {
                                        ...(venue.location || { address: "", city: "", country: "", latitude: 0, longitude: 0, id: 0 }),
                                        country: e.target.value,
                                    };
                                    venue.location = loc;
                                    arr[0] = venue;
                                    updateField("listingItem", arr);
                                }}
                            />
                            <Input
                                type="number"
                                label="Latitude"
                                value={(form.listingItem?.[0] as Partial<Venue> | undefined)?.location?.latitude ?? ""}
                                onChange={(e) => {
                                    const arr = [...(form.listingItem || [])];
                                    const venue: Partial<Venue> & { __component: "dynamic-blocks.venue"; id: number } = {
                                        __component: "dynamic-blocks.venue",
                                        id: (arr[0] as Partial<Venue>)?.id ?? 0,
                                        ...(arr[0] as Partial<Venue> || {}),
                                    };
                                    const loc = {
                                        ...(venue.location || { address: "", city: "", country: "", latitude: 0, longitude: 0, id: 0 }),
                                        latitude: Number(e.target.value),
                                    };
                                    venue.location = loc;
                                    arr[0] = venue;
                                    updateField("listingItem", arr);
                                }}
                            />
                            <Input
                                type="number"
                                label="Longitude"
                                value={(form.listingItem?.[0] as Partial<Venue> | undefined)?.location?.longitude ?? ""}
                                onChange={(e) => {
                                    const arr = [...(form.listingItem || [])];
                                    const venue: Partial<Venue> & { __component: "dynamic-blocks.venue"; id: number } = {
                                        __component: "dynamic-blocks.venue",
                                        id: (arr[0] as Partial<Venue>)?.id ?? 0,
                                        ...(arr[0] as Partial<Venue> || {}),
                                    };
                                    const loc = {
                                        ...(venue.location || { address: "", city: "", country: "", latitude: 0, longitude: 0, id: 0 }),
                                        longitude: Number(e.target.value),
                                    };
                                    venue.location = loc;
                                    arr[0] = venue;
                                    updateField("listingItem", arr);
                                }}
                            />
                        </div>
                        <div>
                            <h4 className="font-medium mb-2">Amenities</h4>
                            {(((form.listingItem?.[0] as Partial<Venue> | undefined)?.amneties) || []).map((a: any, idx: number) => (
                                <div key={idx} className="flex gap-2 items-end mb-2">
                                    <Input
                                        type="text"
                                        label="Amenity"
                                        value={a.text || ""}
                                        onChange={(e) => {
                                            const amneties = [...((form.listingItem?.[0] as Partial<Venue>)?.amneties || [])];
                                            amneties[idx] = { text: e.target.value };
                                            const arr = [...(form.listingItem || [])];
                                            const venue: Partial<Venue> & { __component: "dynamic-blocks.venue"; id: number } = {
                                                __component: "dynamic-blocks.venue",
                                                id: (arr[0] as Partial<Venue>)?.id ?? 0,
                                                ...(arr[0] as Partial<Venue> || {}),
                                                amneties,
                                            };
                                            arr[0] = venue;
                                            updateField("listingItem", arr);
                                        }}
                                    />
                                    <Button
                                        style="ghost"
                                        onClick={() => {
                                            const amneties = [...((form.listingItem?.[0] as Partial<Venue>)?.amneties || [])].filter(
                                                (_, i) => i !== idx
                                            );
                                            const arr = [...(form.listingItem || [])];
                                            const venue: Partial<Venue> & { __component: "dynamic-blocks.venue"; id: number } = {
                                                __component: "dynamic-blocks.venue",
                                                id: (arr[0] as Partial<Venue>)?.id ?? 0,
                                                ...(arr[0] as Partial<Venue> || {}),
                                                amneties,
                                            };
                                            arr[0] = venue;
                                            updateField("listingItem", arr);
                                        }}
                                    >
                                        Remove
                                    </Button>
                                </div>
                            ))}
                            <Button
                                style="secondary"
                                onClick={() => {
                                    const amneties = [...((form.listingItem?.[0] as Partial<Venue>)?.amneties || []), { text: "" }];
                                    const arr = [...(form.listingItem || [])];
                                    const venue: Partial<Venue> & { __component: "dynamic-blocks.venue"; id: number } = {
                                        __component: "dynamic-blocks.venue",
                                        id: (arr[0] as Partial<Venue>)?.id ?? 0,
                                        ...(arr[0] as Partial<Venue> || {}),
                                        amneties,
                                    };
                                    arr[0] = venue;
                                    updateField("listingItem", arr);
                                }}
                            >
                                + Add Amenity
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Event Types (IDs or documentIds depending on your API) */}
            <div className="mt-8">
                <h3 className="text-lg font-semibold mb-2">Event Types</h3>
                <div className="flex flex-col gap-3">
                    {(form.eventTypes || []).map((et: any, idx: number) => (
                        <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                            <Input type="number" label="ID" value={et?.id ?? ""} onChange={(e) => {
                                const arr = [...(form.eventTypes || [])];
                                arr[idx] = { ...(arr[idx] || {}), id: Number(e.target.value) };
                                updateField("eventTypes", arr);
                            }} />
                            <Input type="text" label="documentId" value={et?.documentId || ""} onChange={(e) => {
                                const arr = [...(form.eventTypes || [])];
                                arr[idx] = { ...(arr[idx] || {}), documentId: e.target.value };
                                updateField("eventTypes", arr);
                            }} />
                            <Button style="ghost" onClick={() => removeArrayItem("eventTypes", idx)}>Remove</Button>
                        </div>
                    ))}
                    <div>
                        <Button style="secondary" onClick={() => addArrayItem("eventTypes", { id: undefined, documentId: "" })}>+ Add Event Type</Button>
                    </div>
                </div>
            </div>

            {/* Category (free text or id depending on your API) */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input type="number" label="Category ID" value={(form.category as any)?.id ?? ""} onChange={(e) => updateField("category.id", Number(e.target.value))} />
                <Input type="text" label="Category DocumentId" value={(form.category as any)?.documentId || ""} onChange={(e) => updateField("category.documentId", e.target.value)} />
                <Input type="text" label="Category Name" value={(form.category as any)?.name || ""} onChange={(e) => updateField("category.name", e.target.value)} />
            </div>
        </Modal>
    );
};

export default ListingItemModal;
