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
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
  error?: boolean;
}

const GradeSelect: React.FC<GradeSelectProps> = ({
  value,
  onChange,
  placeholder = "Select grade level",
  className,
  required = false,
  disabled = false,
  error = false,
}) => {
  const { gradeLevels, loading, error: fetchError } = useGradeLevels();

  if (loading) {
    return (
      <Select disabled>
        <SelectTrigger className={cn("text-gray-400", className)}>
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
      <Select disabled>
        <SelectTrigger
          className={cn(
            "border-red-300 focus-visible:ring-red-500 text-red-500",
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
    );
  }

  return (
    <Select value={value || ""} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger
        className={cn(
          error && "border-red-300 focus-visible:ring-red-500",
          className
        )}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {gradeLevels.map((grade) => (
          <SelectItem key={grade.id} value={grade.id}>
            {grade.display_name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export { GradeSelect };
