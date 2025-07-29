import { TitleDescriptionBlock } from '@/types/pagesTypes'
import React from 'react'
import Heading from '../ui/heading'

function TitleDescription({ data }: { data: TitleDescriptionBlock }) {
    return (
        <div className='mx-12 my-10' >
            <Heading
                headingPiece={data.heading.headingPiece}
                as="h2"
                extraStyles='lg:!items-start lg:!justify-start'
            />
            <p className="text-secondary text-base font-normal text-center md:text-left mt-4">{data.sectionDescription}</p>
        </div>
    )
}

export default TitleDescription