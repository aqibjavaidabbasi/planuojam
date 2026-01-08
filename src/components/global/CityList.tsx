import { CityListBlock } from '@/types/pagesTypes'
import React from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'

function CityList({ data }: { data: CityListBlock }) {
  const t = useTranslations('Global.CityList')
  return (
    <div className="bg-white rounded-sm flex"
      style={{
        boxShadow: '0px 0px 4px rgba(0,0,0,0.2)'
      }}
    >
      <div className='lg:max-w-[1700px] mx-auto max-w-screen w-full p-4'>
      <h3 className='text-base font-semibold mb-2'>{t('title')}</h3>
      <ul className='grid grid-cols-2 md:grid-cols-5 justify-evenly pl-5'>
        {data.Cities.map((city) => (
          <li key={city.id}
            className='list-disc'
          >
            <Link href={'/map'}
              className='text-primary hover:underline'
            >
              {city?.city?.name}
            </Link>
          </li>
        ))}
      </ul>
      </div>
    </div>
  )
}

export default CityList