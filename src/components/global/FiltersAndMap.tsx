'use client';

import React, { useEffect, useState } from 'react';
import MapboxMap, { Location } from './MapboxMap';
import Select from '../custom/Select';
import Button from '../custom/Button';
import { fetchListings } from '@/services/common';
import { ListingItem } from '@/types/pagesTypes';
import { useTranslations } from 'next-intl';
import Input from '../custom/Input';


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
    const [appliedFilters, setAppliedFilters] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [keyword, setKeyword] = useState<string>('');

    useEffect(() => {
        if (initialFilterValues) {
            setTempFilterValues(initialFilterValues);
            Object.entries(initialFilterValues).forEach(([name, value]) => {
                handleFilterChange(name, value);
            });
        }
    }, [initialFilterValues]);
    
    const handleFilterChange = (name: string, value: string) => {

        // pricing filter setup
        if (name.toLowerCase().includes('price')) {
            if (value.toLowerCase().includes('without')) {
                setAppliedFilters({
                    $or: [
                        { price: { $eq: 0 } },
                        { price: { $null: true } }
                    ]
                });
            } else {
                setAppliedFilters(prev => ({
                    ...prev,
                    price: {
                        $gt: 0
                    }
                }));
            }
        }
        //category filter setup
        if(name.toLowerCase().includes('category')){
            setAppliedFilters(prev=>({
                ...prev,
                category: {
                    name: {
                        $eq: value,
                    },
                }
            }))
        }
        //event type filter setup
        if(name.toLowerCase().includes('eventtype')){
            setAppliedFilters(prev=>({
                ...prev,
                eventTypes: {
                    eventName: {
                        $eq: value,
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
        setList(res);
        setIsLoading(false);
    };
    
    const handleClear = async () => {
        setIsLoading(true);
        setTempFilterValues({});
        setAppliedFilters({});
        setKeyword('');
        const res = fetcher ? await fetcher({}) : await fetchListings(type);
        setList(res);
        setIsLoading(false);
    };

    const t=useTranslations("VenueInfo")
    const tSearch = useTranslations('Search');
    return (
        <div className="lg:max-w-[1440px] mx-auto px-4">
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
                            disabled={isLoading}
                        />
                    ))}
                    <div className="flex gap-2">
                        <Button style='secondary' onClick={handleApply} disabled={isLoading}>{t("apply")}</Button>
                        <Button style='secondary' onClick={handleClear} disabled={isLoading} >{t("clear")}</Button>
                    </div>
                </div>
            </div>
            <div className='h-[calc(100vh-200px)]'>
                <MapboxMap locations={locations} />
            </div>
        </div>
    );
};

export default FiltersAndMap;
