import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  try {
    // Try using Intl.NumberFormat first
    if (typeof Intl !== 'undefined' && typeof Intl.NumberFormat !== 'undefined') {
      return new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: 'GBP',
      }).format(amount)
    }
  } catch (error) {
    // Fallback if Intl.NumberFormat fails
    console.warn('Intl.NumberFormat not available, using fallback')
  }
  
  // Fallback to basic currency formatting
  return `£${amount.toFixed(2)}`
}

export function formatDate(date: string | Date): string {
  // Handle null, undefined, or empty string
  if (!date) {
    return 'Not set'
  }
  
  try {
    const dateObj = new Date(date)
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      console.warn('Invalid date provided to formatDate:', date)
      return 'Invalid date'
    }
    
    // Try using Intl.DateFormat first
    if (typeof Intl !== 'undefined' && typeof Intl.DateTimeFormat !== 'undefined') {
      return new Intl.DateTimeFormat('en-GB', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }).format(dateObj)
    }
    
    // Fallback to basic date formatting
    const day = dateObj.getDate()
    const year = dateObj.getFullYear()
    
    // Month names fallback
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ]
    const month = monthNames[dateObj.getMonth()]
    
    return `${day} ${month} ${year}`
    
  } catch (error) {
    console.error('Error formatting date:', error, 'Date:', date)
    return 'Invalid date'
  }
}

export function formatTime(hours: number): string {
  const wholeHours = Math.floor(hours)
  const minutes = Math.round((hours - wholeHours) * 60)
  
  if (minutes === 0) {
    return `${wholeHours}h`
  }
  
  return `${wholeHours}h ${minutes}m`
}

export function calculateHourlyRate(dailyRate: number, hoursPerDay: number = 8): number {
  return dailyRate / hoursPerDay
}

export function calculateTaskCost(
  hoursWorked: number,
  rate: number,
  marginPercentage: number = 20
): number {
  const baseCost = hoursWorked * rate
  const margin = baseCost * (marginPercentage / 100)
  return baseCost + margin
}
