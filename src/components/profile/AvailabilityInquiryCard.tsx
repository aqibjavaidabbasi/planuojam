"use client";

import React from "react";
import { FiMail, FiPhone, FiMessageSquare, FiClock } from "react-icons/fi";
import { HiCheckCircle, HiXCircle, HiChatBubbleLeftRight } from "react-icons/hi2";
import Button from "@/components/custom/Button";
import { useTranslations } from "next-intl";

export interface InquiryCardProps {
  name: string;
  email?: string;
  phone?: string;
  message?: string;
  status: string;
  statusLabel: string;
  createdAt: string;
  listingDocumentId?: string;
  onUpdateStatus: (newStatus: "underDiscussion" | "completed" | "rejected") => void;
  isUpdating?: boolean;
}

const AvailabilityInquiryCard: React.FC<InquiryCardProps> = ({
  name,
  email,
  phone,
  message,
  status,
  statusLabel,
  createdAt,
  onUpdateStatus,
  isUpdating,
}) => {
  const t = useTranslations("Profile.AvailabilityInquiries");

  const statusChip = (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${
        status === "completed"
          ? "bg-green-100 text-green-800"
          : status === "underDiscussion"
          ? "bg-orange-100 text-orange-800"
          : status === "new"
          ? "bg-blue-100 text-blue-800"
          : "bg-red-100 text-red-800"
      }`}
    >
      {statusLabel}
    </span>
  );

  return (
    <li className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6 hover:shadow-md transition-shadow duration-300">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-800 break-words">
              {name}
            </h3>
            {statusChip}
          </div>

          <div className="space-y-2 mb-4">
            {email && (
              <div className="flex items-center text-sm text-gray-600">
                <FiMail className="mr-2 flex-shrink-0" />
                <a href={`mailto:${email}`} className="hover:underline truncate">{email}</a>
              </div>
            )}
            {phone && (
              <div className="flex items-center text-sm text-gray-600">
                <FiPhone className="mr-2 flex-shrink-0" />
                <a href={`tel:${phone}`} className="hover:underline">{phone}</a>
              </div>
            )}
            <div className="flex items-center text-sm text-gray-500">
              <FiClock className="mr-2 flex-shrink-0" />
              {new Date(createdAt).toLocaleString()}
            </div>
          </div>

          {message && (
            <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 border border-gray-100">
              <div className="flex items-start">
                <FiMessageSquare className="mt-1 mr-2 flex-shrink-0 text-gray-400" />
                <p className="whitespace-pre-wrap">{message}</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-row md:flex-col gap-2 flex-wrap">
          {status === "new" && (
            <Button 
              style="secondary" 
              size="small" 
              onClick={() => onUpdateStatus("underDiscussion")}
              disabled={isUpdating}
              tooltip={t("actions.markUnderDiscussion")}
            >
              <HiChatBubbleLeftRight className="mr-1" />
              {t("status.underDiscussion")}
            </Button>
          )}
          
          {(status === "new" || status === "underDiscussion") && (
            <>
              <Button 
                style="primary" 
                size="small" 
                onClick={() => onUpdateStatus("completed")}
                disabled={isUpdating}
                tooltip={t("actions.markCompleted")}
              >
                <HiCheckCircle className="mr-1" />
                {t("status.completed")}
              </Button>
              <Button 
                style="destructive" 
                size="small" 
                onClick={() => onUpdateStatus("rejected")}
                disabled={isUpdating}
                tooltip={t("actions.markRejected")}
              >
                <HiXCircle className="mr-1" />
                {t("status.rejected")}
              </Button>
            </>
          )}
        </div>
      </div>
    </li>
  );
};

export default AvailabilityInquiryCard;
