const { prisma } = require('../../config/db');
const { AppError } = require('../../middlewares/error.middleware');

const listLeads = async () => {
  return prisma.lead.findMany({
    include: { createdBy: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: 'desc' },
  });
};

const getLeadById = async (id) => {
  const lead = await prisma.lead.findUnique({
    where: { id },
    include: { createdBy: { select: { id: true, name: true, email: true } } },
  });

  if (!lead) {
    throw new AppError('Lead not found', 404);
  }

  return lead;
};

const createLead = async (payload, createdById) => {
  return prisma.lead.create({
    data: {
      ...payload,
      createdById,
    },
  });
};

const updateLead = async (id, payload) => {
  await getLeadById(id);
  return prisma.lead.update({ where: { id }, data: payload });
};

const deleteLead = async (id) => {
  await getLeadById(id);
  await prisma.lead.delete({ where: { id } });
};

module.exports = {
  listLeads,
  getLeadById,
  createLead,
  updateLead,
  deleteLead,
};
