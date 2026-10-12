"use client";

import React from "react";
import styles from "./Input.module.css";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  maxLength?: number;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  helperText,
  id,
  maxLength,
  value,
  className = "",
  ...props
}) => {
  const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);
  const currentLength = typeof value === "string" ? value.length : 0;

  return (
    <div className={styles.wrapper}>
      <div className={styles.labelRow}>
        {label && (
          <label htmlFor={textareaId} className={styles.label}>
            {label}
          </label>
        )}
        {maxLength && (
          <span className={styles.charCount}>
            {currentLength}/{maxLength}
          </span>
        )}
      </div>
      <textarea
        id={textareaId}
        maxLength={maxLength}
        value={value}
        className={`${styles.textarea} ${error ? styles.hasError : ""} ${className}`}
        aria-invalid={!!error}
        {...props}
      />
      {error && <span className={styles.errorText} role="alert">{error}</span>}
      {!error && helperText && <span className={styles.helperText}>{helperText}</span>}
    </div>
  );
};

export default Textarea;
