import toast, { Toast } from 'react-hot-toast'

export interface ToastOptions {
  duration?: number
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'
}

export function useToast() {
  return {
    success: (message: string, options?: ToastOptions) => {
      return toast.success(message, {
        duration: options?.duration || 4000,
        position: options?.position || 'top-right',
      })
    },
    
    error: (message: string, options?: ToastOptions) => {
      return toast.error(message, {
        duration: options?.duration || 4000,
        position: options?.position || 'top-right',
      })
    },
    
    loading: (message: string, options?: ToastOptions) => {
      return toast.loading(message, {
        duration: Infinity,
        position: options?.position || 'top-right',
      })
    },
    
    info: (message: string, options?: ToastOptions) => {
      return toast(message, {
        duration: options?.duration || 4000,
        position: options?.position || 'top-right',
      })
    },
    
    update: (toastId: string, message: string, type: 'success' | 'error' | 'info' = 'info') => {
      if (type === 'success') toast.success(message, { id: toastId })
      else if (type === 'error') toast.error(message, { id: toastId })
      else toast(message, { id: toastId })
    },
    
    dismiss: (toastId?: string) => {
      if (toastId) {
        toast.dismiss(toastId)
      } else {
        toast.dismiss()
      }
    },
  }
}
