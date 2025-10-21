'use client'
import React from 'react'
import BasePhoneInput from 'react-phone-number-input'
import 'react-phone-number-input/style.css'
import { isValidPhoneNumber } from 'react-phone-number-input'

// Minimal input used by react-phone-number-input via inputComponent.
// It renders a plain <input> with the same styling as our regular Input component.
const StyledInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function StyledInput(
  { className = '', disabled, required, ...props },
  ref
) {
  return (
    <input
      ref={ref}
      disabled={disabled}
      required={required}
      {...props}
      className={`w-full py-1.5 md:py-2.5 px-2.5 md:px-5 border border-border rounded-md text-base font-normal bg-white focus:outline-none focus:border-transparent transition-all duration-200 outline-none focus:ring-2 focus:ring-primary ${disabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-60' : ''} ${className}`}
    />
  )
})

export type PhoneInputFieldProps = Omit<React.ComponentProps<typeof BasePhoneInput>, 'inputComponent' | 'countrySelectProps' | 'labels'> & {
  label?: string
  required?: boolean
  error?: string
}

// Reusable phone input component with project-consistent styling.
const PhoneInputField: React.FC<PhoneInputFieldProps> = ({
  label = '',
  required = false,
  disabled = false,
  error,
  className = '',
  ...props
}) => {
  // Generate a unique id for accessibility if not provided
  const inputId = React.useId()

  return (
    <div className="w-full">
      {label !== '' && (
        <label htmlFor={inputId} className="block capitalize text-sm font-medium text-gray-700 mb-2 tracking-wider">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className={`relative ${disabled ? 'pointer-events-none' : ''}`}>
        {/** Only pass a valid E.164 value to the underlying input to prevent runtime errors */}
        {(() => {
          const { value: rawValue, onChange, ...rest } = props as { value?: string; onChange?: (v?: string) => void }
          const safeValue = typeof rawValue === 'string' && isValidPhoneNumber(rawValue) ? rawValue : undefined
          return (
            <BasePhoneInput
              id={inputId}
              disabled={disabled}
              international
              inputComponent={StyledInput as React.ComponentType<React.InputHTMLAttributes<HTMLInputElement>>}
              className={`flex items-center gap-2 ${className}`}
              countrySelectProps={{
                className:
                  'py-1.5 md:py-2.5 px-2.5 md:px-3 border border-border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-primary ' +
                  (disabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-60' : ''),
              }}
              value={safeValue}
              onChange={onChange as (value?: string) => void}
              {...rest}
            />
          )
        })()}
      </div>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  )
}

export default PhoneInputField
