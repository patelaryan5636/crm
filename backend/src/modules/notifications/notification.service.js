const { prisma } = require('../../config/db');
const { AppError } = require('../../middlewares/error.middleware');

const listNotifications = async () => {
  return prisma.notification.findMany({
    include: {
      recipient: { select: { id: true, name: true, email: true, role: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
};

const getNotificationById = async (id) => {
  const notification = await prisma.notification.findUnique({
    where: { id },
    include: {
      recipient: { select: { id: true, name: true, email: true, role: true } },
    },
  });

  if (!notification) {
    throw new AppError('Notification not found', 404);
  }

  return notification;
};

const createNotification = async (payload) => {
  return prisma.notification.create({ data: payload });
};

const updateNotification = async (id, payload) => {
  await getNotificationById(id);
  return prisma.notification.update({ where: { id }, data: payload });
};

const deleteNotification = async (id) => {
  await getNotificationById(id);
  await prisma.notification.delete({ where: { id } });
};

module.exports = {
  listNotifications,
  getNotificationById,
  createNotification,
  updateNotification,
  deleteNotification,
};
