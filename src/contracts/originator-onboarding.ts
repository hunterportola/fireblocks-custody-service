import type {
  OriginatorRegistrationData,
  TenantProvisioningResult,
  TenantInfo,
} from '../services/control-plane-service';
import type { OnboardingSessionRecord } from '../services/onboarding/types';

export type OriginatorOnboardingRequest = OriginatorRegistrationData;

export interface OriginatorOnboardingResponse {
  result: TenantProvisioningResult;
}

export interface OnboardingStatusResponse {
  originatorId: string;
  tenant?: TenantInfo;
  session?: OnboardingSessionRecord | null;
}
