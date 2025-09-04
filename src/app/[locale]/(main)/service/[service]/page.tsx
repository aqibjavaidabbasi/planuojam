import React from 'react'
import ClientListingWrapper from "@/components/global/ClientListingWrapper";

export default async function ServicePage({ params }: { params: Promise<{ service: string }> }) {
  const { service } = await params;

  return (
    <ClientListingWrapper
      serviceDocId={service}
    />
  );
}
