"use client";

import React, { Ref } from "react"

interface InputProps {
    id: string
    type: string
    placeholder?: string
    autocomplete?: string
    label?: string
    className?: string
    disabled?: boolean
    required?: boolean
    inputError?: string
    min?: string | number
    max?: string | number
    maxLength?: number
    name?: string
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
    onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void
}

function Input({ id, label, type, className, autocomplete, placeholder, disabled, required, inputError, min, max, maxLength, ...props }: InputProps, ref: Ref<HTMLInputElement>) {
    return (
        <div className="mb-3 position-relative">
            {label && (
                <label htmlFor={id} className="form-label small fw-semibold mb-1">
                    {label}{required && <span className="text-danger ms-1">*</span>}
                </label>
            )}
            <input
                {...props}
                ref={ref}
                id={id}
                type={type}
                disabled={disabled}
                min={min}
                max={max}
                maxLength={maxLength}
                className={`form-control ${inputError ? 'is-invalid' : ''} ${className || ''}`}
                autoComplete={autocomplete || 'off'}
                placeholder={placeholder}
            />
            {inputError && <div className="invalid-feedback">{inputError}</div>}
        </div>
    )
}

export default React.memo(React.forwardRef(Input))
