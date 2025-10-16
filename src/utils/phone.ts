import { isValidPhoneNumber, formatPhoneNumberIntl } from 'react-phone-number-input'

export function formatPhoneDisplay(phone?: string): string | undefined {
  if (!phone) return undefined
  try {
    if (isValidPhoneNumber(phone)) {
      return formatPhoneNumberIntl(phone)
    }
  } catch {}
  return undefined
}

export function getTelHref(phone?: string): string | undefined {
  if (!phone) return undefined
  try {
    if (isValidPhoneNumber(phone)) {
      // In most cases stored value is already E.164. Use directly.
      return `tel:${phone}`
    }
  } catch {}
  return undefined
}
