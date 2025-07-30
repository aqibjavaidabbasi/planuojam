'use client'
import React from 'react'
import ClientEventTypeWrapper from './ClientEventTypeWrapper';
import { useParams } from 'next/navigation';

function EventTypesPage() {
  const params = useParams<{slug: string}>();
    const { slug } = params;
    return (
        <div>
            <ClientEventTypeWrapper slug={slug} />
        </div>
    );
}

export default EventTypesPage