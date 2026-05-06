const express = require('express');
const userController = require('../controllers/user.controller');
const { createUserSchema, departmentLoginSchema } = require('../validators/user.validator');
const validate = require('../middleware/validate');
const { requireAdmin, requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/meta/role-department-map', requireAdmin, userController.getRoleDepartmentMap);
router.get('/departments', requireAdmin, userController.getDepartments);
router.post('/login', validate(departmentLoginSchema, 'body'), userController.loginUser);
router.get('/', requireAuth, userController.getUsers);
router.get('/stats', requireAuth, userController.getUserStats);
router.post('/', requireAdmin, validate(createUserSchema, 'body'), userController.createUser);

module.exports = router;
