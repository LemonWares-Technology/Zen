"use client";

import { useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { removeToast } from "../store/slices/toastSlice";
import { X, CheckCircle, AlertCircle, AlertTriangle, Info, Loader2 } from "lucide-react";

export default function ToastContainer() {
  const dispatch = useAppDispatch();
  const { toasts } = useAppSelector((state) => state.toast);

  const getToastIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case "info":
        return <Info className="h-5 w-5 text-blue-500" />;
      case "loading":
        return <Loader2 className="h-5 w-5 text-orange-500 animate-spin" />;
      default:
        return <Info className="h-5 w-5 text-gray-500" />;
    }
  };

  const getToastStyles = (type: string) => {
    switch (type) {
      case "success":
        return "bg-green-50 border-green-200 text-green-800";
      case "error":
        return "bg-red-50 border-red-200 text-red-800";
      case "warning":
        return "bg-yellow-50 border-yellow-200 text-yellow-800";
      case "info":
        return "bg-blue-50 border-blue-200 text-blue-800";
      case "loading":
        return "bg-orange-50 border-orange-200 text-orange-800";
      default:
        return "bg-gray-50 border-gray-200 text-gray-800";
    }
  };

  useEffect(() => {
    toasts.forEach((toast) => {
      if (toast.duration && toast.duration > 0) {
        const timer = setTimeout(() => {
          dispatch(removeToast(toast.id));
        }, toast.duration);

        return () => clearTimeout(timer);
      }
    });
  }, [toasts, dispatch]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-md w-full">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            relative p-4 rounded-lg border shadow-lg backdrop-blur-sm
            transform transition-all duration-300 ease-in-out
            animate-in slide-in-from-right-full
            ${getToastStyles(toast.type)}
          `}
        >
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-0.5">
              {getToastIcon(toast.type)}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold leading-5">
                {toast.title}
              </h4>
              {toast.message && (
                <p className="mt-1 text-sm opacity-90 leading-5">
                  {toast.message}
                </p>
              )}
              {toast.action && (
                <button
                  onClick={toast.action.onClick}
                  className="mt-2 text-sm font-medium underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 rounded"
                >
                  {toast.action.label}
                </button>
              )}
            </div>
            {toast.dismissible && (
              <button
                onClick={() => dispatch(removeToast(toast.id))}
                className="flex-shrink-0 ml-4 inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 rounded-md p-1"
              >
                <span className="sr-only">Close</span>
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          
          {/* Progress bar for timed toasts */}
          {toast.duration && toast.duration > 0 && (
            <div className="absolute bottom-0 left-0 h-1 bg-current opacity-20 rounded-b-lg animate-shrink-width"
                 style={{ 
                   animationDuration: `${toast.duration}ms`,
                   animationFillMode: 'forwards'
                 }}>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
