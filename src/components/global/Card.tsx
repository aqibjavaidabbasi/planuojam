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
    'w-full',
    'overflow-hidden',
    isTop ? 'flex flex-col gap-5' : 'grid grid-cols-1 md:grid-cols-2 items-center gap-5 md:gap-8',
  ].join(' ');

  const imageWrapperClasses = isTop
    ? 'w-full h-72 relative'
    : `${isRight ? 'md:order-2' : ''} w-full h-64 md:h-72 relative`;

  const contentWrapperClasses = [
    isTop ? '' : isRight ? 'md:order-1' : '',
    'w-full',
  ].join(' ');

  return (
    <section className="w-full max-w-[1400px] mx-auto px-4 md:px-6 py-5 md:py-8">
      <div className={containerClasses}>
        <div className={imageWrapperClasses}>
          <Image
            src={imageUrl}
            alt="card image"
            fill
            className="object-cover rounded-md"
            sizes={isTop ? "(max-width: 1400px) 100vw, 1400px" : "(max-width: 768px) 100vw, 50vw"}
          />
        </div>

        <div className={contentWrapperClasses}>
          <h3 className="text-primary font-semibold text-xl mb-2">{card.heading}</h3>
          <p className="text-secondary">{card.blockContent}</p>
        </div>
      </div>
    </section>
  );
}
