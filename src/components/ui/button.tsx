import { forwardRef, type ButtonHTMLAttributes } from "react";

import { cn } from "~/lib/cn";
import { Spinner } from "~/components/ui/spinner";

type Variant = "primary" | "secondary" | "tertiary" | "tertiary-alt";
type Size = "medium" | "small";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  isDanger?: boolean;
  isLoading?: boolean;
  iconOnly?: boolean;
};

const variants: Record<Variant, string> = {
  primary:
    "bg-blue text-white border border-blue hover:bg-[#0046cc] hover:border-[#0046cc]",
  secondary:
    "bg-white text-ink border border-stroke hover:bg-gray-10",
  tertiary: "bg-transparent text-blue border border-transparent hover:bg-gray-10",
  "tertiary-alt":
    "bg-transparent text-ink border border-transparent hover:bg-gray-10",
};

const danger: Record<Variant, string> = {
  primary: "bg-red border-red hover:bg-[#d62a37] hover:border-[#d62a37]",
  secondary: "text-red hover:bg-gray-10",
  tertiary: "text-red",
  "tertiary-alt": "text-red",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "primary",
      size = "medium",
      isDanger,
      isLoading,
      iconOnly,
      disabled,
      className,
      children,
      type = "button",
      ...props
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled ?? isLoading}
        aria-busy={isLoading ? true : undefined}
        className={cn(
          "inline-flex shrink-0 items-center justify-center gap-2 rounded-lg font-semibold whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-50",
          size === "medium" ? "h-8 text-[14px]" : "h-6 text-[12px]",
          iconOnly
            ? size === "medium"
              ? "w-8"
              : "w-6"
            : size === "medium"
              ? "px-3"
              : "px-2",
          variants[variant],
          isDanger && danger[variant],
          className,
        )}
        {...props}
      >
        {isLoading ? <Spinner className="size-3.5" /> : null}
        {children}
      </button>
    );
  },
);
