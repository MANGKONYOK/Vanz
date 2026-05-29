import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export default function Pagination({ 
    totalItems, 
    itemsPerPage, 
    currentPage, 
    onPageChange, 
    itemLabel = 'items',
    showSummary = true
}) {
    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;
        let start = Math.max(1, currentPage - 2);
        let end = Math.min(totalPages, start + maxVisible - 1);
        
        if (end - start < maxVisible - 1) {
            start = Math.max(1, end - maxVisible + 1);
        }

        for (let i = start; i <= end; i++) pages.push(i);
        return pages;
    };

    return (
        <div className="px-5 py-3 bg-white dark:bg-transparent border-t border-slate-100 dark:border-red-900/50 flex items-center justify-between transition-colors duration-300">
            {showSummary && (
                <div className="hidden sm:block text-xs font-medium text-slate-500 dark:text-gray-300 uppercase tracking-wider">
                    Total {totalItems} {itemLabel}
                </div>
            )}
            
            <div className={`flex items-center gap-1.5 ${showSummary ? 'ml-auto' : 'w-full justify-end'}`}>
                <button onClick={() => onPageChange(1)} disabled={currentPage === 1} className="p-1.5 rounded-lg border border-slate-200 dark:border-gray-600 hover:bg-slate-50 dark:hover:bg-white/10 disabled:opacity-20 transition-colors">
                    <ChevronsLeft size={14} className="text-slate-500 dark:text-gray-300" />
                </button>
                <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="p-1.5 rounded-lg border border-slate-200 dark:border-gray-600 hover:bg-slate-50 dark:hover:bg-white/10 disabled:opacity-20 transition-colors">
                    <ChevronLeft size={14} className="text-slate-500 dark:text-gray-300" />
                </button>

                {getPageNumbers().map(p => (
                    <button 
                        key={p} 
                        onClick={() => onPageChange(p)}
                        className={`min-w-[32px] h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all
                            ${currentPage === p 
                                ? 'bg-red-700 text-white shadow-sm' 
                                : 'text-slate-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-white/10 border border-transparent hover:border-slate-200 dark:hover:border-gray-600'}`}
                    >
                        {p}
                    </button>
                ))}

                <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="p-1.5 rounded-lg border border-slate-200 dark:border-gray-600 hover:bg-slate-50 dark:hover:bg-white/10 disabled:opacity-20 transition-colors">
                    <ChevronRight size={14} className="text-slate-500 dark:text-gray-300" />
                </button>
                <button onClick={() => onPageChange(totalPages)} disabled={currentPage === totalPages} className="p-1.5 rounded-lg border border-slate-200 dark:border-gray-600 hover:bg-slate-50 dark:hover:bg-white/10 disabled:opacity-20 transition-colors">
                    <ChevronsRight size={14} className="text-slate-500 dark:text-gray-300" />
                </button>
            </div>
        </div>
    );
}
