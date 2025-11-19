"use client";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { Discount } from "@/types/pagesTypes";
import React, { useState } from "react";
import { MdOutlineEmail, MdOutlineLocalPhone } from "react-icons/md";
import Button from "../custom/Button";
import { useTranslations } from "next-intl";
import { useAppSelector } from "@/store/hooks";
import LoginNavigateModal from "@/components/modals/LoginNavigateModal";
import { useRouter } from "@/i18n/navigation";
import { RootState } from "@/store";
import { formatPhoneDisplay, getTelHref } from "@/utils/phone";

interface ListingDetailHeroProps {
  category: string;
  title: string;
  username: string;
  vendorUserId?: number;
  contact: {
    email: string;
    phone: string;
  };
  websiteLink: string;
  price: number | undefined;
  hotDeal: {
    enableHotDeal: boolean;
    startDate: string;
    lastDate: string;
    discount: Discount;
  };
  onOpenBooking: (defaultPlanIndex?: number | null) => void;
}

function ListingDetailHero({
  category,
  title,
  username,
  vendorUserId,
  contact,
  price,
  hotDeal,
  websiteLink,
  onOpenBooking,
}: ListingDetailHeroProps) {
  const { siteSettings } = useSiteSettings();
  const t = useTranslations('Listing.Hero');
  const user = useAppSelector((s: RootState) => s.auth.user);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const router = useRouter();
  const startDate = hotDeal && new Date(hotDeal.startDate);
  const lastDate = hotDeal && new Date(hotDeal.lastDate);
  const isDealActive =
    hotDeal &&
    hotDeal.enableHotDeal &&
    startDate &&
    lastDate &&
    new Date() >= startDate &&
    new Date() <= lastDate;

  return (
    <div className="rounded-2xl overflow-hidden mb-8 relative bg-gradient-to-r from-amber-500 to-pink-500">
      <div className="absolute inset-0 bg-black/20"></div>
      <div className="relative z-10 p-2.5 md:p-4 text-white">
        <div className="flex flex-col gap-2">
          {category && <div className="flex items-center mb-2">
            <span className="bg-white bg-opacity-20 text-black px-3 py-1 rounded-full text-sm font-medium">
              {category}
            </span>
          </div>}
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-2">{title}</h1>
          <div className="flex-1">
            <p className="text-base sm:text-lg text-white text-opacity-80 mb-3">
              {username}
            </p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            {contact?.email && <div className="flex items-center">
              <MdOutlineEmail className="mr-2" size={24} />
              <a
                href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(contact.email)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                {contact.email}
              </a>
            </div>}
            {(() => {
              const formatted = formatPhoneDisplay(contact?.phone)
              const telHref = getTelHref(contact?.phone)
              if (!formatted || !telHref) return null
              return (
                <div className="flex items-center">
                  <MdOutlineLocalPhone className="mr-2" size={24} />
                  <a href={telHref} rel="noopener noreferrer" className="hover:underline">{formatted}</a>
                </div>
              )
            })()}
          </div>
          <div className="flex gap-1.5 items-end justify-between">
            <div className="flex gap-2 flex-wrap">
              {/* Website Link */}
              {websiteLink && (
                <a
                  className="rounded-xl w-full px-6 py-2 text-center cursor-pointer transition-all duration-200 flex items-center justify-center bg-white/10 border border-white/30 hover:bg-white/30 backdrop-blur text-white"
                  href={/^https?:\/\//i.test(websiteLink) ? websiteLink : `https://${websiteLink}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('visitWebsite')}
                </a>
              )}

              {/* View Available Slots -> scroll to calendar */}
              <div
                className="rounded-xl w-full px-6 py-2 text-center cursor-pointer transition-all duration-200 flex items-center justify-center bg-white/10 border border-white/30 hover:bg-white/30 backdrop-blur"
                onClick={() => {
                  const el = document.getElementById('availability');
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
              >
                <span className="text-white">{t('viewAvailableSlots', { default: 'View available slots' })}</span>
              </div>

              {typeof vendorUserId === 'number' && user?.id !== vendorUserId && (
                <div
                  className="rounded-xl w-full px-6 py-2 text-center cursor-pointer transition-all duration-200 flex items-center justify-center bg-white/10 border border-white/30 hover:bg-white/30 backdrop-blur"
                  onClick={() => {
                    if (!user) {
                      setShowLoginModal(true);
                      return;
                    }
                    router.push(`/profile?tab=messages&withUser=${vendorUserId}`);
                  }}
                >
                  <span className="text-white">
                    {username
                      ? `${t('messageVendor', { default: `Message` })} ${username.split(' ')[0]}`
                      : t('sendMessage', { default: 'Send a message' })}
                  </span>
                </div>
              )}
            </div>
            {price && (
              <div
                className="rounded-xl p-4 flex gap-2 items-center justify-center flex-col"
                style={{
                  backdropFilter: "blur(10px)",
                  background: "rgba(255, 255, 255, 0.1)",
                }}
              >
                {/* hot deal badge if hot deal is active */}
                {isDealActive && (
                  <div className="bg-red-500 text-white text-xs px-2 py-1 rounded-full mb-2 inline-block">
                    {t('hotDealBadge')}
                  </div>
                )}

                {isDealActive &&
                  hotDeal.discount.discountType === "Flat Rate" && (
                    <div className="text-3xl font-bold mb-1">
                      {siteSettings.currency.symbol}
                      {hotDeal.discount.flatRatePrice}
                    </div>
                  )}

                <div
                  className={`text-base font-semibold opacity-80 ${isDealActive && "line-through"
                    } mb-2`}
                >
                  {siteSettings.currency.symbol}
                  {price}
                </div>

                {isDealActive &&
                  hotDeal.discount.discountType === "Percentage" && (
                    <div className="text-sm opacity-80 mb-4">
                      {t('percentageOffLimited', { percent: hotDeal.discount.percentage })}
                    </div>
                  )}

                <Button
                  style="secondary"
                  onClick={() => {
                    if (!user) setShowLoginModal(true);
                    else onOpenBooking(null);
                  }}
                >
                  {t('getTicketCta')}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <LoginNavigateModal showModal={showLoginModal} setShowModal={setShowLoginModal} />
    </div>
  );
}

export default ListingDetailHero;
