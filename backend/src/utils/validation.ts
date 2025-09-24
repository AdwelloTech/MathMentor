import Joi from 'joi';

// User roles enum for validation
export const USER_ROLES = [
  'admin',
  'principal',
  'teacher',
  'student',
  'parent',
  'tutor',
  'hr',
  'finance',
  'support'
] as const;

export type UserRole = typeof USER_ROLES[number];

// Student package types
export const STUDENT_PACKAGES = ['free', 'silver', 'gold'] as const;
export type StudentPackage = typeof STUDENT_PACKAGES[number];

// Register validation schema
export const registerSchema = Joi.object({
  firstName: Joi.string()
    .min(1)
    .max(50)
    .trim()
    .required()
    .messages({
      'string.empty': 'First name is required',
      'string.min': 'First name must be at least 1 character',
      'string.max': 'First name must not exceed 50 characters'
    }),

  lastName: Joi.string()
    .min(1)
    .max(50)
    .trim()
    .required()
    .messages({
      'string.empty': 'Last name is required',
      'string.min': 'Last name must be at least 1 character',
      'string.max': 'Last name must not exceed 50 characters'
    }),

  email: Joi.string()
    .email()
    .lowercase()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'string.empty': 'Email is required'
    }),

  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.max': 'Password must not exceed 128 characters',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
      'string.empty': 'Password is required'
    }),

  confirmPassword: Joi.string()
    .valid(Joi.ref('password'))
    .required()
    .messages({
      'any.only': 'Passwords do not match',
      'string.empty': 'Password confirmation is required'
    }),

  role: Joi.string()
    .valid(...USER_ROLES)
    .required()
    .messages({
      'any.only': `Role must be one of: ${USER_ROLES.join(', ')}`,
      'string.empty': 'Role is required'
    }),

  phone: Joi.string()
    .pattern(/^[\+]?[1-9][\d]{0,15}$/)
    .allow('')
    .optional()
    .messages({
      'string.pattern.base': 'Please provide a valid phone number'
    }),

  // Role-specific validations
  package: Joi.when('role', {
    is: 'student',
    then: Joi.string()
      .valid(...STUDENT_PACKAGES)
      .required()
      .messages({
        'any.only': `Student package must be one of: ${STUDENT_PACKAGES.join(', ')}`,
        'string.empty': 'Package selection is required for students'
      }),
    otherwise: Joi.forbidden()
  }),

  subjects: Joi.when('role', {
    is: 'tutor',
    then: Joi.array()
      .items(Joi.string().trim().min(1).max(100))
      .min(1)
      .required()
      .messages({
        'array.base': 'Subjects must be an array',
        'array.min': 'At least one subject is required for tutors',
        'string.empty': 'Subject names cannot be empty',
        'string.min': 'Subject names must be at least 1 character',
        'string.max': 'Subject names must not exceed 100 characters'
      }),
    otherwise: Joi.forbidden()
  }),

  experience: Joi.when('role', {
    is: 'tutor',
    then: Joi.string()
      .valid('0-1', '1-3', '3-5', '5-10', '10+')
      .required()
      .messages({
        'any.only': 'Please select a valid experience range',
        'string.empty': 'Experience level is required for tutors'
      }),
    otherwise: Joi.forbidden()
  }),

  qualification: Joi.when('role', {
    is: 'tutor',
    then: Joi.string()
      .min(1)
      .max(200)
      .required()
      .messages({
        'string.empty': 'Qualification is required for tutors',
        'string.min': 'Qualification must be at least 1 character',
        'string.max': 'Qualification must not exceed 200 characters'
      }),
    otherwise: Joi.forbidden()
  })
});

// Login validation schema
export const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .lowercase()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'string.empty': 'Email is required'
    }),

  password: Joi.string()
    .required()
    .messages({
      'string.empty': 'Password is required'
    })
});

// Password reset request schema
export const passwordResetRequestSchema = Joi.object({
  email: Joi.string()
    .email()
    .lowercase()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'string.empty': 'Email is required'
    })
});

// Password reset schema
export const passwordResetSchema = Joi.object({
  token: Joi.string()
    .required()
    .messages({
      'string.empty': 'Reset token is required'
    }),

  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.max': 'Password must not exceed 128 characters',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
      'string.empty': 'Password is required'
    }),

  confirmPassword: Joi.string()
    .valid(Joi.ref('password'))
    .required()
    .messages({
      'any.only': 'Passwords do not match',
      'string.empty': 'Password confirmation is required'
    })
});

// Change password schema
export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string()
    .required()
    .messages({
      'string.empty': 'Current password is required'
    }),

  newPassword: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.max': 'Password must not exceed 128 characters',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
      'string.empty': 'New password is required'
    }),

  confirmPassword: Joi.string()
    .valid(Joi.ref('newPassword'))
    .required()
    .messages({
      'any.only': 'Passwords do not match',
      'string.empty': 'Password confirmation is required'
    })
});

/**
 * Validate data against schema
 */
export const validate = <T>(schema: Joi.ObjectSchema<T>, data: any): { value: T; error?: Joi.ValidationError } => {
  const result = schema.validate(data, { abortEarly: false });
  return {
    value: result.value,
    error: result.error
  };
};

/**
 * Validate data and throw error if invalid
 */
export const validateOrThrow = <T>(schema: Joi.ObjectSchema<T>, data: any): T => {
  const { value, error } = validate(schema, data);
  if (error) {
    throw new Error(error.details.map(detail => detail.message).join(', '));
  }
  return value;
};
