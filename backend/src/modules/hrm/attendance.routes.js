const express = require('express');
const attendanceController = require('./attendance.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
const allowRoles = require('../../middlewares/role.middleware');

const router = express.Router();

router.use(authMiddleware, allowRoles('ADMIN', 'HR', 'MANAGER'));

router.get('/', attendanceController.getAttendanceRecords);
router.get('/:id', attendanceController.getAttendanceRecord);
router.post('/', attendanceController.createAttendanceRecord);
router.patch('/:id', attendanceController.updateAttendanceRecord);
router.delete('/:id', allowRoles('ADMIN', 'HR'), attendanceController.deleteAttendanceRecord);

module.exports = router;
