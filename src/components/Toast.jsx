import React, { useCallback, useEffect, useRef, useState } from 'react'

let toastId = 0

export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'success', duration = 3000) => {
    const id = ++toastId
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.map((t) => t.id === id ? { ...t, leaving: true } : t))
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 300)
    }, duration)
    return id
  }, [])

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast toast-${toast.type} ${toast.leaving ? 'toast-leaving' : ''}`}
          >
            <i className={`fa-solid ${
              toast.type === 'success' ? 'fa-circle-check' :
              toast.type === 'error' ? 'fa-circle-xmark' :
              'fa-triangle-exclamation'
            }`} />
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const ToastContext = React.createContext(() => {})
