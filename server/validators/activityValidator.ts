import Joi from 'joi';

const activitySchema = Joi.object({
  name: Joi.string().required().messages({
    'any.required': 'Activity name is required',
    'string.empty': 'Activity name is required'
  }),
  description: Joi.string().allow('', null).optional()
});

export { activitySchema };
