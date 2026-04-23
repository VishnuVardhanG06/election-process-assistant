"use client";

import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "gold" | "danger";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  as?: "button" | "a";
  href?: string;
}

export function Button({
  variant = "primary",
  size = "md",
  isLoading = false,
  leftIcon,
  rightIcon,
  children,
  className = "",
  disabled,
  as: Tag = "button",
  href,
  ...props
}: ButtonProps) {
  const cls = [
    "btn",
    `btn-${variant}`,
    size === "sm" ? "btn-sm" : size === "lg" ? "btn-lg" : size === "icon" ? "btn-icon" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <>
      {isLoading ? (
        <span className="spinner" aria-hidden="true" style={{ width: 16, height: 16, borderWidth: 2 }} />
      ) : leftIcon ? (
        <span aria-hidden="true">{leftIcon}</span>
      ) : null}
      {children && <span>{children}</span>}
      {!isLoading && rightIcon && <span aria-hidden="true">{rightIcon}</span>}
    </>
  );

  if (Tag === "a" && href) {
    return (
      <a href={href} className={cls}>
        {content}
      </a>
    );
  }

  return (
    <button className={cls} disabled={disabled || isLoading} {...props}>
      {content}
    </button>
  );
}
