"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Button from "./Button";

interface ExpandableTextProps {
  text: string;
  maxChars?: number;
}

export function ExpandableText({ text, maxChars = 500 }: ExpandableTextProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const t = useTranslations("Common");

  if (!text) return null;

  const shouldTruncate = text.length > maxChars;
  const displayText = isExpanded ? text : text.slice(0, maxChars).trim();

  return (
    <div className="flex flex-col">
      <div className="whitespace-pre-wrap text-muted-foreground leading-relaxed transition-all duration-300">
        {displayText}
        {!isExpanded && shouldTruncate && "..."}
      </div>
      {shouldTruncate && (
        <Button
          style="link"
          onClick={() => setIsExpanded(!isExpanded)}
          extraStyles="p-0 h-auto font-semibold text-primary hover:text-primary/90 mt-2 self-start"
        >
          {isExpanded ? t("readLess") : t("readMore")}
        </Button>
      )}
    </div>
  );
}
