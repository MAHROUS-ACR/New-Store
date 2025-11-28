import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface MobileWrapperProps {
  children: ReactNode;
  className?: string;
}

export function MobileWrapper({ children, className }: MobileWrapperProps) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-neutral-100 p-2 font-sans">
      <div className="relative w-full max-w-[600px] h-full bg-background rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Content */}
        <div className={cn("flex-1 flex flex-col h-full overflow-hidden w-full", className)}>
          {children}
        </div>
      </div>
    </div>
  );
}
