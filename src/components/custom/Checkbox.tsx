import React from "react";
import { Link } from "@/i18n/navigation";

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: boolean;
  // When provided, the label will be rendered as a link with a hover effect
  linkHref?: string;
}

function Checkbox({ label, disabled = false, error = false, className, linkHref, ...props }: CheckboxProps) {
  return (
    <label
      className={`flex items-center ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
    >
      <input
        type="checkbox"
        className={`w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary ${className || ''}`}
        disabled={disabled}
        {...props}
      />
      {linkHref ? (
        <Link
          href={linkHref}
          className={`ml-2 text-sm capitalize transition-colors ${
            error ? 'text-red-500' : 'text-gray-600'
          } hover:text-primary underline-offset-2 hover:underline`}
          title={label}
          onClick={(e) => {
            // Prevent toggling checkbox when clicking the link
            e.stopPropagation();
          }}
          onMouseDown={(e) => {
            // Prevent label default activation behavior from toggling the checkbox
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          {label}
        </Link>
      ) : (
        <span
          className={`ml-2 text-sm capitalize ${
            error ? 'text-red-500' : 'text-gray-600'
          }`}
        >
          {label}
        </span>
      )}
    </label>
  );
}

export default Checkbox;
