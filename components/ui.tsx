import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";

export function Button({ className, variant = "primary", size = "default", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "soft"; size?: "default" | "sm" | "icon" }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 disabled:pointer-events-none disabled:opacity-50",
        variant === "primary" && "bg-navy text-white hover:bg-[#123049]",
        variant === "secondary" && "border border-line bg-white text-ink hover:bg-gray-50",
        variant === "ghost" && "text-muted hover:bg-gray-100 hover:text-ink",
        variant === "soft" && "bg-blue-50 text-navy hover:bg-blue-100",
        size === "default" && "h-11 px-4 text-sm",
        size === "sm" && "h-9 px-3 text-xs",
        size === "icon" && "h-10 w-10",
        className,
      )}
      {...props}
    />
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("rounded-2xl border border-line bg-white shadow-soft", className)}>{children}</div>;
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn("h-11 w-full rounded-xl border border-line bg-white px-4 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50", className)} {...props} />;
}
