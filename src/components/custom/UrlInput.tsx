"use client"

import React, { forwardRef, useState, useEffect } from "react"
import { useTranslations } from "next-intl"

interface UrlInputProps {
  label?: string
  placeholder?: string
  disabled?: boolean
  required?: boolean
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  error?: string
  helperText?: string
  showNormalizedUrl?: boolean
  allowedProtocols?: string[]
  name?: string
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void
  className?: string
}

// Dangerous protocols that should be blocked
const DANGEROUS_PROTOCOLS = [
  'javascript:',
  'data:',
  'vbscript:',
  'file:',
  'about:',
  'blob:',
]

// Normalize URL - add https:// if no protocol is present
function normalizeUrl(url: string): string {
  if (!url) return ''
  
  const trimmed = url.trim()
  
  // Check if it already has a protocol
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed
  }
  
  // Add https:// prefix
  return `https://${trimmed}`
}

// Check if URL contains malicious patterns
function isSafeUrl(url: string): boolean {
  if (!url) return true
  
  const lower = url.toLowerCase().trim()
  
  // Check for dangerous protocols
  for (const protocol of DANGEROUS_PROTOCOLS) {
    if (lower.startsWith(protocol)) {
      return false
    }
  }
  
  // Check for common XSS patterns
  const xssPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i, // onclick=, onerror=, etc.
    /%3Cscript/i, // URL encoded <script
  ]
  
  for (const pattern of xssPatterns) {
    if (pattern.test(url)) {
      return false
    }
  }
  
  return true
}

// Validate URL format
function validateUrl(url: string, allowedProtocols: string[] = ['http', 'https']): {
  isValid: boolean
  errorKey?: string
  normalizedUrl?: string
} {
  if (!url || url.trim() === '') {
    return { isValid: true, normalizedUrl: '' }
  }

  const trimmed = url.trim()

  // Check for malicious patterns first
  if (!isSafeUrl(trimmed)) {
    return {
      isValid: false,
      errorKey: 'maliciousUrl',
    }
  }

  // Normalize the URL
  const normalized = normalizeUrl(trimmed)

  // Extract protocol
  const protocolMatch = normalized.match(/^(\w+):\/\//)
  if (protocolMatch) {
    const protocol = protocolMatch[1].toLowerCase()
    if (!allowedProtocols.includes(protocol)) {
      return {
        isValid: false,
        errorKey: 'invalidProtocol',
      }
    }
  }

  // Validate domain format
  // Remove protocol for validation
  const withoutProtocol = normalized.replace(/^https?:\/\//, '')
  
  // Basic domain validation: should have at least one dot and valid characters
  const domainPattern = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*(\.[a-zA-Z]{2,})(\/[^\s]*)?$/
  
  if (!domainPattern.test(withoutProtocol)) {
    return {
      isValid: false,
      errorKey: 'invalidFormat',
    }
  }

  return {
    isValid: true,
    normalizedUrl: normalized,
  }
}

const UrlInput = forwardRef<HTMLInputElement, UrlInputProps>(
  (
    {
      label,
      placeholder = "https://jusu-tinklalapis.lt",
      disabled = false,
      required = false,
      value = '',
      onChange,
      error,
      helperText,
      showNormalizedUrl = true,
      allowedProtocols = ['http', 'https'],
      name,
      onBlur,
      className = '',
    },
    ref
  ) => {
    const t = useTranslations('UrlInput')
    const [internalValue, setInternalValue] = useState(value)
    const [validationErrorKey, setValidationErrorKey] = useState<string | undefined>()
    const [normalizedUrl, setNormalizedUrl] = useState<string>('')

    // Update internal value when prop changes
    useEffect(() => {
      setInternalValue(value)
    }, [value])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value
      setInternalValue(newValue)

      // Validate on change
      const validation = validateUrl(newValue, allowedProtocols)
      
      if (!validation.isValid) {
        setValidationErrorKey(validation.errorKey)
        setNormalizedUrl('')
      } else {
        setValidationErrorKey(undefined)
        setNormalizedUrl(validation.normalizedUrl || '')
      }

      // Call parent onChange
      if (onChange) {
        onChange(e)
      }
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      // Validate on blur
      const validation = validateUrl(internalValue, allowedProtocols)
      
      if (!validation.isValid) {
        setValidationErrorKey(validation.errorKey)
      } else {
        setValidationErrorKey(undefined)
      }

      if (onBlur) {
        onBlur(e)
      }
    }

    // Get translated error message
    const errorMessage = error || (validationErrorKey ? t(`errors.${validationErrorKey}`) : undefined)

    return (
      <div className={`flex flex-col gap-1 ${className}`}>
        {label && (
          <label className="text-sm font-medium text-gray-700">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        
        <input
          ref={ref}
          type="text"
          name={name}
          value={internalValue}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`
            w-full px-3 py-2 border rounded-md
            focus:outline-none focus:ring-2 focus:ring-blue-500
            disabled:bg-gray-100 disabled:cursor-not-allowed
            ${errorMessage ? 'border-red-500' : 'border-gray-300'}
          `}
        />

        {/* Show normalized URL preview */}
        {showNormalizedUrl && normalizedUrl && !errorMessage && internalValue && (
          <p className="text-xs text-blue-600">
            {t('willBeSavedAs')}: {normalizedUrl}
          </p>
        )}

        {/* Show validation error */}
        {errorMessage && (
          <p className="text-xs text-red-500">{errorMessage}</p>
        )}

        {/* Show helper text */}
        {helperText && !errorMessage && (
          <p className="text-xs text-gray-500">{helperText}</p>
        )}
      </div>
    )
  }
)

UrlInput.displayName = 'UrlInput'

export default UrlInput
export { validateUrl, normalizeUrl, isSafeUrl }
