const financeService = require('./finance.service');
const { AppError } = require('../../middlewares/error.middleware');
const { successResponse } = require('../../utils/responseHandler');

const getFinanceEntries = async (req, res, next) => {
  try {
    const entries = await financeService.listFinanceEntries();
    return successResponse(res, { message: 'Finance entries fetched', data: entries });
  } catch (error) {
    return next(error);
  }
};

const getFinanceEntry = async (req, res, next) => {
  try {
    const entry = await financeService.getFinanceById(req.params.id);
    return successResponse(res, { message: 'Finance entry fetched', data: entry });
  } catch (error) {
    return next(error);
  }
};

const createFinanceEntry = async (req, res, next) => {
  try {
    const { type, amount } = req.body;

    if (!type || !amount) {
      throw new AppError('type and amount are required', 400);
    }

    const entry = await financeService.createFinanceEntry(req.body, req.user.id);
    return successResponse(res, {
      statusCode: 201,
      message: 'Finance entry created',
      data: entry,
    });
  } catch (error) {
    return next(error);
  }
};

const updateFinanceEntry = async (req, res, next) => {
  try {
    const entry = await financeService.updateFinanceEntry(req.params.id, req.body);
    return successResponse(res, { message: 'Finance entry updated', data: entry });
  } catch (error) {
    return next(error);
  }
};

const deleteFinanceEntry = async (req, res, next) => {
  try {
    await financeService.deleteFinanceEntry(req.params.id);
    return successResponse(res, { message: 'Finance entry deleted' });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getFinanceEntries,
  getFinanceEntry,
  createFinanceEntry,
  updateFinanceEntry,
  deleteFinanceEntry,
};
