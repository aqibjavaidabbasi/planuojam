"use client";
import { Plans } from "@/types/pagesTypes";
import React from "react";
import { FaStar } from "react-icons/fa";
import Button from "../custom/Button";
import { useTranslations } from "next-intl";
import { useSiteSettings } from "@/context/SiteSettingsContext";

function PricingPlans({
  plan,
  optionalAddons,
  onSelectPlan,
  planIndex,
}: {
  plan: Plans;
  optionalAddons?: { statement: string; price: number }[];
  onSelectPlan?: (index: number) => void;
  planIndex?: number;
}) {
  const t = useTranslations("Custom.PricingPlans");
  const { siteSettings } = useSiteSettings()
  return (
    <div
      className={`p-4 rounded-lg shadow-sm border bg-white relative ${plan?.isPopular ? "border-primary" : "border-border"
        }`}
    >
      {plan?.isPopular && (
        <span className="absolute -top-3 -right-3 bg-gradient-to-r from-amber-500 to-pink-500 text-white text-xs font-bold w-10 h-10 rounded-full shadow-lg z-10 flex items-center justify-center">
          <FaStar size={28} />
        </span>
      )}

      <div className="flex flex-col items-center justify-center">
        <h3 className="text-xl font-semibold text-black">{plan?.name}</h3>
        <p className="text-2xl text-primary font-semibold mb-4">
          {siteSettings.currency.symbol}{" "}{plan.price.toLocaleString()}
        </p>
      </div>

      {plan?.featuresList?.length ? (
        <>
          <h4 className="text-lg uppercase font-semibold text-secondary mb-2 text-left">
            {t("featuresHeading")}
          </h4>
          <ul className="text-secondary mb-4 space-y-1">
            {plan?.featuresList?.map((feature, i) => (
              <li key={i} className="flex items-center gap-2 mb-1">
                <span className="text-green-500">
                  {/* Check mark icon */}
                  <svg
                    width="16"
                    height="16"
                    fill="currentColor"
                    viewBox="0 0 16 16"
                  >
                    <path d="M13.485 3.929a1 1 0 0 1 0 1.414l-6.364 6.364a1 1 0 0 1-1.414 0l-2.121-2.121a1 1 0 1 1 1.414-1.414l1.414 1.414 5.657-5.657a1 1 0 0 1 1.414 0z" />
                  </svg>
                </span>
                {feature?.statement}
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="text-sm text-secondary mb-4 text-left">{t("noFeatures")}</p>
      )}

      {plan?.cta?.bodyText && <div className="w-full">
        {plan.isPopular ? (
          <Button
            style="primary"
            extraStyles="!rounded-md w-full bg-gradient-to-r from-amber-500 to-pink-500 hover:from-pink-500 hover:to-amber-500 !hover:bg-transparent transition-colors duration-200"
            onClick={() => typeof planIndex === 'number' && onSelectPlan?.(planIndex)}
          >
            {plan?.cta?.bodyText}
          </Button>
        ) : (
          <Button
            style="secondary"
            extraStyles="!w-full"
            onClick={() => typeof planIndex === 'number' && onSelectPlan?.(planIndex)}
          >
            {plan?.cta?.bodyText}
          </Button>
        )}
      </div>}

      {optionalAddons && optionalAddons.length > 0 && (
        <>
          <h4 className="text-lg uppercase font-semibold text-secondary my-2 text-left">
            {t("optionalAddonsHeading")}
          </h4>
          <ul className="flex flex-col items-start justify-start gap-2 mt-2 text-secondary w-full">
            {optionalAddons.map((addon, i) => (
              <li key={i} className="flex items-center gap-2 mb-1">
                <span className="text-green-500">
                  {/* Check mark icon */}
                  <svg
                    width="16"
                    height="16"
                    fill="currentColor"
                    viewBox="0 0 16 16"
                  >
                    <path d="M13.485 3.929a1 1 0 0 1 0 1.414l-6.364 6.364a1 1 0 0 1-1.414 0l-2.121-2.121a1 1 0 1 1 1.414-1.414l1.414 1.414 5.657-5.657a1 1 0 0 1 1.414 0z" />
                  </svg>
                </span>
                {addon?.statement} - {siteSettings.currency.symbol}{addon?.price?.toLocaleString()}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export default PricingPlans;
