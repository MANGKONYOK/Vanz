export default function Table({ headers, children, minWidth = '500px' }) {
    return (
        <div className="overflow-x-auto main-scrollbar">
            <table className="w-full text-sm text-left" style={{ minWidth }}>
                <thead className="bg-slate-100 border-b border-slate-200">
                    <tr>{headers.map((h, i) => <th key={i} className={`px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-600 whitespace-nowrap ${h.right ? 'text-right' : ''} ${h.center ? 'text-center' : ''}`}>{h.label}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-slate-100">{children}</tbody>
            </table>
        </div>
    );
}

export function Tr({ children, onClick }) {
    return <tr onClick={onClick} className={`hover:bg-slate-50 transition-colors ${onClick ? 'cursor-pointer' : ''}`}>{children}</tr>;
}

export function Td({ children, right, center, bold, mono, className = '' }) {
    return <td className={`px-4 py-3 text-slate-800 ${right ? 'text-right' : ''} ${center ? 'text-center' : ''} ${bold ? 'font-bold text-slate-900' : ''} ${mono ? 'mono text-xs' : ''} ${className}`}>{children}</td>;
}
