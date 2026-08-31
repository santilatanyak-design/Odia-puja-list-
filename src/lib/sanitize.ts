/**
 * Input Sanitization & Security Utilities
 * Prevents XSS, SQL/NoSQL Injection, Script Injection, and Payload Manipulation
 */

/**
 * Strips HTML tags and escapes dangerous special characters
 */
export function sanitizeText(text: string | null | undefined): string {
  if (!text) return '';
  return String(text)
    .replace(/<[^>]*>/g, '') // Strip HTML tags
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/`/g, '&#x60;')
    .trim();
}

/**
 * Unescapes text for safe display inside React (React handles standard JSX text escaping safely,
 * but stripping tags first prevents stored XSS)
 */
export function sanitizePlainString(text: string | null | undefined): string {
  if (!text) return '';
  return String(text)
    .replace(/<[^>]*>/g, '') // Strip HTML tags
    .replace(/javascript:/gi, '') // Strip JS protocol
    .replace(/on\w+=/gi, '') // Strip inline event handlers like onerror=
    .trim();
}

/**
 * Strictly sanitizes PIN to 4 digits (0-9)
 */
export function sanitizePin(pin: string): string {
  if (!pin) return '';
  return pin.replace(/\D/g, '').slice(0, 4);
}

/**
 * Strictly sanitizes Mobile Phone numbers to 10 digits (0-9)
 */
export function sanitizePhone(phone: string): string {
  if (!phone) return '';
  return phone.replace(/\D/g, '').slice(0, 10);
}

/**
 * Strictly sanitizes UTR / UPI Transaction IDs to uppercase alphanumeric (A-Z, 0-9) max 20 chars
 */
export function sanitizeUtr(utr: string): string {
  if (!utr) return '';
  return utr.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 20);
}

/**
 * Strictly sanitizes Pujari ID or Admin Master ID/Password (preserving @, alphanumeric, hyphen, dot, underscore)
 */
export function sanitizeIdentifier(id: string): string {
  if (!id) return '';
  return id.replace(/[^a-zA-Z0-9\-_@.]/g, '').trim().slice(0, 50);
}

/**
 * Generic user-friendly Odia error message to prevent exposing internal system or stack trace details
 */
export const GENERIC_ODIA_ERROR_MESSAGE = 'କିଛି ସମସ୍ୟା ଦେଖାଦେଇଛି, ଦୟାକରି ପୁଣି ଚେଷ୍ଟା କରନ୍ତୁ।';

/**
 * Utility function to format unknown catch errors safely
 */
export function getSafeErrorMessage(error: unknown, fallbackMessage: string = GENERIC_ODIA_ERROR_MESSAGE): string {
  if (Boolean((import.meta as any).env?.DEV)) {
    console.error('[Internal System Error]:', error);
  } else {
    console.error('[System Failure Logged]');
  }
  return fallbackMessage;
}

/**
 * Rate Limiting / Debounce Throttle Map for preventing brute force & spam clicks
 */
const actionThrottleTimestamps: Map<string, number> = new Map();

/**
 * Checks if an action key is currently throttled (default cooldown: 2000ms / 2s)
 */
export function isActionThrottled(actionKey: string, cooldownMs: number = 2000): boolean {
  const now = Date.now();
  const lastTime = actionThrottleTimestamps.get(actionKey) || 0;
  if (now - lastTime < cooldownMs) {
    return true; // Action is throttled!
  }
  actionThrottleTimestamps.set(actionKey, now);
  return false;
}
