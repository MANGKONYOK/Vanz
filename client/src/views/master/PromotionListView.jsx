import { useState, useEffect } from 'react';
import { Search, Plus, Trash2, AlertCircle } from 'lucide-react';
import { PageHeader, Btn, Card, CardHeader, Table, Tr, Td, Badge, Input, Select, Pagination } from '../../components/ui';
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

export default function PromotionListView({ onNavigate, showToast }) {
    const [rows,     setRows]     = useState([]);
    const [loading,  setLoading]  = useState(true);
    const [error,    setError]    = useState(null);
    const [tick,     setTick]     = useState(0);
    const [search,   setSearch]   = useState('');
    const [sort,     setSort]     = useState({ key: 'name', direction: 'asc' });
    const [page,     setPage]     = useState(1);
    const [pageSize, setPageSize] = useState(10);

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

    const handleDelete = async (p) => {
        if (!window.confirm(`Delete promotion ${p.promotionCode}?`)) return;
        try {
            await deleteJson(`/promotions/${p.promotionCode}`);
            showToast(`Promotion ${p.promotionCode} deleted`);
            refresh();
        } catch (err) {
            showToast(getApiErrorMessage(err, 'Delete failed'), 'error');
        }
    };

    const filtered = rows.filter(p =>
        p.promotionCode.toLowerCase().includes(search.toLowerCase()) ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.storeName.toLowerCase().includes(search.toLowerCase()) ||
        p.discountType.toLowerCase().includes(search.toLowerCase())
    );

    const sorted = [...filtered].sort((a, b) => {
        const valA = a[sort.key] ?? '';
        const valB = b[sort.key] ?? '';
        if (valA < valB) return sort.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sort.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const paginated = sorted.slice((page - 1) * pageSize, page * pageSize);
    const start = filtered.length > 0 ? (page - 1) * pageSize + 1 : 0;
    const end = Math.min(page * pageSize, filtered.length);

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
                        <Input
                            icon={Search}
                            placeholder="Search code, campaign, store..."
                            value={search}
                            onChange={e => { setSearch(e.target.value); setPage(1); }}
                            className="bg-white border-slate-200 h-10 shadow-sm"
                        />
                    }
                    filter={
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-medium text-slate-500 dark:text-gray-300">
                                {start}–{end} of {filtered.length} promotions
                            </span>
                            <Select
                                value={pageSize}
                                onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
                                className="h-9 border-slate-200 bg-white shadow-sm w-24"
                            >
                                {[10, 25, 50, 100].map(s => <option key={s} value={s}>{s} / page</option>)}
                            </Select>
                        </div>
                    }
                />

                <Table
                    onSort={handleSort}
                    sortConfig={sort}
                    minWidth="900px"
                    headers={[
                        { label: 'CODE',     key: 'promotionCode', sortable: true, width: '14%' },
                        { label: 'CAMPAIGN', key: 'name',          sortable: true, width: '20%' },
                        { label: 'STORE',    key: 'storeName',     sortable: true, width: '16%' },
                        { label: 'PERIOD',                                          width: '20%' },
                        { label: 'TYPE',     key: 'discountType',  sortable: true, width: '14%' },
                        { label: 'STATUS',   key: 'status',        sortable: true, center: true, width: '10%' },
                        { label: 'Actions',  right: true,                           width: '10%' },
                    ]}
                >
                    {loading ? (
                        <Tr><Td colSpan={7} className="text-center text-slate-400 py-8">Loading…</Td></Tr>
                    ) : error ? (
                        <Tr><Td colSpan={7} className="text-center py-8">
                            <div className="flex flex-col items-center justify-center text-red-500 gap-2">
                                <AlertCircle className="w-8 h-8 text-red-500 animate-bounce" />
                                <span className="font-semibold text-sm">Network Error: Failed to fetch data from server</span>
                                <span className="text-xs text-slate-400">{error.message || 'Please check your connection.'}</span>
                                <Btn size="sm" variant="secondary" onClick={refresh} className="mt-2">Retry</Btn>
                            </div>
                        </Td></Tr>
                    ) : paginated.length === 0 ? (
                        <Tr><Td colSpan={7} className="text-center text-slate-400 py-8">No promotions found</Td></Tr>
                    ) : paginated.map(p => (
                        <Tr key={p.promotionCode}>
                            <Td mono className="text-xs text-red-600 font-bold whitespace-nowrap">{p.promotionCode}</Td>
                            <Td bold className="whitespace-nowrap">{p.name}</Td>
                            <Td className="whitespace-nowrap">{p.storeName}</Td>
                            <Td className="text-xs whitespace-nowrap">{p.startDate} → {p.endDate}</Td>
                            <Td className="whitespace-nowrap"><Badge color="gray">{p.discountType}</Badge></Td>
                            <Td center className="whitespace-nowrap">
                                <Badge color={STATUS_COLOR[p.status] || 'gray'}>{p.status}</Badge>
                            </Td>
                            <Td right className="whitespace-nowrap">
                                <Btn size="sm" variant="danger" onClick={() => handleDelete(p)}>
                                    <Trash2 className="w-3 h-3" /> Delete
                                </Btn>
                            </Td>
                        </Tr>
                    ))}
                </Table>

                <Pagination
                    totalItems={filtered.length}
                    itemsPerPage={pageSize}
                    currentPage={page}
                    onPageChange={setPage}
                    showSummary={false}
                    itemLabel="promotions"
                />
            </Card>
        </div>
    );
}
