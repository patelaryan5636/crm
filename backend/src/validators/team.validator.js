/**
 * TEAM VALIDATOR — Joi schemas for team management endpoints
 * Production-grade validation for team CRUD operations
 */

const Joi = require('joi');

/**
 * Schema for creating a team
 * Required: name, department, leader (optional)
 */
const createTeamSchema = Joi.object({
  name: Joi.string()
    .required()
    .trim()
    .min(2)
    .max(100)
    .messages({
      'string.empty': 'Team name is required',
      'string.min': 'Team name must be at least 2 characters',
      'string.max': 'Team name must not exceed 100 characters',
    }),

  department: Joi.string()
    .required()
    .regex(/^[0-9a-fA-F]{24}$/)
    .messages({
      'string.pattern.base': 'Invalid department ID',
    }),

  leader: Joi.string()
    .optional()
    .allow(null)
    .regex(/^[0-9a-fA-F]{24}$/)
    .messages({
      'string.pattern.base': 'Invalid leader ID',
    }),
}).unknown(false);

/**
 * Schema for updating a team
 * All fields optional except at least one should be provided
 */
const updateTeamSchema = Joi.object({
  name: Joi.string()
    .optional()
    .trim()
    .min(2)
    .max(100)
    .messages({
      'string.min': 'Team name must be at least 2 characters',
      'string.max': 'Team name must not exceed 100 characters',
    }),

  leader: Joi.string()
    .optional()
    .allow(null)
    .regex(/^[0-9a-fA-F]{24}$/)
    .messages({
      'string.pattern.base': 'Invalid leader ID',
    }),

  isActive: Joi.boolean()
    .optional()
    .messages({
      'boolean.base': 'isActive must be true or false',
    }),
}).min(1) // At least one field must be provided
  .unknown(false);

/**
 * Schema for adding a member to team
 */
const addMemberSchema = Joi.object({
  userId: Joi.string()
    .required()
    .regex(/^[0-9a-fA-F]{24}$/)
    .messages({
      'string.pattern.base': 'Invalid user ID',
    }),
}).unknown(false);

/**
 * Schema for removing a member from team
 * Note: Member ID is typically in URL params, not body
 */
const removeMemberSchema = Joi.object({
  // Usually handled in params, but included for completeness
  userId: Joi.string()
    .optional()
    .regex(/^[0-9a-fA-F]{24}$/),
}).unknown(false);

/**
 * Schema for pagination and filtering query params
 */
const listTeamsSchema = Joi.object({
  page: Joi.number()
    .optional()
    .integer()
    .min(1)
    .default(1),

  limit: Joi.number()
    .optional()
    .integer()
    .min(1)
    .max(100)
    .default(20),

  sort: Joi.string()
    .optional()
    .default('-createdAt'),

  department: Joi.string()
    .optional()
    .regex(/^[0-9a-fA-F]{24}$/)
    .messages({
      'string.pattern.base': 'Invalid department ID',
    }),
}).unknown(false);

module.exports = {
  createTeamSchema,
  updateTeamSchema,
  addMemberSchema,
  removeMemberSchema,
  listTeamsSchema,
};
