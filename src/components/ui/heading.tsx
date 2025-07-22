import { headingPiece } from '@/types/pagesTypes'
import React, { JSX } from 'react'

interface HeadingProps {
  headingPiece: headingPiece[];
  title: string;
  extraStyles?: React.CSSProperties;
  as?: keyof JSX.IntrinsicElements; // Allow tag choice
}

function Heading({ headingPiece, title, extraStyles, as = 'h2' }: HeadingProps) {
  const Tag = as;
  return (
    <>
      {headingPiece.length > 0
        ? (
          <Tag className='text-4xl font-bold' style={extraStyles}>
            {headingPiece.map((piece, i) => (
              <span key={i} className='mr-2' style={{ color: piece.color }}>
                {piece.text}
              </span>
            ))}
          </Tag>
        )
        : (
          <Tag className='text-4xl font-bold text-black' style={extraStyles}>
            {title}
          </Tag>
        )
      }
    </>
  );
}

export default Heading