import React from 'react';
import { X } from 'lucide-react';

// --- Card ---
export const Card: React.FC<{ children: React.ReactNode; className?: string; title?: string; action?: React.ReactNode }> = ({ children, className = '', title, action }) => (
  <div className={`bg-white dark:bg-slate-800 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 dark:border-slate-700/50 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] ${className}`}>
    {(title || action) && (
      <div className="px-6 py-5 border-b border-slate-50 dark:border-slate-700/50 flex justify-between items-center">
        {title && <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 tracking-tight">{title}</h3>}
        {action && <div>{action}</div>}
      </div>
    )}
    <div className="p-6">{children}</div>
  </div>
);

// --- Button ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'soft';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', size = 'md', className = '', ...props }) => {
  const baseStyle = "inline-flex items-center justify-center rounded-2xl font-bold transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-primary-200 disabled:opacity-50 disabled:cursor-not-allowed btn-hover shadow-sm";
  
  const variants = {
    primary: "bg-gradient-to-r from-primary-500 to-primary-400 text-white shadow-primary-300/50 shadow-lg hover:shadow-primary-400/60",
    secondary: "bg-white text-slate-700 border-2 border-slate-100 hover:border-primary-200 hover:text-primary-600 focus:ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700",
    soft: "bg-primary-50 text-primary-600 hover:bg-primary-100 dark:bg-primary-900/20 dark:text-primary-300",
    danger: "bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 focus:ring-red-100",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-50 hover:text-primary-500 shadow-none dark:text-slate-400 dark:hover:bg-slate-800",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-5 py-2.5 text-sm",
    lg: "px-8 py-3.5 text-base",
  };

  return (
    <button className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  );
};

// --- Input ---
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className = '', ...props }) => (
  <div className="w-full">
    {label && <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">{label}</label>}
    <input
      className={`w-full rounded-2xl border-slate-200 bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-white placeholder-slate-400 focus:border-primary-400 focus:ring-4 focus:ring-primary-100 transition-all px-4 py-3 border outline-none ${className}`}
      {...props}
    />
    {error && <p className="mt-1 text-xs text-red-500 font-medium">{error}</p>}
  </div>
);

// --- Select ---
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

export const Select: React.FC<SelectProps> = ({ label, options, className = '', ...props }) => (
  <div className="w-full">
    {label && <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">{label}</label>}
    <div className="relative">
      <select
        className={`w-full appearance-none rounded-2xl border-slate-200 bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:border-primary-400 focus:ring-4 focus:ring-primary-100 transition-all px-4 py-3 border outline-none ${className}`}
        {...props}
      >
        {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
        <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
      </div>
    </div>
  </div>
);


// --- Modal ---
export const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4 text-center">
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity" onClick={onClose} />
        <div className="relative w-full max-w-lg transform overflow-hidden rounded-[2rem] bg-white dark:bg-slate-800 text-left shadow-2xl transition-all animate-in fade-in zoom-in-95 duration-200">
          <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
            <h3 className="text-xl font-bold leading-6 text-slate-800 dark:text-white">{title}</h3>
            <button onClick={onClose} className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors"><X size={20} /></button>
          </div>
          <div className="px-6 py-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Badge ---
export const Badge: React.FC<{ type: 'success' | 'warning' | 'danger' | 'neutral' | 'primary'; children: React.ReactNode; className?: string }> = ({ type, children, className = '' }) => {
  const styles = {
    success: 'bg-green-100 text-green-700 border-green-200',
    warning: 'bg-orange-100 text-orange-700 border-orange-200',
    danger: 'bg-red-100 text-red-700 border-red-200',
    neutral: 'bg-slate-100 text-slate-600 border-slate-200',
    primary: 'bg-primary-50 text-primary-600 border-primary-200',
  };
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${styles[type]} ${className}`}>
      {children}
    </span>
  );
};