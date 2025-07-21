import { SearchIcon } from 'lucide-react'
import React from 'react'

function Search() {
    return (
        <div className='relative'>
            <input type="search" className='bg-white p-1 border custom-border-color rounded-lg h-9 pl-8' placeholder='Search here' />
            <div className='absolute left-1 top-1/2 -translate-y-1/2 h-full flex items-center justify-center'>
                <SearchIcon className='text-border' />
            </div>
        </div>
    )
}

export default Search