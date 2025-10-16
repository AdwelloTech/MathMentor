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
    <div ref={containerRef} className={cn("relative w-full", className)}>
      {/* Trigger */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          "flex min-h-12 w-full items-center justify-between rounded-2xl border border-border bg-background px-4 py-2.5 text-left text-foreground shadow-sm transition-all duration-200",
          "hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none",
          disabled && "cursor-not-allowed opacity-50",
          !disabled && "cursor-pointer"
        )}
      >
        <div className="flex flex-1 flex-wrap gap-1.5">
          {selectedOptions.length === 0 ? (
            <span className="text-muted-foreground">{placeholder}</span>
          ) : (
            selectedOptions.map((option) => (
              <span
                key={option.value}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-1 text-sm text-primary border border-primary/20"
              >
                {option.color && (
                  <div
                    className="h-2.5 w-2.5 rounded-full"
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
                    className="ml-0.5 hover:text-destructive transition-colors"
                  >
                    <XMarkIcon className="h-3.5 w-3.5" />
                  </button>
                )}
              </span>
            ))
          )}
        </div>
        <ChevronDownIcon
          className={cn(
            "h-5 w-5 text-muted-foreground transition-transform duration-200 flex-shrink-0 ml-2",
            isOpen && "rotate-180"
          )}
        />
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-50 mt-2 w-full rounded-2xl border border-border bg-card shadow-xl"
          style={{ maxHeight }}
        >
          <div className="overflow-auto p-2" style={{ maxHeight }}>
            {options.length === 0 ? (
              <div className="px-3 py-2 text-sm text-muted-foreground">
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
                      "flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                      "hover:bg-accent",
                      isSelected && "bg-primary/10"
                    )}
                  >
                    <div className="flex h-5 w-5 items-center justify-center flex-shrink-0 rounded border border-border">
                      {isSelected && (
                        <CheckIcon className="h-3.5 w-3.5 text-primary" />
                      )}
                    </div>
                    {option.color && (
                      <div
                        className="h-3 w-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: option.color }}
                      />
                    )}
                    <span className={cn(
                      "flex-1",
                      isSelected ? "text-foreground font-medium" : "text-foreground"
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



