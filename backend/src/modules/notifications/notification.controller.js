const notificationService = require('./notification.service');
const { AppError } = require('../../middlewares/error.middleware');
const { successResponse } = require('../../utils/responseHandler');

const getNotifications = async (req, res, next) => {
  try {
    const notifications = await notificationService.listNotifications();
    return successResponse(res, { message: 'Notifications fetched', data: notifications });
  } catch (error) {
    return next(error);
  }
};

const getNotification = async (req, res, next) => {
  try {
    const notification = await notificationService.getNotificationById(req.params.id);
    return successResponse(res, { message: 'Notification fetched', data: notification });
  } catch (error) {
    return next(error);
  }
};

const createNotification = async (req, res, next) => {
  try {
    const { title, message, recipientId } = req.body;

    if (!title || !message || !recipientId) {
      throw new AppError('title, message, and recipientId are required', 400);
    }

    const notification = await notificationService.createNotification(req.body);
    return successResponse(res, {
      statusCode: 201,
      message: 'Notification created',
      data: notification,
    });
  } catch (error) {
    return next(error);
  }
};

const updateNotification = async (req, res, next) => {
  try {
    const notification = await notificationService.updateNotification(req.params.id, req.body);
    return successResponse(res, { message: 'Notification updated', data: notification });
  } catch (error) {
    return next(error);
  }
};

const deleteNotification = async (req, res, next) => {
  try {
    await notificationService.deleteNotification(req.params.id);
    return successResponse(res, { message: 'Notification deleted' });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getNotifications,
  getNotification,
  createNotification,
  updateNotification,
  deleteNotification,
};
