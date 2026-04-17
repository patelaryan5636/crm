const { prisma } = require('../../config/db');
const { AppError } = require('../../middlewares/error.middleware');

const listProjects = async () => {
  return prisma.project.findMany({
    include: {
      owner: { select: { id: true, name: true, email: true } },
      lead: true,
    },
    orderBy: { createdAt: 'desc' },
  });
};

const getProjectById = async (id) => {
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      lead: true,
      payments: true,
    },
  });

  if (!project) {
    throw new AppError('Project not found', 404);
  }

  return project;
};

const createProject = async (payload, ownerId) => {
  return prisma.project.create({
    data: {
      ...payload,
      ownerId,
    },
  });
};

const updateProject = async (id, payload) => {
  await getProjectById(id);
  return prisma.project.update({ where: { id }, data: payload });
};

const deleteProject = async (id) => {
  await getProjectById(id);
  await prisma.project.delete({ where: { id } });
};

module.exports = {
  listProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
};
