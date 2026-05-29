export default function Select({ children, ...props }) {
    return <select {...props} className={`w-full min-w-0 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-red-400 dark:focus:border-red-500 focus:ring-2 focus:ring-red-100 dark:focus:ring-red-900/50 transition-colors bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 ${props.className || ''}`}>{children}</select>;
}
