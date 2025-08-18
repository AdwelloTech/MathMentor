import * as React from "react";
import { cn } from "@/lib/utils";

interface TextareaProps extends React.ComponentProps<"textarea"> {
  maxLength?: number;
  showCharCount?: boolean;
  charCountClassName?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      maxLength,
      showCharCount = false,
      charCountClassName,
      ...props
    },
    ref
  ) => {
    const [charCount, setCharCount] = React.useState(0);
    const [isOverLimit, setIsOverLimit] = React.useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      setCharCount(value.length);

      if (maxLength) {
        setIsOverLimit(value.length > maxLength);
      }

      // Call the original onChange if it exists
      if (props.onChange) {
        props.onChange(e);
      }
    };

    // Initialize character count on mount
    React.useEffect(() => {
      if (props.value && typeof props.value === "string") {
        setCharCount(props.value.length);
        if (maxLength) {
          setIsOverLimit(props.value.length > maxLength);
        }
      }
    }, [props.value, maxLength]);

    return (
      <div className="relative">
        <textarea
          className={cn(
            "flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            isOverLimit && "border-red-300 focus-visible:ring-red-500",
            className
          )}
          ref={ref}
          maxLength={maxLength}
          onChange={handleChange}
          {...props}
        />
        {showCharCount && maxLength && (
          <div
            className={cn(
              "absolute -bottom-5 right-0 text-xs",
              isOverLimit ? "text-red-500" : "text-gray-500",
              charCountClassName
            )}
          >
            {charCount}/{maxLength}
          </div>
        )}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
