import { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2 } from 'lucide-react';
import { PageHeader, Btn, Card, CardHeader, Table, Tr, Td, Badge, Input, Select, Pagination } from '../../components/ui';
import { getJson, deleteJson, getApiErrorMessage } from '../../api/http';
import PromotionFormView from './PromotionFormView';

function promoStatus(startDate, endDate) {
    const today = new Date().toISOString().slice(0, 10);
    if (today < startDate) return 'upcoming';
    if (today > endDate)   return 'expired';
    return 'active';
}

const STATUS_COLOR = { active: 'green', upcoming: 'blue', expired: 'gray' };

export default function PromotionListView({ showToast }) {
    const [editing, setEditing] = useState(null);
    const [rows, setRows] = useState([]);
    const [stores, setStores] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tick, setTick] = useState(0);
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState({ key: 'name', direction: 'asc' });
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const refresh = () => setTick(t => t + 1);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        Promise.all([
            getJson('/promotions'),
            getJson('/stores'),
            getJson('/store-products'),
        ]).then(([promotions, storeList, productList]) => {
            if (cancelled) return;
            const storeMap = new Map(storeList.map(s => [s.store_id, s]));
            setStores(storeList);
            setProducts(productList);
            setRows(promotions.map(p => {
                const store = storeMap.get(p.store_id) || {};
                return {
                    id:           p.promotion_id,
                    promotionCode: p.promotion_code,
                    storeId:      p.store_id,
                    storeCode:    store.store_code || '',
                    storeName:    store.name || '—',
                    name:         p.name,
                    discountType: p.discount_type,
                    startDate:    p.start_date,
                    endDate:      p.end_date,
                    status:       promoStatus(p.start_date, p.end_date),
                    items:        p.promotion_items || [],
                };
            }));
        }).catch(err => {
            if (!cancelled) showToast(getApiErrorMessage(err, 'Failed to load promotions'), 'error');
        }).finally(() => {
            if (!cancelled) setLoading(false);
        });
        return () => { cancelled = true; };
    }, [tick]);

    const handleDelete = async (p) => {
        if (!window.confirm(`Delete promotion "${p.name}"?`)) return;
        try {
            await deleteJson(`/promotions/${p.promotionCode}`);
            showToast(`Promotion deleted`);
            refresh();
        } catch (err) {
            showToast(getApiErrorMessage(err, 'Delete failed'), 'error');
        }
    };

    if (editing !== null) {
        return <PromotionFormView data={editing} stores={stores} products={products}
            onBack={() => setEditing(null)} onSaved={() => { setEditing(null); refresh(); }} showToast={showToast} />;
    }

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

    const handleSort = (key) => setSort(prev => ({
        key,
        direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));

    return (
        <div className="fade-in space-y-5">
            <PageHeader title="Promotions" subtitle="Manage store promotional campaigns"
                action={<Btn onClick={() => setEditing({})}><Plus className="w-4 h-4" /> Create Promotion</Btn>} />

            <Card className="overflow-hidden">
                <CardHeader
                    search={<Input icon={Search} placeholder="Search ID, campaign, store..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="h-10 shadow-sm" />}
                    filter={
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-medium text-current/50">
                                {start}-{end} of {filtered.length} promotions
                            </span>
                            <Select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }} className="h-9 shadow-sm w-24">
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
                        { label: 'ID',       key: 'promotionCode', sortable: true, width: '16%' },
                        { label: 'CAMPAIGN', key: 'name',          sortable: true, width: '20%' },
                        { label: 'STORE',    key: 'storeName',     sortable: true, width: '16%' },
                        { label: 'PERIOD',                                          width: '18%' },
                        { label: 'TYPE',     key: 'discountType',  sortable: true, width: '12%' },
                        { label: 'STATUS',   key: 'status', center: true,           width: '8%'  },
                        { label: 'Actions',  right: true,                            width: '10%' },
                    ]}
                >
                    {loading ? (
                        <Tr><Td colSpan={7} className="text-center text-current/40 py-8">Loading…</Td></Tr>
                    ) : paginated.length === 0 ? (
                        <Tr><Td colSpan={7} className="text-center text-current/40 py-8">No promotions found</Td></Tr>
                    ) : paginated.map(p => (
                        <Tr key={p.promotionCode}>
                            <Td mono className="text-xs font-bold whitespace-nowrap">{p.promotionCode}</Td>
                            <Td bold className="whitespace-nowrap">{p.name}</Td>
                            <Td className="whitespace-nowrap">{p.storeName}</Td>
                            <Td className="text-xs whitespace-nowrap">{p.startDate} → {p.endDate}</Td>
                            <Td className="whitespace-nowrap"><Badge>{p.discountType}</Badge></Td>
                            <Td center className="whitespace-nowrap">
                                <Badge color={STATUS_COLOR[p.status] || 'gray'}>{p.status}</Badge>
                            </Td>
                            <Td right className="whitespace-nowrap">
                                <div className="flex justify-end gap-2">
                                    <Btn size="sm" variant="secondary" onClick={() => setEditing(p)}><Edit2 className="w-3 h-3" /> Edit</Btn>
                                    <Btn size="sm" variant="danger" onClick={() => handleDelete(p)}><Trash2 className="w-3 h-3" /> Delete</Btn>
                                </div>
                            </Td>
                        </Tr>
                    ))}
                </Table>
                <Pagination totalItems={filtered.length} itemsPerPage={pageSize} currentPage={page} onPageChange={setPage} showSummary={false} itemLabel="promotions" />
            </Card>
        </div>
    );
}
