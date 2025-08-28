// components/MultiSelect.tsx
"use client";

import { useState, useRef, useEffect } from "react";

interface Option {
  label: string;
  value: string;
}

interface MultiSelectProps {
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function MultiSelect({
  options,
  value,
  onChange,
  placeholder = "Select options...",
  disabled= false,
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  const removeOption = (optionValue: string) => {
    onChange(value.filter((v) => v !== optionValue));
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Input Box */}
      <div
        className="flex flex-wrap items-center gap-1 rounded-md border border-gray-300 bg-white px-2 py-1 cursor-pointer"
        onClick={() => setIsOpen((prev) => !prev)}
        style={{ pointerEvents: disabled ? 'none' : 'auto' }}
      >
        {value.length > 0 ? (
          value.map((val) => {
            const option = options.find((o) => o.value === val);
            return (
              <span
                key={val}
                className="flex items-center gap-1 rounded bg-blue-100 text-blue-700 px-2 py-0.5 text-sm"
              >
                {option?.label}
                <button
                  type="button"
                  className="ml-1 text-blue-500 hover:text-blue-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeOption(val);
                  }}
                  style={{ pointerEvents: disabled ? 'none' : 'auto' }}
                >
                  ×
                </button>
              </span>
            );
          })
        ) : (
          <span className="text-gray-400">{placeholder}</span>
        )}
        <span className="ml-auto text-gray-500">▾</span>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-gray-300 bg-white shadow-lg z-10"
          style={{ pointerEvents: disabled ? 'none' : 'auto' }}
        >
          {options.map((option) => (
            <div
              key={option.value}
              onClick={() => toggleOption(option.value)}
              className={`cursor-pointer px-3 py-2 text-sm hover:bg-blue-50 ${
                value.includes(option.value) ? "bg-blue-100 text-blue-700" : ""
              }`}
              style={{ pointerEvents: disabled ? 'none' : 'auto' }}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
