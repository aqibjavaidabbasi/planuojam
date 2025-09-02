'use client'
import { SocialLinksComponentBlock } from '@/types/pagesTypes'
import React from 'react'
import Button from '../custom/Button'
import Input from '../custom/Input'
import SocialIcon from './SocialIcon'
import { useTranslations } from 'next-intl'

function SubscriptionForm({ data }: { data: SocialLinksComponentBlock }) {
    const t = useTranslations('Global.SubscriptionForm')
    return (
        <div className='bg-background flex items-center justify-center md:justify-between px-5 md:px-10 py-3 md:py-5 flex-col md:flex-row gap-2'>
            <div className='flex gap-2 items-center'>
                <Input type='email' placeholder={t('emailPlaceholder')} />
                <Button style='primary' extraStyles='!rounded-sm' >
                    {t('subscribe')}
                </Button>
            </div>
            <div className='flex flex-col gap-1 items-center lg:items-start'>
                {data.optionalSectionTitle && <h3 className='font-semibold text-xl'>{data.optionalSectionTitle}</h3>}
                {
                    data.socialLink.length > 0 && <SocialIcon socialLink={data.socialLink} />
                }
            </div>
        </div>
    )
}

export default SubscriptionForm
