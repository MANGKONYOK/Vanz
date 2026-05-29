import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Search, X } from 'lucide-react';

export default function LovModal({ isOpen, onClose, title, columns, data, onSelect }) {
    const [search, setSearch] = useState('');
    if (!isOpen) return null;
    const filtered = data.filter(row => columns.some(c => String(row[c.key] || '').toLowerCase().includes(search.toLowerCase())));
    return createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-xl flex flex-col max-h-[80vh] overflow-hidden fade-in border border-slate-200 dark:border-slate-800">
                <div className="p-4 sm:px-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">Select {title}</h3>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"><X className="w-5 h-5" /></button>
                </div>
                <div className="p-4 sm:px-6 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <div className="relative">
                        <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search to filter..." className="w-full pl-10 pr-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-red-400 dark:focus:border-red-500 focus:ring-4 focus:ring-red-100 dark:focus:ring-red-900/50 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 transition-all" />
                    </div>
                </div>
                <div className="overflow-y-auto main-scrollbar bg-slate-50/50 dark:bg-slate-950/20">
                    <table className="w-full text-sm">
                        <thead className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 shadow-sm z-10">
                            <tr>{columns.map(c => <th key={c.key} className="p-4 px-6 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{c.label}</th>)}<th className="p-4 px-6"></th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-850 bg-white dark:bg-slate-900">
                            {filtered.map((row, i) => (
                                <tr key={i} className="hover:bg-red-50/80 dark:hover:bg-red-950/30 transition-colors cursor-pointer group" onClick={() => onSelect(row)}>
                                    {columns.map(c => <td key={c.key} className="p-4 px-6 text-slate-700 dark:text-slate-300 font-medium">{row[c.key]}</td>)}
                                    <td className="p-4 px-6 text-right"><button className="px-4 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg group-hover:bg-red-600 group-hover:text-white group-hover:border-red-600 transition-all shadow-sm">Select</button></td>
                                </tr>
                            ))}
                            {filtered.length === 0 && <tr><td colSpan={columns.length + 1} className="p-8 text-center text-slate-400 dark:text-slate-500 text-sm">No results found for "{search}"</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>,
        document.body
    );
}
