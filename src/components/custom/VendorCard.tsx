"use client";
import { Vendor } from "@/types/pagesTypes";
import React from "react";
import { useTranslations } from "next-intl";



interface VendorCardProps {
  item: Vendor;
}

function VendorCard({ item }: VendorCardProps) {
  const t = useTranslations('Custom.VendorCard')
  return (
    <div>
      {(item.about || item.experienceYears || item.serviceArea) && (
        <React.Fragment>
          <h3 className="text-lg font-semibold text-primary">{t('title')}</h3>
          <p className="text-secondary">{item.about}</p>
          <p className="text-secondary">
            <b>
              {t('experienceYears', {years: item.experienceYears || 0})}
            </b>
          </p>
          {item.serviceArea && (
            <div>
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
        </React.Fragment>
      )}
    </div>
  );
}

export default VendorCard;
