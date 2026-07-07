import prisma from '../../config/prisma';
import bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';

export const createSuperAdmin = async () => {
  const existing = await prisma.user.findFirst({
    where: {
      role: UserRole.SUPER_ADMIN,
    },
  });

  if (existing) {
    return;
  }
  const hashedPassword = await bcrypt.hash('Admin@123', 12);

  await prisma.user.create({
    data: {
      email: 'admin@traxa.com',
      password: hashedPassword,
      role: UserRole.SUPER_ADMIN,
    },
  });

  console.log('✅ Super Admin Created');
};