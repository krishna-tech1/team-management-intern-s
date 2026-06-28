import prisma from '../../config/prisma';
import { comparePassword } from '../../utils/password.utils';
import { generateToken } from '../../utils/jwt.utils';

export const login = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      employee: true,
    },
  });

  console.log('==========================');
  console.log('Email received:', email);
  console.log('User found:', user);

  if (!user) {
    console.log('❌ User not found');
    throw new Error('Invalid credentials');
  }

  if (user.isDeleted) {
    console.log('❌ User is deleted');
    throw new Error('Invalid credentials');
  }

  const isValid = await comparePassword(
    password,
    user.password
  );

  console.log('Password entered:', password);
  console.log('Stored hash:', user.password);
  console.log('Password valid:', isValid);

  if (!isValid) {
    console.log('❌ Password mismatch');
    throw new Error('Invalid credentials');
  }

  const token = generateToken({
    id: user.id.toString(),
    role: user.role,
    email: user.email,
  });

  const name = user.employee
    ? `${user.employee.firstName} ${user.employee.lastName}`
    : user.email;

  console.log('✅ Login successful');
  console.log('==========================');

  return {
    token,
    user: {
      uid: user.id.toString(),
      email: user.email,
      name,
      role: user.role,
    },
  };
};