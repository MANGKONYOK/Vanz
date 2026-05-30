import { useState, useEffect } from 'react';
import { History } from 'lucide-react';
import { PageHeader, Btn, Card, CardHeader, Table, Tr, Td, Badge, FilterBar, FilterField, Input, LovInput, LovModal } from '../../../components/ui';
import { getJson, getApiErrorMessage } from '../../../api/http';

export default function DelivererHistoryReportView({ showToast }) {
    const [isLovOpen, setIsLovOpen] = useState(false);
    const [deliverer, setDeliverer] = useState('');
    const [dateFrom,  setDateFrom]  = useState('');
    const [dateTo,    setDateTo]    = useState('');
    const [lovDeliverers, setLovDeliverers] = useState([]);
    
    const [rows,      setRows]      = useState([]);
    const [loading,   setLoading]   = useState(false);
    const [generated, setGenerated] = useState(false);

    // Fetch deliverers for LoV on component mount
    useEffect(() => {
        let cancelled = false;
        Promise.all([
            getJson('/deliverers').catch(() => []),
            getJson('/profiles').catch(() => []),
        ]).then(([deliverersData, profilesData]) => {
            if (cancelled) return;
            const profileMap = new Map(profilesData.map(p => [String(p.profile_id), p]));
            const formatted = (deliverersData || []).map(d => {
                const prof = profileMap.get(String(d.profile_id)) || {};
                return {
                    id: d.deliverer_code,
                    delivererId: d.deliverer_id,
                    name: prof.full_name || d.deliverer_code || '-',
                    type: d.vehicle_type || '-',
                };
            });
            setLovDeliverers(formatted);
        }).catch(e => {
            if (!cancelled) showToast?.(getApiErrorMessage(e, 'Failed to load deliverers'), 'error');
        });
        return () => { cancelled = true; };
    }, [showToast]);

    const handleSearch = () => {
        if (!deliverer) {
            showToast?.('Please select a deliverer first', 'warning');
            return;
        }
        setLoading(true);
        setGenerated(true);

        const parts = String(deliverer).split(' – ');
        const dlvCode = parts[0].trim();

        Promise.all([
            getJson('/deliveries', { deliverer_code: dlvCode }).catch(() => []),
            getJson('/orders').catch(() => []),
            getJson('/stores').catch(() => []),
            getJson('/customers').catch(() => []),
            getJson('/profiles').catch(() => []),
        ]).then(([deliveriesData, ordersData, storesData, customersData, profilesData]) => {
            const orderMap = new Map((ordersData || []).map(o => [String(o.order_id), o]));
            const storeMap = new Map((storesData || []).map(s => [String(s.store_id), s]));
            const custMap = new Map((customersData || []).map(c => [String(c.customer_id), c]));
            const profileMap = new Map((profilesData || []).map(p => [String(p.profile_id), p]));

            let result = (deliveriesData || []).map(d => {
                const order = orderMap.get(String(d.order_id)) || {};
                const store = storeMap.get(String(order.store_id)) || {};
                const cust = custMap.get(String(order.customer_id)) || {};
                const prof = profileMap.get(String(cust.profile_id)) || {};

                const formatDateTime = (dt) => {
                    if (!dt) return '—';
                    return String(dt).replace('T', ' ').slice(0, 16);
                };

                const pickup = formatDateTime(d.pickup_time);
                const delivery = formatDateTime(d.delivery_time);
                
                // Extract date for filtering (YYYY-MM-DD)
                const deliveryDate = d.pickup_time ? String(d.pickup_time).slice(0, 10) : (d.delivery_time ? String(d.delivery_time).slice(0, 10) : '');

                return {
                    deliveryId: d.delivery_id,
                    orderCode: order.order_code || '-',
                    storeName: store.name || '-',
                    customer: prof.full_name || cust.customer_code || '-',
                    type: d.delivery_type || '-',
                    pickupTime: pickup,
                    deliveryTime: delivery,
                    fee: Number(d.delivery_fee || 0),
                    orderTotal: Number(order.total_price || 0),
                    date: deliveryDate,
                };
            });

            // Date filtering
            if (dateFrom) result = result.filter(r => r.date >= dateFrom);
            if (dateTo)   result = result.filter(r => r.date <= dateTo);

            // Sort by delivery ID descending
            result.sort((a, b) => b.deliveryId - a.deliveryId);

            setRows(result);
        }).catch(e => {
            showToast?.(getApiErrorMessage(e, 'Failed to load delivery history'), 'error');
        }).finally(() => {
            setLoading(false);
        });
    };

    const parts = String(deliverer).split(' – ');
    const delivererName = parts[1] || '';
    const delivererCode = parts[0] || '';
    const cardTitle = deliverer
        ? `${delivererName} (${delivererCode}) — Delivery History`
        : 'Delivery History';

    return (
        <div className="fade-in space-y-5">
            <LovModal isOpen={isLovOpen} onClose={() => setIsLovOpen(false)} title="Deliverer"
                columns={[{ key: 'id', label: 'ID' }, { key: 'name', label: 'Name' }, { key: 'type', label: 'Vehicle' }]}
                data={lovDeliverers}
                onSelect={r => { setDeliverer(`${r.id} – ${r.name}`); setIsLovOpen(false); }} />
            
            <PageHeader title="Deliverer History" subtitle="View delivery history of a specific deliverer" />
            
            <FilterBar>
                <FilterField label="Deliverer ID">
                    <LovInput value={deliverer} onLov={() => setIsLovOpen(true)} placeholder="Select deliverer..." />
                </FilterField>
                <FilterField label="Date From">
                    <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
                </FilterField>
                <FilterField label="Date To">
                    <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
                </FilterField>
                <Btn onClick={handleSearch} disabled={loading}>
                    <History className="w-4 h-4" /> {loading ? 'Searching…' : 'Search'}
                </Btn>
            </FilterBar>
            
            <Card>
                <CardHeader title={cardTitle} />
                {loading ? (
                    <div className="py-12 text-center text-slate-500 dark:text-gray-300 text-sm">Loading delivery history…</div>
                ) : (
                    <Table headers={[
                        { label: 'Delivery ID' }, 
                        { label: 'Order Code' }, 
                        { label: 'Store Name' }, 
                        { label: 'Customer' }, 
                        { label: 'Type' }, 
                        { label: 'Pickup Time', center: true }, 
                        { label: 'Delivery Time', center: true }, 
                        { label: 'Fee', right: true }, 
                        { label: 'Order Total', right: true }
                    ]}>
                        {rows.length === 0 ? (
                            <tr>
                                <td colSpan={9} className="py-10 text-center text-slate-500 dark:text-gray-300 text-sm">
                                    {generated ? 'No delivery history found' : 'Select a deliverer and click Search'}
                                </td>
                            </tr>
                        ) : rows.map(r => (
                            <Tr key={r.deliveryId}>
                                <Td bold mono className="text-xs">{r.deliveryId}</Td>
                                <Td mono className="text-xs">{r.orderCode}</Td>
                                <Td bold>{r.storeName}</Td>
                                <Td>{r.customer}</Td>
                                <Td><Badge>{r.type}</Badge></Td>
                                <Td center className="text-xs font-bold text-slate-500 dark:text-gray-300">{r.pickupTime}</Td>
                                <Td center className="text-xs font-bold text-slate-500 dark:text-gray-300">{r.deliveryTime}</Td>
                                <Td right bold>฿{r.fee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Td>
                                <Td right bold className="text-emerald-700 dark:text-emerald-400">
                                    ฿{r.orderTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </Td>
                            </Tr>
                        ))}
                    </Table>
                )}
            </Card>
        </div>
    );
}
