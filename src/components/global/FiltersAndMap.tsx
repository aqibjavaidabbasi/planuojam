'use client';

import React, { useEffect, useState } from 'react';
import MapboxSearch from './MapboxSearch';
import MapboxMap, { Location } from './MapboxMap';
import Select from '../custom/Select';
import Button from '../ui/Button';
import { fetchListings } from '@/services/common';
import { ListingItem } from '@/types/pagesTypes';


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
}

const FiltersAndMap: React.FC<FiltersAndMapProps> = ({ filters, type, setList, initialFilterValues, locations }) => {
    const [selectedPlace, setSelectedPlace] = useState<{
        geometry: {
            location: {
                lat: number;
                lng: number;
            };
        };
        place_name: string;
    } | null>(null);
    const [tempFilterValues, setTempFilterValues] = useState<Record<string, string>>({});
    const [appliedFilters, setAppliedFilters] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (initialFilterValues) {
            setTempFilterValues(initialFilterValues);
            Object.entries(initialFilterValues).forEach(([name, value]) => {
                handleFilterChange(name, value);
            });
        }
    }, [initialFilterValues]);
    

    const onPlaceSelect = (place: {
        geometry: {
            location: {
                lat: number;
                lng: number;
            };
        };
        place_name: string;
    } | null) => {
        setSelectedPlace(place);
    };
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
        console.log(appliedFilters)
        const res = await fetchListings(type, appliedFilters);
        setList(res);
        setIsLoading(false);
    };
    
    const handleClear = async () => {
        setIsLoading(true);
        setTempFilterValues({});
        setAppliedFilters({});
        const res = await fetchListings(type);
        setList(res);
        setIsLoading(false);
    };


    return (
        <div>
            <div className="mb-4 flex flex-col gap-2.5">
                <MapboxSearch onPlaceSelect={onPlaceSelect} placeholder="Search for a place" />
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
                        <Button style='secondary' onClick={handleApply} disabled={isLoading}>Apply</Button>
                        <Button style='secondary' onClick={handleClear} disabled={isLoading} >Clear</Button>
                    </div>
                </div>
            </div>

            <MapboxMap selectedPlace={selectedPlace} locations={locations} />
        </div>
    );
};

export default FiltersAndMap;
