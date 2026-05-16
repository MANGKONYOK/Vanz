export default function Input({ icon: Icon, ...props }) {
    return (
        <div className="relative group w-full">
            {Icon && (
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-red-500 transition-colors pointer-events-none">
                    <Icon size={16} />
                </div>
            )}
            <input 
                {...props} 
                className={`w-full min-w-0 ${Icon ? 'pl-9' : 'px-3'} py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-colors bg-white ${props.className || ''}`} 
            />
        </div>
    );
}
