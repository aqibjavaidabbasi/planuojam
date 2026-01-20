'use client'
import { ListingItem } from '@/types/pagesTypes'
import { getCompleteImageUrl } from '@/utils/helpers'
import Image from 'next/image'
import { useState, useRef } from 'react'
import { Autoplay, Navigation, Pagination } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Swiper as SwiperClass } from 'swiper/types'
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
import { useLocale, useTranslations } from 'next-intl'
import { RootState } from '@/store'
import { StripeProductAttributes } from '@/app/api/stripe-products/route'
import { IoMdSettings } from 'react-icons/io'
import { getHotDealInfo, getUpcomingHotDealMessage } from '@/utils/hotDealHelper';
import { getListingEditPath, getListingPath } from '@/utils/routes';

function ListingCard({ item, highPriority, stripeProducts }: { item: ListingItem; highPriority?: boolean; stripeProducts?: StripeProductAttributes[] }) {
  const { siteSettings } = useSiteSettings();
  const { user } = useAppSelector((state: RootState) => state.auth);
  const { items: likedListings } = useAppSelector((state: RootState) => state.likedListings);
  const dispatch = useAppDispatch();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showListingSubscriptionModal, setShowListingSubscriptionModal] = useState(false);
  const [heartLoading, setHeartLoading] = useState(false);
  const t = useTranslations('Dynamic.ListingCard');
  const locale = useLocale();
  const swiperRef = useRef<{ swiper: SwiperClass }>(null);

  const isLiked = Array.isArray(likedListings) && likedListings.some(listing => listing.listing === item.documentId);

  // Get hot deal information
  const hotDealInfo = getHotDealInfo(item.hotDeal);

  function handleHeartClick() {
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    const likedItem = isLiked
      ? (Array.isArray(likedListings)
        ? likedListings.find(listing => listing.listing === item.documentId)
        : undefined)
      : undefined;

    setHeartLoading(true);
    toast.promise(
      (isLiked
        ? dispatch(removeFromLikedListing(likedItem!.documentId))
        : dispatch(addToLikedListing(item.documentId))
      ).unwrap().finally(() => setHeartLoading(false)),
      {
        loading: isLiked ? t('toasts.removing') : t('toasts.adding'),
        success: isLiked ? t('toasts.removed') : t('toasts.added'),
        error: isLiked ? t('toasts.removeFailed') : t('toasts.addFailed')
      }
    );
  }

  // Paths derived from centralized helpers
  const viewPath = getListingPath(item.slug, locale);
  const editPath = getListingEditPath(item.slug, locale);

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
      {user?.documentId === item.user?.documentId && item.listingStatus === 'archived' && (
        <div className="absolute top-2 left-2 z-10">
          <span className="bg-yellow-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-md">
            {t('archived')}
          </span>
        </div>
      )}

      {/* Upcoming Hot Deal Banner */}
      {hotDealInfo.status === 'upcoming' && (
        <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-r from-orange-500 to-red-500 text-white text-center text-xs font-semibold py-1">
          {getUpcomingHotDealMessage(item.hotDeal, t)}
        </div>
      )}

      {/* Hot Deal Badge (only when currently active) */}
      {hotDealInfo.status === 'active' && (
        <div className="absolute top-0 left-0 right-0 z-10 bg-primary text-white h-fit flex items-center justify-center ">
          <div className="text-center py-2">
            <div className="text-sm font-bold">{t('hot')} {" "} {t('deal')}</div>
          </div>
        </div>
      )}

      {/* Combine images from portfolio and YouTube videos */}
      {((item.portfolio?.filter(media => !media.mime?.startsWith('video/')) || [])?.length > 0 || (item.videos?.length || 0) > 0) && (
        <Swiper
          ref={swiperRef}
          modules={[Navigation, Pagination, Autoplay]}
          className="custom-swiper"
          spaceBetween={30}
          slidesPerView={1}
          navigation
          pagination={{ clickable: true }}
          loop={true}
          autoplay={{ delay: 3000, disableOnInteraction: false }}
        >
          {/* Images from portfolio (filtered to exclude videos) */}
          {item.portfolio?.filter(media => !media.mime?.startsWith('video/')).map((media, idx) => {
            const mediaUrl = getCompleteImageUrl(media.url);

            return (
              <SwiperSlide key={`image-${idx}`}>
                <div className="relative w-full aspect-4/3 bg-black">
                  <Image
                    src={mediaUrl}
                    alt={t('imageAlt', { index: idx + 1 })}
                    fill
                    className='object-cover object-center'
                    sizes="(max-width: 768px) 100vw, 400px"
                    priority={idx === 0 && !!highPriority}
                    fetchPriority={idx === 0 && highPriority ? 'high' : 'auto'}
                    loading={idx === 0 && highPriority ? 'eager' : 'lazy'}
                  />
                </div>
              </SwiperSlide>
            );
          })}

          {/* YouTube videos */}
          {item.videos?.map((video, idx) => {
            // Extract YouTube video ID from URL
            const getYouTubeId = (url: string) => {
              const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
              const match = url.match(regExp);
              return (match && match[2].length === 11) ? match[2] : null;
            };

            const videoId = getYouTubeId(video.url);

            const handleVideoPlay = () => {
              // Pause Swiper when video starts playing
              if (swiperRef.current && swiperRef.current.swiper) {
                swiperRef.current.swiper.autoplay.stop();
              }
            };

            const handleVideoPause = () => {
              // Resume Swiper when video is paused
              if (swiperRef.current && swiperRef.current.swiper) {
                swiperRef.current.swiper.autoplay.start();
              }
            };

            return (
              <SwiperSlide key={`video-${idx}`}>
                <div className="relative w-full aspect-4/3 bg-black">
                  {videoId ? (
                    <iframe
                      width="100%"
                      height="100%"
                      src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1&origin=${window.location.origin}`}
                      title={t('videoThumbnail', { index: idx + 1 })}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full"
                      onLoad={(e) => {
                        const iframe = e.target as HTMLIFrameElement;

                        // Wait a bit for YouTube API to be ready
                        setTimeout(() => {
                          // Add event listeners for YouTube iframe API
                          iframe.contentWindow?.postMessage(
                            JSON.stringify({ event: 'listening', id: videoId }),
                            '*'
                          );

                        }, 1000);

                        const messageHandler = (event: MessageEvent) => {
                          try {
                            const data = JSON.parse(event.data);
                            if (data.id === videoId) {
                              // Handle infoDelivery events which contain playerState
                              if (data.event === 'infoDelivery' && data.info && data.info.playerState !== undefined) {
                                if (data.info.playerState === 1) { // Playing
                                  handleVideoPlay();
                                } else if (data.info.playerState === 2) { // Paused
                                  handleVideoPause();
                                }
                              }
                              // Also handle onStateChange events (if they ever come)
                              else if (data.event === 'onStateChange') {
                                if (data.info === 1) { // Playing
                                  handleVideoPlay();
                                } else if (data.info === 2) { // Paused
                                  handleVideoPause();
                                }
                              }
                            }
                          } catch {
                            // Ignore non-JSON messages
                          }
                        };

                        window.addEventListener('message', messageHandler);

                        // Cleanup on unmount
                        return () => {
                          window.removeEventListener('message', messageHandler);
                        };
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white">
                      <span>{t('invalidVideoUrl')}</span>
                    </div>
                  )}
                </div>
              </SwiperSlide>
            );
          })}
        </Swiper>
      )}
      {((item.portfolio?.filter(media => !media.mime?.startsWith('video/')) || [])?.length === 0 && (item.videos?.length || 0) === 0) && (
        <div className="relative w-full aspect-4/3">
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
          <div className="flex gap-1 text-primary items-center text-sm shrink-0">
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
              {heartLoading ? (
                <FaSpinner size={24} color="#c4a7a7" className="animate-spin" />
              ) : isLiked ? (
                <FaHeart
                  onClick={handleHeartClick}
                  size={24}
                  color="#e53e3e"
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                  title={isLiked ? t('removeFromFavorites') : t('addToFavorites')}
                />
              ) : (
                <FaHeart
                  onClick={handleHeartClick}
                  size={24}
                  color="#9ea2a7"
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                  title={isLiked ? t('removeFromFavorites') : t('addToFavorites')}
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
                    tooltip={t('subscriptionInfo')}
                  >
                    <FaInfoCircle size={16} />
                  </Button>
                  <a
                    href={editPath}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center capitalize justify-center gap-1.5 font-medium rounded-md bg-black text-white hover:bg-primary py-1 px-3 text-sm cursor-pointer"
                    title={t('editListing')}
                  >
                    <IoMdSettings size={16} />
                  </a>
                  <a
                    href={viewPath}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center capitalize justify-center gap-1.5 font-medium rounded-md bg-black text-white hover:bg-primary py-1 px-3 text-sm cursor-pointer"
                    title={t('viewListing')}
                  >
                    <IoNavigateOutline />
                  </a>
                </div>
              ) : (
                <a
                  href={viewPath}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center capitalize justify-center gap-1.5 font-medium rounded-md bg-black text-white hover:bg-primary py-1 px-3 text-sm cursor-pointer"
                >
                  {t('view')} <IoNavigateOutline />
                </a>
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