import React, { useState, useRef, useEffect } from "react";
import { TbSearch, TbArrowRight, TbAlertCircle } from "react-icons/tb";

interface SearchableDropdownProps {
  label?: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  leftIcon?: React.ReactNode;
  disabled?: boolean;
}

const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  label,
  options,
  value,
  onChange,
  placeholder = "Choose an option",
  error,
  required = false,
  leftIcon,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredOptions = options.filter((option) =>
    option.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSelect = (option: string) => {
    onChange(option);
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor="dropdown"
          className="block text-[0.83rem] lg:text-sm font-semibold text-gray-700 pl-1 mb-1 lg:mb-1.5"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative" ref={dropdownRef}>
        <div
          className={`relative w-full pl-12 pr-10 py-2 lg:py-2.5 font-outfit font-medium border rounded-lg text-[0.85rem] lg:text-[0.95rem] focus:ring-1 focus:outline-none transition-all cursor-pointer bg-white ${
            disabled
              ? "bg-gray-100 cursor-not-allowed opacity-60"
              : error
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:ring-primary-600 focus:border-primary-600"
          }`}
          onClick={() => !disabled && setIsOpen(!isOpen)}
        >
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              {leftIcon}
            </div>
          )}
          <span
            className={value ? "text-gray-900" : "text-gray-400/60 font-normal"}
          >
            {value || placeholder}
          </span>
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <TbArrowRight
              className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${
                isOpen ? "rotate-90" : ""
              }`}
            />
          </div>
        </div>
        {isOpen && !disabled && (
          <div className="absolute z-10 mt-1 w-full bg-white shadow-xl rounded-xl border border-gray-200 max-h-72 overflow-y-auto">
            <div className="sticky top-0 p-2 bg-white border-b border-gray-200">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <TbSearch className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:ring-primary-500 focus:border-primary-500 bg-white"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
            <ul className="py-1">
              {filteredOptions.map((option) => (
                <li key={option}>
                  <button
                    type="button"
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-200 transition-colors"
                    onClick={() => handleSelect(option)}
                  >
                    {option}
                  </button>
                </li>
              ))}
              {filteredOptions.length === 0 && (
                <li className="px-4 py-2 text-sm text-gray-500">
                  No options found
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1.5 text-sm text-red-600 font-medium flex items-center">
          <TbAlertCircle className="w-4 h-4 mr-1" />
          {error}
        </p>
      )}
    </div>
  );
};

export default SearchableDropdown;

