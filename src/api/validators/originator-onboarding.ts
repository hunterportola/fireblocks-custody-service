import { body } from 'express-validator';

export const originatorRegistrationValidators = [
  body('company.legalName').isString().withMessage('company.legalName is required'),
  body('company.displayName').isString().withMessage('company.displayName is required'),
  body('company.originatorId')
    .isString()
    .matches(/^[a-z0-9_]+$/)
    .withMessage('company.originatorId must be lowercase alphanumeric/underscore'),
  body('primaryContact.email').isEmail().withMessage('primaryContact.email must be a valid email'),
  body('primaryContact.firstName').isString().withMessage('primaryContact.firstName is required'),
  body('primaryContact.lastName').isString().withMessage('primaryContact.lastName is required'),
  body('configuration.environment')
    .isIn(['sandbox', 'staging', 'production'])
    .withMessage('configuration.environment must be sandbox|staging|production'),
  body('configuration.isolationType')
    .optional()
    .isIn(['dedicated_database', 'dedicated_schema', 'shared_with_rls'])
    .withMessage('configuration.isolationType invalid'),
];
