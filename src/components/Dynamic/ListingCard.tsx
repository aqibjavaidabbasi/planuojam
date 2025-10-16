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
import Button from '../custom/Button'
import { IoNavigateOutline } from 'react-icons/io5'
import { useSiteSettings } from '@/context/SiteSettingsContext'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import LoginNavigateModal from '../modals/LoginNavigateModal'
import { addToLikedListing, removeFromLikedListing } from '@/store/thunks/likedListing'
import toast from 'react-hot-toast'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { registerPromotionClick } from '@/services/promotion'
import { RootState } from '@/store'

function ListingCard({ item, highPriority }: { item: ListingItem; highPriority?: boolean }) {
  const router = useRouter();
  const { siteSettings } = useSiteSettings();
  const { user } = useAppSelector((state: RootState) => state.auth);
  const { status, items: likedListings } = useAppSelector((state: RootState) => state.likedListings);
  const dispatch = useAppDispatch();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const t = useTranslations('Dynamic.ListingCard');

  const isLiked = Array.isArray(likedListings) && likedListings.some(listing => listing.listing.documentId === item.documentId);

  // Determine if hot deal is currently active
  const isHotDealActive = (() => {
    try {
      const hd = item.hotDeal;
      if (!hd || !hd.enableHotDeal) return false;
      const now = new Date();
      const start = new Date(hd.startDate);
      const end = new Date(hd.lastDate);
      return now >= start && now <= end;
    } catch {
      return false;
    }
  })();

  function handleHeartClick() {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
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
    );
  }

  function getListingItemUrl() {
    if (item.listingItem.length === 0) return '#';
    if (item.locale === 'en') return `/listing/${item.slug}`;
    if (item.locale !== 'en') {
      const entry = item.localizations.find(loc => loc.locale === 'en');
      return entry ? `/listing/${entry.slug}` : '#';
    }
  }

  return (
    <div
      className="rounded-lg bg-white relative w-full max-w-[300px] overflow-hidden border border-border"
      style={{
        boxShadow:
          '2px 0px 4px rgba(0,0,0,0.1), 0px 2px 4px rgba(0,0,0,0.1), 0px -2px 4px rgba(0,0,0,0.1), -2px 0px 4px rgba(0,0,0,0.1)'
      }}
    >

      {/* Hot Deal Badge (only when currently active) */}
      {isHotDealActive && (
        <div className="absolute top-1 md:top-4 right-1 md:right-4 z-10">
          <div className="relative">
            <div className="bg-primary text-white w-14 md:w-16 h-14 md:h-16 rounded-full flex items-center justify-center transform rotate-12">
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
        autoplay={{ delay: 3000, disableOnInteraction: false }}
      >
        {item.portfolio?.length > 0
          ? item.portfolio?.map((img, idx) => {
            const imageUrl = getCompleteImageUrl(img.url);
            return (
              <SwiperSlide key={idx}>
                <div className="relative w-full h-40 md:h-56 lg:h-64">
                  <Image
                    src={imageUrl}
                    alt={t('imageAlt', { index: idx + 1 })}
                    fill
                    style={{ objectFit: 'cover' }}
                    sizes="(max-width: 768px) 100vw, 400px"
                    priority={idx === 0 && !!highPriority}
                    fetchPriority={idx === 0 && highPriority ? 'high' : undefined}
                    loading={idx === 0 && highPriority ? 'eager' : undefined}
                  />
                </div>
              </SwiperSlide>
            );
          })
          : [1, 2, 3].map((_, idx) => (
            <SwiperSlide key={idx}>
              <div className="relative w-full h-40 md:h-56 lg:h-64">
                <Image
                  src={"/placeholder.png"}
                  alt={t('placeholderAlt')}
                  fill
                  style={{ objectFit: 'cover' }}
                  sizes="(max-width: 768px) 100vw, 400px"
                />
              </div>
            </SwiperSlide>
          ))}
      </Swiper>

      {/* Content */}
      <div className="p-3 space-y-2">
        {/* Title and Rating */}
        <div className="flex justify-between items-center gap-2">
          <strong className="text-base md:text-lg truncate max-w-[180px]">{item.title}</strong>
          <div className="flex gap-1 text-primary items-center text-sm flex-shrink-0">
            <span>{item.averageRating ?? t('unrated')}</span>
            <span>({item.ratingsCount ?? 0})</span>
          </div>
        </div>

        {/* Location, Category, Event Type */}
        <div className="min-h-[40px] max-h-[48px] overflow-hidden">
          <ul className="space-y-1 text-sm text-secondary">
            {item.listingItem?.length > 0 && (
              <li className="flex items-start ml-3">
                <span className="truncate block max-w-[210px]">
                  {item.listingItem[0].__component === 'dynamic-blocks.vendor' && (
                    <>
                      {item.listingItem[0].serviceArea?.length > 0
                        ? (() => {
                          const locations = item.listingItem[0].serviceArea
                            .map(area => {
                              const city = area?.city?.name ?? '';
                              const state = area?.state?.name ?? '';
                              return city || state ? `${city} ${state}`.trim() : '';
                            })
                            .filter(Boolean);
                          return locations.length > 0 ? locations.join(', ') : t('noLocation');
                        })()
                        : t('noLocation')
                      }
                    </>
                  )}

                  {item.listingItem[0].__component === 'dynamic-blocks.venue' && (
                    <>
                      {item.listingItem[0].location
                        ? item.listingItem[0].location.address
                        : t('noVenueLocation')}
                    </>
                  )}
                </span>
              </li>
            )}
            {item.category?.name && (
              <li className="flex items-start ml-3">
                <span className="truncate block max-w-[210px]">{item.category.name}</span>
              </li>
            )}
          </ul>
        </div>

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

          <div className="flex gap-2.5 items-center justify-center">
            {/* Heart icon */}
            <div className="">
              {status === 'loading' ? (
                <FaSpinner size={24} color="#c4a7a7" className="cursor-not-allowed" />
              ) : isLiked ? (
                <FaHeart onClick={handleHeartClick} size={24} color="#e53e3e" className="cursor-pointer" />
              ) : (
                <FaHeart onClick={handleHeartClick} size={24} color="#9ea2a7" className="cursor-pointer" />
              )}
            </div>
            <div>
              {user?.serviceType && user?.documentId && item?.user?.documentId === user.documentId ? (
                <Button style="secondary" size="small" onClick={() => router.push(`${getListingItemUrl() as string}/edit`)}>
                  {t('edit')} <IoNavigateOutline />
                </Button>
              ) : (
                <Button
                  style="secondary"
                  size="small"
                  onClick={async () => {
                    // Fire-and-forget promotion click registration; backend will no-op if no active promo
                    try { await registerPromotionClick(item.documentId, user?.id); } catch { }
                    router.push(getListingItemUrl() as string);
                  }}
                >
                  {t('view')} <IoNavigateOutline />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <LoginNavigateModal showModal={showLoginModal} setShowModal={setShowLoginModal} />
    </div>
  );
}

export default ListingCard