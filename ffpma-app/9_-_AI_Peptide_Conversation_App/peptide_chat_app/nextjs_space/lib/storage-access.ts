/**
 * Storage Access API utility for iOS Safari iframe compatibility
 * iOS Safari blocks third-party cookies in iframes by default.
 * This utility requests storage access permission from the user.
 */

export async function requestStorageAccess(): Promise<boolean> {
  // Check if we're in an iframe
  if (typeof window === 'undefined' || window.self === window.top) {
    // Not in an iframe, no need for storage access
    console.log('[StorageAccess] Not in iframe, storage access not needed');
    return true;
  }

  // Check if Storage Access API is available
  if (!document.requestStorageAccess) {
    // Browser doesn't support Storage Access API, assume cookies work
    console.log('[StorageAccess] Storage Access API not supported, assuming cookies work');
    return true;
  }

  try {
    // Check if we already have storage access
    const hasAccess = await document.hasStorageAccess();
    if (hasAccess) {
      console.log('[StorageAccess] Already has storage access');
      return true;
    }

    // Request storage access (requires user interaction)
    console.log('[StorageAccess] Requesting storage access...');
    await document.requestStorageAccess();
    console.log('[StorageAccess] Storage access granted!');
    return true;
  } catch (error) {
    console.error('[StorageAccess] Failed to obtain storage access:', error);
    // Return false so we can show appropriate error message
    return false;
  }
}

/**
 * Check if storage access is needed and available
 */
export async function checkStorageAccessStatus(): Promise<'not-needed' | 'granted' | 'denied' | 'prompt-needed'> {
  // Not in iframe
  if (typeof window === 'undefined' || window.self === window.top) {
    return 'not-needed';
  }

  // API not supported
  if (!document.requestStorageAccess || !document.hasStorageAccess) {
    return 'not-needed';
  }

  try {
    const hasAccess = await document.hasStorageAccess();
    return hasAccess ? 'granted' : 'prompt-needed';
  } catch (error) {
    console.error('[StorageAccess] Error checking access status:', error);
    return 'prompt-needed';
  }
}

/**
 * Check if we're in an iframe and need storage access
 */
export function isInIframe(): boolean {
  if (typeof window === 'undefined') return false;
  return window.self !== window.top;
}

/**
 * Check if Storage Access API is supported
 */
export function isStorageAccessSupported(): boolean {
  if (typeof document === 'undefined') return false;
  return 'requestStorageAccess' in document && 'hasStorageAccess' in document;
}
