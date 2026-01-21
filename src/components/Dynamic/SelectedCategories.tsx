"use client";
import { SelectedCategoriesList } from '@/types/pagesTypes'
import { filterUniqueCategoriesByParent } from '@/utils/helpers';
import React from 'react'
import Heading from '../custom/heading';
import CategoryCard from './CategoryCard';
import NoDataCard from '../custom/NoDataCard';
import { useTranslations } from 'next-intl';

function SelectedCategories({ data }: { data: SelectedCategoriesList }) {
    const t = useTranslations('Dynamic.SelectedCategories');
    const updatedData = filterUniqueCategoriesByParent(data);

    return (
        <div className='w-screen py-5 md:py-10 px-3 md:px-6 max-w-screen lg:max-w-[1700px] mx-auto'>
            <div className='flex flex-col items-center justify-center gap-2'>
                <Heading headingPiece={data.sectionTitle.heading.headingPiece} />
                <p className='text-center max-w-prose'>{data.sectionTitle.sectionDescription}</p>
            </div>
            <div className='flex items-center justify-center mt-10'>
                <div className="flex flex-wrap gap-5 justify-center">
                    {
                        updatedData.length > 0 ?
                            updatedData.map(item => {
                                const category = item.category;
                                return (<CategoryCard key={category.documentId} category={category} />)
                            })
                            :
                            <NoDataCard>{t('noCategoriesFound')}</NoDataCard>
                    }
                </div>
            </div>
        </div>
    )
}

export default SelectedCategories