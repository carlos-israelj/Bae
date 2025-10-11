import React from "react";

type ButtonProps = {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
  children: React.ReactNode;
  asChild?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      className = "",
      asChild = false,
      children,
      ...props
    },
    ref,
  ) => {
    const baseClasses =
      "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50";

    const variantClasses = {
      primary: "bg-primary text-on-primary hover:bg-primary/90",
      secondary: "bg-secondary text-on-background hover:bg-secondary/80",
      ghost: "bg-transparent text-primary hover:bg-surface",
    };

    const sizeClasses = {
      sm: "text-sm py-2 px-4",
      md: "text-base py-2.5 px-5",
      lg: "text-lg py-3 px-6",
    };

    const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

    if (asChild) {
      return (
        <span className={classes} ref={ref as React.RefObject<HTMLSpanElement>}>
          {children}
        </span>
      );
    }

    return (
      <button ref={ref} className={classes} {...props}>
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
