import React from "react";

interface CheckboxProps {
  label: string;
  disabled?: boolean;
  error?: boolean;
  checked?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function Checkbox({ label, disabled = false, error = false , checked = false, onChange }: CheckboxProps) {
  return (
    <label
      className={`flex items-center ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
    >
      <input
        type="checkbox"
        className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
        disabled={disabled}
        checked={checked}
        onChange={onChange}
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
