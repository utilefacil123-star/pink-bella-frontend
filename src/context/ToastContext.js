import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [confirmState, setConfirmState] = useState(null);
  const resolveRef = useRef(null);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const toast = {
    success: (msg) => addToast(msg, 'success'),
    error:   (msg) => addToast(msg, 'error'),
    info:    (msg) => addToast(msg, 'info'),
    warning: (msg) => addToast(msg, 'warning'),
  };

  const confirm = useCallback((message) => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setConfirmState(message);
    });
  }, []);

  const handleConfirm = (result) => {
    setConfirmState(null);
    if (resolveRef.current) resolveRef.current(result);
  };

  return (
    <ToastContext.Provider value={{ toast, confirm }}>
      {children}

      {/* Toast Container */}
      <div className="toast-stack">
        {toasts.map((t) => (
          <div key={t.id} className={`toast-item toast-${t.type}`}>
            <i className={`toast-icon fas ${
              t.type === 'success' ? 'fa-check-circle' :
              t.type === 'error'   ? 'fa-times-circle' :
              t.type === 'warning' ? 'fa-exclamation-triangle' :
                                     'fa-info-circle'
            }`} />
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      {/* Confirm Modal */}
      {confirmState && (
        <div className="confirm-overlay" onClick={() => handleConfirm(false)}>
          <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-icon">
              <i className="fas fa-question-circle" />
            </div>
            <p className="confirm-message">{confirmState}</p>
            <div className="confirm-actions">
              <button className="btn-secondary-brand px-4 py-2" onClick={() => handleConfirm(false)}>
                Cancelar
              </button>
              <button className="btn-primary-brand px-4 py-2" onClick={() => handleConfirm(true)}>
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
