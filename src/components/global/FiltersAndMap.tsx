'use client';
import dynamic from "next/dynamic";
import React, { useEffect, useState, useTransition } from 'react';
const MapboxMap = dynamic(() => import('./MapboxMap'), { ssr: false })
import { Location } from './MapboxMap';
import MultiSelect from '../custom/MultiSelect';
import Select from '../custom/Select';
import Button from '../custom/Button';
import { fetchListings } from '@/services/common';
import { ListingItem } from '@/types/pagesTypes';
import { useLocale, useTranslations } from 'next-intl';
import { useParentCategories } from '@/context/ParentCategoriesContext';
import { useRouter, usePathname } from '@/i18n/navigation';
import Input from '../custom/Input';

type FilterValue = {
    $eq?: string | number;
    $gt?: number;
    $containsi?: string;
    $null?: boolean;
    $in?: string[];
};

type NestedFilter = {
    [key: string]: FilterValue | NestedFilter;
};

type FilterObject = {
    [key: string]: FilterValue | NestedFilter | NestedFilter[] | undefined;
    categories?: NestedFilter;
    eventTypes?: NestedFilter;
    price?: FilterValue;
    $or?: NestedFilter[];
    $and?: NestedFilter[];
};


type FilterConfig = {
    name: string;
    options: string[] | { value: string; label: string }[];
    placeholder?: string;
};

interface FiltersAndMapProps {
    filters: FilterConfig[];
    type?: 'venue' | 'vendor';
    setList: (venues: ListingItem[]) => void;
    initialFilterValues?: Record<string, string | string[]>;
    locations: Location[]
    fetcher?: (appliedFilters: Record<string, unknown>) => Promise<ListingItem[]>;
}

const FiltersAndMap: React.FC<FiltersAndMapProps> = ({
    filters,
    type,
    setList,
    initialFilterValues,
    locations,
    fetcher
}) => {
    const [tempFilterValues, setTempFilterValues] = useState<Record<string, string[]>>({});
    const [appliedFilters, setAppliedFilters] = useState<FilterObject>({});
    const [isLoading, setIsLoading] = useState(false);
    const [keyword, setKeyword] = useState<string>('');
    const [isPending, startTransition] = useTransition();
    const { parentCategories } = useParentCategories();
    const router = useRouter();
    const pathname = usePathname();
    const tHeader = useTranslations('Global.Header');
    const locale = useLocale();

    const cats = locale === 'en' ? parentCategories : parentCategories.map(cat => cat.localizations.find(loc => loc.locale === locale))

    // Create service dropdown options
    const serviceOptions = [
        { value: 'all', label: tHeader('allServices') },
        ...cats.map(cat => ({
            value: cat?.slug ?? '',
            label: cat?.name ?? ''
        }))
    ];

    // Determine current service based on pathname
    const getCurrentService = () => {
        if (pathname.includes('/service/all')) return 'all';
        const pathParts = pathname.split('/');
        const serviceIndex = pathParts.indexOf('service');
        if (serviceIndex !== -1 && pathParts[serviceIndex + 1]) {
            return pathParts[serviceIndex + 1];
        }
        return '';
    };

    const currentService = getCurrentService();

    // Handle service navigation
    const handleServiceChange = (value: string) => {
        // Prevent navigation if same service is selected
        if (value === currentService) return;

        const targetUrl = value === 'all' ? '/service/all' : `/service/${value}`;
        router.push(targetUrl);
    };

    // Normalize simple initial filter values into Strapi filter object shape
    const normalizeInitialFilters = (vals: Record<string, string[]>): FilterObject => {
        const out: FilterObject = {};
        Object.entries(vals).forEach(([name, value]) => {
            const lowName = name.toLowerCase();
            const trimmedValues = value.map(v => v.trim()).filter(v => v);
            
            if (trimmedValues.length === 0) return;

            if (lowName === 'categories' || lowName === 'category') {
                out.categories = { documentId: { $in: trimmedValues } as FilterValue };
            } else if (lowName === 'eventtype' || lowName === 'eventtypes') {
                out.eventTypes = { eventName: { $in: trimmedValues } as FilterValue };
            } else if (lowName.includes('price')) {
                const val = trimmedValues[0].toLowerCase();
                if (val.includes('without')) {
                    out.$or = [{ price: { $eq: 0 } }, { price: { $null: true } }];
                } else {
                    out.price = { $gt: 0 };
                }
            } else {
                out[name] = { $eq: trimmedValues[0] } as NestedFilter;
            }
        });
        return out;
    };

    useEffect(() => {
        if (initialFilterValues) {
            const vals = initialFilterValues as Record<string, string[]>;
            setTempFilterValues(vals);
            const normalized = normalizeInitialFilters(vals);
            setAppliedFilters(normalized);
        }
    }, [initialFilterValues]);

    const handleFilterChange = (name: string, value: string[]) => {
        // Remove leading/trailing whitespace and check if empty
        const trimmedValues = value.map(v => v.trim()).filter(v => v);

        // If no values, remove filter entirely
        if (trimmedValues.length === 0) {
            setAppliedFilters(prev => {
                const newFilters = { ...prev };
                // Remove appropriate filter based on field name
                const lowName = name.toLowerCase();
                if (lowName === 'categories' || lowName === 'category') {
                    delete newFilters.categories;
                } else if (lowName === 'eventtype' || lowName === 'eventtypes') {
                    delete newFilters.eventTypes;
                } else if (lowName === 'price') {
                    delete newFilters.price;
                    delete newFilters.$or; // Remove price-related $or filter as well
                }
                return newFilters;
            });

            setTempFilterValues((prev) => ({ ...prev, [name]: [] }));
            return;
        }

        // pricing filter setup
        if (name.toLowerCase().includes('price')) {
            const val = trimmedValues[0].toLowerCase();
            if (val.includes('without')) {
                setAppliedFilters(prev => {
                    const next = { ...prev };
                    delete next.price;
                    next.$or = [
                        { price: { $eq: 0 } },
                        { price: { $null: true } }
                    ];
                    return next;
                });
            } else {
                setAppliedFilters(prev => {
                    const next = { ...prev };
                    delete next.$or;
                    next.price = { $gt: 0 };
                    return next;
                });
            }
        }
        //categories filter setup
        if (name.toLowerCase() === 'categories' || name.toLowerCase() === 'category') {
            setAppliedFilters(prev => {
                const next = {
                    ...prev,
                    categories: {
                        documentId: {
                            $in: trimmedValues,
                        },
                    } as NestedFilter,
                };
                return next;
            });
        }
        //event type filter setup
        if (name.toLowerCase() === 'eventtype' || name.toLowerCase() === 'eventtypes') {
            setAppliedFilters(prev => {
                const next = {
                    ...prev,
                    eventTypes: {
                        eventName: {
                            $in: trimmedValues,
                        },
                    } as NestedFilter,
                };
                return next;
            });
        }

        setTempFilterValues((prev) => ({ ...prev, [name]: trimmedValues }));
    };

    const handleApply = async () => {
        setIsLoading(true);
        // Compose keyword search with existing filters
        let finalFilters: Record<string, unknown> = { ...appliedFilters };
        if (keyword.trim()) {
            finalFilters = {
                ...finalFilters,
                $or: [
                    { name: { $containsi: keyword.trim() } },
                    { description: { $containsi: keyword.trim() } }
                ]
            };
        }

        try {
            const res = fetcher 
                ? await fetcher(finalFilters) 
                : await fetchListings(type, finalFilters);
            
            startTransition(() => {
                if (Array.isArray(res)) setList(res);
            });
        } catch (error) {
            console.error('Error applying filters:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClear = async () => {
        let res;
        setIsLoading(true);
        if (initialFilterValues) {
            setTempFilterValues(initialFilterValues as Record<string, string[]>);
            const normalized = normalizeInitialFilters(initialFilterValues as Record<string, string[]>);
            setAppliedFilters(normalized);
            res = fetcher ? await fetcher(normalized) : await fetchListings(type, normalized);
        } else {
            setTempFilterValues({});
            setAppliedFilters({});
            res = fetcher ? await fetcher({}) : await fetchListings(type);
        }
        startTransition(() => setList(res));
        setIsLoading(false);
    };

    const t = useTranslations("VenueInfo")
    const tSearch = useTranslations('Search');
    const tMap = useTranslations('Map');
    return (
        <div className="lg:max-w-425 mx-auto px-4">
            <div className="mb-4 flex flex-col gap-2.5">
                <div className="grid grid-cols-5 gap-2.5 items-center justify-center">
                    {/* Keyword search for listings (title/description) */}
                    <div className="col-span-4">
                        <Input
                            type="search"
                            placeholder={tSearch('searchListings') || tSearch('search') || 'Search listings'}
                            value={keyword}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setKeyword(e.target.value)}
                        />
                    </div>
                    {/* Service/Parent Category Dropdown */}
                    <Select
                        value={currentService}
                        onChange={(e) => handleServiceChange(e.target.value)}
                        options={serviceOptions ?? []}
                    />
                </div>
                <div className='flex gap-2 items-center justify-center flex-col lg:flex-row'>
                    {filters.map(({ name, options, placeholder }) => {
                        const isPricing = name === 'price';
                        const commonProps = {
                            value: isPricing ? (tempFilterValues[name]?.[0] || '') : (tempFilterValues[name] || []),
                            onChange: (selected: string | string[]) => handleFilterChange(name, Array.isArray(selected) ? selected : [selected]),
                            options: Array.isArray(options) && typeof options[0] === 'object' 
                                ? (options as { value: string; label: string }[]) 
                                : (options as string[]).map((opt) => ({ value: opt, label: opt })),
                            placeholder: placeholder || `Choose ${name}`,
                            disabled: isLoading || isPending,
                        };

                        return isPricing ? (
                            <Select 
                                key={name}
                                {...commonProps} 
                                value={commonProps.value as string} 
                                onChange={(e) => handleFilterChange(name, [e.target.value])} 
                            />
                        ) : (
                            <MultiSelect
                                key={name}
                                {...commonProps} value={commonProps.value as string[]} />
                        );
                    })}
                    <div className="flex gap-2">
                        <Button style='secondary' onClick={handleApply} disabled={isLoading || isPending}>{t("apply")}</Button>
                        <Button style='secondary' onClick={handleClear} disabled={isLoading || isPending} >{t("clear")}</Button>
                    </div>
                </div>
            </div>
            {/* Map helper text */}
            <div className="mb-4 text-center text-sm text-gray-600">
                {tMap('helperText')}
            </div>
            <div className='h-[60vh] md:h-[90vh] lg:h-[calc(100vh-150px)]' style={{ contain: 'layout paint size' }}>
                <MapboxMap locations={locations} />
            </div>
        </div>
    );
};

export default FiltersAndMap;
