import { headingPiece } from '@/types/pagesTypes'
import React, { JSX } from 'react'

interface HeadingProps {
  headingPiece: headingPiece[];
  extraStyles?: string;
  as?: keyof JSX.IntrinsicElements; // Allow tag choice
}

function Heading({ headingPiece, extraStyles, as = 'h2' }: HeadingProps) {
  const Tag = as;
  return (
    <Tag className={`w-full text-center md:w-auto md:text-left text-2xl md:text-4xl font-bold flex flex-wrap items-center justify-center ${extraStyles}`}>
      {headingPiece.map((piece, i) => (
        <span key={i} className='mr-2' style={{ color: piece.color }}>
          {piece.text}
        </span>
      ))}
    </Tag>
  );
}

export default Heading