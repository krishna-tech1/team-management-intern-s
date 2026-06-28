import prisma from '../../config/prisma';
import { createAuditLog } from '../auditlogs/auditlog.service';

// Record a new document in the database
export const createDocument = async (
  data: {
    fileName: string;
    fileUrl: string;
    employeeId?: number;
    clientId?: number;
  },
  uploadedBy: string
) => {
  // Verify client exists if provided
  if (data.clientId) {
    const client = await prisma.client.findFirst({
      where: { id: data.clientId, isDeleted: false },
    });
    if (!client) throw new Error('Client not found');
  }

  // Verify employee exists if provided
  if (data.employeeId) {
    const employee = await prisma.employee.findFirst({
      where: { id: data.employeeId, isDeleted: false },
    });
    if (!employee) throw new Error('Employee not found');
  }

  // Determine documentType enum for schema backward compatibility
  let documentType: 'GST' | 'MCA' | 'OTHER' = 'OTHER';
  const nameLower = data.fileName.toLowerCase();
  if (nameLower.includes('gst')) {
    documentType = 'GST';
  } else if (nameLower.includes('mca')) {
    documentType = 'MCA';
  }

  const document = await prisma.document.create({
    data: {
      fileName: data.fileName,
      filePath: data.fileUrl, // map fileUrl to filePath for schema compatibility
      fileUrl: data.fileUrl,
      documentType,
      clientId: data.clientId || null,
      employeeId: data.employeeId || null,
      uploadedBy,
    },
  });

  // Log to AuditLog
  await createAuditLog(
    `Document ${data.fileName} uploaded`,
    uploadedBy,
    'Document',
    document.id
  );

  return document;
};

// Retrieve documents with pagination and filtering
export const getAllDocuments = async (
  page = 1,
  limit = 10,
  clientId?: number,
  employeeId?: number
) => {
  const skip = (page - 1) * limit;
  const where: any = {};

  if (clientId) where.clientId = clientId;
  if (employeeId) where.employeeId = employeeId;

  const [documents, total] = await Promise.all([
    prisma.document.findMany({
      where,
      skip,
      take: limit,
      include: {
        client: {
          select: { id: true, companyName: true },
        },
        employee: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.document.count({ where }),
  ]);

  return { documents, total, page, limit };
};

// Hard delete document from the database
export const deleteDocument = async (id: number, performedBy: string) => {
  const document = await prisma.document.findUnique({
    where: { id },
  });
  if (!document) throw new Error('Document not found');

  await prisma.document.delete({
    where: { id },
  });

  // Log to AuditLog
  await createAuditLog(
    `Document ${document.fileName} deleted`,
    performedBy,
    'Document',
    id
  );

  return { message: 'Document deleted successfully' };
};
