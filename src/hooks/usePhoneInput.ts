/**
 * Hook for managing phone input with auto-prefill and normalization
 * Automatically prefills "+254" on focus and normalizes on submission
 */

import { useState, useCallback, useRef, useEffect } from "react";

interface UsePhoneInputOptions {
  initialValue?: string;
  onValueChange?: (value: string) => void;
}

interface UsePhoneInputReturn {
  displayValue: string;
  normalizedValue: string;
  handleFocus: (e: React.FocusEvent<HTMLInputElement>) => void;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  setValue: (value: string) => void;
}

/**
 * Normalizes phone number for submission
 */
function normalizeForSubmission(phone: string): string {
  if (!phone) return "";

  let cleaned = phone.trim().replace(/\s+/g, "");

  if (cleaned.startsWith("+254")) {
    const digits = cleaned.substring(4).replace(/\D/g, "");
    if (digits.length === 9) {
      return `+254${digits}`;
    }
    if (digits.startsWith("0") && digits.length === 10) {
      return `+254${digits.substring(1)}`;
    }
    return cleaned;
  }

  cleaned = cleaned.replace(/\D/g, "");

  if (cleaned.startsWith("07") || cleaned.startsWith("01")) {
    return "+254" + cleaned.substring(1);
  } else if (cleaned.startsWith("254")) {
    return "+" + cleaned;
  } else if (
    cleaned.length === 9 &&
    (cleaned.startsWith("7") || cleaned.startsWith("1"))
  ) {
    return "+254" + cleaned;
  } else if (
    cleaned.length === 10 &&
    (cleaned.startsWith("07") || cleaned.startsWith("01"))
  ) {
    return "+254" + cleaned.substring(1);
  } else if (cleaned.length > 0) {
    if (cleaned.startsWith("0")) {
      return "+254" + cleaned.substring(1);
    }
    return "+254" + cleaned;
  }

  return "";
}

/**
 * Formats initial value for display
 */
function formatForDisplay(value: string): string {
  if (!value) return "";

  if (value.startsWith("+254")) {
    return value;
  }

  const digits = value.replace(/\D/g, "");

  if (digits.length === 9 && (digits.startsWith("7") || digits.startsWith("1"))) {
    return "+254" + digits;
  }

  if (
    digits.length === 10 &&
    (digits.startsWith("07") || digits.startsWith("01"))
  ) {
    return "+254" + digits.substring(1);
  }

  if (digits.startsWith("254") && digits.length === 12) {
    return "+" + digits;
  }

  if (digits.length > 0) {
    if (digits.startsWith("0")) {
      return "+254" + digits.substring(1);
    }
    return "+254" + digits;
  }

  return value;
}

export function usePhoneInput(
  options: UsePhoneInputOptions = {}
): UsePhoneInputReturn {
  const { initialValue = "", onValueChange } = options;
  const [displayValue, setDisplayValue] = useState<string>(() =>
    formatForDisplay(initialValue)
  );
  const inputRef = useRef<HTMLInputElement | null>(null);
  const hasPrefilledRef = useRef(false);

  useEffect(() => {
    if (initialValue !== undefined) {
      const formatted = formatForDisplay(initialValue);
      setDisplayValue(formatted);
      hasPrefilledRef.current = false;
    }
  }, [initialValue]);

  const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    const input = e.target;
    inputRef.current = input;

    if (!input.value || input.value.trim() === "") {
      input.value = "+254";
      setDisplayValue("+254");
      hasPrefilledRef.current = true;
      setTimeout(() => {
        input.setSelectionRange(4, 4);
      }, 0);
    }
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      let value = e.target.value;

      if (hasPrefilledRef.current && value === "+254") {
        setDisplayValue("+254");
        onValueChange?.("+254");
        return;
      }

      if (value === "") {
        setDisplayValue("");
        onValueChange?.("");
        return;
      }

      if (!value.startsWith("+254")) {
        const digitsOnly = value.replace(/\D/g, "");
        value = digitsOnly ? `+254${digitsOnly}` : "+254";
      }

      let localDigits = value.slice(4).replace(/\D/g, "");
      if (localDigits.length > 10) {
        localDigits = localDigits.substring(0, 10);
      }

      if (localDigits.length === 10 && localDigits.startsWith("0")) {
        localDigits = localDigits.substring(1);
      }

      value = `+254${localDigits}`;

      setDisplayValue(value);
      onValueChange?.(value);
    },
    [onValueChange]
  );

  const setValue = useCallback((value: string) => {
    const formatted = formatForDisplay(value);
    setDisplayValue(formatted);
    hasPrefilledRef.current = false;
  }, []);

  const normalizedValue = normalizeForSubmission(displayValue);

  return {
    displayValue,
    normalizedValue,
    handleFocus,
    handleChange,
    setValue,
  };
}

