'use client';
import dynamic from "next/dynamic";
import React, { useEffect, useState, useTransition } from 'react';
const MapboxMap = dynamic(()=>import('./MapboxMap'),{ssr:false})
import { Location } from './MapboxMap';
import Select from '../custom/Select';
import Button from '../custom/Button';
import { fetchListings } from '@/services/common';
import { ListingItem } from '@/types/pagesTypes';
import { useTranslations } from 'next-intl';
import Input from '../custom/Input';

type FilterValue = {
    $eq?: string | number;
    $gt?: number;
    $containsi?: string;
    $null?: boolean;
};

type NestedFilter = {
    [key: string]: FilterValue | NestedFilter;
};

type FilterObject = {
    [key: string]: FilterValue | NestedFilter | NestedFilter[] | undefined;
    category?: NestedFilter;
    eventTypes?: NestedFilter;
    price?: FilterValue;
    $or?: NestedFilter[];
    $and?: NestedFilter[];
};


type FilterConfig = {
    name: string;
    options: string[];
    placeholder?: string;
};

interface FiltersAndMapProps {
    filters: FilterConfig[];
    type: 'venue' | 'vendor';
    setList: (venues: ListingItem[]) => void;
    initialFilterValues?: Record<string, string>;
    locations: Location[]
    fetcher?: (appliedFilters: Record<string, unknown>) => Promise<ListingItem[]>;
}

const FiltersAndMap: React.FC<FiltersAndMapProps> = ({ filters, type, setList, initialFilterValues, locations, fetcher }) => {
    const [tempFilterValues, setTempFilterValues] = useState<Record<string, string>>({});
    const [appliedFilters, setAppliedFilters] = useState<FilterObject>({});
    const [isLoading, setIsLoading] = useState(false);
    const [keyword, setKeyword] = useState<string>('');
    const [isPending, startTransition] = useTransition();

    // Normalize simple initial filter values into Strapi filter object shape
    const normalizeInitialFilters = (vals: Record<string, string>): FilterObject => {
        const out: FilterObject = {};
        Object.entries(vals).forEach(([name, value]) => {
            const key = name.toLowerCase();
            if (key.includes('category')) {
                out.category = { name: { $eq: value } };
            } else if (key.includes('eventtype')) {
                out.eventTypes = { eventName: { $eq: value } };
            } else if (key.includes('price')) {
                // In case price ever arrives in initial values, mimic existing logic
                if (value.toLowerCase().includes('without')) {
                    out.$or = [{ price: { $eq: 0 } }, { price: { $null: true } }];
                } else {
                    out.price = { $gt: 0 };
                }
            } else {
                // Fallback: pass as-is (string equality)
                out[name] = { $eq: value } as NestedFilter;
            }
        });
        return out;
    };

    useEffect(() => {
        if (initialFilterValues) {
            setTempFilterValues(initialFilterValues);
            Object.entries(initialFilterValues).forEach(([name, value]) => {
                handleFilterChange(name, value);
            });
        }
    }, [initialFilterValues]);

    const handleFilterChange = (name: string, value: string) => {
        // Remove leading/trailing whitespace and check if empty
        const trimmedValue = value.trim();
        
        // If value is empty, remove the filter entirely
        if (!trimmedValue) {
            setAppliedFilters(prev => {
                const newFilters = { ...prev };
                // Remove the appropriate filter based on the field name
                if (name.toLowerCase().includes('category')) {
                    delete newFilters.category;
                } else if (name.toLowerCase().includes('eventtype')) {
                    delete newFilters.eventTypes;
                } else if (name.toLowerCase().includes('price')) {
                    delete newFilters.price;
                    delete newFilters.$or; // Remove price-related $or filter as well
                }
                return newFilters;
            });
            
            setTempFilterValues((prev) => ({ ...prev, [name]: '' }));
            return;
        }

        // pricing filter setup
        if (name.toLowerCase().includes('price')) {
            if (trimmedValue.toLowerCase().includes('without')) {
                setAppliedFilters(prev => ({
                    ...prev,
                    $or: [
                        { price: { $eq: 0 } },
                        { price: { $null: true } }
                    ]
                }));
            } else {
                setAppliedFilters(prev => {
                    const newFilters = { ...prev };
                    delete newFilters.$or; // Remove any existing $or filter
                    return {
                        ...newFilters,
                        price: {
                            $gt: 0
                        }
                    };
                });
            }
        }
        //category filter setup
        if (name.toLowerCase().includes('category')) {
            setAppliedFilters(prev => ({
                ...prev,
                category: {
                    name: {
                        $eq: trimmedValue,
                    },
                }
            }))
        }
        //event type filter setup
        if (name.toLowerCase().includes('eventtype')) {
            setAppliedFilters(prev => ({
                ...prev,
                eventTypes: {
                    eventName: {
                        $eq: trimmedValue,
                    },
                }
            }))
        }

        setTempFilterValues((prev) => ({ ...prev, [name]: value }));
    }

    const handleApply = async () => {
        setIsLoading(true);
        // Compose keyword search with existing filters without breaking previous logic
        let finalFilters: Record<string, unknown> = { ...appliedFilters };
        if (keyword && keyword.trim().length > 0) {
            const keywordClause = {
                $or: [
                    { title: { $containsi: keyword.trim() } },
                    { description: { $containsi: keyword.trim() } }
                ]
            };
            // If there are already filters, combine using $and to preserve all constraints
            finalFilters = Object.keys(finalFilters).length
                ? { $and: [finalFilters, keywordClause] }
                : keywordClause;
        }
        const res = fetcher ? await fetcher(finalFilters) : await fetchListings(type, finalFilters);
        startTransition(() => setList(res));
        setIsLoading(false);
    };

    const handleClear = async () => {
        let res;
        setIsLoading(true);
        if (initialFilterValues) {
            setTempFilterValues(initialFilterValues);
            const normalized = normalizeInitialFilters(initialFilterValues);
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

    const t=useTranslations("VenueInfo")
    const tSearch = useTranslations('Search');
    const tMap = useTranslations('Map');
    return (
        <div className="lg:max-w-[1700px] mx-auto px-4">
            <div className="mb-4 flex flex-col gap-2.5">
                {/* Keyword search for listings (title/description) */}
                <div>
                    <Input
                        type="search"
                        placeholder={tSearch('searchListings') || tSearch('search') || 'Search listings'}
                        value={keyword}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setKeyword(e.target.value)}
                    />
                </div>
                <div className='flex gap-2 items-center justify-center flex-col lg:flex-row'>
                    {filters.map(({ name, options, placeholder }) => (
                        <Select
                            key={name}
                            name={name}
                            value={tempFilterValues[name] || ''}
                            onChange={(e) => handleFilterChange(name, e.target.value)}
                            options={options.map((opt) => ({ value: opt, label: opt }))}
                            placeholder={placeholder || `Choose ${name}`}
                            disabled={isLoading || isPending}
                        />
                    ))}
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
