import React from "react";
import { UserIcon, PhoneIcon } from "@heroicons/react/24/outline";
import { Input } from "@/components/ui/input";

interface PersonalInfoSectionProps {
  formData: {
    full_name: string;
    phone_number: string;
    postcode: string;
    based_in_country: string;
  };
  errors: Record<string, string | undefined>;
  onChange: (field: any, value: any) => void;
}

const PersonalInfoSection: React.FC<PersonalInfoSectionProps> = ({
  formData,
  errors,
  onChange,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center mb-4">
        <UserIcon className="h-6 w-6 text-primary mr-2" />
        <h2 className="text-xl font-semibold text-foreground">
          Personal Information
        </h2>
      </div>

      <div>
        <label
          htmlFor="full_name"
          className="block text-sm font-medium text-secondary-foreground mb-2"
        >
          Full Name *
        </label>
        <Input
          type="text"
          id="full_name"
          value={formData.full_name}
          onChange={(e) => onChange("full_name", e.target.value)}
          className={`w-full ${
            errors.full_name ? "border-destructive" : ""
          }`}
          placeholder="Enter your full name"
          required
        />
        {errors.full_name && (
          <p className="text-destructive text-sm mt-1">{errors.full_name}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="phone_number"
          className="block text-sm font-medium text-secondary-foreground mb-2"
        >
          Phone Number *
        </label>
        <div className="relative">
          <PhoneIcon className="h-5 w-5 text-muted-foreground absolute left-3 top-1/2 transform -translate-y-1/2 z-10" />
          <Input
            type="tel"
            id="phone_number"
            value={formData.phone_number}
            onChange={(e) => onChange("phone_number", e.target.value)}
            className={`w-full pl-10 ${
              errors.phone_number ? "border-destructive" : ""
            }`}
            placeholder="+1 (555) 123-4567"
            required
          />
        </div>
        {errors.phone_number && (
          <p className="text-destructive text-sm mt-1">{errors.phone_number}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="postcode"
          className="block text-sm font-medium text-secondary-foreground mb-2"
        >
          Postcode *
        </label>
        <Input
          type="text"
          id="postcode"
          value={formData.postcode}
          onChange={(e) => onChange("postcode", e.target.value)}
          className={`w-full ${
            errors.postcode ? "border-destructive" : ""
          }`}
          placeholder="Enter your postcode"
          required
          maxLength={20}
          showCharCount
        />
        {errors.postcode && (
          <p className="text-destructive text-sm mt-1">{errors.postcode}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="based_in_country"
          className="block text-sm font-medium text-secondary-foreground mb-2"
        >
          Based in which country? *
        </label>
        <Input
          type="text"
          id="based_in_country"
          value={formData.based_in_country}
          onChange={(e) => onChange("based_in_country", e.target.value)}
          className={`w-full ${
            errors.based_in_country ? "border-destructive" : ""
          }`}
          placeholder="e.g., United Kingdom, United States, etc."
          required
          maxLength={50}
          showCharCount
        />
        {errors.based_in_country && (
          <p className="text-destructive text-sm mt-1">
            {errors.based_in_country}
          </p>
        )}
      </div>
    </div>
  );
};

export default PersonalInfoSection;

