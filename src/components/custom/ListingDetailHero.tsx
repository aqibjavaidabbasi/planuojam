"use client";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { Discount } from "@/types/pagesTypes";
import React from "react";
import { MdOutlineEmail, MdOutlineLocalPhone } from "react-icons/md";
import Button from "../ui/Button";

interface ListingDetailHeroProps {
  category: string;
  title: string;
  username: string;
  contact: {
    email: string;
    phone: string;
    address: string;
  };
  websiteLink: string;
  price: number | undefined;
  hotDeal: {
    enableHotDeal: boolean;
    startDate: string;
    lastDate: string;
    discount: Discount;
  };
}

function ListingDetailHero({
  category,
  title,
  username,
  contact,
  price,
  hotDeal,
  websiteLink,
}: ListingDetailHeroProps) {
  const { siteSettings } = useSiteSettings();
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
      <div className="relative z-10 p-8 md:p-10 lg:p-12 text-white">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
          <div className="flex-1 mb-6 md:mb-0">
            <div className="flex items-center mb-4">
              <span className="bg-white bg-opacity-20 text-black px-3 py-1 rounded-full text-sm font-medium">
                {category}
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-2">{title}</h1>
            <p className="text-base sm:text-lg text-white text-opacity-80 mb-4">
              by {username}
            </p>
            <p className="text-base sm:text-xl text-white text-opacity-90 mb-6">
              {contact.address}
            </p>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center">
                <MdOutlineEmail className="mr-2" size={24} />
                <span>{contact.email}</span>
              </div>
              <div className="flex items-center">
                <MdOutlineLocalPhone className="mr-2" size={24} />
                <span>{contact.phone}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col justify-center">
            {price && (
              <div
                className="rounded-xl p-6 text-center"
                style={{
                  backdropFilter: "blur(10px)",
                  background: "rgba(255, 255, 255, 0.1)",
                }}
              >
                {/* hot deal badge if hot deal is active */}
                {isDealActive && (
                  <div className="bg-red-500 text-white text-xs px-2 py-1 rounded-full mb-2 inline-block">
                    HOT DEAL
                  </div>
                )}

                {isDealActive &&
                  hotDeal.discount.discountType === "Flat Rate" && (
                    <div className="text-3xl font-bold mb-1">€45</div>
                  )}

                <div
                  className={`text-base font-semibold opacity-80 ${
                    isDealActive && "line-through"
                  } mb-2`}
                >
                  {siteSettings.currency.symbol}
                  {price}
                </div>

                {isDealActive &&
                  hotDeal.discount.discountType === "Percentage" && (
                    <div className="text-sm opacity-80 mb-4">
                      30% OFF - Limited Time
                    </div>
                  )}

                <Button style="secondary">Get Your Ticket Now</Button>
              </div>
            )}
            {/* Website Link */}
            {websiteLink && (
              <div
                className="rounded-xl px-6 py-2 text-center mt-3 cursor-pointer transition-all duration-200"
                style={{
                  backdropFilter: "blur(10px)",
                  background: "rgba(255, 255, 255, 0.1)",
                  border: "1px solid rgba(255, 255, 255, 0.3)",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background =
                    "rgba(255, 255, 255, 0.3)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background =
                    "rgba(255, 255, 255, 0.1)")
                }
                onClick={() => window.open(websiteLink, "_blank")}
              >
                <span className="text-white">Visit Website</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ListingDetailHero;
