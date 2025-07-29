'use client'
import { FAQComponentBlock } from '@/types/pagesTypes'
import React, { useState } from 'react'
import { FaChevronDown } from 'react-icons/fa'

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

  const toggleIndex = (idx: number) => {
    setOpenIndexes((prev) =>
      prev.includes(idx)
        ? prev.filter((i) => i !== idx)
        : [...prev, idx]
    )
  }

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
            <div
              key={faq.id || idx}
              className="rounded-lg border border-gray-200 shadow-sm transition h-fit"
            >
              <button
                className="w-full flex justify-between items-center px-6 py-5 text-left hover:bg-gray-50 transition-all focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                onClick={() => toggleIndex(idx)}
                aria-expanded={isOpen}
                aria-controls={`faq-answer-${idx}`}
              >
                <span className="font-medium text-gray-900 text-base md:text-lg">
                  {faq.question}
                </span>
                <FaChevronDown
                  className={`w-5 h-5 text-primary transform transition-transform duration-200 ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                  aria-hidden="true"
                />
              </button>
              <div
                className={`text-gray-700 text-sm md:text-base overflow-hidden transition-all duration-300 ${
                  isOpen ? 'max-h-[500px] opacity-100 px-6 pb-5 ' : 'max-h-0 opacity-0'
                }`}
                style={{ willChange: 'max-height, opacity' }}
              >
                <div className="pt-2">{faq.answer}</div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default FaqBlock
