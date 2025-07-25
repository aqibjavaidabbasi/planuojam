'use client';

import { useRef, useState } from 'react';
import { LoadScript, StandaloneSearchBox } from '@react-google-maps/api';
import Map from './GoogleMap';
import Input from '../custom/Input';
import Select from '../custom/Select';
import Button from '../ui/Button';

const libraries: ('places')[] = ['places'];

interface FiltersAndMapProps {
    filters: FilterConfig[];
}

type FilterConfig = {
    name: string;
    options: string[];
    placeholder?: string;
};


const FiltersAndMap: React.FC<FiltersAndMapProps> = ({ filters }) => {
    const searchBoxRef = useRef<google.maps.places.SearchBox | null>(null);
    const [selectedPlace, setSelectedPlace] = useState<google.maps.places.PlaceResult | null>(null);

    const [tempFilterValues, setTempFilterValues] = useState<Record<string, string>>({});
    const [appliedFilters, setAppliedFilters] = useState<Record<string, string>>({});


    const onPlacesChanged = () => {
        if (searchBoxRef.current) {
            const places = searchBoxRef.current.getPlaces();
            if (places && places.length > 0) {
                setSelectedPlace(places[0]);
            }
        }
    };
    const handleFilterChange = (name: string, value: string) => {
        setTempFilterValues((prev) => ({ ...prev, [name]: value }));
    };

    const handleApply = () => {
        setAppliedFilters({ ...tempFilterValues });
        // Optional: trigger external data fetch here if needed
    };

    const handleClear = () => {
        setTempFilterValues({});
        setAppliedFilters({});
    };

    console.log(appliedFilters)

    return (
        <LoadScript
            googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}
            libraries={libraries}
        >
            <div>
                <div className="mb-4 flex flex-col gap-1">
                    <StandaloneSearchBox
                        onLoad={(searchBox) => (searchBoxRef.current = searchBox)}
                        onPlacesChanged={onPlacesChanged}
                    >
                        <Input placeholder="Search for a place" type="text" />
                    </StandaloneSearchBox>
                    <div className='flex gap-2 items-center justify-center'>
                        {filters.map(({ name, options, placeholder }) => (
                            <Select
                                key={name}
                                name={name}
                                value={tempFilterValues[name] || ''}
                                onChange={(e) => handleFilterChange(name, e.target.value)}
                                options={options.map((opt) => ({ value: opt, label: opt }))}
                                placeholder={placeholder || `Choose ${name}`}
                            />
                        ))}
                        <Button style='secondary' onClick={handleApply}>Apply</Button>
                        <Button style='secondary' onClick={handleClear}>Clear</Button>
                    </div>
                </div>

                <Map selectedPlace={selectedPlace} />
            </div>
        </LoadScript>
    );
};

export default FiltersAndMap;
