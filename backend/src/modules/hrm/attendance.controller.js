const attendanceService = require('./attendance.service');
const { AppError } = require('../../middlewares/error.middleware');
const { successResponse } = require('../../utils/responseHandler');

const getAttendanceRecords = async (req, res, next) => {
  try {
    const records = await attendanceService.listAttendance();
    return successResponse(res, { message: 'Attendance fetched', data: records });
  } catch (error) {
    return next(error);
  }
};

const getAttendanceRecord = async (req, res, next) => {
  try {
    const record = await attendanceService.getAttendanceById(req.params.id);
    return successResponse(res, { message: 'Attendance record fetched', data: record });
  } catch (error) {
    return next(error);
  }
};

const createAttendanceRecord = async (req, res, next) => {
  try {
    const { userId, date } = req.body;

    if (!userId || !date) {
      throw new AppError('userId and date are required', 400);
    }

    const record = await attendanceService.createAttendance(req.body);
    return successResponse(res, {
      statusCode: 201,
      message: 'Attendance record created',
      data: record,
    });
  } catch (error) {
    return next(error);
  }
};

const updateAttendanceRecord = async (req, res, next) => {
  try {
    const record = await attendanceService.updateAttendance(req.params.id, req.body);
    return successResponse(res, { message: 'Attendance record updated', data: record });
  } catch (error) {
    return next(error);
  }
};

const deleteAttendanceRecord = async (req, res, next) => {
  try {
    await attendanceService.deleteAttendance(req.params.id);
    return successResponse(res, { message: 'Attendance record deleted' });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getAttendanceRecords,
  getAttendanceRecord,
  createAttendanceRecord,
  updateAttendanceRecord,
  deleteAttendanceRecord,
};
