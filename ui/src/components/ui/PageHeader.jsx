export default function PageHeader({ title, subtitle, action }) {
    return (
        <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 mb-5">
            <div>
                <h2 className="text-xl font-black text-slate-900">{title}</h2>
                {subtitle && <p className="text-sm text-slate-600 mt-0.5">{subtitle}</p>}
            </div>
            {action}
        </div>
    );
}
