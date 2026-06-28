import prisma from '../../config/prisma';
import { createAuditLog } from '../auditlogs/auditlog.service';

const VALID_STATUSES = ['ACTIVE', 'INACTIVE', 'ON_HOLD'];

// Get all clients with pagination, status filtering, and search
export const getAllClients = async (
  page = 1,
  limit = 10,
  status?: string,
  search?: string
) => {
  const skip = (page - 1) * limit;
  const where: any = { isDeleted: false };

  if (status) {
    where.status = status.toUpperCase() as any;
  }
  if (search) {
    where.OR = [
      { companyName: { contains: search, mode: 'insensitive' } },
      { contactPerson: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [clients, total] = await Promise.all([
    prisma.client.findMany({
      where,
      skip,
      take: limit,
      include: {
        assignedEmployee: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.client.count({ where }),
  ]);

  return { clients, total, page, limit };
};

// Get single client by ID
export const getClientById = async (id: number) => {
  const client = await prisma.client.findFirst({
    where: { id, isDeleted: false },
    include: {
      assignedEmployee: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
      tasks: {
        where: { isDeleted: false },
        orderBy: { createdAt: 'desc' },
      },
      documents: {
        orderBy: { createdAt: 'desc' },
      },
      allocations: {
        orderBy: { allocatedAt: 'desc' },
        include: {
          employee: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      },
    },
  });

  if (!client) throw new Error('Client not found');
  return client;
};

// Create client with robust unique field validation and case normalization
export const createClient = async (
  data: {
    companyName: string;
    contactPerson: string;
    email: string;
    phone?: string;
    gstNumber?: string;
    panNumber?: string;
    address?: string;
    serviceType?: string;
    status?: string;
    assignedEmployeeId?: number;
    clientCode?: string;
  },
  performedBy: string
) => {
  // 1. Check if email already exists globally (uniqueness constraint in DB)
  const existingEmail = await prisma.client.findUnique({
    where: { email: data.email },
  });
  if (existingEmail) throw new Error('Client email already exists');

  // 2. Check if GST number already exists globally if provided
  if (data.gstNumber) {
    const existingGST = await prisma.client.findUnique({
      where: { gstNumber: data.gstNumber },
    });
    if (existingGST) throw new Error('GST number already exists');
  }

  // 3. Check if PAN number already exists globally if provided
  if (data.panNumber) {
    const existingPAN = await prisma.client.findUnique({
      where: { panNumber: data.panNumber },
    });
    if (existingPAN) throw new Error('PAN number already exists');
  }

  // 4. Validate and normalize status
  let finalStatus: any = 'ACTIVE';
  if (data.status) {
    const normalized = data.status.toUpperCase();
    if (!VALID_STATUSES.includes(normalized)) {
      throw new Error(`Invalid status. Allowed values: ${VALID_STATUSES.join(', ')}`);
    }
    finalStatus = normalized;
  }

  // 5. Generate collision-resistant unique clientCode
  let clientCode: string = '';
  if (data.clientCode) {
    clientCode = data.clientCode;
  } else {
    let prefix = data.companyName.replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase();
    if (prefix.length < 3) prefix = prefix.padEnd(3, 'C');
    
    let isUnique = false;
    let attempts = 0;
    while (!isUnique) {
      const count = await prisma.client.count();
      const code = `CL-${prefix}-${String(count + 1 + attempts).padStart(4, '0')}`;
      const existingCode = await prisma.client.findUnique({
        where: { clientCode: code },
      });
      if (!existingCode) {
        clientCode = code;
        isUnique = true;
      } else {
        attempts++;
      }
    }
  }

  const client = await prisma.client.create({
    data: {
      clientCode,
      companyName: data.companyName,
      contactPerson: data.contactPerson,
      email: data.email,
      phone: data.phone,
      gstNumber: data.gstNumber,
      panNumber: data.panNumber,
      address: data.address,
      serviceType: data.serviceType,
      status: finalStatus,
      assignedEmployeeId: data.assignedEmployeeId,
    },
  });

  // If employee is assigned, record in Allocation history
  if (data.assignedEmployeeId) {
    await prisma.allocation.create({
      data: {
        clientId: client.id,
        employeeId: data.assignedEmployeeId,
        allocatedBy: performedBy,
      },
    });
  }

  // Log to AuditLog
  await createAuditLog('Client created', performedBy, 'Client', client.id);

  return client;
};

// Update client with global uniqueness checks for updated fields
export const updateClient = async (
  id: number,
  data: {
    companyName?: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
    gstNumber?: string;
    panNumber?: string;
    address?: string;
    serviceType?: string;
    status?: string;
    assignedEmployeeId?: number;
  },
  performedBy: string
) => {
  const client = await prisma.client.findFirst({
    where: { id, isDeleted: false },
  });
  if (!client) throw new Error('Client not found');

  // Validate unique email
  if (data.email && data.email !== client.email) {
    const existingEmail = await prisma.client.findUnique({
      where: { email: data.email },
    });
    if (existingEmail) throw new Error('Client email already exists');
  }

  // Validate unique GST
  if (data.gstNumber && data.gstNumber !== client.gstNumber) {
    const existingGST = await prisma.client.findUnique({
      where: { gstNumber: data.gstNumber },
    });
    if (existingGST) throw new Error('GST number already exists');
  }

  // Validate unique PAN
  if (data.panNumber && data.panNumber !== client.panNumber) {
    const existingPAN = await prisma.client.findUnique({
      where: { panNumber: data.panNumber },
    });
    if (existingPAN) throw new Error('PAN number already exists');
  }

  // Validate and normalize status if updated
  let finalStatus: any = undefined;
  if (data.status) {
    const normalized = data.status.toUpperCase();
    if (!VALID_STATUSES.includes(normalized)) {
      throw new Error(`Invalid status. Allowed values: ${VALID_STATUSES.join(', ')}`);
    }
    finalStatus = normalized;
  }

  // Check if assignedEmployeeId is being updated
  const employeeChanged =
    data.assignedEmployeeId !== undefined &&
    data.assignedEmployeeId !== client.assignedEmployeeId;

  const updatedClient = await prisma.client.update({
    where: { id },
    data: {
      ...(data.companyName && { companyName: data.companyName }),
      ...(data.contactPerson && { contactPerson: data.contactPerson }),
      ...(data.email && { email: data.email }),
      ...(data.phone !== undefined && { phone: data.phone }),
      ...(data.gstNumber !== undefined && { gstNumber: data.gstNumber }),
      ...(data.panNumber !== undefined && { panNumber: data.panNumber }),
      ...(data.address !== undefined && { address: data.address }),
      ...(data.serviceType !== undefined && { serviceType: data.serviceType }),
      ...(finalStatus && { status: finalStatus }),
      ...(data.assignedEmployeeId !== undefined && {
        assignedEmployeeId: data.assignedEmployeeId,
      }),
    },
  });

  // If reassigned, create an Allocation record
  if (employeeChanged && data.assignedEmployeeId) {
    await prisma.allocation.create({
      data: {
        clientId: id,
        employeeId: data.assignedEmployeeId,
        allocatedBy: performedBy,
      },
    });
  }

  // Log to AuditLog
  await createAuditLog('Client updated', performedBy, 'Client', id);

  return updatedClient;
};

// Soft delete client
export const deleteClient = async (id: number, performedBy: string) => {
  const client = await prisma.client.findFirst({
    where: { id, isDeleted: false },
  });
  if (!client) throw new Error('Client not found');

  await prisma.client.update({
    where: { id },
    data: { isDeleted: true, status: 'INACTIVE' },
  });

  // Log to AuditLog
  await createAuditLog('Client deleted', performedBy, 'Client', id);

  return { message: 'Client deleted successfully' };
};

