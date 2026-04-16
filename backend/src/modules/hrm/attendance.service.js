const { prisma } = require('../../config/db');
const { AppError } = require('../../middlewares/error.middleware');

const listAttendance = async () => {
  return prisma.attendance.findMany({
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
    },
    orderBy: { date: 'desc' },
  });
};

const getAttendanceById = async (id) => {
  const attendance = await prisma.attendance.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
    },
  });

  if (!attendance) {
    throw new AppError('Attendance record not found', 404);
  }

  return attendance;
};

const createAttendance = async (payload) => {
  return prisma.attendance.create({ data: payload });
};

const updateAttendance = async (id, payload) => {
  await getAttendanceById(id);
  return prisma.attendance.update({ where: { id }, data: payload });
};

const deleteAttendance = async (id) => {
  await getAttendanceById(id);
  await prisma.attendance.delete({ where: { id } });
};

module.exports = {
  listAttendance,
  getAttendanceById,
  createAttendance,
  updateAttendance,
  deleteAttendance,
};
