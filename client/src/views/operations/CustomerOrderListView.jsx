import { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, AlertCircle } from 'lucide-react';
import { PageHeader, Btn, Card, CardHeader, Table, Tr, Td, Badge, Input, Select, Pagination, ConfirmModal } from '../../components/ui';
import { getJson, deleteJson, getApiErrorMessage } from '../../api/http';

export default function CustomerOrderListView({ onNavigate, showToast }) {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [tick, setTick] = useState(0);
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState({ key: 'date', direction: 'desc' });
    const [page, setPage] = useState(1);
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
            getJson('/orders'),
            getJson('/customers'),
            getJson('/stores'),
            getJson('/profiles'),
        ]).then(([ordersList, customersList, storesList, profilesList]) => {
            if (cancelled) return;
            const customerMap = new Map(customersList.map(c => [c.customer_id, c]));
            const storeMap = new Map(storesList.map(s => [s.store_id, s]));
            const profileMap = new Map(profilesList.map(p => [p.profile_id, p]));

            const joined = ordersList.map(o => {
                const cust = customerMap.get(o.customer_id) || {};
                const prof = profileMap.get(cust.profile_id) || {};
                const store = storeMap.get(o.store_id) || {};
                return {
                    id: o.order_code,
                    date: o.order_date ? new Date(o.order_date).toLocaleDateString() : '—',
                    store: store.name || '—',
                    total: parseFloat(o.total_price || 0),
                    status: o.status,
                    customer: prof.full_name || '—',
                };
            });
            setOrders(joined);
        }).catch(err => {
            if (!cancelled) {
                setError(err);
                showToast(getApiErrorMessage(err, 'Failed to load orders'), 'error');
            }
        }).finally(() => {
            if (!cancelled) setLoading(false);
        });
        return () => { cancelled = true; };
    }, [tick, showToast]);

    const confirmDelete = async () => {
        if (confirmDeleteId) {
            try {
                await deleteJson(`/orders/${confirmDeleteId}`);
                showToast(`Order ${confirmDeleteId} deleted successfully`);
                setConfirmDeleteId(null);
                refresh();
            } catch (err) {
                showToast(getApiErrorMessage(err, 'Delete failed'), 'error');
                setConfirmDeleteId(null);
            }
        }
    };

    // 1. Filter
    const filtered = orders.filter(o =>
        o.id.toLowerCase().includes(search.toLowerCase()) ||
        o.customer.toLowerCase().includes(search.toLowerCase()) ||
        o.store.toLowerCase().includes(search.toLowerCase())
    );

    // 2. Sort
    const sorted = [...filtered].sort((a, b) => {
        const valA = a[sort.key] ?? '';
        const valB = b[sort.key] ?? '';
        if (valA < valB) return sort.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sort.direction === 'asc' ? 1 : -1;
        return 0;
    });

    // 3. Paginate
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
            <PageHeader title="Customer Orders" subtitle="Manage all customer orders and tracking"
                action={<Btn onClick={onNavigate}><Plus className="w-4 h-4" /> Create Order</Btn>} />

            <Card className="overflow-hidden">
                <CardHeader
                    search={<Input icon={Search} placeholder="Search ID, customer, store..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="h-10 shadow-sm" />}
                    filter={
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-medium text-slate-500 dark:text-gray-300">
                                {start}-{end} of {filtered.length} orders
                            </span>
                            <Select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }} className="h-9 shadow-sm w-28">
                                {[10, 25, 50, 100].map(s => <option key={s} value={s}>{s} / page</option>)}
                            </Select>
                        </div>
                    }
                />
                <Table
                    onSort={handleSort}
                    sortConfig={sort}
                    headers={[
                        { label: 'Order ID', key: 'id', sortable: true, width: '16%' },
                        { label: 'Date', key: 'date', sortable: true, width: '14%' },
                        { label: 'Customer', key: 'customer', sortable: true, width: '18%' },
                        { label: 'Store', key: 'store', sortable: true, width: '18%' },
                        { label: 'Total Order', key: 'total', right: true, sortable: true, width: '12%' },
                        { label: 'Status', key: 'status', center: true, sortable: true, width: '10%' },
                        { label: 'Actions', right: true, width: '12%' }
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
                        <Tr><Td colSpan={7} className="text-center text-slate-400 py-8">No orders found</Td></Tr>
                    ) : paginated.map(o => (
                        <Tr key={o.id}>
                            <Td mono className="text-xs font-bold text-slate-950 dark:text-slate-100">{o.id}</Td>
                            <Td>{o.date}</Td>
                            <Td bold>{o.customer}</Td>
                            <Td>{o.store}</Td>
                            <Td right bold>฿{o.total?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Td>
                            <Td center>
                                <Badge color={o.status?.toUpperCase() === 'DELIVERED' || o.status?.toUpperCase() === 'COMPLETED' ? 'green' : o.status?.toUpperCase() === 'CANCELLED' || o.status?.toUpperCase() === 'FAILED' ? 'red' : 'amber'}>
                                    {o.status}
                                </Badge>
                            </Td>
                            <Td right>
                                <div className="flex justify-end gap-2">
                                    <Btn size="sm" variant="secondary" onClick={() => onNavigate(o)}><Edit2 className="w-3 h-3" /> Edit</Btn>
                                    <Btn size="sm" variant="danger" onClick={() => setConfirmDeleteId(o.id)}><Trash2 className="w-3 h-3" /> Delete</Btn>
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
                    itemLabel="orders"
                />
            </Card>

            <ConfirmModal
                isOpen={!!confirmDeleteId}
                onClose={() => setConfirmDeleteId(null)}
                title="Delete Customer Order"
                message={`Are you sure you want to delete order ${confirmDeleteId}? This action will permanently remove the order record from the system.`}
                onConfirm={confirmDelete}
            />
        </div>
    );
}
