const { prisma } = require('../../config/db');
const { AppError } = require('../../middlewares/error.middleware');

const listFinanceEntries = async () => {
  return prisma.finance.findMany({
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
};

const getFinanceById = async (id) => {
  const finance = await prisma.finance.findUnique({
    where: { id },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });

  if (!finance) {
    throw new AppError('Finance entry not found', 404);
  }

  return finance;
};

const createFinanceEntry = async (payload, createdById) => {
  return prisma.finance.create({
    data: {
      ...payload,
      createdById,
    },
  });
};

const updateFinanceEntry = async (id, payload) => {
  await getFinanceById(id);
  return prisma.finance.update({ where: { id }, data: payload });
};

const deleteFinanceEntry = async (id) => {
  await getFinanceById(id);
  await prisma.finance.delete({ where: { id } });
};

module.exports = {
  listFinanceEntries,
  getFinanceById,
  createFinanceEntry,
  updateFinanceEntry,
  deleteFinanceEntry,
};
