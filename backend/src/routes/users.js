const express = require('express');
const userController = require('../controllers/user.controller');
const { createUserSchema, departmentLoginSchema } = require('../validators/user.validator');
const validate = require('../middleware/validate');

const router = express.Router();

router.get('/meta/role-department-map', userController.getRoleDepartmentMap);
router.get('/departments', userController.getDepartments);
router.post('/login', validate(departmentLoginSchema, 'body'), userController.loginUser);
router.get('/', userController.getUsers);
router.post('/', validate(createUserSchema, 'body'), userController.createUser);

module.exports = router;
