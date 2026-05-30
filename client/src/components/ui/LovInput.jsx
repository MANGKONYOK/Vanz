export default function LovInput({ value, onLov, placeholder = '', disabled = false }) {
    return (
        <div className={`flex rounded-lg shadow-sm overflow-hidden border border-slate-200 dark:border-slate-700 transition-colors ${disabled ? 'opacity-65 bg-slate-50 dark:bg-slate-800/50' : 'focus-within:border-red-400 dark:focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-100 dark:focus-within:ring-red-900/50'}`}>
            <input readOnly value={value} placeholder={placeholder} disabled={disabled} className={`flex-1 min-w-0 px-3 py-2 text-sm outline-none text-slate-900 dark:text-slate-100 ${disabled ? 'bg-slate-50 dark:bg-slate-800/50 text-slate-400 cursor-not-allowed' : 'bg-white dark:bg-slate-800'}`} />
            <button type="button" onClick={disabled ? undefined : onLov} disabled={disabled} className={`shrink-0 px-4 text-xs font-bold transition-colors ${disabled ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed' : 'bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white'}`}>LoV</button>
        </div>
    );
}
