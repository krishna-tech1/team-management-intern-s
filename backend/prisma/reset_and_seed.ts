import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🗑️ Cascading truncate on database tables...');
  try {
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "Notification", "GPSTracking", "Attendance", "TaskWorkUpdate", "TaskStatusHistory", "TaskAssignment", "Task", "Document", "PasswordReset", "DailyTracking", "Leaderboard", "Performance", "Efficiency", "TeamStrength", "Allocation", "Client", "TeamLeadEmployee", "Employee", "User", "AuditLog" CASCADE');
    console.log('✅ Cascading truncate complete.');
  } catch (err: any) {
    console.warn('Cascading truncate failed, trying table-by-table fallback:', err.message);
    try {
      await prisma.$executeRawUnsafe('TRUNCATE TABLE "User" CASCADE');
      await prisma.$executeRawUnsafe('TRUNCATE TABLE "Client" CASCADE');
      await prisma.$executeRawUnsafe('TRUNCATE TABLE "Task" CASCADE');
    } catch (e: any) {
      console.error('All resets failed:', e.message);
      throw e;
    }
  }

  console.log('🌱 Seeding database...');

  const hashedAdmin = await bcrypt.hash('Admin@123', 12);
  const hashedTL = await bcrypt.hash('TL@123', 12);
  const hashedEmp = await bcrypt.hash('Emp@123', 12);

  // Super Admin
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@traxa.com',
      password: hashedAdmin,
      role: 'SUPER_ADMIN',
      employee: {
        create: {
          employeeCode: 'FC-SA-0001',
          firstName: 'Super',
          lastName: 'Admin',
          email: 'admin@traxa.com',
          department: 'GST',
          designation: 'System Administrator',
          joiningDate: new Date('2022-01-01'),
          status: 'ACTIVE',
        },
      },
    },
  });
  console.log('✅ Super Admin created');

  // Team Lead 1
  const tl1User = await prisma.user.create({
    data: {
      email: 'vikram.tl@traxa.com',
      password: hashedTL,
      role: 'TEAM_LEAD',
      employee: {
        create: {
          employeeCode: 'FC-TL-0001',
          firstName: 'Vikram',
          lastName: 'Malhotra',
          email: 'vikram.tl@traxa.com',
          department: 'GST',
          designation: 'Team Lead - GST',
          joiningDate: new Date('2022-06-01'),
          status: 'ACTIVE',
        },
      },
    },
  });
  console.log('✅ Team Lead 1 created');

  // Team Lead 2
  const tl2User = await prisma.user.create({
    data: {
      email: 'priya.tl@traxa.com',
      password: hashedTL,
      role: 'TEAM_LEAD',
      employee: {
        create: {
          employeeCode: 'FC-TL-0002',
          firstName: 'Priya',
          lastName: 'Kulkarni',
          email: 'priya.tl@traxa.com',
          department: 'MCA',
          designation: 'Team Lead - MCA',
          joiningDate: new Date('2022-08-01'),
          status: 'ACTIVE',
        },
      },
    },
  });
  console.log('✅ Team Lead 2 created');

  // Employee 1
  await prisma.user.create({
    data: {
      email: 'arjun.v@traxa.com',
      password: hashedEmp,
      role: 'EMPLOYEE',
      employee: {
        create: {
          employeeCode: 'FC-GST-9842',
          firstName: 'Arjun',
          lastName: 'Vardhan',
          email: 'arjun.v@traxa.com',
          phone: '+91 98860 12345',
          department: 'GST',
          designation: 'Field Agent',
          joiningDate: new Date('2023-01-15'),
          status: 'ACTIVE',
        },
      },
    },
  });

  // Employee 2
  await prisma.user.create({
    data: {
      email: 'aditi.s@traxa.com',
      password: hashedEmp,
      role: 'EMPLOYEE',
      employee: {
        create: {
          employeeCode: 'FC-GST-9843',
          firstName: 'Aditi',
          lastName: 'Sharma',
          email: 'aditi.s@traxa.com',
          phone: '+91 98765 43210',
          department: 'GST',
          designation: 'Senior Field Agent',
          joiningDate: new Date('2023-03-01'),
          status: 'ACTIVE',
        },
      },
    },
  });

  // Employee 3
  await prisma.user.create({
    data: {
      email: 'rohan.v@traxa.com',
      password: hashedEmp,
      role: 'EMPLOYEE',
      employee: {
        create: {
          employeeCode: 'FC-MCA-9844',
          firstName: 'Rohan',
          lastName: 'Varma',
          email: 'rohan.v@traxa.com',
          phone: '+91 98712 34567',
          department: 'MCA',
          designation: 'Compliance Officer',
          joiningDate: new Date('2023-05-10'),
          status: 'ACTIVE',
        },
      },
    },
  });
  console.log('✅ Employees created');

  // Clients
  const client1 = await prisma.client.create({
    data: {
      clientCode: 'CL-001',
      companyName: 'Reliance Industries Ltd',
      contactPerson: 'Anand Sharma',
      email: 'anand@reliance.com',
      phone: '+91 98765 43210',
      gstNumber: '27AAACR1234A1Z1',
      panNumber: 'AAACR1234A',
      address: 'Maker Chambers IV, Nariman Point, Mumbai',
      status: 'ACTIVE',
    },
  });

  const client2 = await prisma.client.create({
    data: {
      clientCode: 'CL-002',
      companyName: 'Tata Consultancy Services',
      contactPerson: 'Rajesh Kumar',
      email: 'rajesh@tcs.com',
      phone: '+91 98765 11111',
      gstNumber: '27AAACT1234A1Z2',
      panNumber: 'AAACT1234A',
      address: 'TCS House, Raveline Street, Fort, Mumbai',
      status: 'ACTIVE',
    },
  });

  const client3 = await prisma.client.create({
    data: {
      clientCode: 'CL-003',
      companyName: 'HDFC Bank Corp',
      contactPerson: 'Meera Shah',
      email: 'meera@hdfc.com',
      phone: '+91 98765 22222',
      gstNumber: '27AAACH1234A1Z3',
      panNumber: 'AAACH1234A',
      address: 'HDFC Bank House, Senapati Bapat Marg, Mumbai',
      status: 'ACTIVE',
    },
  });
  console.log('✅ Clients created');

  // Get employee records
  const emp1 = await prisma.employee.findUnique({
    where: { employeeCode: 'FC-GST-9842' },
  });
  const emp2 = await prisma.employee.findUnique({
    where: { employeeCode: 'FC-GST-9843' },
  });

  // Tasks
  const task1 = await prisma.task.create({
    data: {
      title: 'GSTR-3B Filing - Reliance Industries',
      description: 'File monthly GSTR-3B return for Reliance Industries',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      clientId: client1.id,
    },
  });

  const task2 = await prisma.task.create({
    data: {
      title: 'Annual MCA Compliance - TCS',
      description: 'Complete annual MCA filing for Tata Consultancy Services',
      status: 'PENDING',
      priority: 'MEDIUM',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      clientId: client2.id,
    },
  });

  const task3 = await prisma.task.create({
    data: {
      title: 'Internal Tax Audit - HDFC Bank',
      description: 'Conduct internal tax audit for HDFC Bank Corp',
      status: 'PENDING',
      priority: 'URGENT',
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      clientId: client3.id,
    },
  });
  console.log('✅ Tasks created');

  // Task Assignments
  if (emp1) {
    await prisma.taskAssignment.create({
      data: { taskId: task1.id, employeeId: emp1.id },
    });
    await prisma.taskAssignment.create({
      data: { taskId: task3.id, employeeId: emp1.id },
    });
  }

  if (emp2) {
    await prisma.taskAssignment.create({
      data: { taskId: task2.id, employeeId: emp2.id },
    });
  }
  console.log('✅ Task assignments created');

  // Attendance for today
  if (emp1) {
    await prisma.attendance.create({
      data: {
        employeeId: emp1.id,
        checkInTime: new Date(),
        checkInLatitude: 12.9716,
        checkInLongitude: 77.5946,
        checkInAddress: 'Bangalore, Karnataka',
        status: 'PRESENT',
      },
    });
  }
  console.log('✅ Attendance created');

  // Notifications
  if (emp1) {
    await prisma.notification.create({
      data: {
        title: 'New Task Assigned',
        message: 'You have been assigned GSTR-3B Filing for Reliance Industries',
        type: 'TASK_ASSIGNED',
        employeeId: emp1.id,
      },
    });
    await prisma.notification.create({
      data: {
        title: 'Task Due Soon',
        message: 'Internal Tax Audit for HDFC Bank is due in 2 days',
        type: 'TASK_UPDATED',
        employeeId: emp1.id,
      },
    });
  }
  console.log('✅ Notifications created');

  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
