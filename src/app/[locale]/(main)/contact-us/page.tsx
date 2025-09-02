  import ContactForm from '@/components/global/ContactForm';
import ContactStatic from './ContactStatic';
import React from 'react';

export default function ContactUs() {
    return (
        <section className="w-full px-4 py-12 md:py-20 lg:px-16 bg-white">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Contact Form */}
               <ContactForm />
                {/* Contact Info */}
                <ContactStatic />
            </div>
        </section>
    );
}
