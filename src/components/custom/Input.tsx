import React, { InputHTMLAttributes } from "react";
import { FaEye } from "react-icons/fa";
import { VscEyeClosed } from "react-icons/vsc";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  type: string;
  label?: string;
  disabled?: boolean;
}

function Input({ label = "", type, disabled = false, ...props }: InputProps) {
  const [showPassword, setShowPassword] = React.useState(false);

  // Determine if this is a password field
  const isPassword = type === "password";

  // Generate a unique id for accessibility if not provided
  const inputId = React.useId();

  return (
    <div className="relative">
      {label !== "" && (
        <label
          htmlFor={inputId}
          className="block capitalize text-sm font-medium text-gray-700 mb-2 tracking-wider"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        type={isPassword ? (showPassword ? "text" : "password") : type}
        {...props}
        className={`w-full py-1.5 md:py-2.5 px-2.5 md:px-5 border border-border rounded-md text-base font-normal bg-white focus:outline-none focus:border-transparent transition-all duration-200 outline-none focus:ring-2 focus:ring-primary ${disabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-60' : ''} ${isPassword ? "pr-10" : ""}`}
        disabled={disabled}
      />
      {isPassword && (
        <button
          type="button"
          tabIndex={-1}
          className="absolute right-3 top-[55%] transform text-gray-500 hover:text-gray-700 focus:outline-none cursor-pointer"
          onClick={() => setShowPassword((prev) => !prev)}
          disabled={disabled}
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? <VscEyeClosed size={20} /> : <FaEye size={20} />}
        </button>
      )}
    </div>
  );
}

export default Input;
