import React from "react";
import { AcademicCapIcon } from "@heroicons/react/24/outline";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { AVAILABLE_SUBJECTS } from "./constants";

interface TeachingInfoSectionProps {
  formData: {
    subjects: string[];
    specializes_learning_disabilities: boolean;
    past_experience?: string;
    weekly_availability?: string;
    employment_status?: string;
    education_level?: string;
    average_weekly_hours?: number;
    expected_hourly_rate?: number;
  };
  errors: Record<string, string | undefined>;
  onChange: (field: any, value: any) => void;
  onSubjectToggle: (subject: string) => void;
}

const TeachingInfoSection: React.FC<TeachingInfoSectionProps> = ({
  formData,
  errors,
  onChange,
  onSubjectToggle,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center mb-4">
        <AcademicCapIcon className="h-6 w-6 text-primary mr-2" />
        <h2 className="text-xl font-semibold text-foreground">
          Teaching Information
        </h2>
      </div>

      <div>
        <label className="block text-sm font-medium text-secondary-foreground mb-2">
          Subjects You Teach *
        </label>
        <div
          className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-64 overflow-y-auto border rounded-lg p-4 bg-background ${
            errors.subjects ? "border-destructive" : "border-border"
          }`}
        >
          {AVAILABLE_SUBJECTS.map((subject) => (
            <label
              key={subject}
              className="flex items-center text-sm cursor-pointer hover:bg-accent p-2 rounded transition-colors"
            >
              <input
                type="checkbox"
                checked={formData.subjects.includes(subject)}
                onChange={() => onSubjectToggle(subject)}
                className="mr-2 rounded text-primary focus:ring-primary"
              />
              <span className="text-secondary-foreground">{subject}</span>
            </label>
          ))}
        </div>
        {errors.subjects && (
          <p className="text-destructive text-sm mt-1">{errors.subjects}</p>
        )}
        <p className="text-sm text-muted-foreground mt-2">
          Selected:{" "}
          {formData.subjects.length > 0
            ? formData.subjects.join(", ")
            : "None"}
        </p>
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
        <label className="flex items-start text-sm">
          <input
            type="checkbox"
            checked={formData.specializes_learning_disabilities}
            onChange={(e) =>
              onChange("specializes_learning_disabilities", e.target.checked)
            }
            className="mr-3 mt-0.5 rounded text-primary focus:ring-primary"
          />
          <div>
            <span className="font-medium text-foreground">
              Specialization in Learning Disabilities
            </span>
            <p className="text-secondary-foreground mt-1">
              Check if you have experience or training in teaching students
              with learning disabilities such as dyslexia, ADHD, or other
              special educational needs.
            </p>
          </div>
        </label>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium text-foreground">
          Additional Information
        </h3>

        <div>
          <label
            htmlFor="past_experience"
            className="block text-sm font-medium text-secondary-foreground mb-2"
          >
            Past Teaching/Tutoring Experience
          </label>
          <Textarea
            id="past_experience"
            value={formData.past_experience}
            onChange={(e) => onChange("past_experience", e.target.value)}
            rows={3}
            className="w-full"
            placeholder="Describe your previous teaching or tutoring experience..."
            maxLength={500}
            showCharCount
          />
        </div>

        <div>
          <label
            htmlFor="weekly_availability"
            className="block text-sm font-medium text-secondary-foreground mb-2"
          >
            Weekly Availability
          </label>
          <Textarea
            id="weekly_availability"
            value={formData.weekly_availability}
            onChange={(e) => onChange("weekly_availability", e.target.value)}
            rows={3}
            className="w-full"
            placeholder="Describe your weekly availability for tutoring sessions..."
            maxLength={300}
            showCharCount
          />
        </div>

        <div>
          <label
            htmlFor="employment_status"
            className="block text-sm font-medium text-secondary-foreground mb-2"
          >
            Current Employment Status
          </label>
          <Input
            type="text"
            id="employment_status"
            value={formData.employment_status}
            onChange={(e) => onChange("employment_status", e.target.value)}
            className="w-full"
            placeholder="e.g., Full-time teacher, Part-time tutor, Freelance, etc."
            maxLength={100}
            showCharCount
          />
        </div>

        <div>
          <label
            htmlFor="education_level"
            className="block text-sm font-medium text-secondary-foreground mb-2"
          >
            Highest Level of Education
          </label>
          <Input
            type="text"
            id="education_level"
            value={formData.education_level}
            onChange={(e) => onChange("education_level", e.target.value)}
            className="w-full"
            placeholder="e.g., Bachelor's degree, Master's degree, PhD, etc."
            maxLength={100}
            showCharCount
          />
        </div>

        <div>
          <label
            htmlFor="average_weekly_hours"
            className="block text-sm font-medium text-secondary-foreground mb-2"
          >
            Average Weekly Hours Available for Tutoring
          </label>
          <Input
            type="number"
            id="average_weekly_hours"
            value={formData.average_weekly_hours || ""}
            onChange={(e) =>
              onChange(
                "average_weekly_hours",
                e.target.value ? parseInt(e.target.value) : undefined
              )
            }
            className="w-full"
            placeholder="e.g., 10, 20, 30"
            min="1"
            max="168"
          />
        </div>

        <div>
          <label
            htmlFor="expected_hourly_rate"
            className="block text-sm font-medium text-secondary-foreground mb-2"
          >
            Expected Hourly Rate (Optional)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground z-10">
              £
            </span>
            <Input
              type="number"
              id="expected_hourly_rate"
              value={formData.expected_hourly_rate || ""}
              onChange={(e) =>
                onChange(
                  "expected_hourly_rate",
                  e.target.value ? parseFloat(e.target.value) : undefined
                )
              }
              className="w-full pl-8"
              placeholder="e.g., 25.00"
              min="0"
              step="0.01"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeachingInfoSection;
