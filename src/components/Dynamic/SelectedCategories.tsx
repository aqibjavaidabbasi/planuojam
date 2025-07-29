import { SelectedCategoriesList } from '@/types/pagesTypes'
import { filterUniqueCategoriesByParent } from '@/utils/helpers';
import React from 'react'
import Heading from '../ui/heading';
import CategoryCard from './CategoryCard';
import NoDataCard from '../custom/NoDataCard';


function SelectedCategories({ data }: { data: SelectedCategoriesList }) {

    const updatedData = filterUniqueCategoriesByParent(data);

    return (
        <div className='w-screen py-5 md:py-10 px-3 md:px-6 max-w-screen lg:max-w-[1400px]'>
            <div className='flex flex-col items-center justify-center gap-2'>
                <Heading headingPiece={data.sectionTitle.heading.headingPiece} />
                <p>{data.sectionTitle.sectionDescription}</p>
            </div>
            <div className='flex items-center justify-center gap-3 mt-10 flex-wrap'>
                {
                    updatedData.length > 0 ?
                        updatedData.map(item => {
                            const category = item.category;
                            return ( <CategoryCard key={category.documentId} category={category} />)
                        })
                        :
                        <NoDataCard>No Data Found</NoDataCard>
                }
            </div>
        </div>
    )
}

export default SelectedCategories