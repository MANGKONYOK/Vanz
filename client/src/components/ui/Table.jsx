import { ChevronUp, ChevronDown, ArrowUpDown } from 'lucide-react';

export default function Table({ headers, children, minWidth = '500px', onSort, sortConfig }) {
    return (
        <div className="overflow-x-auto main-scrollbar">
            <table className="w-full text-sm text-left" style={{ minWidth }}>
                <thead className="bg-slate-100 dark:bg-black/20 border-b border-slate-200 dark:border-red-900/50 transition-colors duration-300">
                    <tr>
                        {headers.map((h, i) => {
                            const isSortable = h.sortable && onSort;
                            const isSorted = sortConfig?.key === h.key;
                            
                            const textClass = isSorted 
                                ? 'text-current font-bold' 
                                : isSortable 
                                    ? 'text-current/60 hover:text-current/90 transition-colors duration-200' 
                                    : 'text-current/60';

                            return (
                                <th 
                                    key={i} 
                                    onClick={() => isSortable && onSort(h.key)}
                                    style={{ width: h.width }}
                                    className={`px-4 py-3 text-[11px] uppercase tracking-wide whitespace-nowrap group select-none
                                        ${h.right ? 'text-right' : ''} ${h.center ? 'text-center' : ''} 
                                        ${isSortable ? 'cursor-pointer' : ''}
                                        ${textClass}`}
                                >
                                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 -ml-2.5 rounded-md transition-colors
                                        ${isSorted ? 'bg-slate-200/70 dark:bg-black/20 shadow-sm' : isSortable ? 'group-hover:bg-slate-200/40 dark:group-hover:bg-black/10' : ''}
                                        ${h.right ? 'ml-auto mr-0 -mr-2.5 float-right' : h.center ? 'mx-auto' : ''}`}>
                                        <span>{h.label}</span>
                                        {isSortable && (
                                            <span className="inline-flex items-center min-h-[14px]">
                                                {isSorted ? (
                                                    sortConfig.direction === 'asc' ? (
                                                        <ChevronUp size={14} className="text-current/70" />
                                                    ) : (
                                                        <ChevronDown size={14} className="text-current/70" />
                                                    )
                                                ) : (
                                                    <ArrowUpDown size={14} className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-current/50" />
                                                )}
                                            </span>
                                        )}
                                    </div>
                                </th>
                            );
                        })}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-red-900/50">{children}</tbody>
            </table>
        </div>
    );
}

export function Tr({ children, onClick }) {
    return <tr onClick={onClick} className={`hover:bg-slate-50 dark:hover:bg-white/5 transition-colors ${onClick ? 'cursor-pointer' : ''}`}>{children}</tr>;
}

export function Td({ children, right, center, bold, mono, className = '' }) {
    return <td className={`px-4 py-3 text-current/90 ${right ? 'text-right' : ''} ${center ? 'text-center' : ''} ${bold ? 'font-bold text-current' : ''} ${mono ? 'mono text-xs' : ''} ${className}`}>{children}</td>;
}
