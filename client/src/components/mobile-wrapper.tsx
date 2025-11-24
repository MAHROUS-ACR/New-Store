import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface MobileWrapperProps {
  children: ReactNode;
  className?: string;
}

export function MobileWrapper({ children, className }: MobileWrapperProps) {
  return (
    <div className={cn("w-full h-full flex flex-col", className)}>
      {children}
    </div>
  );
}
