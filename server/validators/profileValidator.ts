import Joi from 'joi';
import { DESIGNATIONS, INDUSTRIES, SPECIALIZATIONS } from '../constants';

const profileSchema = Joi.object({
  name: Joi.string().required().messages({
    'any.required': 'Name is required',
    'string.empty': 'Name is required'
  }),
  designation: Joi.string().valid(...DESIGNATIONS).required().messages({
    'any.required': 'Designation is required',
    'any.only': 'Invalid designation',
    'string.empty': 'Designation is required'
  }),
  area_of_specialization: Joi.string().valid(...SPECIALIZATIONS).required().messages({
    'any.required': 'Area of specialization is required',
    'any.only': 'Invalid area of specialization',
    'string.empty': 'Area of specialization is required'
  }),
  industry: Joi.string().valid(...INDUSTRIES).required().messages({
    'any.required': 'Industry is required',
    'any.only': 'Invalid industry',
    'string.empty': 'Industry is required'
  }),
  experience: Joi.string().allow('', null).optional(),
  calendar: Joi.string().allow('', null).optional(),
  scheduling_assistance: Joi.string().max(100).allow('', null).optional(),
  brief_bio: Joi.string().required().messages({
    'any.required': 'Brief bio is required',
    'string.empty': 'Brief bio is required'
  }),
  detailed_bio: Joi.string().allow('', null).optional(),
  profile_image: Joi.string().allow('', null).optional(),

  // Visibility fields
  name_visibility: Joi.number().valid(0, 1).optional(),
  profile_visibility: Joi.number().valid(0, 1).optional(),
  brief_bio_visibility: Joi.number().valid(0, 1).optional(),
  experience_visibility: Joi.number().valid(0, 1).optional(),
  calender_visibility: Joi.number().valid(0, 1).optional(),
  scheduling_visibility: Joi.number().valid(0, 1).optional(),
  detailed_bio_visibility: Joi.number().valid(0, 1).optional()
});

export { profileSchema };
