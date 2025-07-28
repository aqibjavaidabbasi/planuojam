'use client';

import { useRef, useState } from 'react';
import { StandaloneSearchBox } from '@react-google-maps/api';
import Map from './GoogleMap';
import Input from '../custom/Input';
import Select from '../custom/Select';
import Button from '../ui/Button';
import { fetchListings } from '@/services/common';
import { listingItem } from '@/types/pagesTypes';


type FilterConfig = {
    name: string;
    options: string[];
    placeholder?: string;
};

interface FiltersAndMapProps {
    filters: FilterConfig[];
    type: 'venue' | 'vendor';
    setList: (venues: listingItem[]) => void;
}

const FiltersAndMap: React.FC<FiltersAndMapProps> = ({ filters, type, setList }) => {
    const searchBoxRef = useRef<google.maps.places.SearchBox | null>(null);
    const [selectedPlace, setSelectedPlace] = useState<google.maps.places.PlaceResult | null>(null);
    const [tempFilterValues, setTempFilterValues] = useState<Record<string, string>>({});
    const [appliedFilters, setAppliedFilters] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    const onPlacesChanged = () => {
        if (searchBoxRef.current) {
            const places = searchBoxRef.current.getPlaces();
            if (places && places.length > 0) {
                setSelectedPlace(places[0]);
            }
        }
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
                <StandaloneSearchBox
                    onLoad={(searchBox) => (searchBoxRef.current = searchBox)}
                    onPlacesChanged={onPlacesChanged}
                >
                    <Input placeholder="Search for a place" type="text" />
                </StandaloneSearchBox>
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

            <Map selectedPlace={selectedPlace} />
        </div>
    );
};

export default FiltersAndMap;
