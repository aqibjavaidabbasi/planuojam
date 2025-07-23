import { CityListBlock } from '@/types/pagesTypes'
import React from 'react'

function CityList({ data }: { data: CityListBlock }) {
  return (
    <div className="bg-white rounded-sm p-4"
      style={{
        boxShadow: '0px 0px 4px rgba(0,0,0,0.2)'
      }}
    >
      <h3 className='text-base font-semibold mb-2'>Find Venues and cities</h3>
      <ul className='grid grid-cols-2 md:grid-cols-5 justify-evenly pl-5'>
        {data.Cities.map((city) => (
          <li key={city.id}
            className='list-disc'
          >
            <a href={'#'}
              className='text-primary hover:underline'
            >
              {city.city.name}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default CityList