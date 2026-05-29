import { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2 } from 'lucide-react';
import { PageHeader, Btn, Card, CardHeader, Table, Tr, Td, Badge, Input, Select, Pagination } from '../../components/ui';
import { getJson, deleteJson, getApiErrorMessage } from '../../api/http';
import ProductFormView from './ProductFormView';

const STATUS_COLOR = {
    AVAILABLE:    'green',
    OUT_OF_STOCK: 'amber',
    DISCONTINUED: 'red',
    UNAVAILABLE:  'gray',
};

export default function ProductListView({ showToast }) {
    const [editing, setEditing] = useState(null);
    const [rows, setRows] = useState([]);
    const [stores, setStores] = useState([]);   // passed down to form's LoV
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
        ]).then(([products, storeList]) => {
            if (cancelled) return;
            const storeMap = new Map(storeList.map(s => [s.store_id, s]));

            // Store list for LoV in form: {id: store_code, storeId, name, category}
            setStores(storeList.map(s => ({
                id:       s.store_code,
                storeId:  s.store_id,
                name:     s.name,
                category: s.category,
            })));

            const joined = products.map(p => {
                const store = storeMap.get(p.store_id) || {};
                return {
                    productId:  p.product_id,
                    storeId:    p.store_id,
                    storeCode:  store.store_code || '—',
                    storeName:  store.name       || '—',
                    name:       p.name,
                    price:      p.unit_price,
                    status:     p.status || 'AVAILABLE',
                    updatedAt:  p.updated_at ? new Date(p.updated_at).toLocaleDateString() : '—',
                };
            });
            setRows(joined);
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
            await deleteJson(`/store-products/${p.productId}`);
            showToast(`Product "${p.name}" deleted`);
            refresh();
        } catch (err) {
            showToast(getApiErrorMessage(err, 'Delete failed'), 'error');
        }
    };

    if (editing !== null) {
        return (
            <ProductFormView
                data={editing}
                stores={stores}
                onBack={() => setEditing(null)}
                onSaved={() => { setEditing(null); refresh(); }}
                showToast={showToast}
            />
        );
    }

    const filtered = rows.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.storeName.toLowerCase().includes(search.toLowerCase()) ||
        String(p.productId).includes(search)
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
                title="Products"
                subtitle="Manage menu items across all stores"
                action={<Btn onClick={() => setEditing({})}><Plus className="w-4 h-4" /> Add Product</Btn>}
            />

            <Card className="overflow-hidden">
                <CardHeader
                    search={
                        <Input
                            icon={Search}
                            placeholder="Search ID, name, store..."
                            value={search}
                            onChange={e => { setSearch(e.target.value); setPage(1); }}
                            className="bg-white border-slate-200 h-10 shadow-sm"
                        />
                    }
                    filter={
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-medium text-slate-500 dark:text-gray-300">
                                {start}–{end} of {filtered.length} products
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
                    minWidth="860px"
                    headers={[
                        { label: '#',      key: 'productId', sortable: true, width: '6%'  },
                        { label: 'NAME',   key: 'name',      sortable: true, width: '26%' },
                        { label: 'STORE',  key: 'storeName', sortable: true, width: '22%' },
                        { label: 'PRICE',  key: 'price',     sortable: true, right: true,  width: '12%' },
                        { label: 'STATUS', key: 'status',    sortable: true, center: true, width: '14%' },
                        { label: 'Actions', right: true,                                    width: '14%' },
                    ]}
                >
                    {loading ? (
                        <Tr><Td colSpan={6} className="text-center text-slate-400 py-8">Loading…</Td></Tr>
                    ) : paginated.length === 0 ? (
                        <Tr><Td colSpan={6} className="text-center text-slate-400 py-8">No products found</Td></Tr>
                    ) : paginated.map(p => (
                        <Tr key={p.productId}>
                            <Td mono className="text-xs text-slate-500 dark:text-gray-300 font-bold whitespace-nowrap">{p.productId}</Td>
                            <Td bold className="whitespace-nowrap">{p.name}</Td>
                            <Td className="text-slate-600 dark:text-gray-300 whitespace-nowrap">{p.storeName}</Td>
                            <Td right bold mono className="whitespace-nowrap">฿{parseFloat(p.price).toFixed(2)}</Td>
                            <Td center className="whitespace-nowrap">
                                <Badge color={STATUS_COLOR[p.status] || 'gray'}>{p.status}</Badge>
                            </Td>
                            <Td right className="whitespace-nowrap">
                                <div className="flex justify-end gap-2">
                                    <Btn size="sm" variant="secondary" onClick={() => setEditing(p)}>
                                        <Edit2 className="w-3 h-3" /> Edit
                                    </Btn>
                                    <Btn size="sm" variant="danger" onClick={() => handleDelete(p)}>
                                        <Trash2 className="w-3 h-3" /> Delete
                                    </Btn>
                                </div>
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
                    itemLabel="products"
                />
            </Card>
        </div>
    );
}
