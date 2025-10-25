'use client';

import { useEffect, useState } from 'react';
import Select from '../custom/Select';
import Button from '../custom/Button';
import { category, ListingItem } from '@/types/pagesTypes';
import { fetchChildCategories, fetchHotDealListings } from '@/services/common';
import { useEventTypes } from '@/context/EventTypesContext';
import { useLocale, useTranslations } from 'next-intl';
import { useParentCategories } from '@/context/ParentCategoriesContext';

type FilterConfig = {
    name: string;
    options: string[];
    placeholder?: string;
};

interface HotDealFilterProps {
    setList: (listings: ListingItem[]) => void;
}

const HotDealFilter: React.FC<HotDealFilterProps> = ({
    setList,
}) => {
    const [tempFilterValues, setTempFilterValues] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);
    const { eventTypes } = useEventTypes();
    const [subCategory, setSubCategory] = useState('');
    const [subcategoryOptions, setSubcategoryOptions] = useState<FilterConfig>();
    const [appliedFilters, setAppliedFilters] = useState({});
    const locale = useLocale();
    const t = useTranslations("hotdeal");
    const { parentCategories } = useParentCategories();

    const eventTypeNames: string[] = []
    eventTypes.forEach(event=>{
        if (locale === 'en') {
            eventTypeNames.push(event.eventName);
        } else {
            eventTypeNames.push(event.localizations?.filter(loc => loc.locale === locale)?.map(loc => loc.eventName)[0] || event.eventName);
        }
    })
    
    const categoryOptions = locale === 'en' ? {
        name: 'category',
        options: parentCategories?.map(cat => ({name: cat.name, documentId: cat.documentId})) || [],
    } : {
        name: 'category',
        options: parentCategories?.map(cat => cat.localizations?.filter(loc => loc.locale === locale)?.map(loc => ({name: loc.name, documentId: loc.documentId}))[0] || [])
    }

    useEffect(function () {
        async function fetchChildren() {
            const childCategories: category[] = await fetchChildCategories(subCategory, locale);
            setSubcategoryOptions({
                name: 'subCategory',
                placeholder: 'Choose a sub Category',
                options: childCategories.map(cat => cat.name)
            })
        }
     fetchChildren();
    }, [subCategory,locale])

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
                    options={categoryOptions.options.map((opt) => ({ label: opt.name, value: opt.documentId }))}
                    placeholder={t("selectCategory")}
                    disabled={isLoading}
                />

                {subcategoryOptions &&
                    <Select
                        name={subcategoryOptions.name}
                        value={tempFilterValues[subcategoryOptions.name] || ''}
                        onChange={(e) => handleFilterChange(subcategoryOptions.name, e.target.value)}
                        options={subcategoryOptions.options.map((opt) => ({ label: opt, value: opt }))}
                        placeholder={t("SelectsubCategory")}
                        disabled={!tempFilterValues['category'] || isLoading}
                    />}

                <Select
                    name='eventType'
                    value={tempFilterValues['eventType'] || ''}
                    onChange={(e) => handleFilterChange('eventType', e.target.value)}
                    options={eventTypeNames.map((opt) => ({ label: opt, value: opt }))}
                    placeholder={t('ChooseEventType')}
                    disabled={isLoading}
                />
            </div>,

            <div className="flex gap-2">
                <Button style="secondary" onClick={handleApply} disabled={isLoading}>
                   {t('Apply')}
                </Button>
                <Button style="secondary" onClick={handleClear} disabled={isLoading}>
                    {t('Clear')}
                </Button>
            </div>
        </div>
    );
};

export default HotDealFilter;
