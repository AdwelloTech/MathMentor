import React from "react";
import { InformationCircleIcon } from "@heroicons/react/24/outline";

interface GMTTooltipProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

/**
 * GMT Tooltip Component
 * Displays a tooltip explaining that all times are in GMT
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

  return (
    <div className={`inline-flex items-center group relative ${className}`}>
      <InformationCircleIcon 
        className={`${sizeClasses[size]} text-muted-foreground hover:text-primary transition-colors cursor-help`}
        aria-label="GMT Time Information"
      />
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-50">
        <div className="bg-slate-900 text-white text-xs rounded-lg py-2 px-3 shadow-lg max-w-xs border border-slate-700">
          <div className="font-semibold mb-1">All times are in GMT</div>
          <div className="text-slate-300">
            Greenwich Mean Time (GMT) is used for all scheduled classes and sessions to ensure consistency across all timezones.
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
 * Simple label showing GMT indicator
 */
export const GMTLabel: React.FC<{ className?: string }> = ({ className = "" }) => {
  return (
    <span className={`text-xs text-muted-foreground font-medium ${className}`}>
      GMT
    </span>
  );
};

/**
 * GMT Help Text Component
 * Help text explaining GMT
 */
export const GMTHelpText: React.FC<{ className?: string }> = ({ className = "" }) => {
  return (
    <p className={`text-xs text-muted-foreground ${className}`}>
      All times are in GMT (Greenwich Mean Time)
    </p>
  );
};





