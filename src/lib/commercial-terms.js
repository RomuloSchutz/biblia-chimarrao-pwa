export const COMMERCIAL_TERMS_VERSION = '08/10/2026'

export function currentCommercialAcceptance() {
  return {
    accepted: true,
    policy_version: COMMERCIAL_TERMS_VERSION,
    license_version: COMMERCIAL_TERMS_VERSION
  }
}
