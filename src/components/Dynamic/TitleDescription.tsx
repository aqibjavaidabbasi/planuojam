import { TitleDescriptionBlock } from '@/types/pagesTypes'
import React from 'react'
import Heading from '../custom/heading'

function TitleDescription({ data }: { data: TitleDescriptionBlock }) {
    return (
        <section className='w-full max-w-[1400px] mx-auto px-4 md:px-6 my-8 md:my-10' >
            <Heading
                headingPiece={data.heading.headingPiece}
                as="h2"
                extraStyles='lg:!items-start lg:!justify-start'
            />
            <p className="text-secondary text-base font-normal text-center md:text-left mt-4">{data.sectionDescription}</p>
        </section>
    )
}

export default TitleDescription
