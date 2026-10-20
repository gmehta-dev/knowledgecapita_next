import Joi from 'joi';

const calendarSchema = Joi.object({
  city: Joi.string().required().messages({
    'any.required': 'City is required',
    'string.empty': 'City is required'
  }),
  from_date: Joi.date().iso().min('now').required().messages({
    'any.required': 'From date is required',
    'date.min': 'From date must be today or in the future',
    'date.format': 'From date must be a valid ISO date'
  }),
  to_date: Joi.date().iso().min(Joi.ref('from_date')).required().messages({
    'any.required': 'To date is required',
    'date.min': 'To date must be greater than or equal to from date',
    'date.format': 'To date must be a valid ISO date'
  }),
  time: Joi.string().required().messages({
    'any.required': 'Time is required',
    'string.empty': 'Time is required'
  }),
  interested_to_meet: Joi.string().required().messages({
    'any.required': 'Interested to meet is required',
    'string.empty': 'Interested to meet is required'
  })
});

export { calendarSchema };
