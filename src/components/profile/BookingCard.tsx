"use client";

import React from "react";
import { FiCalendar } from "react-icons/fi";
import Button from "@/components/custom/Button";
import { useTranslations } from "next-intl";

export interface BookingCardProps {
  listingTitle: string;
  startDateTime: string;
  endDateTime: string;
  status: string;
  statusLabel: string;
  onViewDetails: () => void;
  onMessage?: () => void;
  userInfo?: {
    username: string;
    email: string;
  };
  actions?: React.ReactNode;
}

const BookingCard: React.FC<BookingCardProps> = ({
  listingTitle,
  startDateTime,
  endDateTime,
  status,
  statusLabel,
  onViewDetails,
  onMessage,
  userInfo,
  actions,
}) => {
  const t = useTranslations("Booking.MyBookings");

  const statusChip = (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${
        status === "confirmed"
          ? "bg-green-100 text-green-800"
          : status === "pending"
          ? "bg-yellow-100 text-yellow-800"
          : status === "cancelled"
          ? "bg-gray-100 text-gray-800"
          : status === "completed"
          ? "bg-blue-100 text-blue-800"
          : "bg-red-100 text-red-800"
      }`}
    >
      {statusLabel}
    </span>
  );

  return (
    <li className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 md:p-6 hover:shadow-xl transition-shadow duration-300">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 md:gap-0">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-3 break-words">
            {listingTitle || t("labels.listing", { default: "Listing" })}
          </h3>

          {userInfo && (
            <div className="text-sm text-gray-500 mb-3 break-words">
              {userInfo.username} •{" "}
              <a
                href={`mailto:${userInfo.email}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                {userInfo.email}
              </a>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <FiCalendar className="w-5 h-5 text-green-600" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-gray-500">{t("labels.start", { default: "Start" })}</p>
                <p className="font-medium text-gray-800 truncate">{startDateTime}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <FiCalendar className="w-5 h-5 text-red-600" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-gray-500">{t("labels.end", { default: "End" })}</p>
                <p className="font-medium text-gray-800 truncate">{endDateTime}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-shrink-0">{statusChip}</div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mt-4">
        <Button style="ghost" onClick={onViewDetails}>
          {t("actions.viewDetails", { default: "View Details" })}
        </Button>
        {onMessage && (
          <Button style="primary" extraStyles="!rounded-md" onClick={onMessage}>
            {t("actions.message", { default: "Message" })}
          </Button>
        )}
        {actions}
      </div>
    </li>
  );
};

export default BookingCard;
