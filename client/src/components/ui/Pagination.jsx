import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ 
    totalItems, 
    itemsPerPage, 
    currentPage, 
    onPageChange, 
    onItemsPerPageChange,
    itemLabel = 'items'
}) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const start = (currentPage - 1) * itemsPerPage + 1;
    const end = Math.min(currentPage * itemsPerPage, totalItems);

    return (
        <div className="px-5 py-4 bg-white border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-sm text-slate-500">
                {totalItems > 0 ? (
                    <span>Showing <span className="font-bold text-slate-900">{start}-{end}</span> of <span className="font-bold text-slate-900">{totalItems}</span> {itemLabel}</span>
                ) : (
                    <span>No {itemLabel} found</span>
                )}
            </div>
            
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <select 
                        value={itemsPerPage} 
                        onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
                        className="border border-slate-200 rounded-lg px-2 py-1 text-xs outline-none focus:border-red-400 bg-slate-50 font-medium"
                    >
                        {[10, 25, 50, 100].map(size => (
                            <option key={size} value={size}>{size} / page</option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center gap-1">
                    <button 
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <div className="text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 min-w-[40px] text-center">
                        {currentPage} / {totalPages || 1}
                    </div>
                    <button 
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage === totalPages || totalPages === 0}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}
