import { createContext, useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';
export const ToastContext = createContext(null);
export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null),
    timer = useRef();
  const notify = useCallback((message, type = 'success') => {
    clearTimeout(timer.current);
    setToast({ message, type });
    timer.current = setTimeout(() => setToast(null), 5000);
  }, []);
  useEffect(() => () => clearTimeout(timer.current), []);
  return (
    <ToastContext.Provider value={notify}>
      {children}
      {toast && (
        <div className={`toast ${toast.type}`} role={toast.type === 'error' ? 'alert' : 'status'}>
          <CheckCircle2 size={20} />
          <span>{toast.message}</span>
          <button aria-label="Dismiss notification" onClick={() => setToast(null)}>
            <X size={18} />
          </button>
        </div>
      )}
    </ToastContext.Provider>
  );
}
