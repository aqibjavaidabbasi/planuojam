import React from "react";

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: boolean;
}

function Checkbox({ label, disabled = false, error = false, className, ...props }: CheckboxProps) {
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
      <span
        className={`ml-2 text-sm capitalize ${
          error ? 'text-red-500' : 'text-gray-600'
        }`}
      >
        {label}
      </span>
    </label>
  );
}

export default Checkbox;
