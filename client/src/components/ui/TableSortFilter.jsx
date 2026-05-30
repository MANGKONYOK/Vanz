import { useState, useEffect, useRef } from 'react';
import { SlidersHorizontal, ArrowUpDown, Plus, Trash2, X, ChevronDown, Check } from 'lucide-react';
import Badge from './Badge';

// Helper function to apply search, filters, and sorting to data rows
export function applyFiltersAndSort(rows, search, searchFields, filters, sort) {
    let result = [...rows];

    // 1. Search Filter
    if (search && search.trim() !== '') {
        const query = search.toLowerCase().trim();
        result = result.filter(row =>
            searchFields.some(field => {
                const val = row[field];
                return val != null && String(val).toLowerCase().includes(query);
            })
        );
    }

    // 2. Custom Advanced Filters
    if (filters && filters.length > 0) {
        result = result.filter(row => {
            return filters.every(f => {
                const val = row[f.key];

                // Empty / Not Empty checks can be run on null/undefined
                if (f.operator === 'empty') {
                    return val === '' || val === '—' || val === null || val === undefined;
                }
                if (f.operator === 'not_empty') {
                    return val !== '' && val !== '—' && val !== null && val !== undefined;
                }

                // Other checks require a non-null value
                if (val == null) return false;

                if (f.operator === 'is') {
                    return String(val).toUpperCase() === String(f.value).toUpperCase();
                }
                if (f.operator === 'is_not') {
                    return String(val).toUpperCase() !== String(f.value).toUpperCase();
                }
                if (f.operator === 'contains') {
                    return String(val).toLowerCase().includes(String(f.value).toLowerCase());
                }
                if (f.operator === 'not_contains') {
                    return !String(val).toLowerCase().includes(String(f.value).toLowerCase());
                }
                if (f.operator === 'eq') {
                    return Number(val) === Number(f.value);
                }
                if (f.operator === 'gt') {
                    return Number(val) > Number(f.value);
                }
                if (f.operator === 'lt') {
                    return Number(val) < Number(f.value);
                }
                if (f.operator === 'gte') {
                    return Number(val) >= Number(f.value);
                }
                if (f.operator === 'lte') {
                    return Number(val) <= Number(f.value);
                }
                return true;
            });
        });
    }

    // 3. Sorting
    if (sort && sort.key) {
        result.sort((a, b) => {
            let valA = a[sort.key];
            let valB = b[sort.key];

            // Date parsing check
            const dateA = Date.parse(valA);
            const dateB = Date.parse(valB);
            const isDateA = !isNaN(dateA) && typeof valA === 'string' && valA.includes('/');
            const isDateB = !isNaN(dateB) && typeof valB === 'string' && valB.includes('/');

            if (isDateA && isDateB) {
                valA = dateA;
                valB = dateB;
            } else {
                // Numeric check
                const numA = Number(valA);
                const numB = Number(valB);
                const isNumA = !isNaN(numA) && valA !== '' && valA !== null && typeof valA !== 'object';
                const isNumB = !isNaN(numB) && valB !== '' && valB !== null && typeof valB !== 'object';

                if (isNumA && isNumB) {
                    valA = numA;
                    valB = numB;
                } else {
                    valA = valA != null ? String(valA).toLowerCase() : '';
                    valB = valB != null ? String(valB).toLowerCase() : '';
                }
            }

            if (valA < valB) return sort.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sort.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }

    return result;
}

export default function TableSortFilter({ columns, sort, onSortChange, filters = [], onFiltersChange }) {
    const [sortOpen, setSortOpen] = useState(false);
    const [filterOpen, setFilterOpen] = useState(false);

    const sortRef = useRef(null);
    const filterRef = useRef(null);

    // Dynamic label helper depending on column type
    const getSortLabels = (column) => {
        if (!column) return { asc: 'Ascending', desc: 'Descending' };
        if (column.type === 'number') return { asc: 'Smallest to Largest', desc: 'Largest to Smallest' };
        if (column.type === 'date') return { asc: 'Oldest to Newest', desc: 'Newest to Oldest' };
        return { asc: 'A → Z', desc: 'Z → A' };
    };

    const activeSortColumn = columns.find(c => c.key === sort.key);
    const sortLabels = getSortLabels(activeSortColumn);

    // Auto close on click outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (sortRef.current && !sortRef.current.contains(event.target)) {
                setSortOpen(false);
            }
            if (filterRef.current && !filterRef.current.contains(event.target)) {
                setFilterOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const addFilter = () => {
        if (columns.length === 0) return;
        const firstCol = columns[0];
        const defaultOp = firstCol.type === 'enum' ? 'is' : firstCol.type === 'number' ? 'eq' : 'contains';
        const defaultVal = firstCol.type === 'enum' ? (firstCol.options?.[0] || '') : '';
        
        onFiltersChange([
            ...filters,
            { key: firstCol.key, operator: defaultOp, value: defaultVal }
        ]);
    };

    const updateFilter = (index, updatedFields) => {
        const newFilters = [...filters];
        const currentFilter = newFilters[index];
        const mergedFilter = { ...currentFilter, ...updatedFields };

        // Reset operator and value if column key changed
        if (updatedFields.key && updatedFields.key !== currentFilter.key) {
            const col = columns.find(c => c.key === updatedFields.key);
            mergedFilter.operator = col.type === 'enum' ? 'is' : col.type === 'number' ? 'eq' : 'contains';
            mergedFilter.value = col.type === 'enum' ? (col.options?.[0] || '') : '';
        }

        newFilters[index] = mergedFilter;
        onFiltersChange(newFilters);
    };

    const removeFilter = (index) => {
        const newFilters = filters.filter((_, i) => i !== index);
        onFiltersChange(newFilters);
    };

    const clearFilters = () => {
        onFiltersChange([]);
    };

    const getOperators = (colType) => {
        if (colType === 'enum') {
            return [
                { value: 'is', label: 'is' },
                { value: 'is_not', label: 'is not' }
            ];
        }
        if (colType === 'number') {
            return [
                { value: 'eq', label: '=' },
                { value: 'gt', label: '>' },
                { value: 'lt', label: '<' },
                { value: 'gte', label: '≥' },
                { value: 'lte', label: '≤' },
                { value: 'empty', label: 'is empty' },
                { value: 'not_empty', label: 'is not empty' }
            ];
        }
        return [
            { value: 'contains', label: 'contains' },
            { value: 'not_contains', label: 'does not contain' },
            { value: 'is', label: 'is' },
            { value: 'is_not', label: 'is not' },
            { value: 'empty', label: 'is empty' },
            { value: 'not_empty', label: 'is not empty' }
        ];
    };

    return (
        <div className="flex flex-col gap-2 shrink-0">
            <div className="flex items-center gap-2">
                {/* Sort Button & Popover */}
                <div className="relative" ref={sortRef}>
                    <button
                        type="button"
                        onClick={() => { setSortOpen(!sortOpen); setFilterOpen(false); }}
                        className="h-10 px-3.5 flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold cursor-pointer select-none transition-all duration-200 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm"
                    >
                        <ArrowUpDown size={14} className="shrink-0" />
                        <span>Sort</span>
                    </button>

                    {sortOpen && (
                        <div className="absolute left-0 sm:right-0 sm:left-auto top-12 w-64 p-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 animate-popover-in fade-in transition-all duration-200 transform origin-top-right">
                            <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                                Sort by
                            </div>
                            <div className="space-y-2">
                                <div className="relative">
                                    <select
                                        value={sort.key || ''}
                                        onChange={(e) => {
                                            const key = e.target.value;
                                            if (key) {
                                                onSortChange({ key, direction: sort.direction || 'asc' });
                                            } else {
                                                onSortChange({ key: '', direction: 'asc' });
                                            }
                                        }}
                                        className="w-full appearance-none pl-3 pr-8 py-1.5 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg text-xs font-medium outline-none focus:border-red-400 dark:focus:border-red-500 transition-all cursor-pointer"
                                    >
                                        <option value="">None</option>
                                        {columns.filter(c => c.sortable !== false).map(c => (
                                            <option key={c.key} value={c.key}>{c.label}</option>
                                        ))}
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none text-slate-400">
                                        <ChevronDown size={12} />
                                    </div>
                                </div>

                                {sort.key && (
                                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                                        <button
                                            type="button"
                                            onClick={() => onSortChange({ ...sort, direction: 'asc' })}
                                            className={`py-1.5 px-2 rounded-lg text-[11px] font-bold text-center border cursor-pointer transition-all ${
                                                sort.direction === 'asc'
                                                    ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400'
                                                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                                            }`}
                                        >
                                            {sortLabels.asc}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => onSortChange({ ...sort, direction: 'desc' })}
                                            className={`py-1.5 px-2 rounded-lg text-[11px] font-bold text-center border cursor-pointer transition-all ${
                                                sort.direction === 'desc'
                                                    ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400'
                                                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                                            }`}
                                        >
                                            {sortLabels.desc}
                                        </button>
                                    </div>
                                )}

                                {sort.key && (
                                    <div className="border-t border-slate-100 dark:border-slate-800/80 pt-2 flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => onSortChange({ key: '', direction: 'asc' })}
                                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 cursor-pointer"
                                        >
                                            <Trash2 size={12} /> Clear Sort
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Filter Button & Popover */}
                <div className="relative" ref={filterRef}>
                    <button
                        type="button"
                        onClick={() => { setFilterOpen(!filterOpen); setSortOpen(false); }}
                        className="h-10 px-3.5 flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold cursor-pointer select-none transition-all duration-200 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm"
                    >
                        <SlidersHorizontal size={13} className="shrink-0" />
                        <span>Filter</span>
                    </button>

                    {filterOpen && (
                        <div className="absolute left-0 top-12 w-[340px] sm:w-[420px] p-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 animate-popover-in fade-in transition-all duration-200 transform origin-top-left">
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-2 mb-2">
                                <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                                    Filter Rules
                                </div>
                                {filters.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={clearFilters}
                                        className="text-[10px] font-bold text-red-500 hover:text-red-600 dark:text-red-400 cursor-pointer"
                                    >
                                        Clear All
                                    </button>
                                )}
                            </div>

                            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                                {filters.length === 0 ? (
                                    <div className="text-center py-6 text-xs text-slate-400 dark:text-slate-500 font-medium">
                                        No active filters. Add a filter to slice database.
                                    </div>
                                ) : (
                                    filters.map((f, index) => {
                                        const col = columns.find(c => c.key === f.key) || columns[0];
                                        const ops = getOperators(col.type);

                                        return (
                                            <div key={index} className="flex items-center gap-2 group/row">
                                                {/* Column Selection */}
                                                <div className="relative w-28 shrink-0">
                                                    <select
                                                        value={f.key}
                                                        onChange={(e) => updateFilter(index, { key: e.target.value })}
                                                        className="w-full appearance-none pl-2.5 pr-6 py-1.5 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-semibold outline-none focus:border-red-400 cursor-pointer"
                                                    >
                                                        {columns.map(c => (
                                                            <option key={c.key} value={c.key}>{c.label}</option>
                                                        ))}
                                                    </select>
                                                    <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-slate-400">
                                                        <ChevronDown size={11} />
                                                    </div>
                                                </div>

                                                {/* Operator Selection */}
                                                <div className="relative w-28 shrink-0">
                                                    <select
                                                        value={f.operator}
                                                        onChange={(e) => updateFilter(index, { operator: e.target.value })}
                                                        className="w-full appearance-none pl-2.5 pr-6 py-1.5 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-semibold outline-none focus:border-red-400 cursor-pointer"
                                                    >
                                                        {ops.map(o => (
                                                            <option key={o.value} value={o.value}>{o.label}</option>
                                                        ))}
                                                    </select>
                                                    <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-slate-400">
                                                        <ChevronDown size={11} />
                                                    </div>
                                                </div>

                                                {/* Value Input */}
                                                {f.operator !== 'empty' && f.operator !== 'not_empty' && (
                                                    <div className="flex-1 min-w-0">
                                                        {col.type === 'enum' ? (
                                                            <div className="relative">
                                                                <select
                                                                    value={f.value}
                                                                    onChange={(e) => updateFilter(index, { value: e.target.value })}
                                                                    className="w-full appearance-none pl-2.5 pr-6 py-1.5 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-semibold outline-none focus:border-red-400 cursor-pointer"
                                                                >
                                                                    {col.options?.map(opt => {
                                                                        const valStr = typeof opt === 'object' ? opt.value : opt;
                                                                        const labelStr = typeof opt === 'object' ? opt.label : opt;
                                                                        return <option key={valStr} value={valStr}>{labelStr}</option>;
                                                                    })}
                                                                </select>
                                                                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-slate-400">
                                                                    <ChevronDown size={11} />
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <input
                                                                type={col.type === 'number' ? 'number' : col.type === 'date' ? 'date' : 'text'}
                                                                value={f.value}
                                                                placeholder={col.type === 'number' ? '0' : 'Filter value...'}
                                                                onChange={(e) => updateFilter(index, { value: e.target.value })}
                                                                className="w-full pl-2.5 pr-2.5 py-1.5 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg text-xs outline-none focus:border-red-400 focus:ring-1 focus:ring-red-100 dark:focus:ring-red-900/30"
                                                            />
                                                        )}
                                                    </div>
                                                )}

                                                {/* Delete Button */}
                                                <button
                                                    type="button"
                                                    onClick={() => removeFilter(index)}
                                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer shrink-0 transition-colors"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            <button
                                type="button"
                                onClick={addFilter}
                                className="w-full mt-3 py-2 border border-dashed border-slate-200 dark:border-slate-800 hover:border-red-300 dark:hover:border-red-900/50 hover:bg-red-50/30 dark:hover:bg-red-950/10 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 flex items-center justify-center gap-1.5 cursor-pointer transition-colors duration-200"
                            >
                                <Plus size={13} /> Add filter
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Display-only component for filter badges/pills under the search bar
export function FilterPills({ columns, filters, onRemoveFilter, onClearAll }) {
    if (!filters || filters.length === 0) return null;

    return (
        <div className="flex flex-wrap items-center gap-1.5 pt-2 animate-popover-in fade-in">
            <span className="text-[10px] font-bold text-white dark:text-white uppercase tracking-wider shrink-0 mr-1">
                Filters:
            </span>
            {filters.map((f, i) => {
                const col = columns.find(c => c.key === f.key);
                if (!col) return null;

                const getOperatorLabel = (op) => {
                    const map = {
                        is: '=',
                        is_not: '≠',
                        contains: 'contains',
                        not_contains: 'not contain',
                        eq: '=',
                        gt: '>',
                        lt: '<',
                        gte: '≥',
                        lte: '≤',
                        empty: 'is empty',
                        not_empty: 'is not empty'
                    };
                    return map[op] || op;
                };

                let displayValue = f.value;
                if (f.operator === 'empty' || f.operator === 'not_empty') {
                    displayValue = '';
                } else if (col.type === 'enum') {
                    const opt = col.options?.find(o => (typeof o === 'object' ? o.value : o) === f.value);
                    if (opt && typeof opt === 'object') displayValue = opt.label;
                }

                return (
                    <span
                        key={i}
                        className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full border border-amber-400/35 bg-amber-500/10 text-amber-200 dark:text-amber-300 transition-colors shadow-sm select-none"
                    >
                        <span>{col.label}</span>
                        <span className="text-amber-400/90 dark:text-amber-400/90 text-[10px] font-bold">{getOperatorLabel(f.operator)}</span>
                        {displayValue !== '' && <span className="font-bold text-white">{displayValue}</span>}
                        <button
                            type="button"
                            onClick={() => onRemoveFilter(i)}
                            className="w-3.5 h-3.5 rounded-full flex items-center justify-center hover:bg-amber-500/20 text-amber-300 hover:text-white cursor-pointer ml-0.5 transition-colors shrink-0"
                        >
                            <X size={10} strokeWidth={3} />
                        </button>
                    </span>
                );
            })}
            <button
                type="button"
                onClick={onClearAll}
                className="text-[11px] font-bold text-white hover:text-white/80 dark:text-white dark:hover:text-white/80 hover:underline px-1.5 py-0.5 cursor-pointer transition-colors"
            >
                Clear All
            </button>
        </div>
    );
}
