import { CardComponentBlock } from '@/types/pagesTypes';
import { getCompleteImageUrl } from '@/utils/helpers';
import Image from 'next/image';
import React from 'react';

export default function CardComponent({ card }: { card: CardComponentBlock }) {
  const imageUrl = getCompleteImageUrl(card.image.url);
  const imagePosition = card.imagePositon ?? 'top';

  const isRight = imagePosition === 'right';
  const isTop = imagePosition === 'top';

  const containerClasses = [
    'p-6',
    'rounded-lg',
    'shadow-md',
    'bg-white',
    'overflow-hidden',
    'bg-background',
    isTop ? 'flex flex-col' : 'flex items-center gap-6',
    isRight ? 'flex row-reverse' : '',
  ].join(' ');

  const imageWrapperClasses = isTop
    ? 'w-full h-72 relative'
    : 'w-1/2 h-72 relative';

  const contentWrapperClasses = isTop ? 'mt-4' : 'w-1/2';

  return (
    <div className={containerClasses}>
      <div className={imageWrapperClasses}>
        <Image
          src={imageUrl}
          alt="card image"
          fill
          className="object-cover rounded-md"
        />
      </div>

      <div className={contentWrapperClasses}>
        <h3 className="text-primary font-semibold text-xl mb-2">{card.heading}</h3>
        <p>{card.blockContent}</p>
      </div>
    </div>
  );
}
