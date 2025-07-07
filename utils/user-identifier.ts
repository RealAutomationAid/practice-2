/**
 * Generates a simple user identifier for audit persistence
 * Uses localStorage to maintain consistency across sessions
 * Falls back to a temporary session-based identifier
 */
export function getUserIdentifier(): string {
  if (typeof window === 'undefined') {
    // Server-side - use IP or generate temporary ID
    return 'anonymous-server'
  }

  try {
    // Try to get existing identifier from localStorage
    let identifier = localStorage.getItem('audit-user-id')
    
    if (!identifier) {
      // Generate new identifier based on browser info
      const browserInfo = navigator.userAgent
      const screenInfo = `${screen.width}x${screen.height}`
      const timezoneInfo = Intl.DateTimeFormat().resolvedOptions().timeZone
      
      // Create a simple hash
      const combined = `${browserInfo}-${screenInfo}-${timezoneInfo}-${Date.now()}`
      identifier = 'user-' + combined.replace(/[^a-zA-Z0-9]/g, '').substring(0, 20)
      
      // Store for future use
      localStorage.setItem('audit-user-id', identifier)
    }
    
    return identifier
  } catch (error) {
    // Fallback for privacy mode or storage issues
    return 'anonymous-' + Math.random().toString(36).substring(2, 15)
  }
}

/**
 * Clears the stored user identifier (useful for testing)
 */
export function clearUserIdentifier(): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('audit-user-id')
    } catch (error) {
      // Ignore errors
    }
  }
}