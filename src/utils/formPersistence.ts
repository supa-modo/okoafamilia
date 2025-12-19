/**
 * Form Data Persistence Utility for Okoa Familia
 * Handles localStorage operations for registration forms with 24-hour expiration
 */

const STORAGE_KEYS = {
  REGISTER: "okoa-familia-register-form",
} as const;

const EXPIRATION_HOURS = 24;
const EXPIRATION_MS = EXPIRATION_HOURS * 60 * 60 * 1000;

interface StoredFormData {
  formData: any;
  dependants?: any[];
  currentStep?: number;
  timestamp: number;
}

/**
 * Save form data to localStorage
 */
export function saveFormData(
  storageKey: keyof typeof STORAGE_KEYS,
  data: {
    formData: any;
    dependants?: any[];
    currentStep?: number;
  }
): void {
  try {
    const stored: StoredFormData = {
      ...data,
      timestamp: Date.now(),
    };
    localStorage.setItem(STORAGE_KEYS[storageKey], JSON.stringify(stored));
  } catch (e) {
    console.error(`Error saving form data to ${storageKey}:`, e);
  }
}

/**
 * Load form data from localStorage
 * Returns null if data doesn't exist or has expired
 */
export function loadFormData(storageKey: keyof typeof STORAGE_KEYS): {
  formData: any;
  dependants?: any[];
  currentStep?: number;
} | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS[storageKey]);
    if (!stored) {
      return null;
    }

    const parsed: StoredFormData = JSON.parse(stored);

    if (parsed.timestamp && Date.now() - parsed.timestamp > EXPIRATION_MS) {
      localStorage.removeItem(STORAGE_KEYS[storageKey]);
      return null;
    }

    const { timestamp, ...data } = parsed;
    return data;
  } catch (e) {
    console.error(`Error loading form data from ${storageKey}:`, e);
    localStorage.removeItem(STORAGE_KEYS[storageKey]);
    return null;
  }
}

/**
 * Clear form data from localStorage
 */
export function clearFormData(storageKey: keyof typeof STORAGE_KEYS): void {
  try {
    localStorage.removeItem(STORAGE_KEYS[storageKey]);
  } catch (e) {
    console.error(`Error clearing form data from ${storageKey}:`, e);
  }
}

/**
 * Sanitize form data before saving (remove sensitive fields like passwords)
 */
export function sanitizeFormData(formData: any): any {
  const sanitized = { ...formData };

  if (sanitized.password) {
    delete sanitized.password;
  }
  if (sanitized.confirm_password) {
    delete sanitized.confirm_password;
  }

  return sanitized;
}

export { STORAGE_KEYS };

