import Joi from 'joi';
import { DESIGNATIONS, INDUSTRIES, SPECIALIZATIONS } from '../constants';

const visibility = Joi.number().valid(0, 1);

// Super admin edit of any user. Every field is optional (send only what changed),
// but at least one must be present.
const adminUserUpdateSchema = Joi.object({
  name: Joi.string().messages({
    'string.empty': 'Name is required'
  }),
  email: Joi.string().email().messages({
    'string.email': 'Email format is invalid',
    'string.empty': 'Email is required'
  }),
  phone_number: Joi.string().pattern(/^\+?\d{1,15}$/).messages({
    'string.pattern.base': 'Invalid phone number format',
    'string.empty': 'Phone number is required'
  }),
  password: Joi.string().min(8).messages({
    'string.min': 'Password must be at least 8 characters',
    'string.empty': 'Password is required'
  }),
  role: Joi.string().valid('user', 'super_admin').messages({
    'any.only': 'Invalid role'
  }),
  designation: Joi.string().valid(...DESIGNATIONS).messages({ 'any.only': 'Invalid designation' }),
  industry: Joi.string().valid(...INDUSTRIES).messages({ 'any.only': 'Invalid industry' }),
  area_of_specialization: Joi.string().valid(...SPECIALIZATIONS).messages({ 'any.only': 'Invalid area of specialization' }),
  brief_bio: Joi.string().allow('', null),
  experience: Joi.string().allow('', null),
  detailed_bio: Joi.string().allow('', null),
  scheduling_assistance: Joi.string().max(100).allow('', null),
  profile_image: Joi.string().allow('', null),

  name_visibility: visibility,
  profile_visibility: visibility,
  brief_bio_visibility: visibility,
  experience_visibility: visibility,
  calender_visibility: visibility,
  scheduling_visibility: visibility,
  detailed_bio_visibility: visibility
}).min(1).messages({
  'object.min': 'Nothing to update'
});

export { adminUserUpdateSchema };
