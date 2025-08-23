/**
 * Utility functions for formatting data consistently across the application
 */

interface ProviderUser {
  firstName: string
  lastName: string
}

interface Provider {
  user: ProviderUser
  specialty?: string
  title?: string
}

/**
 * Formats a provider's name with proper title prefix
 * @param provider - Provider object with user information
 * @param includeTitle - Whether to include title (Dr., NP, etc.)
 * @returns Formatted provider name
 */
export function formatProviderName(provider: Provider, includeTitle = true): string {
  if (!provider?.user) {
    return 'Unknown Provider'
  }

  const { firstName, lastName } = provider.user
  const fullName = `${firstName} ${lastName}`

  if (!includeTitle) {
    return fullName
  }

  // Check if the provider has a specific title
  if (provider.title) {
    // If title already exists in firstName, don't duplicate
    if (firstName.toLowerCase().includes(provider.title.toLowerCase())) {
      return fullName
    }
    return `${provider.title} ${fullName}`
  }

  // Default to "Dr." for medical providers if no specific title
  // Check if "Dr." is already in the firstName to avoid duplication
  if (firstName.toLowerCase().includes('dr.') || firstName.toLowerCase().startsWith('doctor')) {
    return fullName
  }

  return `Dr. ${fullName}`
}

/**
 * Formats a simple provider name from firstName and lastName
 * @param firstName - Provider's first name
 * @param lastName - Provider's last name
 * @param title - Optional title (Dr., NP, etc.)
 * @returns Formatted provider name
 */
export function formatSimpleProviderName(
  firstName: string, 
  lastName: string, 
  title?: string
): string {
  if (!firstName || !lastName) {
    return 'Unknown Provider'
  }

  const fullName = `${firstName} ${lastName}`

  if (title) {
    // Check if title is already in firstName
    if (firstName.toLowerCase().includes(title.toLowerCase())) {
      return fullName
    }
    return `${title} ${fullName}`
  }

  // Check if "Dr." is already in the firstName
  if (firstName.toLowerCase().includes('dr.') || firstName.toLowerCase().startsWith('doctor')) {
    return fullName
  }

  return `Dr. ${fullName}`
}

/**
 * Formats currency values consistently
 * @param amount - Amount to format
 * @param currency - Currency code (default: USD)
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Formats date consistently across the application
 * @param date - Date to format
 * @param includeTime - Whether to include time
 * @returns Formatted date string
 */
export function formatDate(date: Date | string, includeTime = false): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  if (includeTime) {
    return dateObj.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }
  
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Formats time consistently
 * @param date - Date object or time string
 * @returns Formatted time string
 */
export function formatTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  return dateObj.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}