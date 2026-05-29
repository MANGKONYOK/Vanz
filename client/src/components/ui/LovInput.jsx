export default function LovInput({ value, onLov, placeholder = '' }) {
    return (
        <div className="flex rounded-lg shadow-sm overflow-hidden border border-slate-200 dark:border-slate-700 focus-within:border-red-400 dark:focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-100 dark:focus-within:ring-red-900/50 transition-colors">
            <input readOnly value={value} placeholder={placeholder} className="flex-1 min-w-0 px-3 py-2 text-sm outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" />
            <button onClick={onLov} className="shrink-0 px-4 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white text-xs font-bold transition-colors">LoV</button>
        </div>
    );
}
