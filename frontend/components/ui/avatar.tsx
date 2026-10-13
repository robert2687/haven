import * as React from "react";
import { cn } from "../../lib/utils";

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  name: string;
  size?: "sm" | "md" | "lg";
}

const SIZES: Record<NonNullable<AvatarProps["size"]>, string> = {
  sm: "h-7 w-7 text-[10px]",
  md: "h-9 w-9 text-xs",
  lg: "h-12 w-12 text-sm",
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({
  src,
  name,
  size = "md",
  className,
  ...props
}: AvatarProps): React.JSX.Element {
  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full",
        "bg-gradient-to-tr from-blue-600 to-indigo-500 font-bold text-white",
        SIZES[size],
        className,
      )}
      title={name}
      {...props}
    >
      {src ? (
        // Plain img keeps this dependency-light (no next/image remote config needed).
        <img src={src} alt={name} className="h-full w-full object-cover" />
      ) : (
        <span>{initials(name)}</span>
      )}
    </div>
  );
}
