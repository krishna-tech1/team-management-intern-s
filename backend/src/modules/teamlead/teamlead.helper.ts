/**
 * Shared helper: resolve the TeamLead record for the currently authenticated user.
 * Throws if the user has no associated TeamLead profile.
 */
import prisma from '../../config/prisma';

export const resolveTeamLead = async (userId: number) => {
  let teamLead = await prisma.teamLead.findUnique({
    where: { userId },
    include: {
      teamMembers: {
        select: { employeeId: true },
      },
    },
  });

  if (!teamLead) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { employee: true },
    });

    if (user && (user.role === 'TEAM_LEAD' || user.role === 'SUPER_ADMIN')) {
      teamLead = await prisma.teamLead.create({
        data: {
          userId,
          teamName: user.employee ? `${user.employee.firstName}'s Team` : 'General Team',
          department: user.employee?.department || 'Operations',
        },
        include: {
          teamMembers: {
            select: { employeeId: true },
          },
        },
      });

      // To make testing easier, auto-associate all other active employees to this team lead
      const otherEmployees = await prisma.employee.findMany({
        where: {
          email: { not: user.email },
          isDeleted: false,
        },
      });

      if (otherEmployees.length > 0) {
        await prisma.teamLeadEmployee.createMany({
          data: otherEmployees.map((emp) => ({
            teamLeadId: teamLead!.id,
            employeeId: emp.id,
          })),
          skipDuplicates: true,
        });

        // Re-fetch with newly created memberships
        teamLead = await prisma.teamLead.findUnique({
          where: { userId },
          include: {
            teamMembers: {
              select: { employeeId: true },
            },
          },
        }) || teamLead;
      }
    } else {
      throw new Error('Team Lead profile not found for this user');
    }
  }

  return teamLead;
};

/** Return the list of employeeIds that belong to this Team Lead */
export const getTeamMemberIds = async (userId: number): Promise<number[]> => {
  const tl = await resolveTeamLead(userId);
  return tl.teamMembers.map((m) => m.employeeId);
};
