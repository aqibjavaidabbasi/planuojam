import React from "react";
import { Link } from "@/i18n/navigation";

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: React.ReactNode;
  error?: boolean;
  // Deprecated: prefer passing rich content via `label` instead of linking the entire text
  linkHref?: string;
  // Extra styling hooks for flexibility
  containerClassName?: string;
  labelClassName?: string; // applied to the text wrapper (span) or link when linkHref is used
  linkClassName?: string;  // additional classes for anchor when linkHref is provided
  // Control whether clicks on inner links should avoid toggling the checkbox
  stopToggleOnLinkClick?: boolean; // default true
}

function Checkbox({
  label,
  disabled = false,
  error = false,
  className,
  linkHref,
  containerClassName,
  labelClassName,
  linkClassName,
  stopToggleOnLinkClick = true,
  ...props
}: CheckboxProps) {
  return (
    <label
      className={`flex items-center ${disabled ? 'opacity-60 cursor-not-allowed' : ''} ${containerClassName || ''}`}
      onMouseDownCapture={(e) => {
        // Prevent label activation (which toggles the checkbox) when mousedown originates on a link
        if (!stopToggleOnLinkClick) return;
        const target = e.target as HTMLElement | null;
        if (target && target.closest('a')) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
      onClickCapture={(e) => {
        // If a link inside the label is clicked, avoid toggling the checkbox
        if (!stopToggleOnLinkClick) return;
        const target = e.target as HTMLElement | null;
        if (target && target.closest('a')) {
          e.stopPropagation();
        }
      }}
    >
      <input
        type="checkbox"
        className={`w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary ${className || ''}`}
        disabled={disabled}
        {...props}
      />
      {linkHref ? (
        // Backward compatibility: if linkHref is provided, render the label as a single link
        <Link
          href={linkHref}
          className={`ml-2 text-sm capitalize transition-colors ${
            error ? 'text-red-500' : 'text-gray-600'
          } hover:text-primary underline-offset-2 hover:underline ${linkClassName || labelClassName || ''}`}
          title={typeof label === 'string' ? label : undefined}
        >
          {label}
        </Link>
      ) : (
        <span
          className={`ml-2 text-sm capitalize ${
            error ? 'text-red-500' : 'text-gray-600'
          } ${labelClassName || ''}`}
        >
          {label}
        </span>
      )}
    </label>
  );
}

export default Checkbox;
