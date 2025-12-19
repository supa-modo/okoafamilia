import React, { useState, useRef, useEffect } from "react";
import { FiCalendar } from "react-icons/fi";

interface DateInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  name?: string;
  id?: string;
  error?: boolean;
}

const DateInput: React.FC<DateInputProps> = ({
  value,
  onChange,
  className = "",
  placeholder = "DD/MMM/YYYY",
  disabled = false,
  name,
  id,
  error = false,
}) => {
  const [displayValue, setDisplayValue] = useState("");
  const dateInputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const monthAdvanceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  const monthAbbreviations = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const getMonthAbbr = (monthNum: number): string => {
    if (monthNum >= 1 && monthNum <= 12) {
      return monthAbbreviations[monthNum - 1];
    }
    return "";
  };

  const getMonthNumber = (monthAbbr: string): number => {
    const index = monthAbbreviations.findIndex(
      (abbr) => abbr.toLowerCase() === monthAbbr.toLowerCase()
    );
    return index >= 0 ? index + 1 : 0;
  };

  const formatForDisplay = (isoDate: string): string => {
    if (!isoDate) return "";
    try {
      const date = new Date(isoDate);
      if (isNaN(date.getTime())) return "";
      const day = String(date.getDate()).padStart(2, "0");
      const monthAbbr = monthAbbreviations[date.getMonth()];
      const year = date.getFullYear();
      return `${day}/${monthAbbr}/${year}`;
    } catch {
      return "";
    }
  };

  const parseToISO = (input: string): string => {
    const parts = input.split("/").filter(Boolean);

    if (parts.length === 3) {
      const day = parts[0].padStart(2, "0");
      let monthNum: number;

      if (isNaN(parseInt(parts[1]))) {
        monthNum = getMonthNumber(parts[1]);
      } else {
        monthNum = parseInt(parts[1]);
      }

      if (monthNum < 1 || monthNum > 12) {
        return "";
      }

      const month = String(monthNum).padStart(2, "0");
      const year = parts[2];

      const date = new Date(`${year}-${month}-${day}`);
      if (
        !isNaN(date.getTime()) &&
        date.getDate() === parseInt(day) &&
        date.getMonth() + 1 === monthNum &&
        date.getFullYear() === parseInt(year)
      ) {
        return `${year}-${month}-${day}`;
      }
    }
    return "";
  };

  useEffect(() => {
    if (value) {
      setDisplayValue(formatForDisplay(value));
    } else {
      setDisplayValue("");
    }
  }, [value]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value;

    if (monthAdvanceTimeoutRef.current) {
      clearTimeout(monthAdvanceTimeoutRef.current);
      monthAdvanceTimeoutRef.current = null;
    }

    const parts = input.split("/");
    let day = parts[0] || "";
    let month = parts[1] || "";
    let year = parts[2] || "";

    day = day.replace(/\D/g, "");
    if (day.length > 2) {
      day = day.substring(0, 2);
    }

    let shouldAutoAdvanceToYear = false;
    let monthDigits = "";

    if (month.length > 0) {
      monthDigits = month.replace(/\D/g, "");

      if (monthDigits.length > 0) {
        const monthNum = parseInt(monthDigits);

        if (monthDigits.length === 1 && monthNum >= 1 && monthNum <= 9) {
          month = monthDigits;
        } else if (monthDigits.length === 2 && monthNum >= 10 && monthNum <= 12) {
          month = getMonthAbbr(monthNum);
          shouldAutoAdvanceToYear = true;
        } else if (monthNum >= 1 && monthNum <= 12) {
          month = getMonthAbbr(monthNum);
          shouldAutoAdvanceToYear = true;
        } else if (monthDigits.length > 2) {
          const limitedNum = parseInt(monthDigits.substring(0, 2));
          if (limitedNum >= 1 && limitedNum <= 12) {
            month = getMonthAbbr(limitedNum);
            shouldAutoAdvanceToYear = true;
          } else {
            month = monthDigits.substring(0, 2);
          }
        } else {
          month = monthDigits;
        }
      } else {
        if (month.length > 3) {
          month = month.substring(0, 3);
        }
      }
    }

    year = year.replace(/\D/g, "");
    if (year.length > 4) {
      year = year.substring(0, 4);
    }

    let formatted = day;

    if (day.length === 2) {
      formatted += "/";
      if (month) {
        if (monthDigits && monthDigits.length > 0 && monthDigits.length < 2) {
          formatted += monthDigits;
        } else if (monthDigits && monthDigits.length === 2) {
          const monthNum = parseInt(monthDigits);
          if (monthNum >= 1 && monthNum <= 12) {
            formatted += getMonthAbbr(monthNum);
          } else {
            formatted += monthDigits;
          }
        } else {
          formatted += month;
        }
      }
    } else if (day.length > 0) {
      formatted = day;
    }

    if (month && month.length === 3) {
      formatted += "/";
      if (year) {
        formatted += year;
      }
    } else if (monthDigits && monthDigits.length === 2) {
      const monthNum = parseInt(monthDigits);
      if (monthNum >= 1 && monthNum <= 12 && day.length === 2) {
        formatted = `${day}/${getMonthAbbr(monthNum)}/`;
        if (year) {
          formatted += year;
        }
      }
    }

    setDisplayValue(formatted);

    if (day.length === 2 && !month && textInputRef.current) {
      setTimeout(() => {
        if (textInputRef.current && textInputRef.current.value === formatted) {
          const newPosition = day.length + 1;
          textInputRef.current.setSelectionRange(newPosition, newPosition);
        }
      }, 0);
    }

    if (
      monthDigits &&
      monthDigits.length === 1 &&
      parseInt(monthDigits) >= 1 &&
      parseInt(monthDigits) <= 9
    ) {
      const monthNum = parseInt(monthDigits);
      monthAdvanceTimeoutRef.current = setTimeout(() => {
        if (textInputRef.current) {
          const currentValue = textInputRef.current.value;
          const currentParts = currentValue.split("/");
          const currentMonthDigits =
            currentParts[1]?.replace(/\D/g, "") || "";

          if (
            currentMonthDigits.length === 1 &&
            parseInt(currentMonthDigits) === monthNum
          ) {
            const monthAbbr = getMonthAbbr(monthNum);
            const newFormatted =
              day.length === 2 ? `${day}/${monthAbbr}/` : currentValue;

            setDisplayValue(newFormatted);

            setTimeout(() => {
              if (
                textInputRef.current &&
                textInputRef.current.value === newFormatted
              ) {
                const newPosition = day.length + 1 + monthAbbr.length + 1;
                textInputRef.current.setSelectionRange(newPosition, newPosition);
              }
            }, 0);
          }
        }
        monthAdvanceTimeoutRef.current = null;
      }, 700);
    } else if (
      shouldAutoAdvanceToYear &&
      month.length === 3 &&
      textInputRef.current
    ) {
      const monthNum = monthDigits
        ? parseInt(monthDigits)
        : getMonthNumber(month);
      const delay = monthNum >= 10 ? 800 : 600;

      monthAdvanceTimeoutRef.current = setTimeout(() => {
        if (textInputRef.current) {
          const currentValue = textInputRef.current.value;
          if (
            currentValue === formatted ||
            currentValue.startsWith(
              formatted.substring(0, day.length + 1 + month.length)
            )
          ) {
            const newPosition = day.length + 1 + month.length + 1;
            textInputRef.current.setSelectionRange(newPosition, newPosition);
          }
        }
        monthAdvanceTimeoutRef.current = null;
      }, delay);
    }

    if (
      formatted.length === 11 &&
      day.length === 2 &&
      month.length === 3 &&
      year.length === 4
    ) {
      const isoDate = parseToISO(formatted);
      if (isoDate) {
        onChange(isoDate);
      }
    } else if (formatted.length === 0) {
      onChange("");
    }
  };

  const handleDatePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      onChange(e.target.value);
    }
  };

  const handleCalendarClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (!disabled && dateInputRef.current) {
      setTimeout(() => {
        if (dateInputRef.current) {
          try {
            if (
              typeof (dateInputRef.current as any).showPicker === "function"
            ) {
              (dateInputRef.current as any).showPicker().catch(() => {
                dateInputRef.current?.focus();
                dateInputRef.current?.click();
              });
            } else {
              dateInputRef.current.focus();
              dateInputRef.current.click();
            }
          } catch {
            dateInputRef.current.focus();
            dateInputRef.current.click();
          }
        }
      }, 0);
    }
  };

  const handleBlur = () => {
    if (monthAdvanceTimeoutRef.current) {
      clearTimeout(monthAdvanceTimeoutRef.current);
      monthAdvanceTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (monthAdvanceTimeoutRef.current) {
        clearTimeout(monthAdvanceTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          ref={textInputRef}
          type="text"
          value={displayValue}
          onChange={handleTextChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          name={name}
          id={id}
          className={`${className} pr-10 ${error ? "border-red-500" : ""}`}
          maxLength={11}
          inputMode="text"
        />

        <input
          ref={dateInputRef}
          type="date"
          value={value || ""}
          onChange={handleDatePickerChange}
          style={{
            position: "absolute",
            left: "-9999px",
            width: "1px",
            height: "1px",
            opacity: 0,
            pointerEvents: "auto",
          }}
          aria-hidden="true"
          tabIndex={-1}
        />

        <button
          type="button"
          onClick={handleCalendarClick}
          disabled={disabled}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed z-20"
          tabIndex={-1}
          aria-label="Open date picker"
        >
          <FiCalendar className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default DateInput;

