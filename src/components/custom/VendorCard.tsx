"use client";
import { Vendor } from "@/types/pagesTypes";
import type { SocialLink } from "@/types/pagesTypes";
import React from "react";
import { useTranslations } from "next-intl";
import { ExpandableText } from "./ExpandableText";
import SocialIcon from "@/components/global/SocialIcon";


interface VendorCardProps {
  item: Vendor;
  socialLink?: SocialLink[];
}

function VendorCard({ item, socialLink = [] }: VendorCardProps) {
  const t = useTranslations('Custom.VendorCard')
  const hasSocialLinks = socialLink.some((link) => link.visible !== false && link.link);
  return (
    <div>
      {(item.about || item.experienceYears || item.serviceArea || hasSocialLinks) && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-primary">{t('title')}</h3>
          {item.about && (
            <div className="text-secondary">
              <ExpandableText text={item.about || ""} maxChars={300} />
            </div>
          )}
          <p className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-secondary">
            <b>
              {t('experienceYears', {years: item.experienceYears || 0})}
            </b>
          </p>
          {item.serviceArea && (
            <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
              <p className="text-secondary">
                <b>
                  {t('serviceArea')}{" "}
                </b>
                {[
                  item.serviceArea.length > 0
                    ? item.serviceArea.map((s) => s?.state?.name).join(", ")
                    : null,
                  item.serviceArea.length > 0
                    ? item.serviceArea.map((c) => c?.city?.name).join(", ")
                    : null,
                ]
                  .filter(Boolean)
                  .join(", ") || t('notSpecified')}
              </p>
            </div>
          )}
          {hasSocialLinks && (
            <div className="border-t border-gray-100 pt-4">
              <SocialIcon socialLink={socialLink} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default VendorCard;
