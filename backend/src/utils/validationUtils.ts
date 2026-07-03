import { validateCoordinates, isWithinRadius, isAccuracyAcceptable } from './gpsUtils';

/**
 * Validate attendance check-in parameters
 */
export const validateCheckIn = (data: {
  latitude?: number;
  longitude?: number;
  accuracy?: number;
}): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (data.latitude === undefined || data.longitude === undefined) {
    errors.push('Latitude and longitude are required for check-in');
  } else {
    const coordValidation = validateCoordinates(data.latitude, data.longitude);
    if (!coordValidation.isValid) {
      errors.push(coordValidation.error!);
    }
  }

  if (data.accuracy && !isAccuracyAcceptable(data.accuracy)) {
    errors.push(`GPS accuracy too low (${Math.round(data.accuracy)}m). Please move to a location with better signal.`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate attendance check-out parameters with radius check
 */
export const validateCheckOut = (data: {
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  checkInLatitude: number;
  checkInLongitude: number;
  radiusMeters?: number;
}): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  const checkInValidation = validateCheckIn({
    latitude: data.latitude,
    longitude: data.longitude,
    accuracy: data.accuracy,
  });

  errors.push(...checkInValidation.errors);

  // Check radius
  if (
    data.latitude !== undefined &&
    data.longitude !== undefined &&
    checkInValidation.isValid
  ) {
    const radiusMeters = data.radiusMeters || 200;
    const withinRadius = isWithinRadius(
      data.checkInLatitude,
      data.checkInLongitude,
      data.latitude,
      data.longitude,
      radiusMeters
    );

    if (!withinRadius) {
      const distance = Math.round(
        Math.sqrt(
          Math.pow(data.latitude - data.checkInLatitude, 2) +
            Math.pow(data.longitude - data.checkInLongitude, 2)
        ) * 111000
      ); // approximate meters
      errors.push(`You are ${distance}m away from check-in location. Maximum allowed: ${radiusMeters}m`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate task assignment data
 */
export const validateTaskAssignment = (data: {
  taskId?: number;
  employeeId?: number;
}): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!data.taskId) {
    errors.push('Task ID is required');
  }
  if (!data.employeeId) {
    errors.push('Employee ID is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate work update data
 */
export const validateWorkUpdate = (data: {
  title?: string;
  progress?: number;
  latitude?: number;
  longitude?: number;
}): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!data.title || data.title.trim().length === 0) {
    errors.push('Title is required');
  }

  if (data.progress !== undefined) {
    if (typeof data.progress !== 'number' || data.progress < 0 || data.progress > 100) {
      errors.push('Progress must be a number between 0 and 100');
    }
  }

  if (data.latitude || data.longitude) {
    const coordValidation = validateCoordinates(data.latitude!, data.longitude!);
    if (!coordValidation.isValid) {
      errors.push(coordValidation.error!);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate password reset request
 */
export const validatePasswordReset = (data: {
  employeeId?: number;
  newPassword?: string;
  confirmPassword?: string;
}): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!data.employeeId) {
    errors.push('Employee ID is required');
  }

  if (!data.newPassword) {
    errors.push('New password is required');
  }

  if (!data.confirmPassword) {
    errors.push('Password confirmation is required');
  }

  if (data.newPassword && data.confirmPassword && data.newPassword !== data.confirmPassword) {
    errors.push('Passwords do not match');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate date range
 */
export const validateDateRange = (
  fromDate: Date,
  toDate: Date
): { isValid: boolean; error?: string } => {
  if (!fromDate || !toDate) {
    return { isValid: false, error: 'Both start and end dates are required' };
  }

  const from = new Date(fromDate);
  const to = new Date(toDate);

  if (from > to) {
    return { isValid: false, error: 'Start date must be before end date' };
  }

  return { isValid: true };
};

/**
 * Check if time is within working hours (default: 6 AM - 10 PM)
 */
export const isWithinWorkingHours = (
  date: Date,
  startHour: number = 6,
  endHour: number = 22
): boolean => {
  const hour = new Date(date).getHours();
  return hour >= startHour && hour < endHour;
};

/**
 * Check if already checked in today
 */
export const isAlreadyCheckedInToday = (checkInTime: Date | null): boolean => {
  if (!checkInTime) return false;

  const today = new Date();
  const checkinDate = new Date(checkInTime);

  return (
    checkinDate.getDate() === today.getDate() &&
    checkinDate.getMonth() === today.getMonth() &&
    checkinDate.getFullYear() === today.getFullYear()
  );
};
