import Joi from 'joi';

const signUpSchema = Joi.object({
  name: Joi.string().required().messages({
    'any.required': 'Name is required',
    'string.empty': 'Name is required'
  }),
  email: Joi.string().email().required().messages({
    'any.required': 'Email is required',
    'string.email': 'Email format is invalid',
    'string.empty': 'Email is required'
  }),
  phone_number: Joi.string().pattern(/^\+?\d{1,15}$/).required().messages({
    'any.required': 'Phone number is required',
    'string.pattern.base': 'Invalid phone number format',
    'string.empty': 'Phone number is required'
  }),
  password: Joi.string().min(8).required().messages({
    'any.required': 'Password is required',
    'string.min': 'Password must be at least 8 characters',
    'string.empty': 'Password is required'
  })
});

const signInSchema = Joi.object({
  emailOrphone: Joi.string().required().messages({
    'any.required': 'Email or phone number is required',
    'string.empty': 'Email or phone number is required'
  }),
  password: Joi.string().min(8).required().messages({
    'any.required': 'Password is required',
    'string.min': 'Password must be at least 8 characters',
    'string.empty': 'Password is required'
  })
});

const passResetSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'any.required': 'Email is required',
    'string.email': 'Email format is invalid',
    'string.empty': 'Email is required'
  })
});

const passChangeSchema = Joi.object({
  old_password: Joi.string().required().messages({
    'any.required': 'Old password is required',
    'string.empty': 'Old password is required'
  }),
  new_password: Joi.string().min(8).required().messages({
    'any.required': 'New password is required',
    'string.min': 'New password must be at least 8 characters',
    'string.empty': 'New password is required'
  }),
  password_confirmation: Joi.string().valid(Joi.ref('new_password')).required().messages({
    'any.required': 'Password confirmation is required',
    'any.only': 'Password confirmation must match new password',
    'string.empty': 'Password confirmation is required'
  })
});

const passResetConfirmSchema = Joi.object({
  token: Joi.string().hex().length(64).required().messages({
    'any.required': 'Reset link is invalid',
    'string.empty': 'Reset link is invalid',
    'string.hex': 'Reset link is invalid',
    'string.length': 'Reset link is invalid'
  }),
  password: Joi.string().min(8).required().messages({
    'any.required': 'Password is required',
    'string.min': 'Password must be at least 8 characters',
    'string.empty': 'Password is required'
  }),
  password_confirmation: Joi.string().valid(Joi.ref('password')).required().messages({
    'any.required': 'Password confirmation is required',
    'any.only': 'Password confirmation must match password',
    'string.empty': 'Password confirmation is required'
  })
});

export {
  signUpSchema,
  signInSchema,
  passResetSchema,
  passResetConfirmSchema,
  passChangeSchema
};
