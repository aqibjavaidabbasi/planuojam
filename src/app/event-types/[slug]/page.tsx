import React from 'react'
import ClientEventTypeWrapper from './ClientEventTypeWrapper';

async function EventTypesPage({ params }: { params: { slug: string } }) {
    const {slug} = await params;
  return (
    <div>
       <ClientEventTypeWrapper slug={slug} />
    </div>
  )
}

export default EventTypesPage