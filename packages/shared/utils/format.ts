// Currency formatting (no decimals for whole numbers)
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-MY', {
    style: 'currency',
    currency: 'MYR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Price formatting (shows decimals when present)
export const formatPrice = (amount: number): string => {
  // Check if amount has decimals
  const hasDecimals = amount % 1 !== 0;
  return new Intl.NumberFormat('en-MY', {
    style: 'currency',
    currency: 'MYR',
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Time formatting - Convert 24h to 12h format (e.g., "14:30" -> "2:30 PM")
export const formatTime = (time: string): string => {
  if (!time) return '';
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
};

// Format datetime to user's local time in 12-hour format (Grab-style)
// Database stores UTC, display in user's device timezone
// Input: ISO datetime string or Date object
// Output: "2:30 PM" or "10:15 AM"
export const formatLocalTime = (datetime: string | Date): string => {
  if (!datetime) return '';
  
  const date = typeof datetime === 'string' ? new Date(datetime) : datetime;
  
  return new Intl.DateTimeFormat('en-MY', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
};

// Format datetime to user's local date
// Database stores UTC, display in user's device timezone
// Input: ISO datetime string or Date object
// Output: "15 Jan 2025" or custom format
export const formatLocalDate = (datetime: string | Date, format: 'short' | 'long' = 'short'): string => {
  if (!datetime) return '';
  
  const date = typeof datetime === 'string' ? new Date(datetime) : datetime;
  
  if (format === 'long') {
    return new Intl.DateTimeFormat('en-MY', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  }
  
  return new Intl.DateTimeFormat('en-MY', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

// Format datetime to user's local date + time (Grab-style)
// Database stores UTC, display in user's device timezone
// Input: ISO datetime string or Date object
// Output: "15 Jan 2025, 2:30 PM"
export const formatLocalDateTime = (datetime: string | Date): string => {
  if (!datetime) return '';
  
  const date = formatLocalDate(datetime, 'short');
  const time = formatLocalTime(datetime);
  
  return `${date}, ${time}`;
};

// Legacy aliases for Malaysia timezone (keep for backward compatibility)
export const formatMalaysiaTime = formatLocalTime;
export const formatMalaysiaDate = formatLocalDate;
export const formatMalaysiaDateTime = formatLocalDateTime;

// ============================================
// PRODUCTION TIMEZONE UTILITIES (Grab-style)
// ============================================

/**
 * Convert date + time strings to ISO 8601 timestamp with device timezone
 * This is the CORRECT way to handle scheduled bookings in production
 * 
 * @param dateStr - Date string in format "YYYY-MM-DD" (e.g., "2025-11-02")
 * @param timeStr - Time string in format "HH:mm" (e.g., "14:30")
 * @returns ISO 8601 timestamp with timezone (e.g., "2025-11-02T14:30:00+08:00")
 * 
 * @example
 * // User in Singapore (GMT+8) selects Nov 2, 2025 at 2:30 PM
 * createScheduledDateTime("2025-11-02", "14:30")
 * // Returns: "2025-11-02T14:30:00+08:00"
 * // Stored in DB as UTC: "2025-11-02T06:30:00Z"
 * // Displayed back in user's timezone: "2:30 PM"
 */
export const createScheduledDateTime = (dateStr: string, timeStr: string): string => {
  if (!dateStr || !timeStr) {
    throw new Error('Date and time are required');
  }
  
  // Create date object in user's local timezone
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);
  
  // Use Date constructor with local timezone
  const localDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
  
  // Return ISO string (includes timezone offset)
  return localDate.toISOString();
};

/**
 * Extract date string from ISO timestamp for display
 * @param isoTimestamp - ISO 8601 timestamp
 * @returns Date string in format "YYYY-MM-DD"
 */
export const extractDateFromISO = (isoTimestamp: string): string => {
  if (!isoTimestamp) return '';
  const date = new Date(isoTimestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Extract time string from ISO timestamp for display
 * @param isoTimestamp - ISO 8601 timestamp
 * @returns Time string in format "HH:mm"
 */
export const extractTimeFromISO = (isoTimestamp: string): string => {
  if (!isoTimestamp) return '';
  const date = new Date(isoTimestamp);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

// Time range formatting (e.g., "09:00 - 21:00" -> "9:00 AM - 9:00 PM")
export const formatTimeRange = (startTime: string, endTime: string): string => {
  if (!startTime || !endTime) return 'Closed';
  return `${formatTime(startTime)} - ${formatTime(endTime)}`;
};

// Date formatting
export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
};

export const formatShortDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

// Distance calculation (Haversine formula)
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Radius of Earth in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 10) / 10; // Round to 1 decimal
};

const toRad = (degrees: number): number => {
  return (degrees * Math.PI) / 180;
};

// Format distance
export const formatDistance = (km: number): string => {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(1)} km`;
};

// Duration formatting
export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};

// Phone number formatting for Malaysian and Indonesian numbers
export const formatPhoneNumber = (phone: string): string => {
  if (!phone) return '';
  
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Format Malaysian phone number (+60)
  if (cleaned.startsWith('60')) {
    // +60 12-345 6789 (mobile)
    if (cleaned.length === 11 || cleaned.length === 12) {
      return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)}-${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
    }
    return `+${cleaned.slice(0, 2)} ${cleaned.slice(2)}`;
  }
  
  // Format Indonesian phone number (+62)
  if (cleaned.startsWith('62')) {
    // +62 812-3456-7890 (mobile)
    if (cleaned.length >= 11) {
      return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)}-${cleaned.slice(5, 9)}-${cleaned.slice(9)}`;
    }
    return `+${cleaned.slice(0, 2)} ${cleaned.slice(2)}`;
  }
  
  // Format local Malaysian mobile number (without country code)
  // 012-345 6789
  if (cleaned.length === 10 && (cleaned.startsWith('01') || cleaned.startsWith('03'))) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  }
  
  // Format local Indonesian mobile number (without country code)
  // 0812-3456-7890
  if (cleaned.length >= 10 && cleaned.startsWith('08')) {
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 8)}-${cleaned.slice(8)}`;
  }
  
  // Return as-is if format not recognized
  return phone;
};

// Convert phone to WhatsApp format (digits only, with country code)
export const formatPhoneForWhatsApp = (phone: string): string => {
  if (!phone) return '';
  
  const cleaned = phone.replace(/\D/g, '');
  
  // If it already has country code, return it
  if (cleaned.startsWith('60') || cleaned.startsWith('62')) {
    return cleaned;
  }
  
  // Add Malaysian country code if starts with 0
  if (cleaned.startsWith('0')) {
    return '60' + cleaned.slice(1);
  }
  
  return cleaned;
};

// Convert phone to tel: format
export const formatPhoneForCall = (phone: string): string => {
  if (!phone) return '';
  
  const cleaned = phone.replace(/\D/g, '');
  
  // Ensure it has + prefix for international format
  if (cleaned.startsWith('60') || cleaned.startsWith('62')) {
    return `+${cleaned}`;
  }
  
  return cleaned;
};

// Validate phone number format
export const isValidPhoneNumber = (phone: string): boolean => {
  if (!phone) return false;
  
  const cleaned = phone.replace(/\D/g, '');
  
  // Malaysian: +60 (11-12 digits total) or local 10 digits starting with 01
  if (cleaned.startsWith('60')) {
    return cleaned.length >= 11 && cleaned.length <= 12;
  }
  
  // Indonesian: +62 (11-13 digits total) or local 10-12 digits starting with 08
  if (cleaned.startsWith('62')) {
    return cleaned.length >= 11 && cleaned.length <= 13;
  }
  
  // Local Malaysian
  if (cleaned.startsWith('01') || cleaned.startsWith('03')) {
    return cleaned.length === 10;
  }
  
  // Local Indonesian
  if (cleaned.startsWith('08')) {
    return cleaned.length >= 10 && cleaned.length <= 12;
  }
  
  return false;
};

// Truncate text
export const truncate = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};
