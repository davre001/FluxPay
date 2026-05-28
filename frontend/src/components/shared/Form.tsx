'use client';

import React, { ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'

interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  children: ReactNode
}

export function Form({ className = '', ...props }: FormProps) {
  return (
    <form className={`space-y-6 ${className}`} {...props}>
      {props.children}
    </form>
  )
}

interface FormGroupProps {
  children: ReactNode
  className?: string
}

export function FormGroup({ children, className = '' }: FormGroupProps) {
  return <div className={`space-y-2 ${className}`}>{children}</div>
}

interface FormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean
  hint?: string
}

export function FormLabel({ required, hint, className = '', ...props }: FormLabelProps) {
  return (
    <div>
      <label className={`block text-sm font-medium text-gray-700 ${className}`} {...props}>
        {props.children}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </div>
  )
}

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
  hint?: string
}

export function FormInput({ error, hint, className = '', ...props }: FormInputProps) {
  return (
    <div className="space-y-1">
      <input
        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
          error
            ? 'border-red-300 bg-red-50 focus:ring-red-500'
            : 'border-gray-300 bg-white focus:border-transparent'
        } ${className}`}
        {...props}
      />
      {error && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle className="h-4 w-4" />{error}</p>}
      {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  )
}

interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string
  hint?: string
}

export function FormTextarea({ error, hint, className = '', ...props }: FormTextareaProps) {
  return (
    <div className="space-y-1">
      <textarea
        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none ${
          error
            ? 'border-red-300 bg-red-50 focus:ring-red-500'
            : 'border-gray-300 bg-white focus:border-transparent'
        } ${className}`}
        {...props}
      />
      {error && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle className="h-4 w-4" />{error}</p>}
      {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  )
}

interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string
  hint?: string
  options: Array<{ value: string; label: string }>
  placeholder?: string
}

export function FormSelect({
  error,
  hint,
  options,
  placeholder,
  className = '',
  ...props
}: FormSelectProps) {
  return (
    <div className="space-y-1">
      <select
        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white cursor-pointer ${
          error
            ? 'border-red-300 bg-red-50 focus:ring-red-500'
            : 'border-gray-300 focus:border-transparent'
        } ${className}`}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle className="h-4 w-4" />{error}</p>}
      {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  )
}

interface FormCheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: string
}

export function FormCheckbox({ label, error, hint, className = '', ...props }: FormCheckboxProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center">
        <input
          type="checkbox"
          className={`h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer ${
            error ? 'border-red-300' : ''
          } ${className}`}
          {...props}
        />
        <label className="ml-2 text-sm text-gray-700 cursor-pointer">{label}</label>
      </div>
      {error && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle className="h-4 w-4" />{error}</p>}
      {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  )
}

interface FormRadioGroupProps {
  name: string
  options: Array<{ value: string; label: string; description?: string }>
  value: string
  onChange: (value: string) => void
  error?: string
  className?: string
}

export function FormRadioGroup({
  name,
  options,
  value,
  onChange,
  error,
  className = '',
}: FormRadioGroupProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {options.map((option) => (
        <div key={option.value} className="flex items-start">
          <input
            type="radio"
            id={`${name}-${option.value}`}
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={(e) => onChange(e.target.value)}
            className="h-4 w-4 mt-1 cursor-pointer"
          />
          <div className="ml-3">
            <label
              htmlFor={`${name}-${option.value}`}
              className="text-sm font-medium text-gray-700 cursor-pointer"
            >
              {option.label}
            </label>
            {option.description && (
              <p className="text-sm text-gray-500">{option.description}</p>
            )}
          </div>
        </div>
      ))}
      {error && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle className="h-4 w-4" />{error}</p>}
    </div>
  )
}

interface FormButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
  fullWidth?: boolean
  variant?: 'primary' | 'secondary' | 'danger'
}

export function FormButton({
  loading,
  fullWidth,
  variant = 'primary',
  className = '',
  children,
  disabled,
  ...props
}: FormButtonProps) {
  const baseClasses = 'px-4 py-2 rounded-lg font-medium transition duration-200'
  const widthClass = fullWidth ? 'w-full' : ''
  const disabledClass = disabled || loading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'

  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  }

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${widthClass} ${disabledClass} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="flex items-center justify-center">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Processing...
        </span>
      ) : (
        children
      )}
    </button>
  )
}

interface FormSectionProps {
  title: string
  description?: string
  children: ReactNode
  className?: string
}

export function FormSection({ title, description, children, className = '' }: FormSectionProps) {
  return (
    <div className={`border-t pt-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      {description && <p className="mt-1 text-sm text-gray-600">{description}</p>}
      <div className="mt-4 space-y-4">{children}</div>
    </div>
  )
}
