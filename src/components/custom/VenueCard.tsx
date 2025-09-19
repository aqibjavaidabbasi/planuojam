"use client";
import React from "react";
import { useTranslations } from "next-intl";

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
};

function VenueCard({ item }: VenueCardProps) {
  const t = useTranslations('Custom.VenueCard')
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
        (item.location && item.location.address) ? (
        <div>
          <h3 className="text-lg font-semibold text-primary">{t('title')}</h3>
          {item.amneties && (
            <ul className="list-disc pl-5 text-secondary">
              {item.amneties.map((amenity, i) => (
                <li key={i}>{amenity.text}</li>
              ))}
            </ul>
          )}
          {item.capacity && (
            <p className="text-secondary">{t('capacity', {count: item.capacity})}</p>
          )}
          {item.location && (
            <p className="text-secondary">
              {t('location')}: {item.location.address}{item.location?.city ? ", " : ""}{getName(item.location?.city)}{" "}
              {getName(item.location?.country)}
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}

export default VenueCard;
