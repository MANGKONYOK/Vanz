export default function Btn({ children, variant = 'primary', onClick, className = '', disabled = false, size = 'md' }) {
    const variants = {
        primary: 'bg-red-600 hover:bg-red-700 text-white shadow-sm',
        secondary: 'bg-white border border-slate-300 text-slate-800 hover:bg-slate-50 font-semibold',
        ghost: 'text-slate-700 hover:bg-slate-100 font-medium',
        danger: 'bg-red-50 text-red-600 hover:bg-red-100 font-semibold',
    };
    const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm', lg: 'px-6 py-2.5 text-sm' };
    return (
        <button onClick={onClick} disabled={disabled} className={`shrink-0 inline-flex items-center justify-center gap-1.5 font-semibold rounded-lg transition-colors ${variants[variant]} ${sizes[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}>
            {children}
        </button>
    );
}
