import { useState } from 'react';
import { Search } from 'lucide-react';
import { PageHeader, Btn, Card, Table, Tr, Td, FilterBar, FilterField, Input } from '../../../components/ui';
import { getJson, getApiErrorMessage } from '../../../api/http';

export default function DeliveredOrdersReportView({ showToast }) {
    const [rows,      setRows]      = useState([]);
    const [loading,   setLoading]   = useState(false);
    const [generated, setGenerated] = useState(false);
    const [dateFrom,  setDateFrom]  = useState('');
    const [dateTo,    setDateTo]    = useState('');

    const handleGenerate = () => {
        setLoading(true);
        setGenerated(true);
        Promise.all([
            getJson('/orders', { status: 'DELIVERED' }).catch(() => []),
            getJson('/customers').catch(() => []),
            getJson('/profiles').catch(() => []),
            getJson('/stores').catch(() => []),
            getJson('/deliveries').catch(() => []),
            getJson('/deliverers').catch(() => []),
        ]).then(([orders, customers, profiles, stores, deliveries, deliverers]) => {
            const profileMap   = new Map(profiles.map(p => [p.profile_id, p]));
            const custMap      = new Map(customers.map(c => [c.customer_id, c]));
            const storeMap     = new Map(stores.map(s => [s.store_id, s]));
            const deliveryMap  = new Map(deliveries.map(d => [d.order_id, d]));
            const delivererMap = new Map(deliverers.map(d => [d.deliverer_id, d]));

            let result = (orders || [])
                .filter(o => o.status === 'DELIVERED')
                .map(o => {
                    const cust     = custMap.get(o.customer_id) || {};
                    const prof     = profileMap.get(cust.profile_id) || {};
                    const store    = storeMap.get(o.store_id) || {};
                    const delivery = deliveryMap.get(o.order_id) || {};
                    const dlv      = delivererMap.get(delivery.deliverer_id) || {};
                    const dlvProf  = profileMap.get(dlv.profile_id) || {};

                    const pickupMs   = delivery.pickup_time   ? new Date(delivery.pickup_time).getTime()   : null;
                    const deliveryMs = delivery.delivery_time ? new Date(delivery.delivery_time).getTime() : null;
                    const durationMins = pickupMs && deliveryMs ? Math.round((deliveryMs - pickupMs) / 60000) : null;
                    const duration = durationMins != null ? `${durationMins} min` : '—';

                    return {
                        id:        o.order_code,
                        date:      String(o.order_date || '').slice(0, 10),
                        customer:  prof.full_name || cust.customer_code || '-',
                        store:     store.name || '-',
                        deliverer: dlvProf.full_name || dlv.deliverer_code || '—',
                        duration,
                        total:     Number(o.total_price || 0),
                    };
                });

            if (dateFrom) result = result.filter(r => r.date >= dateFrom);
            if (dateTo)   result = result.filter(r => r.date <= dateTo);

            setRows(result);
        }).catch(e => {
            showToast?.(getApiErrorMessage(e, 'Failed to load orders'), 'error');
        }).finally(() => {
            setLoading(false);
        });
    };

    return (
        <div className="fade-in space-y-5">
            <PageHeader title="Delivered Orders" subtitle="List of all orders that have been successfully delivered" />
            <FilterBar>
                <FilterField label="Date From">
                    <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
                </FilterField>
                <FilterField label="Date To">
                    <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
                </FilterField>
                <Btn onClick={handleGenerate} disabled={loading}>
                    <Search className="w-4 h-4" /> {loading ? 'Loading…' : 'Generate'}
                </Btn>
            </FilterBar>
            <Card>
                {loading ? (
                    <div className="py-12 text-center text-current/60 text-sm">Loading orders…</div>
                ) : (
                    <Table headers={[
                        { label: 'Order ID' }, { label: 'Date' }, { label: 'Customer' },
                        { label: 'Store' }, { label: 'Deliverer' }, { label: 'Duration', right: true }, { label: 'Total', right: true },
                    ]}>
                        {rows.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="py-10 text-center text-current/50 text-sm">
                                    {generated ? 'No delivered orders found' : 'Set filters and click Generate'}
                                </td>
                            </tr>
                        ) : rows.map(o => (
                            <Tr key={o.id}>
                                <Td bold mono className="text-xs">{o.id}</Td>
                                <Td>{o.date}</Td>
                                <Td>{o.customer}</Td>
                                <Td>{o.store}</Td>
                                <Td>{o.deliverer}</Td>
                                <Td right className="text-xs text-current/60 font-bold">{o.duration}</Td>
                                <Td right bold>฿{o.total.toLocaleString()}</Td>
                            </Tr>
                        ))}
                    </Table>
                )}
            </Card>
        </div>
    );
}
