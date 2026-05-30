import { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, AlertCircle } from 'lucide-react';
import { PageHeader, Btn, Card, CardHeader, Table, Tr, Td, Badge, Input, Select, Pagination, TableSortFilter, applyFiltersAndSort, FilterPills } from '../../components/ui';
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
    const [error, setError] = useState(null);
     const [tick, setTick] = useState(0);
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState({ key: '', direction: 'asc' });
    const [filters, setFilters] = useState([]);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const refresh = () => {
        setLoading(true);
        setError(null);
        setTick(t => t + 1);
    };

    useEffect(() => {
        let cancelled = false;
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
            if (!cancelled) {
                setError(err);
                showToast(getApiErrorMessage(err, 'Failed to load products'), 'error');
            }
        }).finally(() => {
            if (!cancelled) setLoading(false);
        });
        return () => { cancelled = true; };
    }, [tick, showToast]);

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

     const columns = [
        { key: 'productId', label: 'Product ID', type: 'number' },
        { key: 'name', label: 'Name', type: 'text' },
        { key: 'storeName', label: 'Store Name', type: 'text' },
        { key: 'price', label: 'Price', type: 'number' },
        { key: 'status', label: 'Status', type: 'enum', options: ['AVAILABLE', 'OUT_OF_STOCK', 'DISCONTINUED', 'UNAVAILABLE'] },
        { key: 'updatedAt', label: 'Updated At', type: 'date' }
    ];

    const sorted = applyFiltersAndSort(rows, search, ['productId', 'name', 'storeName'], filters, sort);
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
                title="Products"
                subtitle="Manage menu items across all stores"
                action={<Btn onClick={() => setEditing({})}><Plus className="w-4 h-4" /> Add Product</Btn>}
            />

             <Card className="overflow-hidden">
                <CardHeader
                    search={
                        <div className="flex items-center gap-2 flex-1">
                            <Input
                                icon={Search}
                                placeholder="Search ID, name, store..."
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
                                {start}–{end} of {sorted.length} products
                            </span>
                            <Select
                                value={pageSize}
                                onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
                                className="h-9 border-slate-200 bg-white shadow-sm w-28"
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
                        <Tr><Td colSpan={6} center className="text-slate-400 py-8">Loading…</Td></Tr>
                    ) : error ? (
                        <Tr><Td colSpan={6} center className="py-8">
                            <div className="flex flex-col items-center justify-center text-red-500 gap-2">
                                <AlertCircle className="w-8 h-8 text-red-500 animate-bounce" />
                                <span className="font-semibold text-sm">Network Error: Failed to fetch data from server</span>
                                <span className="text-xs text-slate-400">{error.message || 'Please check your connection.'}</span>
                                <Btn size="sm" variant="secondary" onClick={refresh} className="mt-2">Retry</Btn>
                            </div>
                        </Td></Tr>
                    ) : paginated.length === 0 ? (
                        <Tr><Td colSpan={6} center className="text-slate-400 py-8">No products found</Td></Tr>
                    ) : paginated.map(p => (
                        <Tr key={p.productId}>
                            <Td mono className="text-xs text-slate-500 dark:text-gray-300 font-bold whitespace-nowrap">{p.productId}</Td>
                            <Td bold className="whitespace-nowrap">{p.name}</Td>
                            <Td className="text-slate-600 dark:text-gray-300 whitespace-nowrap">{p.storeName}</Td>
                            <Td right bold mono className="whitespace-nowrap">฿{parseFloat(p.price).toFixed(2)}</Td>
                            <Td center className="whitespace-nowrap">
                                <Badge color={STATUS_COLOR[p.status?.toUpperCase()] || 'gray'}>{p.status}</Badge>
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
                    totalItems={sorted.length}
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
