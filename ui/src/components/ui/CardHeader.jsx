export default function CardHeader({ title, action }) {
    return (
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-4">
            <h3 className="font-bold text-slate-900">{title}</h3>
            {action}
        </div>
    );
}
