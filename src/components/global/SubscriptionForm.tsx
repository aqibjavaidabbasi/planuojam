'use client'
import { SocialLinksComponentBlock } from '@/types/pagesTypes'
import React from 'react'
import Button from '../ui/Button'
import Input from '../custom/Input'
import SocialIcon from './SocialIcon'

function SubscriptionForm({ data }: { data: SocialLinksComponentBlock }) {
    return (
        <div className='bg-background flex items-center justify-center md:justify-between px-5 md:px-10 py-3 md:py-5 flex-col md:flex-row gap-2'>
            <div className='flex gap-2 items-center'>
                <Input type='email' placeholder='Enter your email' />
                <Button style='primary' extraStyles='!rounded-sm' >
                    Subscribe
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
