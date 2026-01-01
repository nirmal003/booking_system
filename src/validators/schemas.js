const Joi = require('joi');

// User validation schemas
const registerSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .trim()
    .required()
    .messages({
      'string.empty': 'Name is required',
      'string.min': 'Name must be at least 2 characters',
      'string.max': 'Name cannot exceed 100 characters'
    }),
  email: Joi.string()
    .email()
    .trim()
    .lowercase()
    .required()
    .messages({
      'string.empty': 'Email is required',
      'string.email': 'Please provide a valid email address'
    }),
  password: Joi.string()
    .min(6)
    .max(15)
    .required()
    .messages({
      'string.empty': 'Password is required',
      'string.min': 'Password must be at least 6 characters',
      'string.max': 'Password cannot exceed 15 characters'
    }),
  role: Joi.string()
    .valid('user', 'admin')
    .default('user')
});

const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .trim()
    .lowercase()
    .required()
    .messages({
      'string.empty': 'Email is required',
      'string.email': 'Please provide a valid email address'
    }),
  password: Joi.string()
    .required()
    .messages({
      'string.empty': 'Password is required'
    })
});

// Event validation schemas
const createEventSchema = Joi.object({
  name: Joi.string()
    .min(3)
    .max(200)
    .trim()
    .required()
    .messages({
      'string.empty': 'Event name is required',
      'string.min': 'Event name must be at least 3 characters',
      'string.max': 'Event name cannot exceed 200 characters'
    }),
  description: Joi.string()
    .min(10)
    .trim()
    .required()
    .messages({
      'string.empty': 'Event description is required',
      'string.min': 'Event description must be at least 10 characters'
    }),
  date: Joi.date()
    .greater('now')
    .required()
    .messages({
      'date.base': 'Please provide a valid date',
      'date.greater': 'Event date must be in the future'
    }),
  location: Joi.string()
    .min(3)
    .trim()
    .required()
    .messages({
      'string.empty': 'Event location is required',
      'string.min': 'Event location must be at least 3 characters'
    }),
  totalTickets: Joi.number()
    .integer()
    .min(1)
    .max(100000)
    .required()
    .messages({
      'number.base': 'Total tickets must be a number',
      'number.integer': 'Total tickets must be an integer',
      'number.min': 'Total tickets must be at least 1',
      'number.max': 'Total tickets cannot exceed 100,000'
    }),
  metadata: Joi.object()
    .optional()
    .default({})
});

const updateEventSchema = Joi.object({
  name: Joi.string()
    .min(3)
    .max(200)
    .trim()
    .optional(),
  description: Joi.string()
    .min(10)
    .trim()
    .optional(),
  date: Joi.date()
    .greater('now')
    .optional(),
  location: Joi.string()
    .min(3)
    .trim()
    .optional(),
  totalTickets: Joi.number()
    .integer()
    .min(1)
    .max(100000)
    .optional(),
  metadata: Joi.object()
    .optional()
}).min(1);

// Booking validation schemas
const bookTicketSchema = Joi.object({
  eventId: Joi.string()
    .required()
    .messages({
      'string.empty': 'Event ID is required'
    }),
  ticketCount: Joi.number()
    .integer()
    .min(1)
    .max(10)
    .default(1)
    .messages({
      'number.base': 'Ticket count must be a number',
      'number.integer': 'Ticket count must be an integer',
      'number.min': 'Ticket count must be at least 1',
      'number.max': 'Cannot book more than 10 tickets at once'
    })
});

// Query validation schemas
const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().optional(),
  upcoming: Joi.boolean().truthy('true').falsy('false').optional()
});

module.exports = {
  registerSchema,
  loginSchema,
  createEventSchema,
  updateEventSchema,
  bookTicketSchema,
  paginationSchema
};
