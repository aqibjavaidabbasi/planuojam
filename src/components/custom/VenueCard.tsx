"use client";
import React from "react";
import { useTranslations } from "next-intl";
import SocialIcon from "@/components/global/SocialIcon";
import type { SocialLink } from "@/types/pagesTypes";

type Amenity = {
  text: string;
};

type MaybePlace = string | { name?: string } | null | undefined;
type Location = {
  address?: string;
  city?: MaybePlace;
  country?: MaybePlace;
};

type VenueItem = {
  amneties?: Amenity[];
  capacity?: number;
  location?: Location;
};

type VenueCardProps = {
  item: VenueItem;
  socialLink?: SocialLink[];
};

function VenueCard({ item, socialLink = [] }: VenueCardProps) {
  const t = useTranslations('Custom.VenueCard')
  const hasSocialLinks = socialLink.some((link) => link.visible !== false && link.link);
  const getName = (val: MaybePlace): string => {
    if (!val) return "";
    if (typeof val === "string") return val;
    if (typeof val === "object" && val && "name" in val) return String(val.name || "");
    return "";
  }
  return (
    <div>
      {(item.amneties && item.amneties.length > 0) ||
        item.capacity ||
        (item.location && item.location.address) ||
        hasSocialLinks ? (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-primary">{t('title')}</h3>
          {item.amneties && item.amneties.length > 0 && (
            <ul className="space-y-1.5 text-secondary">
              {item.amneties.map((amenity, i) => (
                <li key={i} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/70" />
                  <span>{amenity.text}</span>
                </li>
              ))}
            </ul>
          )}
          {item.capacity && (
            <p className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-secondary font-medium">{t('capacity', {count: item.capacity})}</p>
          )}
          {item.location && (
            <p className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-secondary">
              <b>
                {t('location')}: {" "} 
              </b>
              {item.location.address}{item.location?.city ? ", " : ""}{getName(item.location?.city)}{" "}
              {getName(item.location?.country)}
            </p>
          )}
          {hasSocialLinks && (
            <div className="border-t border-gray-100 pt-4">
              <SocialIcon socialLink={socialLink} />
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

export default VenueCard;
