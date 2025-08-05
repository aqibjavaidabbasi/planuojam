import React from "react";

interface CheckboxProps {
  label: string;
}

function Checkbox({ label }: CheckboxProps) {
  return (
    <label className="flex items-center">
      <input
        type="checkbox"
        className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
      />
      <span className="ml-2 text-sm capitalize text-gray-600">{label}</span>
    </label>
  );
}

export default Checkbox;
