const Joi = require('joi');

exports.uploadOptionsSchema = Joi.object({
  skipDuplicates: Joi.boolean().default(true),
  strictMode:     Joi.boolean().default(false),
});

exports.commitUploadSchema = Joi.object({
  confirm:    Joi.boolean().valid(true).required()
                .messages({ 'any.only': 'confirm must be true to proceed' }),
  importMode: Joi.string().valid('VALID_ONLY', 'FAIL_ON_ANY_ERROR').default('VALID_ONLY'),
});

