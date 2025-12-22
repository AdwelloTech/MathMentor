import React from "react";
import { InformationCircleIcon } from "@heroicons/react/24/outline";
import { getUserTimezone, getUserTimezoneAbbreviation } from "@/utils/timezoneUtils";

interface GMTTooltipProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

/**
 * GMT Tooltip Component
 * Displays a tooltip explaining that times are shown in user's local timezone
 */
export const GMTTooltip: React.FC<GMTTooltipProps> = ({
  className = "",
  size = "md"
}) => {
  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  const userTimezone = getUserTimezone();
  const userTzAbbr = getUserTimezoneAbbreviation();

  return (
    <div className={`inline-flex items-center group relative ${className}`}>
      <InformationCircleIcon
        className={`${sizeClasses[size]} text-muted-foreground hover:text-primary transition-colors cursor-help`}
        aria-label="Timezone Information"
      />
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-50">
        <div className="bg-slate-900 text-white text-xs rounded-lg py-2 px-3 shadow-lg max-w-xs border border-slate-700">
          <div className="font-semibold mb-1">Times in Your Timezone</div>
          <div className="text-slate-300">
            All times are displayed in your local timezone ({userTzAbbr} - {userTimezone}). Times are stored in GMT and automatically converted for your convenience.
          </div>
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
            <div className="border-4 border-transparent border-t-slate-900"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * GMT Label Component
 * Simple label showing user's timezone indicator
 */
export const GMTLabel: React.FC<{ className?: string }> = ({ className = "" }) => {
  const userTzAbbr = getUserTimezoneAbbreviation();
  return (
    <span className={`text-xs text-muted-foreground font-medium ${className}`}>
      {userTzAbbr}
    </span>
  );
};

/**
 * GMT Help Text Component
 * Help text explaining timezone
 */
export const GMTHelpText: React.FC<{ className?: string }> = ({ className = "" }) => {
  const userTzAbbr = getUserTimezoneAbbreviation();
  return (
    <p className={`text-xs text-muted-foreground ${className}`}>
      All times are in your local timezone ({userTzAbbr})
    </p>
  );
};
















