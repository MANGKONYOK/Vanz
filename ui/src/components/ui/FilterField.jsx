export default function FilterField({ label, children }) {
    return (
        <div className="flex-1 min-w-[140px] max-w-[200px]">
            <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wide block mb-1">{label}</label>
            {children}
        </div>
    );
}
