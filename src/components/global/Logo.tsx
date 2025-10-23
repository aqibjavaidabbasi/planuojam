"use client";
import Image from "next/image";
import React from "react";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { getCompleteImageUrl } from "@/utils/helpers";

type LogoVariant = "sm" | "md" | "lg";

type Props = {
  variant?: LogoVariant;
  className?: string;
  onClick?: () => void;
  alt?: string;
  priority?: boolean;
};

const sizeClasses: Record<LogoVariant, string> = {
  sm: "w-10 h-10",
  md: "w-10 h-10 md:w-[95px] md:h-[60px]",
  lg: "w-[140px] h-[80px]",
};

const sizeDims: Record<LogoVariant, { width: number; height: number }> = {
  sm: { width: 40, height: 40 },
  md: { width: 100, height: 100 },
  lg: { width: 160, height: 100 },
};

export default function Logo({
  variant = "md",
  className = "",
  onClick,
  alt = "Planuojam Logo",
  priority,
}: Props) {
  const { siteSettings } = useSiteSettings();
  const imageUrl = getCompleteImageUrl(siteSettings.siteLogo.url);

  const dims = sizeDims[variant];
  const classes = `${sizeClasses[variant]} object-contain cursor-pointer transition-opacity hover:opacity-90 ${className}`;

  return (
    <Image
      src={imageUrl}
      alt={alt}
      width={dims.width}
      height={dims.height}
      onClick={onClick}
      className={classes}
      priority={priority}
    />
  );
}
