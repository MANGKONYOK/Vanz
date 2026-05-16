export default function FormField({ label, required, children }) {
    return (
        <div className="min-w-0">
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
            {children}
        </div>
    );
}
