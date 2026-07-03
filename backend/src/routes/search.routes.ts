import { Router } from 'express';
import prisma from '../config/prisma';
import { authenticateToken } from '../middleware/auth.middleware';
import { requireTeamLeadOrAdmin } from '../middleware/role.middleware';
import { successResponse, errorResponse } from '../utils/response.utils';

const router = Router();

router.get('/admin/search', authenticateToken, requireTeamLeadOrAdmin, async (req, res) => {
  try {
    const query = (req.query.q as string || '').trim();
    if (!query) {
      return successResponse(res, { clients: [], employees: [], tasks: [] }, 'Search results fetched successfully');
    }

    const [clients, employees, tasks] = await Promise.all([
      prisma.client.findMany({
        where: {
          isDeleted: false,
          OR: [
            { companyName: { contains: query, mode: 'insensitive' } },
            { contactPerson: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 5,
        orderBy: { companyName: 'asc' },
      }),
      prisma.employee.findMany({
        where: {
          isDeleted: false,
          OR: [
            { firstName: { contains: query, mode: 'insensitive' } },
            { lastName: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
            { employeeCode: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 5,
        orderBy: { firstName: 'asc' },
      }),
      prisma.task.findMany({
        where: {
          isDeleted: false,
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 5,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return successResponse(res, { clients, employees, tasks }, 'Search results fetched successfully');
  } catch (err: any) {
    return errorResponse(res, err.message, 500);
  }
});

export default router;
