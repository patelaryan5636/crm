const express = require('express');
const notificationController = require('./notification.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
const allowRoles = require('../../middlewares/role.middleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/', allowRoles('ADMIN', 'MANAGER', 'HR', 'FINANCE', 'SALES', 'USER'), notificationController.getNotifications);
router.get('/:id', allowRoles('ADMIN', 'MANAGER', 'HR', 'FINANCE', 'SALES', 'USER'), notificationController.getNotification);
router.post('/', allowRoles('ADMIN', 'MANAGER', 'HR'), notificationController.createNotification);
router.patch('/:id', allowRoles('ADMIN', 'MANAGER', 'HR'), notificationController.updateNotification);
router.delete('/:id', allowRoles('ADMIN', 'MANAGER'), notificationController.deleteNotification);

module.exports = router;
