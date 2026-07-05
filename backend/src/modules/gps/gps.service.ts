import prisma from '../../config/prisma';
import { formatLocationData } from '../../utils/gpsUtils';
import { generateMapsUrl } from '../../utils/mapsUtils';

/**
 * Record GPS location for any event type
 */
export const recordGPSLocation = async (
  employeeId: number,
  latitude: number,
  longitude: number,
  eventType: string,
  eventId?: number,
  address?: string,
  accuracy?: number
) => {
  const gpsTracking = await prisma.gPSTracking.create({
    data: {
      employeeId,
      latitude,
      longitude,
      address,
      accuracy,
      eventType,
      eventId,
    },
  });

  return {
    ...gpsTracking,
    locationData: formatLocationData(latitude, longitude, address, accuracy),
    mapsUrl: generateMapsUrl(latitude, longitude),
  };
};

/**
 * Get all GPS locations for an employee
 */
export const getEmployeeGPSHistory = async (
  employeeId: number,
  page: number = 1,
  limit: number = 20,
  eventType?: string,
  dateFrom?: Date,
  dateTo?: Date
) => {
  const where: any = { employeeId };

  if (eventType) {
    where.eventType = eventType;
  }

  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = dateFrom;
    if (dateTo) where.createdAt.lte = dateTo;
  }

  const skip = (page - 1) * limit;

  const [locations, total] = await Promise.all([
    prisma.gPSTracking.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.gPSTracking.count({ where }),
  ]);

  return {
    locations: locations.map((loc) => ({
      ...loc,
      locationData: formatLocationData(loc.latitude, loc.longitude, loc.address ?? undefined, loc.accuracy ?? undefined),
      mapsUrl: generateMapsUrl(loc.latitude, loc.longitude),
    })),
    total,
    page,
    limit,
  };
};

/**
 * Get GPS location by event
 */
export const getGPSLocationByEvent = async (
  employeeId: number,
  eventType: string,
  eventId: number
) => {
  const location = await prisma.gPSTracking.findFirst({
    where: {
      employeeId,
      eventType,
      eventId,
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!location) {
    throw new Error(`No GPS location found for ${eventType} event`);
  }

  return {
    ...location,
    locationData: formatLocationData(location.latitude, location.longitude, location.address ?? undefined, location.accuracy ?? undefined),
    mapsUrl: generateMapsUrl(location.latitude, location.longitude),
  };
};

/**
 * Get employee's current location (latest GPS record)
 */
export const getCurrentLocation = async (employeeId: number) => {
  const location = await prisma.gPSTracking.findFirst({
    where: { employeeId },
    orderBy: { createdAt: 'desc' },
  });

  if (!location) {
    throw new Error('No location data available');
  }

  return {
    ...location,
    locationData: formatLocationData(location.latitude, location.longitude, location.address ?? undefined, location.accuracy ?? undefined),
    mapsUrl: generateMapsUrl(location.latitude, location.longitude),
  };
};

/**
 * Get GPS locations for multiple employees (for team lead dashboard)
 */
export const getTeamGPSLocations = async (employeeIds: number[]) => {
  if (employeeIds.length === 0) {
    throw new Error('No employee IDs provided');
  }

  const locations = await Promise.all(
    employeeIds.map(async (empId) => {
      try {
        const location = await getCurrentLocation(empId);
        return location;
      } catch {
        return null;
      }
    })
  );

  return locations.filter((loc) => loc !== null);
};

/**
 * Clean up old GPS records (older than specified days)
 */
export const cleanupOldGPSRecords = async (daysToKeep: number = 90) => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  const result = await prisma.gPSTracking.deleteMany({
    where: {
      createdAt: {
        lt: cutoffDate,
      },
    },
  });

  return {
    deletedCount: result.count,
    cutoffDate,
  };
};

/**
 * Get GPS heatmap data for employee (aggregate locations)
 */
export const getGPSHeatmapData = async (
  employeeId: number,
  dateFrom: Date,
  dateTo: Date
) => {
  const locations = await prisma.gPSTracking.findMany({
    where: {
      employeeId,
      createdAt: {
        gte: dateFrom,
        lte: dateTo,
      },
    },
    select: {
      latitude: true,
      longitude: true,
      accuracy: true,
      createdAt: true,
      eventType: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  // Aggregate by location clusters
  const clusters = new Map<string, { lat: number; lon: number; count: number; events: string[] }>();

  locations.forEach((loc) => {
    // Round to 4 decimal places (~11 meters accuracy)
    const key = `${loc.latitude.toFixed(4)},${loc.longitude.toFixed(4)}`;

    if (!clusters.has(key)) {
      clusters.set(key, {
        lat: parseFloat(loc.latitude.toFixed(4)),
        lon: parseFloat(loc.longitude.toFixed(4)),
        count: 0,
        events: [],
      });
    }

    const cluster = clusters.get(key)!;
    cluster.count++;
    if (!cluster.events.includes(loc.eventType)) {
      cluster.events.push(loc.eventType);
    }
  });

  return {
    employeeId,
    dateRange: { from: dateFrom, to: dateTo },
    totalLocations: locations.length,
    clusters: Array.from(clusters.values()),
  };
};
