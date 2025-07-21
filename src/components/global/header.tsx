'use client'
import { fetchHeader } from '@/services/pagesApi'
import { header as HeaderType } from '@/types/pagesTypes';
import { strapiImage } from '@/types/common';
import Image from 'next/image';
import React, { useEffect, useState } from 'react'
import Search from '../custom/Search';
import { User2 } from 'lucide-react';



function Header({ logo }: { logo: strapiImage }) {
    const [headerData, setHeaderData] = useState<HeaderType>();
    const imageUrl = `${process.env.NEXT_PUBLIC_API_URL}${logo.url}`;

    useEffect(function () {
        fetchHeader().then(data => setHeaderData(data));
    }, [])

    if (!headerData) return <div>loading...</div>
    return (
        <header className='w-screen p-3 flex items-center justify-between'>
            <div className='flex items-center gap-2.5'>
                <Image
                    src={imageUrl}
                    alt='Planuojam Logo'
                    width={100}
                    height={100}
                />
                <div className='flex items-center gap-2'>
                    {headerData.nav.item.map(navItem => {
                        return <div
                            className='cursor-pointer text-primary bg-white hover:bg-primary  hover:text-white p-2.5 rounded-sm inline-block'
                            key={navItem.id}
                        >{navItem.label}</div>
                    })}
                </div>
            </div>
            <div className='flex items-center gap-2'>
                <select className='bg-white p-1 border custom-border-color rounded-md h-9'>
                    <option value="">English</option>
                    <option value="">Lietuvių</option>
                </select>
                <Search />
                <div className='border border-primary rounded-full p-1.5 cursor-pointer group hover:bg-primary' >
                    <User2 className='text-primary group-hover:text-white' />
                </div>
            </div>
        </header>
    )
}

export default Header