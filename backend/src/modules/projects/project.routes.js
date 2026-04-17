const express = require('express');
const projectController = require('./project.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
const allowRoles = require('../../middlewares/role.middleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/', allowRoles('ADMIN', 'MANAGER', 'SALES'), projectController.getProjects);
router.get('/:id', allowRoles('ADMIN', 'MANAGER', 'SALES'), projectController.getProject);
router.post('/', allowRoles('ADMIN', 'MANAGER', 'SALES'), projectController.createProject);
router.patch('/:id', allowRoles('ADMIN', 'MANAGER'), projectController.updateProject);
router.delete('/:id', allowRoles('ADMIN', 'MANAGER'), projectController.deleteProject);

module.exports = router;
