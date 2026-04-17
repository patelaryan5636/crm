const express = require('express');
const roleController = require('./role.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
const allowRoles = require('../../middlewares/role.middleware');

const router = express.Router();

router.use(authMiddleware, allowRoles('ADMIN'));

router.get('/', roleController.listRoles);
router.patch('/assign', roleController.updateUserRole);

module.exports = router;
