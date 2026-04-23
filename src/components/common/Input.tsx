"use client";

import React, { forwardRef } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  wrapperClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, required, leftIcon, rightIcon, wrapperClassName = "", id, className = "", ...props },
  ref
) {
  const inputId = id ?? `input-${label?.toLowerCase().replace(/\s+/g, "-")}`;
  const described = [error ? `${inputId}-error` : null, hint ? `${inputId}-hint` : null]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={`input-wrapper ${wrapperClassName}`}>
      {label && (
        <label htmlFor={inputId} className={`input-label${required ? " required" : ""}`}>
          {label}
        </label>
      )}
      <div style={{ position: "relative" }}>
        {leftIcon && (
          <span
            aria-hidden="true"
            style={{
              position: "absolute", left: "12px", top: "50%",
              transform: "translateY(-50%)", color: "var(--color-text-muted)",
            }}
          >
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`input${error ? " error" : ""} ${className}`}
          aria-describedby={described || undefined}
          aria-invalid={error ? "true" : undefined}
          aria-required={required}
          style={leftIcon ? { paddingLeft: "40px" } : rightIcon ? { paddingRight: "40px" } : undefined}
          {...props}
        />
        {rightIcon && (
          <span
            aria-hidden="true"
            style={{
              position: "absolute", right: "12px", top: "50%",
              transform: "translateY(-50%)", color: "var(--color-text-muted)",
            }}
          >
            {rightIcon}
          </span>
        )}
      </div>
      {error && (
        <p id={`${inputId}-error`} className="input-error" role="alert">
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={`${inputId}-hint`} className="input-hint">
          {hint}
        </p>
      )}
    </div>
  );
});
