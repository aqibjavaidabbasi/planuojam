import React from 'react';
import { IoMdArrowDropdown } from 'react-icons/io';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string }[];
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  label?: string;
}

const Select: React.FC<SelectProps> = ({
  options,
  placeholder = 'Choose an option',
  className = '',
  value,
  defaultValue,
  disabled = false,
  required = false,
  label = "",
  ...props
}) => {
  const isControlled = value !== undefined;
  const [isOpen, setIsOpen] = React.useState(false);

  // Compose className with disabled state styling
  const selectClassName = `
    w-full py-1.5 md:py-2.5 px-2.5 md:px-5 border border-border rounded-md text-base font-normal bg-white 
    focus:outline-none focus:ring-2 focus:ring-primary appearance-none
    ${disabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-60' : 'cursor-pointer'}
    ${className}
  `;

  const selectProps: React.SelectHTMLAttributes<HTMLSelectElement> = {
    className: selectClassName,
    disabled,
    ...props,
  };

  if (isControlled) {
    selectProps.value = value;
  } else if (defaultValue !== undefined) {
    selectProps.defaultValue = defaultValue;
  }

  return (
    <div className={`relative w-full ${disabled ? 'pointer-events-none' : ''}`}>
      {label !== "" && (
        <label
          htmlFor={selectProps.id}
          className="block capitalize text-sm font-medium text-gray-700 mb-2 tracking-wider"
        >
          {label}{required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative group" onClick={()=>setIsOpen(!isOpen)}>
        <select {...selectProps} id={selectProps.id}>
          {placeholder && placeholder !== 'Choose an option' && placeholder !== '' && (
            <option value="">
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option value={option.value} key={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div
          className={`
          pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 transform transition-transform duration-200
          ${isOpen ? 'rotate-180' : ''}
          ${disabled ? 'text-gray-400' : ''}
        `}
        >
          <IoMdArrowDropdown />
        </div>
      </div>
    </div>

  );
};

export default Select;
