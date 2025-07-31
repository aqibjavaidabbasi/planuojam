import React from 'react';
import { IoMdArrowDropdown } from 'react-icons/io';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string }[];
  placeholder?: string;
}

const Select: React.FC<SelectProps> = ({
  options,
  placeholder = 'Choose an option',
  className = '',
  value,
  defaultValue,
  ...props
}) => {
  const isControlled = value !== undefined;

  const selectProps: React.SelectHTMLAttributes<HTMLSelectElement> = {
    className: `w-full py-1.5 md:py-2.5 px-2.5 md:px-5 border border-border rounded-md text-base font-normal bg-white focus:outline-none focus:ring-2 focus:ring-primary appearance-none ${className}`,
    ...props,
  };

  if (isControlled) {
    selectProps.value = value;
  } else if (defaultValue !== undefined) {
    selectProps.defaultValue = defaultValue;
  }

  return (
    <div className='relative w-full'>
      <select {...selectProps}>
        {placeholder && (
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
      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
      <IoMdArrowDropdown />
      </div>
    </div>
  );
};

export default Select;
