import React from 'react';

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
    className: `w-full py-2 md:py-3.5 px-3 md:px-7 border custom-border-color rounded-md text-base font-normal bg-white focus:outline-none focus:ring-2 focus:ring-primary ${className}`,
    ...props,
  };

  if (isControlled) {
    selectProps.value = value;
  } else if (defaultValue !== undefined) {
    selectProps.defaultValue = defaultValue;
  }

  return (
    <select {...selectProps}>
      {!isControlled && placeholder && (
        <option value="" disabled hidden>
          {placeholder}
        </option>
      )}
      {options.map((option) => (
        <option value={option.value} key={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};

export default Select;
