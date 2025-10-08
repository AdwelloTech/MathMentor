import React, { useState, useRef, useEffect } from "react";
import { ChevronDownIcon, XMarkIcon, CheckIcon } from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";

interface MultiSelectOption {
  value: string;
  label: string;
  color?: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  maxHeight?: string;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = "Select options...",
  disabled = false,
  className,
  maxHeight = "200px",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (optionValue: string) => {
    const newValue = value.includes(optionValue)
      ? value.filter((v) => v !== optionValue)
      : [...value, optionValue];
    onChange(newValue);
  };

  const removeOption = (optionValue: string) => {
    onChange(value.filter((v) => v !== optionValue));
  };

  const selectedOptions = options.filter((option) =>
    value.includes(option.value)
  );

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Trigger */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          "flex min-h-12 w-full items-center justify-between rounded-2xl border-2 border-slate-600 bg-slate-600/50 px-4 py-3 text-left text-slate-200 shadow-sm transition-all duration-200",
          "hover:border-green-500/50 focus:border-green-500 focus:ring-4 focus:ring-green-500/20 focus:outline-none",
          disabled && "cursor-not-allowed opacity-50",
          !disabled && "cursor-pointer"
        )}
      >
        <div className="flex flex-1 flex-wrap gap-1">
          {selectedOptions.length === 0 ? (
            <span className="text-slate-400">{placeholder}</span>
          ) : (
            selectedOptions.map((option) => (
              <span
                key={option.value}
                className="inline-flex items-center gap-1 rounded-lg bg-green-600/20 px-2 py-1 text-sm text-green-300"
              >
                {option.color && (
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: option.color }}
                  />
                )}
                {option.label}
                {!disabled && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeOption(option.value);
                    }}
                    className="ml-1 hover:text-red-300"
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                )}
              </span>
            ))
          )}
        </div>
        <ChevronDownIcon
          className={cn(
            "h-5 w-5 text-slate-400 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-50 mt-2 w-full rounded-2xl border-2 border-slate-600 bg-slate-700 shadow-xl"
          style={{ maxHeight }}
        >
          <div className="overflow-auto p-2">
            {options.length === 0 ? (
              <div className="px-3 py-2 text-sm text-slate-400">
                No options available
              </div>
            ) : (
              options.map((option) => {
                const isSelected = value.includes(option.value);
                return (
                  <div
                    key={option.value}
                    onClick={() => toggleOption(option.value)}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-sm transition-colors",
                      "hover:bg-slate-600/50",
                      isSelected && "bg-green-600/20"
                    )}
                  >
                    <div className="flex h-4 w-4 items-center justify-center">
                      {isSelected && (
                        <CheckIcon className="h-3 w-3 text-green-400" />
                      )}
                    </div>
                    {option.color && (
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: option.color }}
                      />
                    )}
                    <span className={cn(
                      "flex-1",
                      isSelected ? "text-green-300" : "text-slate-200"
                    )}>
                      {option.label}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiSelect;



