import { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, AlertCircle } from 'lucide-react';
import { PageHeader, Btn, Card, CardHeader, Table, Tr, Td, Badge, Input, Select, Pagination, ConfirmModal, TableSortFilter, applyFiltersAndSort, FilterPills } from '../../components/ui';
import { getJson, deleteJson, getApiErrorMessage } from '../../api/http';

function computeStatus(startDate, endDate) {
    const today = new Date();
    const start = new Date(startDate);
    const end   = new Date(endDate);
    if (today < start) return 'UPCOMING';
    if (today > end)   return 'EXPIRED';
    return 'ACTIVE';
}

const STATUS_COLOR = { ACTIVE: 'green', UPCOMING: 'blue', EXPIRED: 'gray' };

function formatShortDate(dateStr) {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
}

export default function PromotionListView({ onNavigate, showToast }) {
    const [rows,     setRows]     = useState([]);
    const [loading,  setLoading]  = useState(true);
    const [error,    setError]    = useState(null);
    const [tick,     setTick]     = useState(0);
    const [search,   setSearch]   = useState('');
    const [sort,     setSort]     = useState({ key: '', direction: 'asc' });
    const [filters,  setFilters]  = useState([]);
    const [page,     setPage]     = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);

    const refresh = () => {
        setLoading(true);
        setError(null);
        setTick(t => t + 1);
    };

    useEffect(() => {
        let cancelled = false;
        Promise.all([
            getJson('/promotions'),
            getJson('/stores'),
        ]).then(([promotions, stores]) => {
            if (cancelled) return;
            const storeMap = new Map(stores.map(s => [s.store_id, s]));
            const joined = promotions.map(p => {
                const store = storeMap.get(p.store_id) || {};
                return {
                    promotionCode: p.promotion_code,
                    promotionId:   p.promotion_id,
                    storeId:       p.store_id,
                    storeCode:     store.store_code || '—',
                    storeName:     store.name       || '—',
                    name:          p.name,
                    startDate:     p.start_date,
                    endDate:       p.end_date,
                    discountType:  p.discount_type,
                    status:        computeStatus(p.start_date, p.end_date),
                    items:         p.promotion_items || [],
                };
            });
            setRows(joined);
        }).catch(err => {
            if (!cancelled) {
                setError(err);
                showToast(getApiErrorMessage(err, 'Failed to load promotions'), 'error');
            }
        }).finally(() => {
            if (!cancelled) setLoading(false);
        });
        return () => { cancelled = true; };
    }, [tick, showToast]);

    const handleDelete = async () => {
        if (!confirmDeleteId) return;
        try {
            await deleteJson(`/promotions/${confirmDeleteId}`);
            showToast(`Promotion ${confirmDeleteId} deleted`);
            setConfirmDeleteId(null);
            refresh();
        } catch (err) {
            showToast(getApiErrorMessage(err, 'Delete failed'), 'error');
            setConfirmDeleteId(null);
        }
    };

         const columns = [
        { key: 'promotionCode', label: 'Code', type: 'text' },
        { key: 'name', label: 'Campaign', type: 'text' },
        { key: 'storeName', label: 'Store Name', type: 'text' },
        { key: 'startDate', label: 'Start Date', type: 'date' },
        { key: 'endDate', label: 'End Date', type: 'date' },
        { key: 'discountType', label: 'Type', type: 'enum', options: ['FIXED_AMOUNT', 'PERCENTAGE', 'FREE_DELIVERY'] },
        { key: 'status', label: 'Status', type: 'enum', options: ['ACTIVE', 'UPCOMING', 'EXPIRED'] }
    ];

    const sorted = applyFiltersAndSort(rows, search, ['promotionCode', 'name', 'storeName', 'discountType'], filters, sort);
    const paginated = sorted.slice((page - 1) * pageSize, page * pageSize);
    const start = sorted.length > 0 ? (page - 1) * pageSize + 1 : 0;
    const end = Math.min(page * pageSize, sorted.length);

    const handleSort = (key) => {
        setSort(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    return (
        <div className="fade-in space-y-5">
            <PageHeader
                title="Promotions"
                subtitle="Manage store promotional campaigns"
                action={<Btn onClick={() => onNavigate()}><Plus className="w-4 h-4" /> Create Promotion</Btn>}
            />

             <Card className="overflow-hidden">
                <CardHeader
                    search={
                        <div className="flex items-center gap-2 flex-1">
                            <Input
                                icon={Search}
                                placeholder="Search code, campaign, store..."
                                value={search}
                                onChange={e => { setSearch(e.target.value); setPage(1); }}
                                className="bg-white border-slate-200 h-10 shadow-sm"
                            />
                            <TableSortFilter
                                columns={columns}
                                sort={sort}
                                onSortChange={s => { setSort(s); setPage(1); }}
                                filters={filters}
                                onFiltersChange={f => { setFilters(f); setPage(1); }}
                            />
                        </div>
                    }
                    filter={
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-medium text-slate-500 dark:text-gray-300">
                                {start}–{end} of {sorted.length} promotions
                            </span>
                            <Select
                                value={pageSize}
                                onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
                                className="w-28 h-9"
                            >
                                {[10, 25, 50, 100].map(s => <option key={s} value={s}>{s} / page</option>)}
                            </Select>
                        </div>
                    }
                />

                {filters.length > 0 && (
                    <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20">
                        <FilterPills
                            columns={columns}
                            filters={filters}
                            onRemoveFilter={i => {
                                const newFilters = filters.filter((_, idx) => idx !== i);
                                setFilters(newFilters);
                                setPage(1);
                            }}
                            onClearAll={() => {
                                setFilters([]);
                                setPage(1);
                            }}
                        />
                    </div>
                )}

                <Table
                    onSort={handleSort}
                    sortConfig={sort}
                    minWidth="700px"
                    headers={[
                        { label: 'CODE',     key: 'promotionCode', sortable: true, width: '14%' },
                        { label: 'CAMPAIGN', key: 'name',          sortable: true, width: '20%' },
                        { label: 'STORE',    key: 'storeName',     sortable: true, width: '18%' },
                        { label: 'PERIOD',                                          width: '20%' },
                        { label: 'TYPE',     key: 'discountType',  sortable: true, width: '14%' },
                        { label: 'STATUS',   key: 'status',        sortable: true, center: true, width: '10%' },
                        { label: 'Actions',  right: true,                           width: '10%' },
                    ]}
                >
                    {loading ? (
                        <Tr><Td colSpan={7} center className="text-slate-400 py-8">Loading…</Td></Tr>
                    ) : error ? (
                        <Tr><Td colSpan={7} center className="py-8">
                            <div className="flex flex-col items-center justify-center text-red-500 gap-2">
                                <AlertCircle className="w-8 h-8 text-red-500 animate-bounce" />
                                <span className="font-semibold text-sm">Network Error: Failed to fetch data from server</span>
                                <span className="text-xs text-slate-400">{error.message || 'Please check your connection.'}</span>
                                <Btn size="sm" variant="secondary" onClick={refresh} className="mt-2">Retry</Btn>
                            </div>
                        </Td></Tr>
                    ) : paginated.length === 0 ? (
                        <Tr><Td colSpan={7} center className="text-slate-400 py-8">No promotions found</Td></Tr>
                    ) : paginated.map(p => (
                        <Tr key={p.promotionCode}>
                            <Td mono className="text-xs text-red-650 font-bold whitespace-nowrap">{p.promotionCode}</Td>
                            <Td bold className="whitespace-nowrap">{p.name}</Td>
                            <Td className="whitespace-nowrap">{p.storeName}</Td>
                            <Td className="text-xs whitespace-nowrap">{formatShortDate(p.startDate)} - {formatShortDate(p.endDate)}</Td>
                            <Td className="whitespace-nowrap"><Badge color="gray">{p.discountType.replace(/_/g, ' ')}</Badge></Td>
                            <Td center className="whitespace-nowrap">
                                <Badge color={STATUS_COLOR[p.status?.toUpperCase()] || 'gray'}>{p.status}</Badge>
                            </Td>
                            <Td right className="whitespace-nowrap">
                                <div className="flex justify-end gap-2">
                                    <Btn size="sm" variant="secondary" onClick={() => onNavigate(p)}>
                                        <Edit2 className="w-3 h-3" /> Edit
                                    </Btn>
                                    <Btn size="sm" variant="danger" onClick={() => setConfirmDeleteId(p.promotionCode)}>
                                        <Trash2 className="w-3 h-3" /> Delete
                                    </Btn>
                                </div>
                            </Td>
                        </Tr>
                    ))}
                </Table>

                 <Pagination
                    totalItems={sorted.length}
                    itemsPerPage={pageSize}
                    currentPage={page}
                    onPageChange={setPage}
                    showSummary={false}
                    itemLabel="promotions"
                />
            </Card>

            <ConfirmModal
                isOpen={!!confirmDeleteId}
                onClose={() => setConfirmDeleteId(null)}
                title="Delete Promotion"
                message={`Are you sure you want to delete promotion ${confirmDeleteId}? This action cannot be undone.`}
                onConfirm={handleDelete}
            />
        </div>
    );
}
