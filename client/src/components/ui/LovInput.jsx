export default function LovInput({ value, onLov, placeholder = '' }) {
    return (
        <div className="flex rounded-lg shadow-sm overflow-hidden border border-slate-200 focus-within:border-red-400 focus-within:ring-2 focus-within:ring-red-100">
            <input readOnly value={value} placeholder={placeholder} className="flex-1 min-w-0 px-3 py-2 text-sm outline-none bg-white" />
            <button onClick={onLov} className="shrink-0 px-4 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-colors">LoV</button>
        </div>
    );
}
