const { prisma } = require('../../config/db');
const { AppError } = require('../../middlewares/error.middleware');

const listPayments = async () => {
  return prisma.payment.findMany({
    include: {
      project: true,
      recordedBy: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
};

const getPaymentById = async (id) => {
  const payment = await prisma.payment.findUnique({
    where: { id },
    include: {
      project: true,
      recordedBy: { select: { id: true, name: true, email: true } },
    },
  });

  if (!payment) {
    throw new AppError('Payment not found', 404);
  }

  return payment;
};

const createPayment = async (payload, recordedById) => {
  return prisma.payment.create({
    data: {
      ...payload,
      recordedById,
    },
  });
};

const updatePayment = async (id, payload) => {
  await getPaymentById(id);
  return prisma.payment.update({ where: { id }, data: payload });
};

const deletePayment = async (id) => {
  await getPaymentById(id);
  await prisma.payment.delete({ where: { id } });
};

module.exports = {
  listPayments,
  getPaymentById,
  createPayment,
  updatePayment,
  deletePayment,
};
