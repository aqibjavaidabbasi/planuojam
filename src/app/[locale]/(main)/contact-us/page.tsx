  import ContactForm from '@/components/global/ContactForm';
import ContactStatic from './ContactStatic';
import React from 'react';
import { fetchAPI, createQuery } from '@/services/api';

export default async function ContactUs() {
    // Fetch site-setting fields as per final schema
    const query = createQuery({
        contactInfo: { populate: '*' },
        socialLink: { populate: '*' },
        contactCountries: { populate: '*' },
    });
    const siteSetting = await fetchAPI('site-setting', query);
    const contactInfo = siteSetting?.contactInfo || {};
    const description = siteSetting?.contactDescription;
    const socialLinks = siteSetting?.socialLink || [];
    const countries: string[] = (siteSetting?.contactCountries || [])
        .map((c: { country: string; }) => c?.country)
        .filter((c: string) => c.trim().length > 0);

    return (
        <section className="w-full px-4 py-12 md:py-20 lg:px-16 bg-white">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Contact Form */}
                <ContactForm countries={countries} />
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
