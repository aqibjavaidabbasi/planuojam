import React, { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  type: string;
  label?: string;
}

function Input({ label = "", type, ...props }: InputProps) {
  return (
    <div>
      {label !== "" && (
        <label
          htmlFor="password"
          className="block capitalize text-sm font-medium text-gray-700 mb-2 tracking-wider"
        >
          {label}
        </label>
      )}
      <input
        type={type}
        {...props}
        className="w-full py-1.5 md:py-2.5 px-2.5 md:px-5 border border-border rounded-md text-base font-normal bg-white focus:outline-none focus:border-transparent transition-all duration-200 outline-none focus:ring-2 focus:ring-primary"
      />
    </div>
  );
}

export default Input;
