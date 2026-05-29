export default function Input({ icon: Icon, ...props }) {
    return (
        <div className="relative group w-full">
            {Icon && (
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-red-500 dark:group-focus-within:text-red-400 transition-colors pointer-events-none">
                    <Icon size={16} />
                </div>
            )}
            <input 
                {...props} 
                className={`w-full min-w-0 ${Icon ? 'pl-9' : 'px-3'} py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-red-400 dark:focus:border-red-500 focus:ring-2 focus:ring-red-100 dark:focus:ring-red-900/50 transition-colors bg-white dark:bg-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 ${props.className || ''}`} 
            />
        </div>
    );
}
