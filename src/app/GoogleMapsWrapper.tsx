'use client'
import { LoadScript } from '@react-google-maps/api'
import React from 'react'

const libraries: Array<'places'> = ['places'];

interface GoogleMapsWrapperProps {
    children: React.ReactNode;
}

function GoogleMapsWrapper({ children }: GoogleMapsWrapperProps) {
    return (
        <LoadScript
            googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}
            libraries={libraries}
        >
            {children}
        </LoadScript>
    )
}

export default GoogleMapsWrapper