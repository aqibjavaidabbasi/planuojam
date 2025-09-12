'use client'
import { ListingItem } from '@/types/pagesTypes'
import { getCompleteImageUrl } from '@/utils/helpers'
import Image from 'next/image'
import { useState } from 'react'
import { Autoplay, Navigation, Pagination } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import { FaHeart, FaSpinner } from 'react-icons/fa'
import { CiHeart } from 'react-icons/ci'
import Button from '../custom/Button'
import { IoNavigateOutline } from 'react-icons/io5'
import { useSiteSettings } from '@/context/SiteSettingsContext'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import LoginNavigateModal from '../modals/LoginNavigateModal'
import { addToLikedListing, removeFromLikedListing } from '@/store/thunks/likedListing'
import toast from 'react-hot-toast'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'

function ListingCard({ item }: { item: ListingItem }) {
  const router = useRouter();
  const { siteSettings } = useSiteSettings();
  const { user } = useAppSelector(state => state.auth);
  const { status, items: likedListings } = useAppSelector(state => state.likedListings);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const dispatch = useAppDispatch();
  const t = useTranslations('Dynamic.ListingCard');

  const isLiked = Array.isArray(likedListings) && likedListings.some(listing => listing.listing.documentId === item.documentId);

  function handleHeartClick() {
    //if user is not logged in, show modal for login 
    if (!user) {
      setShowLoginModal(true)
      return;
    }
    // When already liked, find the corresponding liked item id (cannot be undefined if isLiked is true)
    const likedItem = isLiked
      ? (Array.isArray(likedListings)
        ? likedListings.find(listing => listing.listing.documentId === item.documentId)
        : undefined)
      : undefined;

    toast.promise(
      isLiked
        ? dispatch(removeFromLikedListing(likedItem!.documentId)).unwrap()
        : dispatch(addToLikedListing(item.documentId)).unwrap(),
      {
        loading: isLiked ? t('toasts.removing') : t('toasts.adding'),
        success: isLiked ? t('toasts.removed') : t('toasts.added'),
        error: isLiked ? t('toasts.removeFailed') : t('toasts.addFailed')
      }
    )
  }

  function getListingItemUrl(){
    if(item.listingItem.length === 0) return '#';
    if (item.locale === 'en') return `/listing/${item.slug}`;
    if (item.locale !== 'en') {
      const entry = item.localizations.find(loc => loc.locale === 'en');
      return entry ? `/listing/${entry.slug}` : '#';
    }
  }

  return (
    <div
      className="rounded-lg bg-white relative max-w-full sm:max-w-[300px] overflow-hidden border border-border"
      style={{
        boxShadow:
          '2px 0px 4px rgba(0,0,0,0.1), 0px 2px 4px rgba(0,0,0,0.1), 0px -2px 4px rgba(0,0,0,0.1), -2px 0px 4px rgba(0,0,0,0.1)'
      }}
    >
      {/* Heart icon */}
      <div className="absolute top-2 left-2 z-20">
        {status === 'loading' ? (
          <FaSpinner size={32}
            color="#e53e3e"
            className="cursor-not-allowed" />
        ) : isLiked ? (
          <FaHeart
            onClick={handleHeartClick}
            size={32}
            color="#e53e3e"
            className="cursor-pointer"
          />
        ) : (
          <CiHeart
            onClick={handleHeartClick}
            size={32}
            color="#e2e8f0"
            className="cursor-pointer"
          />
        )}
      </div>

      {/* Hot Deal Badge */}
      {item.hotDeal?.enableHotDeal && (
        <div className="absolute top-4 right-4 z-10">
          <div className="relative">
            <div className="bg-primary text-white w-16 h-16 rounded-full flex items-center justify-center transform rotate-12">
              <div className="text-center">
                <div className="text-xs font-bold">{t('hot')}</div>
                <div className="text-xs">{t('deal')}</div>
              </div>
            </div>
            <div className="absolute inset-0 rounded-full border-2 border-white transform rotate-12"></div>
          </div>
        </div>
      )}

      {/* Swiper */}
      <Swiper
        modules={[Navigation, Pagination, Autoplay]}
        className="custom-swiper"
        spaceBetween={30}
        slidesPerView={1}
        navigation
        pagination={{ clickable: true }}
        loop={true}
        autoplay={{
          delay: 3000,
          disableOnInteraction: false
        }}
      >
        {item.portfolio?.length > 0 ? item.portfolio?.map((img, idx) => {
          const imageUrl = getCompleteImageUrl(img.url)
          return (
            <SwiperSlide key={idx}>
              <div className="relative w-full h-40 md:h-56 lg:h-64">
                <Image
                  src={imageUrl}
                  alt={t('imageAlt', { index: idx + 1 })}
                  fill
                  style={{ objectFit: 'cover' }}
                  sizes="(max-width: 768px) 100vw, 400px"
                  priority={idx === 0}
                />
              </div>
            </SwiperSlide>
          )
        }) : [1,2,3].map((_, idx)=> <SwiperSlide key={idx}>
          <div className="relative w-full h-40 md:h-56 lg:h-64">
            <Image
              src={"/placeholder.png"}
              alt={t('placeholderAlt')}
              fill
              style={{ objectFit: 'cover' }}
              sizes="(max-width: 768px) 100vw, 400px"
            />
          </div>
        </SwiperSlide>)}
      </Swiper>

      {/* Content */}
      <div className="p-3 space-y-2">
        {/* Title and Rating */}
        <div className="flex justify-between items-center">
          <strong className="text-base md:text-lg">{item.title}</strong>
          <div className="flex gap-1 text-primary items-center text-sm">
            <span>{item.averageRating ?? t('unrated')}</span>
            <span>({item.ratingsCount ?? 0})</span>
          </div>
        </div>

        {/* Location, Category, Event Type */}
        <ul className="ml-4 list-disc text-sm text-secondary">
          {item.listingItem?.length > 0 && (
            <li className="truncate list-disc">
             {item.listingItem[0].__component === 'dynamic-blocks.vendor' && (
  <span>
    {item.listingItem[0].serviceArea?.length > 0 ? (
      (() => {
        const locations = item.listingItem[0].serviceArea
          .map(area => {
            const city = area?.city?.name ?? '';
            const state = area?.state?.name ?? '';
            return city || state ? `${city} ${state}`.trim() : '';
          })
          .filter(Boolean);

        return locations.length > 0 ? locations.join(', ') : t('noLocation');
      })()
    ) : (
      t('noLocation')
    )}
  </span>
)}

                { item.listingItem[0].__component === 'dynamic-blocks.venue' && 
              <span>
                {item.listingItem[0].location
                  ? item.listingItem[0].location.address : t('noVenueLocation')}
              </span>
              }
            </li>
          )}
          {item.category?.name && <li className="truncate">{item.category.name}</li>}
        </ul>

        {/* Pricing and Button */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 text-sm">
            {item.price ? (
              <>
                <span className="font-medium">{t('price')}</span>
                <span className="font-semibold text-primary">{siteSettings.currency ? siteSettings.currency.symbol : '$'}{item.price.toLocaleString()}</span>
              </>
            ) : (
              <span>{t('contactForPricing')}</span>
            )}
          </div>
          {user?.serviceType && user?.documentId && item?.user?.documentId === user.documentId ? (
            <Button
              style="secondary"
              size="small"
              onClick={() => router.push(`${getListingItemUrl() as string}/edit`)}
            >
              {t('edit')} <IoNavigateOutline />
            </Button>
          ) : (
            <Button style="secondary" size="small" onClick={() => router.push(getListingItemUrl() as string)}>
              {t('view')} <IoNavigateOutline />
            </Button>
          )}
        </div>
      </div>

      <LoginNavigateModal showModal={showLoginModal} setShowModal={setShowLoginModal} />
    </div>
  )
}

export default ListingCard