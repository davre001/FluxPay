'use client';

import { useState, useCallback, useEffect } from 'react'

interface UseFormState {
  values: Record<string, any>
  errors: Record<string, string>
  touched: Record<string, boolean>
  isSubmitting: boolean
}

interface UseFormOptions {
  initialValues: Record<string, any>
  onSubmit: (values: Record<string, any>) => Promise<void> | void
  validate?: (values: Record<string, any>) => Record<string, string>
}

export function useForm(options: UseFormOptions) {
  const [state, setState] = useState<UseFormState>({
    values: options.initialValues,
    errors: {},
    touched: {},
    isSubmitting: false,
  })

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const fieldValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value

    setState((prev) => ({
      ...prev,
      values: {
        ...prev.values,
        [name]: fieldValue,
      },
    }))
  }, [])

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name } = e.target
    const errors = options.validate ? options.validate(state.values) : {}

    setState((prev) => ({
      ...prev,
      touched: {
        ...prev.touched,
        [name]: true,
      },
      errors: {
        ...prev.errors,
        [name]: errors[name] || '',
      },
    }))
  }, [options, state.values])

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()

      const errors = options.validate ? options.validate(state.values) : {}
      const hasErrors = Object.keys(errors).length > 0

      if (hasErrors) {
        setState((prev) => ({
          ...prev,
          errors,
          touched: Object.keys(state.values).reduce(
            (acc, key) => ({ ...acc, [key]: true }),
            {}
          ),
        }))
        return
      }

      setState((prev) => ({ ...prev, isSubmitting: true }))
      try {
        await options.onSubmit(state.values)
      } catch (error) {
        // Error handling is done by the onSubmit function
      } finally {
        setState((prev) => ({ ...prev, isSubmitting: false }))
      }
    },
    [options, state.values]
  )

  const setFieldValue = useCallback((name: string, value: any) => {
    setState((prev) => ({
      ...prev,
      values: {
        ...prev.values,
        [name]: value,
      },
    }))
  }, [])

  const setFieldError = useCallback((name: string, error: string) => {
    setState((prev) => ({
      ...prev,
      errors: {
        ...prev.errors,
        [name]: error,
      },
    }))
  }, [])

  const resetForm = useCallback(() => {
    setState({
      values: options.initialValues,
      errors: {},
      touched: {},
      isSubmitting: false,
    })
  }, [options.initialValues])

  return {
    ...state,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
    setFieldError,
    resetForm,
  }
}

interface UseAsyncState<T> {
  data: T | null
  loading: boolean
  error: Error | null
}

interface UseAsyncOptions<T> {
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
}

export function useAsync<T>(
  asyncFunction: () => Promise<T>,
  immediate = true,
  options?: UseAsyncOptions<T>
) {
  const [state, setState] = useState<UseAsyncState<T>>({
    data: null,
    loading: immediate,
    error: null,
  })

  const execute = useCallback(async () => {
    setState({ data: null, loading: true, error: null })
    try {
      const response = await asyncFunction()
      setState({ data: response, loading: false, error: null })
      options?.onSuccess?.(response)
      return response
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      setState({ data: null, loading: false, error: err })
      options?.onError?.(err)
      throw err
    }
  }, [asyncFunction, options])

  useEffect(() => {
    if (immediate) {
      execute()
    }
  }, [])

  return { ...state, execute }
}

interface UseLocalStorageOptions<T> {
  initialValue?: T
  serializer?: (value: T) => string
  deserializer?: (value: string) => T
}

export function useLocalStorage<T>(
  key: string,
  options?: UseLocalStorageOptions<T>
) {
  const [storedValue, setStoredValue] = useState<T | null>(() => {
    try {
      const item = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null
      return item
        ? options?.deserializer
          ? options.deserializer(item)
          : JSON.parse(item)
        : options?.initialValue ?? null
    } catch (error) {
      console.error(error)
      return options?.initialValue ?? null
    }
  })

  const setValue = useCallback(
    (value: T | ((val: T | null) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value
        setStoredValue(valueToStore)
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(
            key,
            options?.serializer
              ? options.serializer(valueToStore)
              : JSON.stringify(valueToStore)
          )
        }
      } catch (error) {
        console.error(error)
      }
    },
    [key, storedValue, options]
  )

  const removeValue = useCallback(() => {
    try {
      setStoredValue(null)
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key)
      }
    } catch (error) {
      console.error(error)
    }
  }, [key])

  return [storedValue, setValue, removeValue] as const
}

interface UseDebounceOptions {
  delay?: number
}

export function useDebounce<T>(value: T, options?: UseDebounceOptions) {
  const [debouncedValue, setDebouncedValue] = useState(value)
  const { delay = 500 } = options || {}

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(handler)
  }, [value, delay])

  return debouncedValue
}
