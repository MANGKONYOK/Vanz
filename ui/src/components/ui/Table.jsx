import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

export default function Table({ headers, children, minWidth = '500px', onSort, sortConfig }) {
    return (
        <div className="overflow-x-auto main-scrollbar">
            <table className="w-full text-sm text-left" style={{ minWidth }}>
                <thead className="bg-slate-100 border-b border-slate-200">
                    <tr>
                        {headers.map((h, i) => {
                            const isSortable = h.sortable && onSort;
                            const isSorted = sortConfig?.key === h.key;
                            return (
                                <th 
                                    key={i} 
                                    onClick={() => isSortable && onSort(h.key)}
                                    className={`px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-600 whitespace-nowrap 
                                        ${h.right ? 'text-right' : ''} ${h.center ? 'text-center' : ''} 
                                        ${isSortable ? 'cursor-pointer hover:bg-slate-200 transition-colors' : ''}`}
                                >
                                    <div className={`flex items-center gap-1.5 ${h.right ? 'justify-end' : h.center ? 'justify-center' : ''}`}>
                                        {h.label}
                                        {isSortable && (
                                            <span className="text-slate-400">
                                                {isSorted ? (
                                                    sortConfig.direction === 'asc' ? <ChevronUp size={12} className="text-red-500" /> : <ChevronDown size={12} className="text-red-500" />
                                                ) : (
                                                    <ChevronsUpDown size={12} className="opacity-30" />
                                                )}
                                            </span>
                                        )}
                                    </div>
                                </th>
                            );
                        })}
                    </tr>
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
