'use client'
import Input from '@/components/custom/Input';
import TextArea from '@/components/custom/TextArea';
import Button from '@/components/custom/Button';
import React from 'react'
import { useTranslations } from 'next-intl';

function ContactForm() {
    const t = useTranslations('Contact.Form');
    return (
        <div className="space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">{t('title')}</h2>
            <p className="text-gray-600">{t('description')}</p>
            <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        type="text"
                        placeholder={t('firstName')}
                    />
                    <Input
                        type="text"
                        placeholder={t('lastName')}
                    />
                </div>
                <Input
                    type="email"
                    placeholder={t('emailPlaceholder')}
                />
                <div className="flex gap-2">
                    <select className="border border-gray-300 rounded-md px-3 py-2">
                        <option>{t('country.lt')}</option>
                        <option>{t('country.ru')}</option>
                    </select>
                    <Input
                        type="tel"
                        placeholder={t('phonePlaceholder')}
                    />
                </div>
                <TextArea
                    placeholder={t('messagePlaceholder')}
                    rows={4}
                />
                <Button
                    style='primary'
                    type="submit"
                >
                    {t('send')}
                </Button>
            </form>
        </div>
    )
}

export default ContactForm