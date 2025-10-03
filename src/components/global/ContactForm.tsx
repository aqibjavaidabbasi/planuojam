'use client'
import Input from '@/components/custom/Input';
import TextArea from '@/components/custom/TextArea';
import Button from '@/components/custom/Button';
import React from 'react'
import { useTranslations } from 'next-intl';

type Props = {
    countries?: string[];
}

const ContactForm: React.FC<Props> = ({ countries = [] }) => {
    const t = useTranslations('Contact.Form');
    const [firstName, setFirstName] = React.useState('');
    const [lastName, setLastName] = React.useState('');
    const [email, setEmail] = React.useState('');
    const [country, setCountry] = React.useState(countries[0] || '');
    const [phone, setPhone] = React.useState('');
    const [message, setMessage] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    const [success, setSuccess] = React.useState<string | null>(null);
    const [error, setError] = React.useState<string | null>(null);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSuccess(null);
        setError(null);

        if (!firstName || !email || !message) {
            setError(t('validationRequired', { default: 'Please fill in required fields.' }));
            return;
        }
        setLoading(true);
        try {
            const res = await fetch('/api/contact/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ firstName, lastName, email, country, phone, message })
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data?.error || 'Request failed');
            }
            setSuccess(t('success', { default: 'Message sent successfully.' }));
            setFirstName('');
            setLastName('');
            setEmail('');
            setCountry(countries[0] || '');
            setPhone('');
            setMessage('');
        } catch {
            setError(t('failure', { default: 'Failed to send your message. Please try again.' }));
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
                        placeholder={t('firstName')}
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                    />
                    <Input
                        type="text"
                        placeholder={t('lastName')}
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                    />
                </div>
                <Input
                    type="email"
                    placeholder={t('emailPlaceholder')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <div className="flex gap-2">
                    <select className="border border-gray-300 rounded-md px-3 py-2" value={country} onChange={(e) => setCountry(e.target.value)}>
                        {countries.length > 0 ? (
                            countries.map((c) => (
                                <option key={c} value={c}>{c}</option>
                            ))
                        ) : (
                            <option value="">{t('countryPlaceholder', { default: 'Select a country' })}</option>
                        )}
                    </select>
                    <Input
                        type="tel"
                        placeholder={t('phonePlaceholder')}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                    />
                </div>
                <TextArea
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
                    {loading ? t('sending', { default: 'Sending...' }) : t('send')}
                </Button>
                {success && <p className="text-green-600 text-sm">{success}</p>}
                {error && <p className="text-red-600 text-sm">{error}</p>}
            </form>
        </div>
    )
}

export default ContactForm