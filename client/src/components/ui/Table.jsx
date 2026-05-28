import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';

export default function Table({ headers, children, minWidth = '500px', onSort, sortConfig }) {
    return (
        <div className="overflow-x-auto main-scrollbar">
            <table className="w-full text-sm text-left" style={{ minWidth }}>
                <thead className="bg-slate-100 border-b border-slate-200">
                    <tr>
                        {headers.map((h, i) => {
                            const isSortable = h.sortable && onSort;
                            const isSorted = sortConfig?.key === h.key;
                            
                            const textClass = isSorted 
                                ? 'text-slate-900 font-extrabold' 
                                : isSortable 
                                    ? 'text-slate-500 hover:text-slate-900 transition-colors duration-200' 
                                    : 'text-slate-500';

                            return (
                                <th 
                                    key={i} 
                                    onClick={() => isSortable && onSort(h.key)}
                                    style={{ width: h.width }}
                                    className={`px-4 py-3 text-[11px] uppercase tracking-wide whitespace-nowrap group select-none
                                        ${h.right ? 'text-right' : ''} ${h.center ? 'text-center' : ''} 
                                        ${isSortable ? 'cursor-pointer hover:bg-slate-200/50 transition-colors' : ''}
                                        ${textClass}`}
                                >
                                    <div className={`flex items-center gap-1 ${h.right ? 'justify-end' : h.center ? 'justify-center' : ''}`}>
                                        <span>{h.label}</span>
                                        {isSortable && (
                                            <span className="inline-flex items-center min-h-[14px]">
                                                {isSorted ? (
                                                    sortConfig.direction === 'asc' ? (
                                                        <ArrowUp size={13} className="text-red-600 font-bold animate-bounce-subtle" />
                                                    ) : (
                                                        <ArrowDown size={13} className="text-red-600 font-bold animate-bounce-subtle" />
                                                    )
                                                ) : (
                                                    <ArrowUpDown size={13} className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-slate-400" />
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
