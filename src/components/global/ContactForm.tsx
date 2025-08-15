'use client'
import Input from '@/components/custom/Input';
import TextArea from '@/components/custom/TextArea';
import Button from '@/components/custom/Button';
import React from 'react'

function ContactForm() {
    return (
        <div className="space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">Contact our team</h2>
            <p className="text-gray-600">
                Got any questions about the product or scaling on our platform? We’re here to help.
                Chat to our friendly team 24/7 and get onboard in less than 5 minutes.
            </p>
            <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        type="text"
                        placeholder="First name"
                    />
                    <Input
                        type="text"
                        placeholder="Last name"
                    />
                </div>
                <Input
                    type="email"
                    placeholder="you@company.com"
                />
                <div className="flex gap-2">
                    <select className="border border-gray-300 rounded-md px-3 py-2">
                        <option>Lt</option>
                        <option>Ru</option>
                    </select>
                    <Input
                        type="tel"
                        placeholder="+1 (555) 000-0000"
                    />
                </div>
                <TextArea
                    placeholder="Leave us a message..."
                    rows={4}
                />
                <Button
                    style='primary'
                    type="submit"
                >
                    Send message
                </Button>
            </form>
        </div>
    )
}

export default ContactForm