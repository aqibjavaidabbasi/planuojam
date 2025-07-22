'use client'
import { fetchFooter } from '@/services/pagesApi'
import { footer } from '@/types/pagesTypes';
import React, { useEffect, useState } from 'react'

function Footer() {
    const [footerData, setFooterData] = useState<footer>();
    useEffect(function () {
        fetchFooter().then(data => setFooterData(data))
    }, []);

    if (!footerData) return <div>footer loading</div>

    return (
        <div className='bg-footer w-screen max-w-screen text-primary p-5' >
            <div className='flex justify-between'>
                {footerData.footerlinkSection.map(section => (<div key={section.id}>
                    <p className='text-white font-semibold mb-2 capitalize'>{section.title}</p>
                    <div className='flex flex-col gap-1'>
                        {section.navItem.map(item => (<a className='hover:underline capitalize' href={item.relativeUrl} key={item.id}>
                            {item.label}
                        </a>))}
                    </div>
                </div>))}
            </div>
            <div className='flex items-center justify-between mt-4 pt-3 border-t-[0.5px] custom-border-color'>
                <div className='flex items-center gap-2.5'>
                    {footerData.extraLinks.map(link => (<a className='hover:underline capitalize' href={link.relativeUrl} key={link.id}>
                        {link.label}
                    </a>))}
                </div>
                <p className='text-white'>&copy; {footerData.copyRightText}</p>
            </div>
        </div>
    )
}

export default Footer