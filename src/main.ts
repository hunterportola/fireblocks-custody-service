/* eslint-disable no-console */

import 'dotenv/config';

import { TurnkeyClientManager } from './core/turnkey-client';
import { toTurnkeyServiceError } from './core/error-handler';
import type { TurnkeyEnvironment } from './config/types';
import { isNonEmptyString } from './utils/type-guards';

async function bootstrap(): Promise<void> {
  const apiPrivateKey = process.env.TURNKEY_API_PRIVATE_KEY;
  const apiPublicKey = process.env.TURNKEY_API_PUBLIC_KEY;
  const apiKeyId = process.env.TURNKEY_API_KEY_ID;

  const hasCredentials =
    isNonEmptyString(apiPrivateKey) && isNonEmptyString(apiPublicKey) && isNonEmptyString(apiKeyId);

  if (!hasCredentials) {
    console.log('Turnkey credentials not configured; skipping client initialization.');
    return;
  }

  const organizationIdValue = process.env.TURNKEY_ORGANIZATION_ID;
  if (!isNonEmptyString(organizationIdValue)) {
    console.warn('TURNKEY_ORGANIZATION_ID not set; unable to initialize client');
    return;
  }
  const organizationId = organizationIdValue.trim();

  const environment = (process.env.TURNKEY_ENVIRONMENT as TurnkeyEnvironment) ?? 'sandbox';

  try {
    await TurnkeyClientManager.initialize({
      platform: {
        organizationId,
        environment,
        apiBaseUrl: process.env.TURNKEY_API_BASE_URL,
        originator: {
          originatorId: 'bootstrap_runner',
          displayName: 'Bootstrap Runner',
        },
      },
    });
    console.log('Turnkey client ready.');
  } catch (error) {
    const serviceError = toTurnkeyServiceError(error);
    console.error('Failed to initialize Turnkey client:', serviceError.message);
  }
}

bootstrap().catch((error) => {
  const serviceError = toTurnkeyServiceError(error);
  console.error('Unexpected bootstrap failure:', serviceError.message);
});
