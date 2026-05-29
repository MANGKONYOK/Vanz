import { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2 } from 'lucide-react';
import { PageHeader, Btn, Card, CardHeader, Table, Tr, Td, Badge, Input, Select, Pagination } from '../../components/ui';
import { getJson, deleteJson, getApiErrorMessage } from '../../api/http';
import CustomerOrderFormView from './CustomerOrderFormView';

const STATUS_COLOR = { pending: 'amber', confirmed: 'blue', preparing: 'blue', picked_up: 'blue', delivering: 'blue', delivered: 'green', cancelled: 'red' };

export default function CustomerOrderListView({ showToast }) {
    const [editing, setEditing] = useState(null);
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tick, setTick] = useState(0);
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState({ key: 'orderCode', direction: 'desc' });
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const refresh = () => setTick(t => t + 1);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        Promise.all([
            getJson('/orders'),
            getJson('/customers'),
            getJson('/profiles'),
            getJson('/stores'),
        ]).then(([orders, customers, profiles, stores]) => {
            if (cancelled) return;
            const custMap    = new Map(customers.map(c => [c.customer_id, c]));
            const profileMap = new Map(profiles.map(p => [p.profile_id, p]));
            const storeMap   = new Map(stores.map(s => [s.store_id, s]));
            setRows(orders.map(o => {
                const cust  = custMap.get(o.customer_id) || {};
                const prof  = profileMap.get(cust.profile_id) || {};
                const store = storeMap.get(o.store_id) || {};
                return {
                    id:              o.order_id,
                    orderCode:       o.order_code,
                    customerId:      o.customer_id,
                    customerCode:    cust.customer_code || '',
                    storeId:         o.store_id,
                    storeCode:       store.store_code || '',
                    customerName:    prof.full_name || '—',
                    storeName:       store.name || '—',
                    total:           o.total_price,
                    status:          o.status || 'pending',
                    addressSnapshot: o.address_snapshot || '',
                    date:            o.order_date ? new Date(o.order_date).toLocaleDateString() : '—',
                    orderItems:      o.order_items || [],
                };
            }));
        }).catch(err => {
            if (!cancelled) showToast(getApiErrorMessage(err, 'Failed to load orders'), 'error');
        }).finally(() => {
            if (!cancelled) setLoading(false);
        });
        return () => { cancelled = true; };
    }, [tick]);

    const handleDelete = async (o) => {
        if (o.status !== 'pending') return showToast('Only pending orders can be deleted', 'error');
        if (!window.confirm(`Delete order ${o.orderCode}?`)) return;
        try {
            await deleteJson(`/orders/${o.orderCode}`);
            showToast(`Order ${o.orderCode} deleted`);
            refresh();
        } catch (err) {
            showToast(getApiErrorMessage(err, 'Delete failed'), 'error');
        }
    };

    if (editing !== null) {
        return <CustomerOrderFormView data={editing} onBack={() => setEditing(null)} onSaved={() => { setEditing(null); refresh(); }} showToast={showToast} />;
    }

    const filtered = rows.filter(o =>
        o.orderCode.toLowerCase().includes(search.toLowerCase()) ||
        o.customerName.toLowerCase().includes(search.toLowerCase()) ||
        o.storeName.toLowerCase().includes(search.toLowerCase())
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
            <PageHeader title="Customer Orders" subtitle="Manage all customer orders and tracking"
                action={<Btn onClick={() => setEditing({})}><Plus className="w-4 h-4" /> Create Order</Btn>} />

            <Card className="overflow-hidden">
                <CardHeader
                    search={<Input icon={Search} placeholder="Search ID, customer, store..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="h-10 shadow-sm" />}
                    filter={
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-medium text-current/50">
                                {start}-{end} of {filtered.length} orders
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
                    headers={[
                        { label: 'Order ID',    key: 'orderCode',    sortable: true, width: '18%' },
                        { label: 'Date',        key: 'date',         sortable: true, width: '12%' },
                        { label: 'Customer',    key: 'customerName', sortable: true, width: '18%' },
                        { label: 'Store',       key: 'storeName',    sortable: true, width: '18%' },
                        { label: 'Total Order', key: 'total',        right: true, sortable: true, width: '12%' },
                        { label: 'Status',      key: 'status',       center: true, sortable: true, width: '10%' },
                        { label: 'Actions',     right: true,                         width: '12%' },
                    ]}
                >
                    {loading ? (
                        <Tr><Td colSpan={7} className="text-center text-current/40 py-8">Loading…</Td></Tr>
                    ) : paginated.length === 0 ? (
                        <Tr><Td colSpan={7} className="text-center text-current/40 py-8">No orders found</Td></Tr>
                    ) : paginated.map(o => (
                        <Tr key={o.orderCode}>
                            <Td mono className="text-xs font-bold whitespace-nowrap">{o.orderCode}</Td>
                            <Td className="whitespace-nowrap">{o.date}</Td>
                            <Td bold className="whitespace-nowrap">{o.customerName}</Td>
                            <Td className="whitespace-nowrap">{o.storeName}</Td>
                            <Td right bold className="whitespace-nowrap">฿{Number(o.total).toLocaleString()}</Td>
                            <Td center className="whitespace-nowrap">
                                <Badge color={STATUS_COLOR[o.status] || 'gray'}>{o.status}</Badge>
                            </Td>
                            <Td right className="whitespace-nowrap">
                                <div className="flex justify-end gap-2">
                                    <Btn size="sm" variant="secondary" onClick={() => setEditing(o)}><Edit2 className="w-3 h-3" /> Edit</Btn>
                                    <Btn size="sm" variant="danger" onClick={() => handleDelete(o)} disabled={o.status !== 'pending'}><Trash2 className="w-3 h-3" /> Delete</Btn>
                                </div>
                            </Td>
                        </Tr>
                    ))}
                </Table>
                <Pagination totalItems={filtered.length} itemsPerPage={pageSize} currentPage={page} onPageChange={setPage} showSummary={false} itemLabel="orders" />
            </Card>
        </div>
    );
}
