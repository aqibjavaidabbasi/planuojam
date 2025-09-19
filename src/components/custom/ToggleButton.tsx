// components/ToggleButton.tsx
"use client";

import { useEffect, useRef, useState } from "react";

interface ToggleButtonProps {
  onLabel?: string;
  offLabel?: string;
  defaultOn?: boolean;
  onToggle?: (state: boolean) => void;
  className?: string;
  disabled?: boolean;
}

const ToggleButton: React.FC<ToggleButtonProps> = ({
  onLabel = "On",
  offLabel = "Off",
  defaultOn = false,
  onToggle,
  className = "",
  disabled=false,
}) => {
  const [enabled, setEnabled] = useState(defaultOn);
  const onToggleRef = useRef<typeof onToggle>(onToggle);
  // keep latest callback
  useEffect(() => {
    onToggleRef.current = onToggle;
  }, [onToggle]);

  const toggle = () => {
    const next = !enabled;
    setEnabled(next);
    // Call parent handler in event handler context, after local state update is scheduled
    onToggleRef.current?.(next);
  };

  // Note: No effect to call onToggle on mount/update to avoid feedback loops

  // Keep internal state in sync if defaultOn prop changes
  useEffect(() => {
    if (defaultOn !== enabled) setEnabled(defaultOn);
  }, [defaultOn, enabled]);

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={disabled}
      className={`relative inline-flex items-center h-8 w-16 rounded-full transition-colors duration-300
        ${enabled ? "bg-[#cc922f]" : "bg-gray-300"} ${className}`}
    >
      <span
        className={`inline-block w-6 h-6 transform bg-white rounded-full shadow-md transition-transform duration-300
          ${enabled ? "translate-x-10" : "translate-x-0"}`}
      />
      <span className="absolute left-2 text-xs text-white font-medium select-none">
        {enabled ? onLabel : ""}
      </span>
      <span className="absolute right-2 text-xs text-gray-700 font-medium select-none">
        {!enabled ? offLabel : ""}
      </span>
    </button>
  );
};

export default ToggleButton;
