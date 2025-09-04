import DynamicZoneRenderer from '@/components/global/DynamicZoneRenderer';
import { fetchPageById } from '@/services/pagesApi';
import { page } from '@/types/pagesTypes';
import React from 'react';

interface AboutPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function AboutPage({ params }: AboutPageProps) {
  const { locale } = await params 
  const aboutUsData: page = await fetchPageById('w9xmo2id7rjddo44es246xzl', locale);
    if (!aboutUsData) return null;
    return (
    <div>
      <DynamicZoneRenderer blocks={aboutUsData.blocks} />
    </div>
  )
}