"use client";

import React from "react";
import styles from "./Button.module.css";

export type ButtonVariant =
  | "primary"     // Radiant Warm Coral
  | "secondary"   // Elevated Plum Surface
  | "amber"       // Sunset Amber (Super Spark / VIP)
  | "pass"        // Pass Slate
  | "outline"     // Outlined Plum
  | "ghost"       // Subtle Transparent
  | "icon";       // Round Action Icon (Pass / Like / Spark)

export type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  isLoading = false,
  icon,
  children,
  fullWidth = false,
  className = "",
  disabled,
  ...props
}) => {
  const buttonClasses = [
    styles.button,
    styles[variant],
    styles[size],
    fullWidth ? styles.fullWidth : "",
    isLoading ? styles.loading : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      className={buttonClasses}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className={styles.spinner} aria-hidden="true" />
      ) : (
        <>
          {icon && <span className={styles.iconWrapper}>{icon}</span>}
          {children && <span>{children}</span>}
        </>
      )}
    </button>
  );
};

export default Button;
