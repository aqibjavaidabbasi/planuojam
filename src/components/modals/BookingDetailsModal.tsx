"use client";

import React from "react";
import Modal from "@/components/custom/Modal";
import Button from "@/components/custom/Button";
import { useTranslations } from "next-intl";

export type BookingDetails = {
  bookingStatus?: string;
  startDateTime?: string;
  endDateTime?: string;
  selectedPlan?: {
    name?: string;
    price?: number;
    features?: { statement: string }[];
  } | null;
  selectedAddons?: { statement: string; price?: number }[] | null;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  booking: BookingDetails;
};

const BookingDetailsModal: React.FC<Props> = ({ isOpen, onClose, booking }) => {
  const t = useTranslations("Booking.DetailsModal");

  const features = booking.selectedPlan?.features || [];
  const addons = booking.selectedAddons || [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={<span className="pr-8">{t("title")}</span>}
      footer={
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button style="primary" onClick={onClose}>{t("actions.close")}</Button>
        </div>
      }
    >
      <div className="space-y-4 py-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-gray-500">{t("labels.status")}</div>
            <div className="font-medium text-gray-800">{booking.bookingStatus}</div>
          </div>
          <div>
            <div className="text-gray-500">{t("labels.start")}</div>
            <div className="font-medium text-gray-800">{booking.startDateTime ? new Date(booking.startDateTime).toLocaleString() : ""}</div>
          </div>
          <div>
            <div className="text-gray-500">{t("labels.end")}</div>
            <div className="font-medium text-gray-800">{booking.endDateTime ? new Date(booking.endDateTime).toLocaleString() : ""}</div>
          </div>
          <div>
            <div className="text-gray-500">{t("labels.plan")}</div>
            <div className="font-medium text-gray-800">{booking.selectedPlan?.name || t("labels.none")}</div>
            {booking.selectedPlan?.price !== undefined && (
              <div className="text-gray-700">{t("labels.price")}: {booking.selectedPlan?.price}</div>
            )}
          </div>
        </div>

        <div>
          <div className="text-gray-500 text-sm mb-1">{t("labels.features")}</div>
          {features.length > 0 ? (
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-800">
              {features.map((f, i) => (
                <li key={i}>{f.statement}</li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-gray-600">{t("labels.none")}</div>
          )}
        </div>

        <div>
          <div className="text-gray-500 text-sm mb-1">{t("labels.addons")}</div>
          {addons.length > 0 ? (
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-800">
              {addons.map((a, i) => (
                <li key={i}>
                  {a.statement}
                  {typeof a.price !== "undefined" && ` — ${a.price}`}
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-gray-600">{t("labels.none")}</div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default BookingDetailsModal;
