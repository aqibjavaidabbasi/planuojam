'use client'
import { SocialLinksComponentBlock } from '@/types/pagesTypes'
import React from 'react'
import Button from '../custom/Button'
import Input from '../custom/Input'
import SocialIcon from './SocialIcon'
import { useTranslations } from 'next-intl'
import { postAPI } from '@/services/api'
import { toast } from 'react-hot-toast'

function SubscriptionForm({ data }: { data: SocialLinksComponentBlock }) {
    const t = useTranslations('Global.SubscriptionForm')
    const [email, setEmail] = React.useState('')
    const [submitting, setSubmitting] = React.useState(false)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!email) return
        setSubmitting(true)
        try {
            await postAPI('news-letter-emails', { data: { email } })
            toast.success(t('success'))
            setEmail('')
        } catch {
            toast.error(t('error'))
        } finally {
            setSubmitting(false)
        }
    }
    return (
        <div className='bg-background px-5 md:px-10 py-3 md:py-5'>
            <div className='max-w-screen lg:max-w-[1440px] mx-auto flex items-center justify-center flex-col md:flex-row gap-2 md:justify-between'>
                <form onSubmit={handleSubmit} id='subscription-form' className='flex gap-2 items-center w-full md:w-auto'>
                    <Input
                        type='email'
                        placeholder={t('emailPlaceholder')}
                        value={email}
                        onChange={(e) => setEmail(e.currentTarget.value)}
                        required
                        disabled={submitting}
                    />
                    <Button
                        style='primary'
                        extraStyles='!rounded-sm'
                        form='subscription-form'
                        type='submit'
                        disabled={submitting} >
                        {submitting ? t('subscribing') : t('subscribe')}
                    </Button>
                </form>
                <div className='flex flex-col gap-1 items-center lg:items-start'>
                    {data.optionalSectionTitle && <h3 className='font-semibold text-xl'>{data.optionalSectionTitle}</h3>}
                    {
                        data.socialLink.length > 0 && <SocialIcon socialLink={data.socialLink} />
                    }
                </div>
            </div>
        </div>
    )
}

export default SubscriptionForm
