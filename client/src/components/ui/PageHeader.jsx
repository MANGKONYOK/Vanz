export default function PageHeader({ title, subtitle, action }) {
    return (
        <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 mb-5">
            <div>
                <h2 className="text-xl font-extrabold text-red-600 dark:text-red-400">{title}</h2>
                {subtitle && <p className="text-sm text-red-600/75 dark:text-red-400/75 mt-0.5 font-medium">{subtitle}</p>}
            </div>
            {action}
        </div>
    );
}
