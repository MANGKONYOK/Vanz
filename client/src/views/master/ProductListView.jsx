import { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2 } from 'lucide-react';
import { PageHeader, Btn, Card, CardHeader, Table, Tr, Td, Badge, Input, Select, Pagination } from '../../components/ui';
import { getJson, deleteJson, getApiErrorMessage } from '../../api/http';
import ProductFormView from './ProductFormView';

const STATUS_COLOR = { available: 'green', inactive: 'gray' };

export default function ProductListView({ showToast }) {
    const [editing, setEditing] = useState(null);
    const [rows, setRows] = useState([]);
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
            getJson('/store-products'),
            getJson('/stores'),
        ]).then(([products, stores]) => {
            if (cancelled) return;
            const storeMap = new Map(stores.map(s => [s.store_id, s]));
            setRows(products.map(p => {
                const store = storeMap.get(p.store_id) || {};
                return {
                    id:        p.product_id,
                    storeId:   p.store_id,
                    storeCode: store.store_code || '',
                    storeName: store.name || '—',
                    name:      p.name,
                    price:     p.unit_price,
                    status:    p.status || 'available',
                };
            }));
        }).catch(err => {
            if (!cancelled) showToast(getApiErrorMessage(err, 'Failed to load products'), 'error');
        }).finally(() => {
            if (!cancelled) setLoading(false);
        });
        return () => { cancelled = true; };
    }, [tick]);

    const handleDelete = async (p) => {
        if (!window.confirm(`Delete product "${p.name}"?`)) return;
        try {
            await deleteJson(`/store-products/${p.id}`);
            showToast(`Product deleted`);
            refresh();
        } catch (err) {
            showToast(getApiErrorMessage(err, 'Delete failed'), 'error');
        }
    };

    if (editing !== null) {
        return <ProductFormView data={editing} onBack={() => setEditing(null)} onSaved={() => { setEditing(null); refresh(); }} showToast={showToast} />;
    }

    const filtered = rows.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.storeName.toLowerCase().includes(search.toLowerCase()) ||
        p.storeCode.toLowerCase().includes(search.toLowerCase())
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
            <PageHeader title="Products" subtitle="Manage menu items across all stores"
                action={<Btn onClick={() => setEditing({})}><Plus className="w-4 h-4" /> Add Product</Btn>} />
            <Card className="overflow-hidden">
                <CardHeader
                    search={<Input icon={Search} placeholder="Search name, store..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="h-10 shadow-sm" />}
                    filter={
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-medium text-current/50">
                                {start}-{end} of {filtered.length} products
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
                    minWidth="800px"
                    headers={[
                        { label: 'NAME',   key: 'name',      sortable: true, width: '30%' },
                        { label: 'STORE',  key: 'storeName', sortable: true, width: '26%' },
                        { label: 'PRICE',  key: 'price',     right: true, sortable: true, width: '14%' },
                        { label: 'STATUS', key: 'status',    center: true, sortable: true, width: '14%' },
                        { label: 'Actions', right: true,                     width: '16%' },
                    ]}
                >
                    {loading ? (
                        <Tr><Td colSpan={5} className="text-center text-current/40 py-8">Loading…</Td></Tr>
                    ) : paginated.length === 0 ? (
                        <Tr><Td colSpan={5} className="text-center text-current/40 py-8">No products found</Td></Tr>
                    ) : paginated.map(p => (
                        <Tr key={p.id}>
                            <Td bold className="whitespace-nowrap">{p.name}</Td>
                            <Td className="whitespace-nowrap">{p.storeName}</Td>
                            <Td right bold className="whitespace-nowrap">฿{Number(p.price).toLocaleString()}</Td>
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
                <Pagination totalItems={filtered.length} itemsPerPage={pageSize} currentPage={page} onPageChange={setPage} showSummary={false} itemLabel="products" />
            </Card>
        </div>
    );
}
