import { WORKSPACE_ENVIRONMENTS, WorkspaceEnvironment } from '../config/types';

export const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

export const isNonNegativeInteger = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0;

export const isPositiveNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0;

export const isDecimalString = (value: unknown): value is string => {
  if (typeof value !== 'string') {
    return false;
  }

  if (value.trim().length === 0) {
    return false;
  }

  return !Number.isNaN(Number(value));
};

export const isIsoDateString = (value: unknown): value is string => {
  if (typeof value !== 'string') {
    return false;
  }

  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp);
};

export const isDateInstance = (value: unknown): value is Date =>
  value instanceof Date && !Number.isNaN(value.getTime());

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

export const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string' && item.trim().length > 0);

export const isWorkspaceEnvironment = (value: unknown): value is WorkspaceEnvironment =>
  typeof value === 'string' && (WORKSPACE_ENVIRONMENTS as ReadonlyArray<string>).includes(value);
