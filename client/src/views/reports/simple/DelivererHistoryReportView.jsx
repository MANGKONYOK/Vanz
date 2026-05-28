import { useState, useEffect } from 'react';
import { History } from 'lucide-react';
import { PageHeader, Btn, Card, CardHeader, Table, Tr, Td, Badge, FilterBar, FilterField, Input, LovInput, LovModal } from '../../../components/ui';
import { getJson, getApiErrorMessage } from '../../../api/http';

const STATUS_BADGE = { DELIVERED: 'green', DELIVERING: 'blue', PICKED_UP: 'blue', PREPARING: 'amber', CANCELLED: 'red' };

export default function DelivererHistoryReportView({ showToast }) {
    const [deliverer,  setDeliverer]  = useState('');
    const [dateFrom,   setDateFrom]   = useState('');
    const [dateTo,     setDateTo]     = useState('');
    const [lovOpen,    setLovOpen]    = useState(false);
    const [lovData,    setLovData]    = useState([]);
    const [rows,       setRows]       = useState([]);
    const [loading,    setLoading]    = useState(false);
    const [headerName, setHeaderName] = useState('');

    // Load deliverer LoV on mount
    useEffect(() => {
        Promise.all([
            getJson('/deliverers').catch(() => []),
            getJson('/profiles').catch(() => []),
        ]).then(([deliverers, profiles]) => {
            const profileMap = new Map(profiles.map(p => [p.profile_id, p]));
            setLovData(deliverers.map(d => {
                const prof = profileMap.get(d.profile_id) || {};
                return { id: d.deliverer_code, name: prof.full_name || d.deliverer_code, type: d.vehicle_type || '—' };
            }));
        }).catch(() => {});
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleSearch = async () => {
        if (!deliverer) return showToast?.('Please select a deliverer first', 'error');
        const delivererCode = String(deliverer).split(' – ')[0].trim();
        const delivererName = String(deliverer).split(' – ')[1] || delivererCode;
        setHeaderName(`${delivererName} (${delivererCode})`);
        setLoading(true);
        try {
            const [deliveries, orders, storeList, custList, profilesList] = await Promise.all([
                getJson('/deliveries', { deliverer_code: delivererCode }).catch(() => []),
                getJson('/orders').catch(() => []),
                getJson('/stores').catch(() => []),
                getJson('/customers').catch(() => []),
                getJson('/profiles').catch(() => []),
            ]);
            const orderMap   = new Map((orders      || []).map(o => [o.order_id,  o]));
            const storeMap   = new Map((storeList   || []).map(s => [s.store_id,  s]));
            const custMap    = new Map((custList    || []).map(c => [c.customer_id, c]));
            const profileMap = new Map((profilesList|| []).map(p => [p.profile_id, p]));

            let result = (deliveries || []).map(d => {
                const order  = orderMap.get(d.order_id) || {};
                const store  = storeMap.get(order.store_id) || {};
                const cust   = custMap.get(order.customer_id) || {};
                const prof   = profileMap.get(cust.profile_id) || {};
                const dateStr = d.delivery_time || d.pickup_time || '';
                return {
                    id:       order.order_code || `Delivery#${d.delivery_id}`,
                    date:     String(dateStr).slice(0, 10),
                    time:     String(dateStr).slice(11, 16) || '—',
                    store:    store.name || '-',
                    customer: prof.full_name || cust.customer_code || '-',
                    fee:      Number(d.delivery_fee || 0),
                    status:   order.status || 'DELIVERED',
                };
            });

            if (dateFrom) result = result.filter(r => r.date >= dateFrom);
            if (dateTo)   result = result.filter(r => r.date <= dateTo);
            result.sort((a, b) => b.date.localeCompare(a.date));
            setRows(result);
        } catch (e) {
            showToast?.(getApiErrorMessage(e, 'Failed to load delivery history'), 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fade-in space-y-5">
            <LovModal isOpen={lovOpen} onClose={() => setLovOpen(false)} title="Deliverer"
                columns={[{ key: 'id', label: 'ID' }, { key: 'name', label: 'Name' }, { key: 'type', label: 'Vehicle' }]}
                data={lovData}
                onSelect={r => { setDeliverer(`${r.id} – ${r.name}`); setLovOpen(false); }} />
            <PageHeader title="Deliverer History" subtitle="View delivery history of a specific deliverer" />
            <FilterBar>
                <FilterField label="Deliverer ID">
                    <LovInput value={deliverer} onLov={() => setLovOpen(true)} placeholder="Select deliverer..." />
                </FilterField>
                <FilterField label="Date From">
                    <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
                </FilterField>
                <FilterField label="Date To">
                    <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
                </FilterField>
                <Btn onClick={handleSearch} disabled={loading}>
                    <History className="w-4 h-4" /> {loading ? 'Loading…' : 'Search'}
                </Btn>
            </FilterBar>
            <Card>
                {headerName && <CardHeader title={`${headerName} — Delivery History`} />}
                <Table headers={[
                    { label: 'Order ID' }, { label: 'Date' }, { label: 'Time', center: true },
                    { label: 'Store' }, { label: 'Customer' }, { label: 'Fee', right: true }, { label: 'Status', center: true },
                ]}>
                    {rows.length === 0 ? (
                        <tr><td colSpan={7} className="py-10 text-center text-slate-400 text-sm">
                            {headerName ? 'No deliveries found for this deliverer' : 'Select a deliverer and click Search'}
                        </td></tr>
                    ) : rows.map(h => (
                        <Tr key={`${h.id}-${h.date}`}>
                            <Td bold mono className="text-xs">{h.id}</Td>
                            <Td>{h.date}</Td>
                            <Td center className="text-xs font-bold text-slate-500">{h.time}</Td>
                            <Td>{h.store}</Td>
                            <Td>{h.customer}</Td>
                            <Td right bold>฿{h.fee.toLocaleString()}</Td>
                            <Td center><Badge color={STATUS_BADGE[h.status] || 'gray'}>{h.status}</Badge></Td>
                        </Tr>
                    ))}
                </Table>
            </Card>
        </div>
    );
}
