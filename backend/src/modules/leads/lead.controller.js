const leadService = require('./lead.service');
const { AppError } = require('../../middlewares/error.middleware');
const { successResponse } = require('../../utils/responseHandler');

const getLeads = async (req, res, next) => {
  try {
    const leads = await leadService.listLeads();
    return successResponse(res, { message: 'Leads fetched', data: leads });
  } catch (error) {
    return next(error);
  }
};

const getLead = async (req, res, next) => {
  try {
    const lead = await leadService.getLeadById(req.params.id);
    return successResponse(res, { message: 'Lead fetched', data: lead });
  } catch (error) {
    return next(error);
  }
};

const createLead = async (req, res, next) => {
  try {
    const { name, email } = req.body;

    if (!name || !email) {
      throw new AppError('name and email are required', 400);
    }

    const lead = await leadService.createLead(req.body, req.user.id);
    return successResponse(res, {
      statusCode: 201,
      message: 'Lead created',
      data: lead,
    });
  } catch (error) {
    return next(error);
  }
};

const updateLead = async (req, res, next) => {
  try {
    const lead = await leadService.updateLead(req.params.id, req.body);
    return successResponse(res, { message: 'Lead updated', data: lead });
  } catch (error) {
    return next(error);
  }
};

const deleteLead = async (req, res, next) => {
  try {
    await leadService.deleteLead(req.params.id);
    return successResponse(res, { message: 'Lead deleted' });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getLeads,
  getLead,
  createLead,
  updateLead,
  deleteLead,
};
