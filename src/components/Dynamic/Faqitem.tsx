'use client'
import { FAQ } from '@/types/pagesTypes'
import React from 'react'
import { FaChevronDown } from 'react-icons/fa'

type FaqitemProps = {
  faq: FAQ;
  idx: number;
  isOpen: boolean;
  setOpenIndexes: React.Dispatch<React.SetStateAction<number[]>>;
};

function Faqitem({faq, idx, isOpen, setOpenIndexes}: FaqitemProps) {

    const toggleIndex = (idx: number) => {
        setOpenIndexes((prev: number[]) =>
          prev.includes(idx)
            ? prev.filter((i) => i !== idx)
            : [...prev, idx]
        )
      }
  return (
    <div
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
}

export default Faqitem