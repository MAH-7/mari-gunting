/**
 * ETA Calculation Utility
 * Calculate estimated arrival time based on distance
 */

export interface ETAResult {
  minutes: number;
  seconds: number;
  text: string;
  shortText: string;
}

/**
 * Calculate ETA based on distance
 * @param distanceKm Distance in kilometers
 * @param avgSpeedKmh Average speed in km/h (default: 25 for city traffic)
 * @param trafficFactor Traffic multiplier (1.0 = no traffic, 1.5 = heavy traffic)
 */
export function calculateETA(
  distanceKm: number,
  avgSpeedKmh: number = 25,
  trafficFactor: number = 1.2
): ETAResult {
  // Calculate base time in hours
  const baseHours = distanceKm / avgSpeedKmh;
  
  // Apply traffic factor
  const adjustedHours = baseHours * trafficFactor;
  
  // Convert to minutes
  const totalMinutes = Math.ceil(adjustedHours * 60);
  
  // Break down into hours and minutes
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const seconds = Math.ceil((adjustedHours * 3600) % 60);
  
  // Format text
  let text: string;
  let shortText: string;
  
  if (totalMinutes < 1) {
    text = 'Arriving now';
    shortText = 'Now';
  } else if (totalMinutes < 60) {
    text = `${totalMinutes} minute${totalMinutes > 1 ? 's' : ''}`;
    shortText = `${totalMinutes}m`;
  } else {
    if (minutes === 0) {
      text = `${hours} hour${hours > 1 ? 's' : ''}`;
      shortText = `${hours}h`;
    } else {
      text = `${hours} hour${hours > 1 ? 's' : ''} ${minutes} min${minutes > 1 ? 's' : ''}`;
      shortText = `${hours}h ${minutes}m`;
    }
  }
  
  return {
    minutes: totalMinutes,
    seconds,
    text,
    shortText,
  };
}

/**
 * Format distance for display
 * @param distanceKm Distance in kilometers
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 0.1) {
    return 'Less than 100m';
  } else if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`;
  } else {
    return `${distanceKm.toFixed(1)} km`;
  }
}

/**
 * Get urgency level based on distance
 */
export function getUrgencyLevel(distanceKm: number): 'arriving' | 'near' | 'far' {
  if (distanceKm < 0.2) return 'arriving'; // Less than 200m
  if (distanceKm < 2) return 'near'; // Less than 2km
  return 'far';
}

/**
 * Get notification message based on distance
 */
export function getNotificationMessage(distanceKm: number, eta: ETAResult): string {
  const urgency = getUrgencyLevel(distanceKm);
  
  switch (urgency) {
    case 'arriving':
      return 'Your barber has arrived! 🎉';
    case 'near':
      return `Your barber is ${eta.text} away! 🚗`;
    default:
      return `Your barber is on the way (${eta.shortText})`;
  }
}
