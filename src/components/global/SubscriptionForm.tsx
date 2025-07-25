import { SocialLinksComponentBlock } from '@/types/pagesTypes'
import React from 'react'
import Button from '../ui/Button'
import { FaFacebook, FaInstagram, FaLinkedin, FaPinterest, FaRedditAlien, FaTiktok, FaTwitter, FaYoutube } from 'react-icons/fa'
import { FaSquareThreads } from 'react-icons/fa6'
import Input from '../custom/Input'

function SubscriptionForm({ data }: { data: SocialLinksComponentBlock }) {
    return (
        <div className='bg-normal flex items-center justify-center md:justify-between px-5 md:px-10 py-3 md:py-5 flex-col md:flex-row gap-2'>
            <div className='flex gap-2 items-center'>
                <Input type='email' placeholder='Enter your email' />
                <Button style='primary' extraStyles='!rounded-sm' >
                    Subscribe
                </Button>
            </div>
            <div className='flex flex-col gap-1 items-center lg:items-start'>
                {data.optionalSectionTitle && <h3 className='font-semibold text-xl'>{data.optionalSectionTitle}</h3>}
                {
                    data.socialLink.length > 0 && <div className='flex items-center gap-2.5 md:gap-1.5  flex-wrap lg:items-start justify-center lg:justify-start'>
                        {data.socialLink.map(link => (
                            <span key={link.id} className='bg-white p-2 rounded-full cursor-pointer hover:bg-primary hover:text-white'>
                                {link.platform.toLowerCase() === 'facebook' && <FaFacebook size={20} />}
                                {link.platform.toLowerCase() === 'linkedin' && <FaLinkedin size={20} />}
                                {link.platform.toLowerCase() === 'youtube' && <FaYoutube size={20} />}
                                {link.platform.toLowerCase() === 'instagram' && <FaInstagram size={20} />}
                                {link.platform.toLowerCase() === 'tiktok' && <FaTiktok size={20} />}
                                {link.platform.toLowerCase() === 'twitter' && <FaTwitter size={20} />}
                                {link.platform.toLowerCase() === 'pinterest' && <FaPinterest size={20} />}
                                {link.platform.toLowerCase() === 'thread' && <FaSquareThreads size={20} />}
                                {link.platform.toLowerCase() === 'reddit' && <FaRedditAlien size={20} />}
                            </span>
                        ))}
                    </div>
                }
            </div>
        </div>
    )
}

export default SubscriptionForm
