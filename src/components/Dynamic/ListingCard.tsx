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
import { FaHeart, FaSpinner, FaInfoCircle } from 'react-icons/fa'
import Button from '../custom/Button'
import { IoNavigateOutline } from 'react-icons/io5'
import { useSiteSettings } from '@/context/SiteSettingsContext'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import LoginNavigateModal from '../modals/LoginNavigateModal'
import SubscriptionManagementModal from '../modals/SubscriptionManagementModal'
import ListingSubscriptionModal from '../modals/ListingSubscriptionModal'
import { addToLikedListing, removeFromLikedListing } from '@/store/thunks/likedListing'
import toast from 'react-hot-toast'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { RootState } from '@/store'
import { StripeProductAttributes } from '@/app/api/stripe-products/route'
import { IoMdSettings } from 'react-icons/io'

function ListingCard({ item, highPriority, stripeProducts }: { item: ListingItem; highPriority?: boolean; stripeProducts?: StripeProductAttributes[] }) {
  const router = useRouter();
  const { siteSettings } = useSiteSettings();
  const { user } = useAppSelector((state: RootState) => state.auth);
  const { status, items: likedListings } = useAppSelector((state: RootState) => state.likedListings);
  const dispatch = useAppDispatch();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showListingSubscriptionModal, setShowListingSubscriptionModal] = useState(false);
  const t = useTranslations('Dynamic.ListingCard');

  const isLiked = Array.isArray(likedListings) && likedListings.some(listing => listing.listing?.documentId === item.documentId);

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
        ? likedListings.find(listing => listing.listing?.documentId === item.documentId)
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
      {/* Status Badge - Only visible to owner */}
      {user?.documentId === item.user?.documentId && item.listingStatus === 'draft' && (
        <div className="absolute top-2 left-2 z-10">
          <span className="bg-gray-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-md">
            {t('draft')}
          </span>
        </div>
      )}
      {user?.documentId === item.user?.documentId && item.listingStatus === 'pending review' && (
        <div className="absolute top-2 left-2 z-10">
          <span className="bg-yellow-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-md">
            {t('pending')}
          </span>
        </div>
      )}

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

      {item.portfolio?.length > 0 && (
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
          {item.portfolio?.map((img, idx) => {
            const imageUrl = getCompleteImageUrl(img.url);
            return (
              <SwiperSlide key={idx}>
                <div className="relative w-full aspect-[4/3] bg-black">
                  <Image
                    src={imageUrl}
                    alt={t('imageAlt', { index: idx + 1 })}
                    fill
                    className='object-cover obejct-center'
                    sizes="(max-width: 768px) 100vw, 400px"
                    priority={idx === 0 && !!highPriority}
                    fetchPriority={idx === 0 && highPriority ? 'high' : undefined}
                    loading={idx === 0 && highPriority ? 'eager' : undefined}
                  />
                </div>
              </SwiperSlide>
            );
          })}
        </Swiper>
      )}
      {item.portfolio?.length === 0 && (
        <div className="relative w-full aspect-[4/3]">
          <Image
            src={"/noImage.jpg"}
            alt={t('placeholderAlt')}
            fill
            style={{ objectFit: 'cover', objectPosition: 'center' }}
            sizes="(max-width: 768px) 100vw, 400px"
          />
        </div>)}

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
                <FaSpinner size={24} color="#c4a7a7" className="animate-spin" />
              ) : isLiked ? (
                <FaHeart
                  onClick={handleHeartClick}
                  size={24}
                  color="#e53e3e"
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                />
              ) : (
                <FaHeart
                  onClick={handleHeartClick}
                  size={24}
                  color="#9ea2a7"
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                />
              )}
            </div>
            <div>
              {user?.serviceType && user?.documentId && item?.user?.documentId === user.documentId ? (
                <div className='flex items-center justify-center gap-2.5'>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowSubscriptionModal(true);
                    }}
                    style="primary"
                    size="small"
                    extraStyles='!rounded-md'
                  >
                    <FaInfoCircle size={16} />
                  </Button>
                  <Button style="secondary" size="small" onClick={() => router.push(`${getListingItemUrl() as string}/edit`)} >
                    <IoMdSettings size={16} />
                  </Button>
                </div>
              ) : (
                <Button
                  style="secondary"
                  size="small"
                  onClick={async () => {
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

      <SubscriptionManagementModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        listingDocId={item.documentId}
        userId={user?.documentId || ''}
        onOpenSubscriptionModal={() => setShowListingSubscriptionModal(true)}
      />

      {stripeProducts && user?.serviceType && item.listingStatus !== 'pending review' &&
        <ListingSubscriptionModal
          isOpen={showListingSubscriptionModal}
          onClose={() => setShowListingSubscriptionModal(false)}
          listingDocId={item.documentId}
          listingTitle={item.title}
          listingPrice={item.price}
          userId={user?.documentId || ''}
          stripeProducts={stripeProducts}
        />
      }
    </div>
  );
}

export default ListingCard