import prisma from '../../config/prisma';


export const getTLClients = async (
  _userId: number,
  page = 1,
  limit = 10,
  search?: string,
  status?: string,
  serviceType?: string
) => {
  const skip = (page - 1) * limit;

  const where: any = {
    isDeleted: false,
  };
  if (status) where.status = status.toUpperCase();
  if (serviceType) where.serviceType = { contains: serviceType, mode: 'insensitive' };
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
        assignedEmployee: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.client.count({ where }),
  ]);

  return { clients, total, page, limit };
};

export const getTLClientById = async (_userId: number, clientId: number) => {
  const client = await prisma.client.findFirst({
    where: { id: clientId, isDeleted: false },
    include: {
      assignedEmployee: { select: { id: true, firstName: true, lastName: true, email: true, designation: true } },
      tasks: {
        where: { isDeleted: false },
        select: { id: true, title: true, status: true, priority: true, dueDate: true, assignedEmployee: { select: { firstName: true, lastName: true } } },
        orderBy: { createdAt: 'desc' },
      },
      documents: { orderBy: { createdAt: 'desc' } },
      invoices: { orderBy: { createdAt: 'desc' }, take: 10 },
    },
  });
  if (!client) throw new Error('Client not found or not accessible');

  const totalTasks = client.tasks.length;
  const completedTasks = client.tasks.filter((t) => t.status === 'COMPLETED').length;

  return { ...client, taskSummary: { totalTasks, completedTasks } };
};
