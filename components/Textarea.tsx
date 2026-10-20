"use client";

import React, { Ref } from "react"

interface TextareaProps {
    id: string
    type: string
    autocomplete: string
    label?: string
    labelClass?: string
    className?: string
    disabled?: boolean
    required?: boolean
    placeholder: string
    name?: string
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
    onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void
}

function Textarea({ id, label, type, className, autocomplete, placeholder, disabled, required, ...props }: TextareaProps, ref: Ref<HTMLInputElement>) {
    return (
        <div className="mb-3">
            <label htmlFor="Name" className="bg-transparent text-primary fw-bold mb-2">{label}
                {required &&
                    <span className="required error-text">*</span>
                }
            </label>
            <input
                {...props}
                ref={ref}
                disabled={disabled}
                type={type}
                className={`form-control bg-light rounded-0 ${className}`}
                autoComplete={autocomplete}
                placeholder={placeholder}
                id={id} />
        </div>
    )
}

export default React.memo(React.forwardRef(Textarea));