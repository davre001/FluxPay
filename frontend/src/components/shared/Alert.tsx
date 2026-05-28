'use client';

import React from 'react'
import { AlertCircle, CheckCircle, InfoIcon, AlertTriangle, XCircle, X } from 'lucide-react'

interface AlertProps {
  type: 'success' | 'error' | 'warning' | 'info'
  title?: string
  message: string
  onClose?: () => void
  dismissible?: boolean
  className?: string
}

const alertConfig = {
  success: {
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-800',
    titleColor: 'text-green-900',
    Icon: CheckCircle,
    iconColor: 'text-green-600',
  },
  error: {
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-800',
    titleColor: 'text-red-900',
    Icon: XCircle,
    iconColor: 'text-red-600',
  },
  warning: {
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    textColor: 'text-yellow-800',
    titleColor: 'text-yellow-900',
    Icon: AlertTriangle,
    iconColor: 'text-yellow-600',
  },
  info: {
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-800',
    titleColor: 'text-blue-900',
    Icon: InfoIcon,
    iconColor: 'text-blue-600',
  },
}

export function Alert({
  type,
  title,
  message,
  onClose,
  dismissible = true,
  className = '',
}: AlertProps) {
  const config = alertConfig[type]
  const { Icon, bgColor, borderColor, textColor, titleColor, iconColor } = config

  return (
    <div
      className={`rounded-lg border p-4 ${bgColor} ${borderColor} ${className}`}
      role="alert"
    >
      <div className="flex">
        <Icon className={`h-5 w-5 flex-shrink-0 ${iconColor}`} />
        <div className="ml-3 flex-1">
          {title && <h3 className={`font-medium ${titleColor}`}>{title}</h3>}
          <p className={`${title ? 'mt-1 text-sm' : ''} ${textColor}`}>{message}</p>
        </div>
        {dismissible && (
          <button
            onClick={onClose}
            className={`ml-3 inline-flex flex-shrink-0 ${textColor} hover:opacity-75`}
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  )
}

interface AlertContainerProps {
  alerts: AlertProps[]
  onRemove: (index: number) => void
}

export function AlertContainer({ alerts, onRemove }: AlertContainerProps) {
  return (
    <div className="fixed right-4 top-4 z-50 space-y-3 max-w-md">
      {alerts.map((alert, index) => (
        <Alert
          key={index}
          {...alert}
          onClose={() => onRemove(index)}
          className="shadow-lg animate-fade-in"
        />
      ))}
    </div>
  )
}

interface ValidationAlertProps {
  errors: Array<{ field: string; message: string }>
  onClose?: () => void
}

export function ValidationAlert({ errors, onClose }: ValidationAlertProps) {
  if (errors.length === 0) return null

  return (
    <Alert
      type="error"
      title={`${errors.length} ${errors.length === 1 ? 'Error' : 'Errors'} Found`}
      message={
        errors.length === 1
          ? errors[0].message
          : `Please fix the following issues: ${errors.map((e) => e.field).join(', ')}`
      }
      onClose={onClose}
    />
  )
}

interface ConfirmAlertProps {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
  type?: 'danger' | 'default'
}

export function ConfirmAlert({
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  type = 'default',
}: ConfirmAlertProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <p className="mt-2 text-sm text-gray-600">{message}</p>
        <div className="mt-6 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 rounded px-4 py-2 text-sm font-medium text-white ${
              type === 'danger'
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
