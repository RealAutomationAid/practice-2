/**
 * Safely formats a date string or Date object to localized date string
 * Handles the case where API returns dates as strings
 */
export function formatDate(date: string | Date): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return dateObj.toLocaleDateString()
  } catch {
    return 'Invalid Date'
  }
}

/**
 * Safely formats a date string or Date object to localized time string
 * Handles the case where API returns dates as strings
 */
export function formatTime(date: string | Date): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return dateObj.toLocaleTimeString()
  } catch {
    return 'Invalid Time'
  }
}

/**
 * Safely formats a date string or Date object to localized date and time string
 */
export function formatDateTime(date: string | Date): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return `${dateObj.toLocaleDateString()} at ${dateObj.toLocaleTimeString()}`
  } catch {
    return 'Invalid Date/Time'
  }
}