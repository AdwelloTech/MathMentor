import React from "react";
import { useGradeLevels } from "@/lib/gradeLevels";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface GradeSelectProps {
  value?: string;
  onChange?: (value: string) => void;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
  error?: boolean;
}

const GradeSelect: React.FC<GradeSelectProps> = ({
  value,
  onChange,
  onValueChange,
  placeholder = "Select grade level",
  className,
  required = false,
  disabled = false,
  error = false,
}) => {
  const handleValueChange = (newValue: string) => {
    if (onChange) {
      onChange(newValue);
    }
    if (onValueChange) {
      onValueChange(newValue);
    }
  };
  const { gradeLevels, loading, error: fetchError } = useGradeLevels();

  if (loading) {
    return (
      <Select disabled>
        <SelectTrigger className={cn("text-gray-400", className, {
          'border-red-500': error,
        })}>
          <SelectValue>Loading grades...</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="loading" disabled>
            Loading grades...
          </SelectItem>
        </SelectContent>
      </Select>
    );
  }

  if (fetchError) {
    return (
      <div className="w-full">
        <Select disabled>
          <SelectTrigger
            className={cn(
              "w-full border-red-300 focus-visible:ring-red-500 text-red-500",
              className
            )}
          >
            <SelectValue>Error loading grades</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="error" disabled>
              Error loading grades
            </SelectItem>
          </SelectContent>
        </Select>
        <p className="mt-1 text-sm text-yellow-600">
          Couldn't load grade levels. Please try again later.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <Select
        value={value || undefined}
        onValueChange={handleValueChange}
        disabled={disabled || loading}
      >
        <SelectTrigger
          className={cn("w-full", className, {
            'border-red-500': error,
            'opacity-70': loading,
          })}
        >
          <SelectValue placeholder={loading ? 'Loading grades...' : placeholder}>
            {value ? (gradeLevels.find(g => String(g.id) === value)?.display_name || '') : ''}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {!required && (
            <SelectItem value="none" className="hidden">
              {placeholder}
            </SelectItem>
          )}
          {gradeLevels.length > 0 ? (
            gradeLevels.map((grade) => (
              <SelectItem 
                key={grade.id} 
                value={String(grade.id)}
                className="cursor-pointer hover:bg-gray-100"
              >
                {grade.display_name || `Grade ${grade.id}`}
              </SelectItem>
            ))
          ) : (
            <div className="p-2 text-sm text-gray-500">
              No grade levels available
            </div>
          )}
        </SelectContent>
      </Select>
      {error && (
        <p className="mt-1 text-sm text-red-500">
          {typeof error === 'string' ? error : 'Please select a valid grade level'}
        </p>
      )}
    </div>
  );
};

export { GradeSelect };
