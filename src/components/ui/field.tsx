import {
  forwardRef,
  type InputHTMLAttributes,
  type LabelHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";

import { cn } from "~/lib/cn";

const control =
  "w-full rounded-lg border border-gray-20 bg-white px-3 text-[14px] leading-[19px] text-black placeholder:text-gray-50 transition-colors hover:border-gray-40 focus:border-blue focus:outline-none focus:ring-2 focus:ring-blue/20 disabled:cursor-not-allowed disabled:bg-gray-10 disabled:text-gray-50 aria-[invalid=true]:border-red";

export function Label({
  className,
  ...props
}: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("t-text-s mb-1.5 block text-gray-80", className)}
      {...props}
    />
  );
}

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(function Input({ className, ...props }, ref) {
  return <input ref={ref} className={cn(control, "h-10", className)} {...props} />;
});

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(control, "min-h-24 py-2.5", className)}
      {...props}
    />
  );
});

export function FieldHint({
  children,
  error,
}: {
  children: React.ReactNode;
  error?: boolean;
}) {
  return (
    <p
      className={cn("t-text-xs mt-1.5", error ? "text-red" : "text-gray-60")}
      role={error ? "alert" : undefined}
    >
      {children}
    </p>
  );
}

export const Select = forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(function Select({ className, ...props }, ref) {
  return <select ref={ref} className={cn(control, "h-10", className)} {...props} />;
});
