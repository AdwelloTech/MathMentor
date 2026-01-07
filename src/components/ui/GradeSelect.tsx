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
        <SelectTrigger className={cn("bg-background text-muted-foreground border-input", className, {
          'border-destructive': error,
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
              "w-full bg-background text-destructive border-destructive focus-visible:ring-destructive",
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
        <p className="mt-1 text-sm text-warning">
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
          className={cn("w-full bg-background text-foreground border-input", className, {
            'border-destructive': error,
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
                className="cursor-pointer hover:bg-muted"
              >
                {grade.display_name || `Grade ${grade.id}`}
              </SelectItem>
            ))
          ) : (
            <div className="p-2 text-sm text-muted-foreground">
              No grade levels available
            </div>
          )}
        </SelectContent>
      </Select>
      {error && (
        <p className="mt-1 text-sm text-destructive">
          {typeof error === 'string' ? error : 'Please select a valid grade level'}
        </p>
      )}
    </div>
  );
};

export { GradeSelect };
