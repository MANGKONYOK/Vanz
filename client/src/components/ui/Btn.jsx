export default function Btn({ children, variant = 'primary', onClick, className = '', disabled = false, size = 'md', type = 'button' }) {
    const variants = {
        primary: 'bg-red-600 hover:bg-red-700 text-white shadow-sm',
        secondary: 'bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 font-semibold',
        ghost: 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium',
        danger: 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 font-semibold',
    };
    const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm', lg: 'px-6 py-2.5 text-sm' };
    return (
        <button type={type} onClick={onClick} disabled={disabled} className={`shrink-0 inline-flex items-center justify-center gap-1.5 font-semibold rounded-lg transition-colors duration-200 ${variants[variant]} ${sizes[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}>
            {children}
        </button>
    );
}
