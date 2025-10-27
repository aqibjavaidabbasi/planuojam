"use client";
import React from "react";
import { useTranslations } from "next-intl";

type Props = {
  onClick: () => void | Promise<void>;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
};

export default function LoadMoreButton({ onClick, disabled, loading, className }: Props) {
  const t = useTranslations("Pagination");
  const isDisabled = !!disabled || !!loading;
  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={`px-4 py-2 rounded border inline-flex cursor-pointer hover:bg-gray-100 items-center gap-2 disabled:opacity-50 ${className || ""}`}
   >
      {loading && (
        <span className="inline-block h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" aria-hidden="true" />
      )}
      <span>{t("loadMore")}</span>
    </button>
  );
}
