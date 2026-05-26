'use client'
import { ListingItem, SocialLink } from '@/types/pagesTypes'
import { getCompleteImageUrl } from '@/utils/helpers'
import Image from 'next/image'
import { useEffect, useState, useRef } from 'react'
import { Autoplay, Navigation, Pagination } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Swiper as SwiperClass } from 'swiper/types'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import { FaHeart, FaSpinner, FaInfoCircle, FaStar, FaRegImages } from 'react-icons/fa'
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
import { Link } from '@/i18n/navigation'

const LISTING_CARD_SOCIAL_LOGOS: Record<'facebook' | 'instagram', { src: string; label: string }> = {
  facebook: {
    src: '/social/facebook.svg',
    label: 'Facebook',
  },
  instagram: {
    src: '/social/instagram.svg',
    label: 'Instagram',
  },
};

function normalizeSocialHref(link: string) {
  return /^https?:\/\//i.test(link) ? link : `https://${link}`;
}

function ListingCardSocialLogos({ socialLinks }: { socialLinks: SocialLink[] }) {
  const visibleSocialLinks = socialLinks.filter((link) => {
    const platform = link.platform?.toLowerCase();
    return (
      link.visible !== false &&
      !!link.link &&
      (platform === 'facebook' || platform === 'instagram')
    );
  });

  if (!visibleSocialLinks.length) return null;

  return (
    <div className="inline-flex items-center gap-1.5">
      {visibleSocialLinks.map((link) => {
        const platform = link.platform.toLowerCase() as 'facebook' | 'instagram';
        const logo = LISTING_CARD_SOCIAL_LOGOS[platform];

        return (
          <a
            key={`${platform}-${link.id ?? link.link}`}
            href={normalizeSocialHref(link.link)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open ${logo.label}`}
            title={logo.label}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg shadow-md transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary/30"
            onClick={(event) => event.stopPropagation()}
          >
            <Image
              src={logo.src}
              alt=""
              width={32}
              height={32}
              className="rounded-lg"
            />
          </a>
        );
      })}
    </div>
  );
}

function ListingCard({ item, highPriority, stripeProducts }: { item: ListingItem; highPriority?: boolean; stripeProducts?: StripeProductAttributes[] }) {
  const { siteSettings } = useSiteSettings();
  const { user } = useAppSelector((state: RootState) => state.auth);
  const { items: likedListings } = useAppSelector((state: RootState) => state.likedListings);
  const dispatch = useAppDispatch();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showListingSubscriptionModal, setShowListingSubscriptionModal] = useState(false);
  const [heartLoading, setHeartLoading] = useState(false);
  const [openListingsInNewTab, setOpenListingsInNewTab] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const t = useTranslations('Dynamic.ListingCard');
  const locale = useLocale();
  const swiperRef = useRef<{ swiper: SwiperClass }>(null);
  const portfolioImages = item.portfolio?.filter(media => !media.mime?.startsWith('video/')) || [];
  const imageCount = portfolioImages.length;
  const cardSocialLinks = item.socialLinks?.socialLink || [];
  const hasCardSocialLinks = cardSocialLinks.some((link) => {
    const platform = link.platform?.toLowerCase();
    return link.visible !== false && !!link.link && (platform === 'facebook' || platform === 'instagram');
  });

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
  const listingLinkProps = openListingsInNewTab
    ? { target: "_blank", rel: "noopener noreferrer" }
    : {};

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const updateLinkTarget = () => setOpenListingsInNewTab(mediaQuery.matches);

    updateLinkTarget();
    mediaQuery.addEventListener("change", updateLinkTarget);

    return () => mediaQuery.removeEventListener("change", updateLinkTarget);
  }, []);

  return (
    <div
      className="rounded-lg bg-white relative w-full max-w-85 overflow-hidden border border-border"
      style={{
        boxShadow:
          '2px 0px 4px rgba(0,0,0,0.1), 0px 2px 4px rgba(0,0,0,0.1), 0px -2px 4px rgba(0,0,0,0.1), -2px 0px 4px rgba(0,0,0,0.1)'
      }}
    >

      {/* Upcoming Hot Deal Banner */}
      {hotDealInfo.status === 'upcoming' && (
        <div className="absolute top-0 left-0 right-0 z-10 bg-linear-to-r from-orange-500 to-red-500 text-white text-center text-xs font-semibold py-1">
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
      {(imageCount > 0 || (item.videos?.length || 0) > 0) && (
        <div className="relative">
          <Swiper
            ref={swiperRef}
            modules={[Navigation, Pagination, Autoplay]}
            className="custom-swiper"
            spaceBetween={30}
            slidesPerView={1}
            navigation
            pagination={{ clickable: true, dynamicBullets: true, dynamicMainBullets: 3 }}
            loop={true}
            autoplay={{ delay: 3000, disableOnInteraction: false }}
            onSlideChange={(swiper) => setActiveImageIndex(swiper.realIndex)}
          >
            {/* Images from portfolio (filtered to exclude videos) */}
            {portfolioImages.map((media, idx) => {
              const mediaUrl = getCompleteImageUrl(media.url);

              return (
                <SwiperSlide key={`image-${idx}`}>
                  <Link
                    href={viewPath}
                    {...listingLinkProps}
                    className="block"
                    title={item.title}
                  >
                    <div className="relative w-full aspect-4/3 bg-black">
                      <Image
                        src={mediaUrl}
                        alt={t('imageAlt', { index: idx + 1 })}
                        fill
                        className='object-cover object-center'
                        sizes="(max-width: 768px) 100vw, 340px"
                        priority={idx === 0 && !!highPriority}
                        fetchPriority={idx === 0 && highPriority ? 'high' : 'auto'}
                        loading={idx === 0 && highPriority ? 'eager' : 'lazy'}
                      />
                    </div>
                  </Link>
                </SwiperSlide>
              );
            })}

          {/* YouTube videos */}
          {
          // item.videos?.map((video, idx) => {
          //   // Extract YouTube video ID from URL
          //   const getYouTubeId = (url: string) => {
          //     const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
          //     const match = url.match(regExp);
          //     return (match && match[2].length === 11) ? match[2] : null;
          //   };

          //   const videoId = getYouTubeId(video.url);

          //   const handleVideoPlay = () => {
          //     // Pause Swiper when video starts playing
          //     if (swiperRef.current && swiperRef.current.swiper) {
          //       swiperRef.current.swiper.autoplay.stop();
          //     }
          //   };

          //   const handleVideoPause = () => {
          //     // Resume Swiper when video is paused
          //     if (swiperRef.current && swiperRef.current.swiper) {
          //       swiperRef.current.swiper.autoplay.start();
          //     }
          //   };

          //   return (
          //     <SwiperSlide key={`video-${idx}`}>
          //       <div className="relative w-full aspect-4/3 bg-black">
          //         {videoId ? (
          //           <iframe
          //             width="100%"
          //             height="100%"
          //             src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1&origin=${window.location.origin}`}
          //             title={t('videoThumbnail', { index: idx + 1 })}
          //             frameBorder="0"
          //             allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          //             allowFullScreen
          //             className="w-full h-full"
          //             onLoad={(e) => {
          //               const iframe = e.target as HTMLIFrameElement;

          //               // Wait a bit for YouTube API to be ready
          //               setTimeout(() => {
          //                 // Add event listeners for YouTube iframe API
          //                 iframe.contentWindow?.postMessage(
          //                   JSON.stringify({ event: 'listening', id: videoId }),
          //                   '*'
          //                 );

          //               }, 1000);

          //               const messageHandler = (event: MessageEvent) => {
          //                 try {
          //                   const data = JSON.parse(event.data);
          //                   if (data.id === videoId) {
          //                     // Handle infoDelivery events which contain playerState
          //                     if (data.event === 'infoDelivery' && data.info && data.info.playerState !== undefined) {
          //                       if (data.info.playerState === 1) { // Playing
          //                         handleVideoPlay();
          //                       } else if (data.info.playerState === 2) { // Paused
          //                         handleVideoPause();
          //                       }
          //                     }
          //                     // Also handle onStateChange events (if they ever come)
          //                     else if (data.event === 'onStateChange') {
          //                       if (data.info === 1) { // Playing
          //                         handleVideoPlay();
          //                       } else if (data.info === 2) { // Paused
          //                         handleVideoPause();
          //                       }
          //                     }
          //                   }
          //                 } catch {
          //                   // Ignore non-JSON messages
          //                 }
          //               };

          //               window.addEventListener('message', messageHandler);

          //               // Cleanup on unmount
          //               return () => {
          //                 window.removeEventListener('message', messageHandler);
          //               };
          //             }}
          //           />
          //         ) : (
          //           <div className="w-full h-full flex items-center justify-center text-white">
          //             <span>{t('invalidVideoUrl')}</span>
          //           </div>
          //         )}
          //       </div>
          //     </SwiperSlide>
          //   );
          // })
          }
          </Swiper>
          {(hasCardSocialLinks || imageCount > 1) && (
            <div className="pointer-events-none absolute inset-x-3 bottom-3 z-20 flex items-center justify-between gap-1.5">
              <div className="pointer-events-auto flex min-w-0 items-center">
                <ListingCardSocialLogos socialLinks={cardSocialLinks} />
              </div>
              {imageCount > 1 && (
                <div className="inline-flex items-center gap-1.5 rounded-full bg-black/65 px-2.5 py-1 text-xs font-semibold leading-none text-white shadow-md backdrop-blur-sm">
                  <FaRegImages size={13} aria-hidden="true" />
                  <span>{activeImageIndex + 1}/{imageCount}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="p-3 space-y-2 relative">
        {/* Status Badge - Only visible to owner */}
        {user?.documentId === item.user?.documentId && item.listingStatus === 'draft' && (
          <div className="absolute -top-8 left-2 z-10">
            <span className="bg-gray-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-md">
              {t('draft')}
            </span>
          </div>
        )}
        {user?.documentId === item.user?.documentId && item.listingStatus === 'archived' && (
          <div className="absolute -top-8 left-2 z-10">
            <span className="bg-yellow-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-md">
              {t('archived')}
            </span>
          </div>
        )}
        {/* Title and Rating */}
        <div className="flex justify-between items-start gap-2">
          <Link
            href={viewPath}
            {...listingLinkProps}
            className="min-w-0 flex-1"
            title={item.title}
          >
            <span className="flex min-w-0 items-center gap-1.5">
              <strong className="block truncate text-base md:text-lg hover:text-primary transition-colors">{item.title}</strong>
              {item.isPromoted && (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase leading-none text-primary">
                  <FaStar size={10} />
                  {/* {t('promoted')} */}
                </span>
              )}
            </span>
          </Link>
          <div className="flex gap-1 text-primary items-center text-sm shrink-0">
            <span>{item.averageRating ?? t('unrated')}</span>
            <span>({item.ratingsCount ?? 0})</span>
          </div>
        </div>

        {/* Location, Category, Event Type */}
        <div className="min-h-10 max-h-12 overflow-hidden">
          <ul className="space-y-1 text-sm text-secondary">
            {item.listingItem?.length > 0 && (
              <li className="flex items-start ml-3">
                <span className="block max-w-full truncate">
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
            {item.categories && item.categories.length > 0 && (
              <li className="flex items-start ml-3">
                <span className="block max-w-full truncate">{item.categories[0]?.name}</span>
              </li>
            )}
          </ul>
        </div>

        {/* Pricing and Button */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2 text-sm">
            {item.price ? (
              <>
                <span className="font-medium">{t('price')}</span>
                <span className="truncate font-semibold text-primary">{siteSettings.currency ? siteSettings.currency.symbol : '$'}{item.price.toLocaleString()}</span>
              </>
            ) : (
              <span className='text-xs'>{t('contactForPricing')}</span>
            )}
          </div>

          <div className="flex shrink-0 gap-2.5 items-center justify-center">
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
                  <Link
                    href={editPath}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center capitalize justify-center gap-1.5 font-medium rounded-md bg-black text-white hover:bg-primary py-1 px-3 text-sm cursor-pointer"
                    title={t('editListing')}
                  >
                    <IoMdSettings size={16} />
                  </Link>
                  <Link
                    href={viewPath}
                    {...listingLinkProps}
                    className="flex items-center capitalize justify-center gap-1.5 font-medium rounded-md bg-black text-white hover:bg-primary py-1 px-3 text-sm cursor-pointer"
                    title={t('viewListing')}
                  >
                    <IoNavigateOutline />
                  </Link>
                </div>
              ) : (
                <Link
                  href={viewPath}
                  {...listingLinkProps}
                  className="flex items-center capitalize justify-center gap-1.5 font-medium rounded-md bg-black text-white hover:bg-primary py-1 px-3 text-sm cursor-pointer"
                >
                  {t('view')} <IoNavigateOutline />
                </Link>
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
          listingSlug={item.slug}
        />
      }
    </div>
  );
}

export default ListingCard
