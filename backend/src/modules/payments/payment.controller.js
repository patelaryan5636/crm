const paymentService = require('./payment.service');
const { AppError } = require('../../middlewares/error.middleware');
const { successResponse } = require('../../utils/responseHandler');

const getPayments = async (req, res, next) => {
  try {
    const payments = await paymentService.listPayments();
    return successResponse(res, { message: 'Payments fetched', data: payments });
  } catch (error) {
    return next(error);
  }
};

const getPayment = async (req, res, next) => {
  try {
    const payment = await paymentService.getPaymentById(req.params.id);
    return successResponse(res, { message: 'Payment fetched', data: payment });
  } catch (error) {
    return next(error);
  }
};

const createPayment = async (req, res, next) => {
  try {
    const { amount, projectId } = req.body;

    if (!amount || !projectId) {
      throw new AppError('amount and projectId are required', 400);
    }

    const payment = await paymentService.createPayment(req.body, req.user.id);
    return successResponse(res, {
      statusCode: 201,
      message: 'Payment created',
      data: payment,
    });
  } catch (error) {
    return next(error);
  }
};

const updatePayment = async (req, res, next) => {
  try {
    const payment = await paymentService.updatePayment(req.params.id, req.body);
    return successResponse(res, { message: 'Payment updated', data: payment });
  } catch (error) {
    return next(error);
  }
};

const deletePayment = async (req, res, next) => {
  try {
    await paymentService.deletePayment(req.params.id);
    return successResponse(res, { message: 'Payment deleted' });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getPayments,
  getPayment,
  createPayment,
  updatePayment,
  deletePayment,
};
