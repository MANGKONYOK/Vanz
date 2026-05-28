export default function CardHeader({ title, action, search, filter }) {
    return (
        <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
                {title && <h3 className="font-bold text-slate-900 whitespace-nowrap">{title}</h3>}
                {search && <div className="flex-1 max-w-md">{search}</div>}
            </div>
            <div className="flex items-center gap-4 shrink-0">
                {filter && <div className="flex items-center gap-2">{filter}</div>}
                {action && <div className="shrink-0">{action}</div>}
            </div>
        </div>
    );
}
