import dynamic from 'next/dynamic';
const ContactForm = dynamic(()=>import('@/components/global/ContactForm'))
const ContactStatic = dynamic(()=>import('./ContactStatic'))
import React from 'react';
import { fetchAPI, createQuery } from '@/services/api';
import type { Metadata } from 'next'
import { getSeoMetadata } from '@/lib/getSeoMetadata'
import { fetchFallbackSeo, fetchPageSeoBySlug, resolveSeoByUrl } from '@/services/seoApi'

export default async function ContactUs({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const contactPop = {
        info: {
          populate: '*',
        },
        links: {
          populate: '*',
        }
    }
    const contactQuery = createQuery(contactPop, { locale: locale})
    const contactSettings = await fetchAPI('contact-setting', contactQuery);
    const contactInfo = contactSettings?.info || {};
    const description = contactSettings?.contactDescription;
    const socialLinks = contactSettings?.links || [];

    return (
        <section className="w-full px-4 py-12 md:py-20 lg:px-16 bg-white">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Contact Form */}
                <ContactForm />
                {/* Contact Info */}
                <ContactStatic
                  address={contactInfo.address}
                  email={contactInfo.email}
                  phone={contactInfo.phone}
                  description={description}
                  socialLinks={socialLinks}
                />
            </div>
        </section>
    );
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const slug = 'contact-us';
  const pageUrl = `/${locale}/${slug}`;
  const urlPath = pageUrl;

  const pageSeo = await fetchPageSeoBySlug(slug, locale);
  const fallbackSeo = await fetchFallbackSeo();
  if (pageSeo) {
    return getSeoMetadata(pageSeo, fallbackSeo, urlPath);
  }

  const mappedSeo = await resolveSeoByUrl({ pageUrl, locale });
  return getSeoMetadata(mappedSeo, fallbackSeo, urlPath);
}
