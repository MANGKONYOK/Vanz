import { ChevronDown } from 'lucide-react';

export default function Select({ children, className = '', ...props }) {
    return (
        <div className={`relative min-w-0 ${className}`}>
            <select 
                {...props} 
                className="w-full appearance-none min-w-0 pl-3 pr-8 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-red-400 dark:focus:border-red-500 focus:ring-2 focus:ring-red-100 dark:focus:ring-red-900/50 transition-colors bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 cursor-pointer"
            >
                {children}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none">
                <ChevronDown size={14} className="text-slate-500 dark:text-gray-300" />
            </div>
        </div>
    );
}

