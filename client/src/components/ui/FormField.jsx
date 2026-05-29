export default function FormField({ label, required, error, children }) {
    return (
        <div className="min-w-0">
            <label className="text-xs font-bold text-slate-700 dark:text-white block mb-1.5">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
            {children}
            {error && <p className="text-xs text-red-500 mt-1 font-medium">{error}</p>}
        </div>
    );
}
