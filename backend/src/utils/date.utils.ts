import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { startOfDay, endOfDay } from 'date-fns';

const TIMEZONE = 'Asia/Kolkata';

/**
 * Returns the start of the business day (00:00:00.000 in IST) represented as a UTC Date
 */
export const getStartOfBusinessDay = (date: Date = new Date()): Date => {
  const zoned = toZonedTime(date, TIMEZONE);
  const start = startOfDay(zoned);
  return fromZonedTime(start, TIMEZONE);
};

/**
 * Returns the end of the business day (23:59:59.999 in IST) represented as a UTC Date
 */
export const getEndOfBusinessDay = (date: Date = new Date()): Date => {
  const zoned = toZonedTime(date, TIMEZONE);
  const end = endOfDay(zoned);
  return fromZonedTime(end, TIMEZONE);
};

/**
 * Gets the current date/time mapped to the business timezone (IST)
 */
export const getBusinessNow = (): Date => {
  return toZonedTime(new Date(), TIMEZONE);
};

/**
 * Converts a UTC Date into a zoned IST Date
 */
export const toBusinessTimezone = (date: Date): Date => {
  return toZonedTime(date, TIMEZONE);
};

/**
 * Converts a zoned IST Date back to a UTC Date
 */
export const fromBusinessTimezone = (date: Date): Date => {
  return fromZonedTime(date, TIMEZONE);
};
