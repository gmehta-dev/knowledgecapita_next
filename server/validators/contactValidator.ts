import Joi from 'joi';

const contactSchema = Joi.object({
  name: Joi.string().required().messages({
    'any.required': 'Name is required',
    'string.empty': 'Name is required'
  }),
  email: Joi.string().email().required().messages({
    'any.required': 'Email is required',
    'string.email': 'Email format is invalid',
    'string.empty': 'Email is required'
  }),
  contact_no: Joi.string().pattern(/^\d{10}$/).required().messages({
    'any.required': 'Contact number is required',
    'string.pattern.base': 'Contact number must be exactly 10 digits',
    'string.empty': 'Contact number is required'
  }),
  query: Joi.string().required().messages({
    'any.required': 'Query is required',
    'string.empty': 'Query is required'
  })
});

export { contactSchema };
