'use client'
import Input from '@/components/custom/Input';
import TextArea from '@/components/custom/TextArea';
import Button from '@/components/custom/Button';
import React from 'react'
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import PhoneInputField from '@/components/custom/PhoneInputField';

const ContactForm = () => {
    const t = useTranslations('Contact.Form');
    const [firstName, setFirstName] = React.useState('');
    const [lastName, setLastName] = React.useState('');
    const [email, setEmail] = React.useState('');
    const [country, setCountry] = React.useState('');
    const [phone, setPhone] = React.useState('');
    const [message, setMessage] = React.useState('');
    const [loading, setLoading] = React.useState(false);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!firstName || !email || !message) {
            toast.error(t('validationRequired'));
            return;
        }
        setLoading(true);
        const data = {
            firstName,
            lastName,
            email,
            country,
            phone,
            message
        }
        try {
            const res = await fetch('/api/contact/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data?.error || 'Request failed');
            }
            toast.success(t('success'));
            setFirstName('');
            setLastName('');
            setEmail('');
            setCountry('');
            setPhone('');
            setMessage('');
        } catch {
            toast.error(t('failure'));
        } finally {
            setLoading(false);
        }
    };
    return (
        <div className="space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">{t('title')}</h2>
            <p className="text-gray-600">{t('description')}</p>
            <form className="space-y-6" onSubmit={onSubmit} id='contact-form'>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        type="text"
                        label={t('firstNameLabel')}
                        placeholder={t('firstName')}
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                    />
                    <Input
                        type="text"
                        label={t('lastNameLabel')}
                        placeholder={t('lastName')}
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                    />
                </div>
                <Input
                    type="email"
                    label={t('emailLabel')}
                    placeholder={t('emailPlaceholder')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <PhoneInputField
                    label={t('phoneLabel')}
                    placeholder={t('phonePlaceholder')}
                    value={phone}
                    onChange={(value: string | undefined) => setPhone(value || '')}
                    onCountryChange={(c?: string) => setCountry(c || '')}
                />
                <TextArea
                    label={t('messageLabel')}
                    placeholder={t('messagePlaceholder')}
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                />
                <Button
                    style='primary'
                    type="submit"
                    disabled={loading}
                    form='contact-form'
                >
                    {loading ? t('sending') : t('send')}
                </Button>
            </form>
        </div>
    )
}

export default ContactForm