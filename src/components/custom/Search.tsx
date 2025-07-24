'use client'
import React, { useState } from 'react'
import { IoSearchOutline } from 'react-icons/io5'

function Search() {
    const [isFocused, setIsFocused] = useState(false);

    return (
        <div className='relative w-full'>
            <input
                type="search"
                className="bg-white w-full p-1 border custom-border-color rounded-lg h-9 pl-8 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Search here"
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
            />
            <div className='absolute left-1 top-1/2 -translate-y-1/2 h-full flex items-center justify-center'>
                <IoSearchOutline
                    className={isFocused ? 'text-primary' : 'text-gray-400'}
                    size={24}
                />
            </div>
        </div>
    )

}

export default Search