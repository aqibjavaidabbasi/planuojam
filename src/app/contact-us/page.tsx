import ContactForm from '@/components/global/ContactForm';
import React from 'react';

export default function ContactUs() {
    return (
        <section className="w-full px-4 py-12 md:py-20 lg:px-16 bg-white">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Contact Form */}
               <ContactForm />
                {/* Contact Info */}
                <div className="space-y-8 text-gray-700">
                    <div>
                        <h3 className="text-xl font-semibold mb-2">Chat with us</h3>
                        <ul className="space-y-1">
                            <li><a href="#" className="text-black hover:underline">Start a live chat</a></li>
                            <li><a href="#" className="text-black hover:underline">Shoot us an email</a></li>
                            <li><a href="#" className="text-black hover:underline">Message us on X</a></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold mb-2">Call us</h3>
                        <p>
                            Call our team Mon–Fri from 8am to 5pm.<br />
                            <a href="tel:+15550000000" className="text-black font-medium hover:underline">+1 (555) 000–0000</a>
                        </p>
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold mb-2">Visit us</h3>
                        <p>
                            Chat to us in person at our Melbourne HQ.<br />
                            <a
                                href="https://maps.google.com"
                                className="text-black font-medium hover:underline"
                            >
                                100 Smith Street, Collingwood VIC 3066
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
