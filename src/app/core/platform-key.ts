/** Access key required by the free-tier host fronting the real marketplace API
 *  (xstoreegy*.etempurl.com) to pass its infra-level gate — not a per-admin credential.
 *  Must only ever be sent to that trusted host, never to a base URL an admin has typed
 *  into a "custom API base" override (login's base row, the delivery-backend pilot's
 *  connect bar) — otherwise it leaks to whatever third-party host they point at. */
const TRUSTED_HOST_PATTERN = /etempurl|jtempurl/;

export const PLATFORM_ACCESS_KEY = 'Basic MTEzMjQ4ODM6NjAtZGF5ZnJlZXRyaWFs';

export function isTrustedPlatformHost(url: URL): boolean {
  return url.host === window.location.host || TRUSTED_HOST_PATTERN.test(url.host);
}
