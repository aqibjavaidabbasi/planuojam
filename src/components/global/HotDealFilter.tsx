'use client';

import { useEffect, useState } from 'react';
import Select from '../custom/Select';
import Button from '../custom/Button';
import { category, ListingItem } from '@/types/pagesTypes';
import { fetchChildCategories, fetchHotDealListings } from '@/services/common';
import { useEventTypes } from '@/context/EventTypesContext';

type FilterConfig = {
    name: string;
    options: string[];
    placeholder?: string;
};

interface HotDealFilterProps {
    setList: (listings: ListingItem[]) => void;
    categoryOptions: FilterConfig;
}

const HotDealFilter: React.FC<HotDealFilterProps> = ({
    setList,
    categoryOptions,
}) => {
    const [tempFilterValues, setTempFilterValues] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);
    const { eventTypes } = useEventTypes();
    const [subCategory, setSubCategory] = useState('');
    const [subcategoryOptions, setSubcategoryOptions] = useState<FilterConfig>();
    const [appliedFilters, setAppliedFilters] = useState({});

    const eventTypeNames: string[] = []
    eventTypes.map(event => eventTypeNames.push(event.eventName));

    useEffect(function () {
        async function fetchChildren() {
            const childCategories: category[] = await fetchChildCategories(subCategory);
            setSubcategoryOptions({
                name: 'subCategory',
                placeholder: 'Choose a sub Category',
                options: childCategories.map(cat => cat.name)
            })
        }
        fetchChildren();
    }, [subCategory])

    const handleFilterChange = (name: string, value: string) => {
        //subCategory filter setup
        if (name.toLowerCase() === subcategoryOptions?.name.toLowerCase()) {
            setAppliedFilters(prev => ({
                ...prev,
                category: {
                    name: {
                        $eq: value,
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
                        $eq: value,
                    },
                }
            }))
        }

        setTempFilterValues((prev) => ({ ...prev, [name]: value }));
    }

    const handleApply = async () => {
        setIsLoading(true);
        const filteredListings: ListingItem[] = await fetchHotDealListings(appliedFilters);
        setList(filteredListings);
        setIsLoading(false);
    };

    const handleClear = async () => {
        setIsLoading(true);
        setTempFilterValues({});
        const allListings: ListingItem[] = await fetchHotDealListings(); // No filters
        setList(allListings);
        setIsLoading(false);
    };

    return (
        <div className="flex flex-col items-center gap-4 my-4">
            <div className="flex flex-col lg:flex-row gap-2 w-full">
                <Select
                    name={categoryOptions.name}
                    value={tempFilterValues[categoryOptions.name] || ''}
                    onChange={(e) => {
                        setSubCategory(e.target.value);
                        handleFilterChange(categoryOptions.name, e.target.value)
                    }}
                    options={categoryOptions.options.map((opt) => ({ label: opt, value: opt }))}
                    placeholder="Select category"
                    disabled={isLoading}
                />

                {subcategoryOptions &&
                    <Select
                        name={subcategoryOptions.name}
                        value={tempFilterValues[subcategoryOptions.name] || ''}
                        onChange={(e) => handleFilterChange(subcategoryOptions.name, e.target.value)}
                        options={subcategoryOptions.options.map((opt) => ({ label: opt, value: opt }))}
                        placeholder="Select subcategory"
                        disabled={!tempFilterValues['category'] || isLoading}
                    />}

                <Select
                    name='eventType'
                    value={tempFilterValues['eventType'] || ''}
                    onChange={(e) => handleFilterChange('eventType', e.target.value)}
                    options={eventTypeNames.map((opt) => ({ label: opt, value: opt }))}
                    placeholder='Choose Event Type'
                    disabled={isLoading}
                />
            </div>

            <div className="flex gap-2">
                <Button style="secondary" onClick={handleApply} disabled={isLoading}>
                    Apply
                </Button>
                <Button style="secondary" onClick={handleClear} disabled={isLoading}>
                    Clear
                </Button>
            </div>
        </div>
    );
};

export default HotDealFilter;
