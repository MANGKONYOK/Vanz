import { useState, useEffect } from 'react';
import { Plus, Search } from 'lucide-react';
import { PageHeader, Btn, Card, Table, Tr, Td, Badge, FilterBar, FilterField, Input, Select } from '../../components/ui';
import { getJson, getApiErrorMessage } from '../../api/http';

const STATUS_BADGE = {
    PENDING:    'amber',
    CONFIRMED:  'amber',
    PREPARING:  'blue',
    PREPARED:   'blue',
    PICKED_UP:  'blue',
    DELIVERING: 'blue',
    DELIVERED:  'green',
    CANCELLED:  'red',
};

const ALL_STATUSES = ['PENDING', 'CONFIRMED', 'PREPARING', 'PREPARED', 'PICKED_UP', 'DELIVERING', 'DELIVERED', 'CANCELLED'];

export default function CustomerOrderListView({ onNavigate, showToast }) {
    const [rows, setRows]       = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch]   = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [tick, setTick]       = useState(0);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        Promise.all([
            getJson('/orders').catch(() => []),
            getJson('/customers').catch(() => []),
            getJson('/profiles').catch(() => []),
            getJson('/stores').catch(() => []),
        ]).then(([orders, customers, profiles, stores]) => {
            if (cancelled) return;
            const profileMap = new Map(profiles.map(p => [p.profile_id, p]));
            const custMap    = new Map(customers.map(c => [c.customer_id, c]));
            const storeMap   = new Map(stores.map(s => [s.store_id, s]));

            setRows(orders.map(o => {
                const cust  = custMap.get(o.customer_id) || {};
                const prof  = profileMap.get(cust.profile_id) || {};
                const store = storeMap.get(o.store_id) || {};
                return {
                    id:      o.order_code,
                    orderId: o.order_id,
                    date:    String(o.order_date || '').slice(0, 10),
                    customer: prof.full_name || cust.customer_code || `Cust#${o.customer_id}`,
                    store:    store.name || `Store#${o.store_id}`,
                    status:   o.status || 'PENDING',
                    total:    Number(o.total_price || 0),
                };
            }));
        }).catch(e => {
            if (!cancelled) showToast(getApiErrorMessage(e, 'Failed to load orders'), 'error');
        }).finally(() => {
            if (!cancelled) setLoading(false);
        });
        return () => { cancelled = true; };
    }, [tick]); // eslint-disable-line react-hooks/exhaustive-deps

    const filtered = rows.filter(o => {
        const matchSearch = !search ||
            o.id.toLowerCase().includes(search.toLowerCase()) ||
            o.customer.toLowerCase().includes(search.toLowerCase()) ||
            o.store.toLowerCase().includes(search.toLowerCase());
        const matchStatus = !statusFilter || o.status === statusFilter;
        return matchSearch && matchStatus;
    });

    return (
        <div className="fade-in space-y-5">
            <PageHeader
                title="Customer Orders"
                subtitle="Manage all customer orders"
                action={<Btn onClick={onNavigate}><Plus className="w-4 h-4" /> Create Order</Btn>}
            />
            <FilterBar>
                <div className="w-full md:w-72">
                    <FilterField label="Search">
                        <Input icon={Search} placeholder="Order code, customer, store…"
                            value={search} onChange={e => setSearch(e.target.value)} />
                    </FilterField>
                </div>
                <FilterField label="Status">
                    <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                        <option value="">All Statuses</option>
                        {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </Select>
                </FilterField>
            </FilterBar>
            <Card>
                {loading ? (
                    <div className="py-12 text-center text-slate-500 text-sm">Loading orders…</div>
                ) : (
                    <Table headers={[
                        { label: 'Order Code' },
                        { label: 'Date' },
                        { label: 'Customer' },
                        { label: 'Store' },
                        { label: 'Total', right: true },
                        { label: 'Status', center: true },
                    ]}>
                        {filtered.length === 0 ? (
                            <tr><td colSpan={6} className="py-10 text-center text-slate-400 text-sm">
                                {rows.length === 0 ? 'No orders found' : 'No orders match the current filter'}
                            </td></tr>
                        ) : filtered.map(o => (
                            <Tr key={o.id}>
                                <Td mono className="text-xs font-bold text-red-600">{o.id}</Td>
                                <Td className="text-xs text-slate-500">{o.date}</Td>
                                <Td bold>{o.customer}</Td>
                                <Td className="text-slate-600">{o.store}</Td>
                                <Td right bold className="mono">฿{o.total.toLocaleString()}</Td>
                                <Td center>
                                    <Badge color={STATUS_BADGE[o.status] || 'gray'}>{o.status}</Badge>
                                </Td>
                            </Tr>
                        ))}
                    </Table>
                )}
            </Card>
        </div>
    );
}
