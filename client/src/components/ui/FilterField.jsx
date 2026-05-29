export default function FilterField({ label, children, className = '' }) {
    return (
        <div className={`flex-1 min-w-[140px] ${className || 'max-w-[200px]'}`}>
            <label className="text-[10px] font-bold text-slate-500 dark:text-white uppercase tracking-wide block mb-1">{label}</label>
            {children}
        </div>
    );
}
