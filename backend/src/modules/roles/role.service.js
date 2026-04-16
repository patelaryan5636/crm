const { prisma } = require('../../config/db');
const { AppError } = require('../../middlewares/error.middleware');

const roleList = ['ADMIN', 'MANAGER', 'SALES', 'HR', 'FINANCE', 'USER'];

const getRoles = async () => roleList;

const assignRole = async (userId, role) => {
  if (!roleList.includes(role)) {
    throw new AppError('Invalid role', 400);
  }

  return prisma.user.update({
    where: { id: userId },
    data: { role },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      updatedAt: true,
    },
  });
};

module.exports = {
  getRoles,
  assignRole,
};
