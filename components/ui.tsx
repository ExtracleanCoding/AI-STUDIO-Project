
import React, { ReactNode } from 'react';

// Card
interface CardProps {
  children: ReactNode;
  className?: string;
}
export const Card: React.FC<CardProps> = ({ children, className = '' }) => (
  <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden ${className}`}>
    {children}
  </div>
);

export const CardHeader: React.FC<CardProps> = ({ children, className = '' }) => (
    <div className={`p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 ${className}`}>
        {children}
    </div>
);

export const CardContent: React.FC<CardProps> = ({ children, className = '' }) => (
    <div className={`p-4 sm:p-6 ${className}`}>
        {children}
    </div>
);

export const CardTitle: React.FC<CardProps> = ({ children, className = '' }) => (
    <h3 className={`text-lg font-semibold text-gray-800 dark:text-white ${className}`}>
        {children}
    </h3>
);

// Modal
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  footer?: ReactNode;
}
export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer, size = 'md' }) => {
  if (!isOpen) return null;
  const sizeClasses = {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
      xl: 'max-w-xl',
  }
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-start p-4 pt-16">
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full ${sizeClasses[size]} transform transition-all max-h-[90vh] flex flex-col`}>
        <div className="flex justify-between items-center p-4 border-b dark:border-gray-700 flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-3xl leading-none">&times;</button>
        </div>
        <div className="p-6 overflow-y-auto flex-grow">
          {children}
        </div>
        {footer && <div className="p-4 border-t dark:border-gray-700 flex-shrink-0">{footer}</div>}
      </div>
    </div>
  );
};

// Button
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  children: ReactNode;
}
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, className, variant = 'primary', ...props }, ref) => {
    const baseClasses = "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors disabled:opacity-50 disabled:pointer-events-none";
    const variantClasses = {
      primary: 'bg-brand-start hover:bg-brand-end text-white focus:ring-brand-start',
      secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 focus:ring-gray-500',
      danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
      ghost: 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 focus:ring-gray-500',
    };
    return (
      <button ref={ref} className={`${baseClasses} ${variantClasses[variant]} ${className}`} {...props}>
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";


// Form elements
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
    ({ className, ...props }, ref) => (
        <input ref={ref} className={`block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-start focus:border-brand-start sm:text-sm ${className}`} {...props} />
    )
);
Input.displayName = "Input";

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
    ({ className, children, ...props }, ref) => (
        <select ref={ref} className={`block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-start focus:border-brand-start sm:text-sm ${className}`} {...props}>
            {children}
        </select>
    )
);
Select.displayName = "Select";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
    ({ className, ...props }, ref) => (
        <textarea ref={ref} rows={4} className={`block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-start focus:border-brand-start sm:text-sm ${className}`} {...props} />
    )
);
Textarea.displayName = "Textarea";


export const Label: React.FC<{htmlFor: string; children: ReactNode; className?: string;}> = ({htmlFor, children, className}) => (
    <label htmlFor={htmlFor} className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 ${className}`}>
        {children}
    </label>
);

// Badge
export const Badge: React.FC<{ children: ReactNode; color?: 'green' | 'blue' | 'yellow' | 'red' | 'gray' }> = ({ children, color = 'gray' }) => {
    const colorClasses = {
        gray: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
        green: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
        yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
        red: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    };
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClasses[color]}`}>
            {children}
        </span>
    );
};

// Tabs
interface TabsProps<T extends string> {
  tabs: { id: T; label: string }[];
  activeTab: T;
  onTabClick: (tabId: T) => void;
  className?: string;
}
export function Tabs<T extends string>({ tabs, activeTab, onTabClick, className = '' }: TabsProps<T>) {
    return (
        <div className={className}>
            <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => onTabClick(tab.id)}
                        className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                            activeTab === tab.id
                            ? 'border-brand-start text-brand-start'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                        aria-current={activeTab === tab.id ? 'page' : undefined}
                    >
                    {tab.label}
                    </button>
                ))}
                </nav>
            </div>
        </div>
    );
}
