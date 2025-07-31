'use client'
import { FAQComponentBlock } from '@/types/pagesTypes'
import React, { useState } from 'react'
import Faqitem from './Faqitem'

function FaqBlock({ data }: { data: FAQComponentBlock }) {
  const faqs = Array.isArray(data?.items) ? data.items : []
  const [openIndexes, setOpenIndexes] = useState<number[]>([])

  // Determine columns based on numberOfColumns field
  const columns =
    data.numberOfColumns === 'two'
      ? 2
      : 1

  const gridClass =
    columns === 2
      ? 'grid grid-cols-2 gap-4'
      : 'grid grid-cols-1 gap-4 max-w-xl mx-auto'

  if (!faqs.length) return null

  return (
    <section className="my-12 px-4">
      <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center text-primary">
        {data.sectionTitle}
      </h2>

      <div className={gridClass}>
        {faqs.map((faq, idx) => {
          const isOpen = openIndexes.includes(idx)

          return (
            <Faqitem
              isOpen={isOpen}
              faq={faq}
              idx={idx}
              key={faq.id || idx}
              setOpenIndexes={setOpenIndexes}
            />
          )
        })}
      </div>
    </section>
  )
}

export default FaqBlock
