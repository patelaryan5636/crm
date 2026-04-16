const express = require('express');
const userController = require('./user.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
const allowRoles = require('../../middlewares/role.middleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/', allowRoles('ADMIN', 'MANAGER'), userController.getUsers);
router.get('/:id', allowRoles('ADMIN', 'MANAGER'), userController.getUser);
router.post('/', allowRoles('ADMIN'), userController.createUser);
router.patch('/:id', allowRoles('ADMIN'), userController.updateUser);
router.delete('/:id', allowRoles('ADMIN'), userController.deleteUser);

module.exports = router;
