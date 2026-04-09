'use client';

import { useEffect, useState } from 'react';
import MultiSelect from '../custom/MultiSelect';
import Select from '../custom/Select';
import Button from '../custom/Button';
import { category, ListingItem } from '@/types/pagesTypes';
import { fetchChildCategories, fetchHotDealListings } from '@/services/common';
import { useEventTypes } from '@/context/EventTypesContext';
import { useLocale, useTranslations } from 'next-intl';
import { useParentCategories } from '@/context/ParentCategoriesContext';
import { FaSpinner } from 'react-icons/fa';

type Option = {
  name: string;
  documentId: string;
};

type FilterConfig = {
  name: string;
  options: Option[];
  placeholder?: string;
};

interface HotDealFilterProps {
  setList: (listings: ListingItem[]) => void;
}

interface StrapiFilterValue {
  documentId?: { $in: string[] };
  $in?: string[];
  $eq?: string;
}

interface StrapiFilter {
  [key: string]: StrapiFilterValue | StrapiFilter;
}

const HotDealFilter: React.FC<HotDealFilterProps> = ({ setList }) => {
  const [tempFilterValues, setTempFilterValues] = useState<
    Record<string, string[]>
  >({});
  const [isLoading, setIsLoading] = useState(false);
  const { eventTypes } = useEventTypes();
  const [parentCategoryId, setParentCategoryId] = useState('');
  const [subcategoryOptions, setSubcategoryOptions] = useState<FilterConfig>();
  const [appliedFilters, setAppliedFilters] = useState<StrapiFilter>({});
  const locale = useLocale();
  const t = useTranslations('hotdeal');
  const { parentCategories } = useParentCategories();

  const eventTypeOptions: Option[] = eventTypes.map((event) => ({
    name: event.eventName,
    documentId: event.documentId,
  }));

  const categoryOptions: FilterConfig =
    locale === 'en'
      ? {
          name: 'category',
          options:
            parentCategories?.map((cat) => ({
              name: cat.name,
              documentId: cat.documentId,
            })) || [],
        }
      : {
          name: 'category',
          options: parentCategories?.map((cat) => {
            const loc = cat.localizations?.find((l) => l.locale === locale);
            return loc
              ? { name: loc.name, documentId: loc.documentId }
              : { name: cat.name, documentId: cat.documentId };
          }) || [],
        };

  useEffect(
    function () {
      if (!parentCategoryId) {
        setSubcategoryOptions(undefined);
        return;
      }
      async function fetchChildren() {
        const childCategories: category[] = await fetchChildCategories(
          parentCategoryId,
          locale,
        );
        setSubcategoryOptions({
          name: 'subCategory',
          placeholder: t('selectSubCategory'),
          options: childCategories
            .sort((a, b) => b.priority - a.priority)
            .map((cat) => ({
              name: cat.name,
              documentId: cat.documentId,
            })),
        });
      }
      fetchChildren();
    },
    [parentCategoryId, locale, t],
  );

  const handleFilterChange = (name: string, value: string[]) => {
    const lowName = name.toLowerCase();
    const trimmedValues = value.map(v => v.trim()).filter(v => v);

    if (trimmedValues.length === 0) {
      setAppliedFilters((prev) => {
        const next = { ...prev };
        if (lowName.includes('category') || lowName.includes('subcategory')) {
          delete next.categories;
        } else if (lowName.includes('eventtype')) {
          delete next.eventTypes;
        }
        return next;
      });
      setTempFilterValues((prev) => ({ ...prev, [name]: [] }));
      return;
    }

    //subCategory or Category filter setup
    if (lowName.includes('category') || lowName.includes('subcategory')) {
      setAppliedFilters((prev) => ({
        ...prev,
        categories: {
          documentId: {
            $in: trimmedValues,
          },
        },
      }));
    }
    //event type filter setup
    if (lowName.includes('eventtype')) {
      setAppliedFilters((prev) => ({
        ...prev,
        eventTypes: {
          documentId: {
            $in: trimmedValues,
          },
        },
      }));
    }

    setTempFilterValues((prev) => ({ ...prev, [name]: trimmedValues }));
  };

  const handleApply = async () => {
    setIsLoading(true);
    try {
      const filteredListings: ListingItem[] =
        await fetchHotDealListings(appliedFilters);
      setList(filteredListings);
    } catch (err) {
      console.error('Error fetching hot deals:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = async () => {
    setIsLoading(true);
    try {
      setTempFilterValues({});
      setAppliedFilters({});
      setParentCategoryId('');
      const allListings: ListingItem[] = await fetchHotDealListings();
      setList(allListings);
    } catch (err) {
      console.error('Error clearing hot deals:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='flex flex-col items-center gap-4 my-4'>
      <div className='flex flex-col lg:flex-row gap-2 w-full'>
        <Select
          key={categoryOptions.name}
          value={tempFilterValues[categoryOptions.name]?.[0] || ''}
          onChange={(e) => {
            const val = e.target.value;
            setParentCategoryId(val);
            handleFilterChange(categoryOptions.name, val ? [val] : []);
          }}
          options={categoryOptions.options.map((opt) => ({
            label: opt.name,
            value: opt.documentId,
          }))}
          placeholder={t('selectLocationOrServiceType')}
          disabled={isLoading}
        />

        <MultiSelect
          key={subcategoryOptions?.name || 'subCategory-placeholder'}
          value={tempFilterValues[subcategoryOptions?.name || 'subCategory'] || []}
          onChange={(selected) =>
            handleFilterChange(subcategoryOptions?.name || 'subCategory', selected)
          }
          options={(subcategoryOptions?.options || []).map((opt) => ({
            label: opt.name,
            value: opt.documentId,
          }))}
          placeholder={t('selectSubCategory')}
          disabled={!parentCategoryId || isLoading}
        />

        <MultiSelect
          key='eventType'
          value={tempFilterValues['eventType'] || []}
          onChange={(selected) => handleFilterChange('eventType', selected)}
          options={eventTypeOptions.map((opt) => ({
            label: opt.name,
            value: opt.documentId,
          }))}
          placeholder={t('ChooseEventType')}
          disabled={isLoading}
        />
      </div>
      
      <div className='flex gap-2'>
        <Button style='secondary' onClick={handleApply} disabled={isLoading}>
          {isLoading && <FaSpinner className='animate-spin' />}
          {t('Apply')}
        </Button>
        <Button style='secondary' onClick={handleClear} disabled={isLoading}>
          {t('Clear')}
        </Button>
      </div>
    </div>
  );
};

export default HotDealFilter;
