"use client";
import { Plans } from "@/types/pagesTypes";
import React from "react";
import { FaStar } from "react-icons/fa";
import Button from "../custom/Button";

function PricingPlans({
  plan,
  optionalAddons,
}: {
  plan: Plans;
  optionalAddons?: { statement: string; price: number }[];
}) {
  return (
    <div
      className={`p-4 rounded-lg shadow-sm border bg-white relative ${
        plan.isPopular ? "border-primary" : "border-border"
      }`}
    >
      {plan.isPopular && (
        <span className="absolute -top-3 -right-3 bg-gradient-to-r from-amber-500 to-pink-500 text-white text-xs font-bold w-10 h-10 rounded-full shadow-lg z-10 flex items-center justify-center">
          <FaStar size={28} />
        </span>
      )}

      <div className="flex flex-col items-center justify-center">
        <h3 className="text-xl font-semibold text-black">{plan.name}</h3>
        <p className="text-2xl text-primary font-semibold mb-4">
          ${plan.price.toLocaleString()}
        </p>
      </div>

      <ul className="pl-5 text-secondary mb-4">
        {plan.featuresList.map((feature, i) => (
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
            {feature.statement}
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-center">
        {plan.isPopular ? (
          <Button
            style="primary"
            extraStyles="!rounded-md bg-gradient-to-r from-amber-500 to-pink-500"
          >
            {plan.cta.bodyText}
          </Button>
        ) : (
          <Button style="secondary">{plan.cta.bodyText}</Button>
        )}
      </div>

      {optionalAddons && optionalAddons.length > 0 && (
        <ul className="list-disc pl-5 mt-2 text-secondary">
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
              {addon.statement} - ${addon.price.toLocaleString()}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default PricingPlans;
