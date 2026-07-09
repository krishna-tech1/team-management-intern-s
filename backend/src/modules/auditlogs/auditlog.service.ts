import prisma from '../../config/prisma';

// Helper to create audit logs from any module
export const createAuditLog = async (
  action: string,
  performedBy: string,
  entity: string,
  entityId?: number,
  tx?: any
) => {
  const client = tx || prisma;
  return client.auditLog.create({
    data: {
      module: entity, // backward compatibility with original schema's 'module'
      action,
      entity,
      entityId,
      performedBy,
    },
  });
};

// Retrieve audit logs with pagination and filters
export const getAllAuditLogs = async (
  page = 1,
  limit = 20,
  performedBy?: string,
  entity?: string
) => {
  const skip = (page - 1) * limit;
  const where: any = {};

  if (performedBy) {
    where.performedBy = { contains: performedBy, mode: 'insensitive' };
  }
  if (entity) {
    where.entity = entity;
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { logs, total, page, limit };
};
