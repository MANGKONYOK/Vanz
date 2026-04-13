export default function Input({ ...props }) {
    return <input {...props} className={`w-full min-w-0 px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-colors bg-white ${props.className || ''}`} />;
}
