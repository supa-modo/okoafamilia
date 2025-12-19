/**
 * Validation utility functions
 */

/**
 * Check if a date string represents someone who is at least 18 years old
 * @param dateString - Date in YYYY-MM-DD format
 * @returns true if age is 18 or older, false otherwise
 */
export function isAtLeast18YearsOld(dateString: string): boolean {
  if (!dateString) return false;

  try {
    const birthDate = new Date(dateString);
    if (isNaN(birthDate.getTime())) return false;

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age >= 18;
  } catch {
    return false;
  }
}

/**
 * Get age validation error message if date is invalid or person is under 18
 * @param dateString - Date in YYYY-MM-DD format
 * @returns Error message string or null if valid
 */
export function getAgeValidationError(dateString: string): string | null {
  if (!dateString) return null;

  try {
    const birthDate = new Date(dateString);
    if (isNaN(birthDate.getTime())) {
      return "Invalid date format";
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    birthDate.setHours(0, 0, 0, 0);

    if (birthDate > today) {
      return "Date of birth cannot be in the future";
    }

    if (!isAtLeast18YearsOld(dateString)) {
      return "Must be at least 18 years old";
    }

    return null;
  } catch {
    return "Invalid date format";
  }
}

/**
 * Normalize phone number to international format (+254XXXXXXXXX) for submission
 */
export function normalizePhoneNumber(phone: string): string {
  if (!phone) return phone;

  let cleaned = phone.trim().replace(/\s+/g, "");

  if (cleaned.startsWith("+254")) {
    let digits = cleaned.substring(4).replace(/\D/g, "");
    if (digits.length === 10 && digits.startsWith("0")) {
      digits = digits.substring(1);
    }
    if (digits.length === 9) {
      return `+254${digits}`;
    }
    return cleaned;
  }

  cleaned = cleaned.replace(/\D/g, "");

  if (!cleaned) {
    return phone;
  }

  if (cleaned.startsWith("254")) {
    cleaned = cleaned.substring(3);
  }

  if (cleaned.length === 10 && cleaned.startsWith("0")) {
    cleaned = cleaned.substring(1);
  }

  if (cleaned.length === 9 && /^[71]/.test(cleaned)) {
    return `+254${cleaned}`;
  }

  if (cleaned.length > 9) {
    return `+254${cleaned.slice(-9)}`;
  }

  return `+254${cleaned}`;
}

/**
 * Normalize an agent code to the 0XXXXXXXXX format
 */
export function normalizeAgentCode(code: string | undefined | null): string {
  if (!code) {
    return "";
  }

  let cleaned = code.trim();

  if (!cleaned) {
    return "";
  }

  cleaned = cleaned.replace(/[\s\-()]/g, "");

  if (cleaned.startsWith("+")) {
    cleaned = cleaned.substring(1);
  }

  cleaned = cleaned.replace(/\D/g, "");

  if (!cleaned) {
    return "";
  }

  if (cleaned.startsWith("254")) {
    cleaned = "0" + cleaned.substring(3);
  } else if (cleaned.startsWith("07") || cleaned.startsWith("01")) {
    cleaned = cleaned;
  } else if (cleaned.length === 9) {
    cleaned = "0" + cleaned;
  } else if (cleaned.length === 10 && cleaned.startsWith("0")) {
    cleaned = cleaned;
  } else if (cleaned.length === 10 && !cleaned.startsWith("0")) {
    cleaned = "0" + cleaned.substring(1);
  } else if (cleaned.length > 10) {
    cleaned = cleaned.slice(-10);
    if (!cleaned.startsWith("0")) {
      cleaned = "0" + cleaned.substring(1);
    }
  } else if (cleaned.length < 9) {
    return "";
  }

  return cleaned;
}

