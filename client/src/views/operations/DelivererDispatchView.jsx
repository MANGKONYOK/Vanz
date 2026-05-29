import { useState, useEffect } from 'react';
import { Truck, Zap, RefreshCw } from 'lucide-react';
import { PageHeader, Btn, Card, CardHeader, Table, Tr, Td, Badge, FormField, LovInput, LovModal } from '../../components/ui';
import { getJson, postJson, getApiErrorMessage } from '../../api/http';

function extractCode(value) {
    return String(value || '').split(' – ')[0].trim();
}

const VEHICLE_ICON = { Motorcycle: '🏍', Car: '🚗', Bicycle: '🚲', Scooter: '🛵', Van: '🚐', Truck: '🚚' };

export default function DelivererDispatchView({ showToast }) {
    // Prepared orders queue
    const [queue,       setQueue]       = useState([]);
    const [deliverers,  setDeliverers]  = useState([]);
    const [loadingQ,    setLoadingQ]    = useState(false);

    // Form state
    const [orderId,     setOrderId]     = useState('');
    const [delivererId, setDelivererId] = useState('');
    const [lovTarget,   setLovTarget]   = useState(null); // null | 'order' | 'deliverer'
    const [tick,        setTick]        = useState(0);

    const refresh = () => setTick(t => t + 1);

    // Load PREPARED orders and AVAILABLE deliverers in parallel
    useEffect(() => {
        let cancelled = false;
        setLoadingQ(true);
        Promise.all([
            getJson('/orders').catch(() => []),
            getJson('/customers').catch(() => []),
            getJson('/profiles').catch(() => []),
            getJson('/stores').catch(() => []),
            getJson('/deliverers').catch(() => []),
        ]).then(([orders, customers, profiles, stores, delivererList]) => {
            if (cancelled) return;

            const profileMap = new Map(profiles.map(p => [p.profile_id, p]));
            const custMap    = new Map(customers.map(c => [c.customer_id, c]));
            const storeMap   = new Map(stores.map(s => [s.store_id, s]));

            // Show CONFIRMED and PREPARING orders in the dispatch queue
            const prepared = orders
                .filter(o => o.status === 'confirmed' || o.status === 'preparing')
                .map(o => {
                    const cust  = custMap.get(o.customer_id) || {};
                    const prof  = profileMap.get(cust.profile_id) || {};
                    const store = storeMap.get(o.store_id) || {};
                    return {
                        id:       o.order_code,
                        store:    store.name || `Store#${o.store_id}`,
                        customer: prof.full_name || cust.customer_code || `Cust#${o.customer_id}`,
                        total:    Number(o.total_price || 0),
                    };
                });
            setQueue(prepared);

            // Build deliverer LoV list (all, show status)
            setDeliverers(delivererList.map(d => {
                const prof = profileMap.get(d.profile_id) || {};
                return {
                    id:     d.deliverer_code,
                    name:   prof.full_name || d.deliverer_code,
                    type:   `${VEHICLE_ICON[d.vehicle_type] || ''} ${d.vehicle_type || ''}`.trim(),
                    status: d.current_status || 'UNKNOWN',
                };
            }));
        }).catch(e => {
            if (!cancelled) showToast(getApiErrorMessage(e, 'Failed to load dispatch data'), 'error');
        }).finally(() => {
            if (!cancelled) setLoadingQ(false);
        });
        return () => { cancelled = true; };
    }, [tick]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleDispatch = async (orderCode, delivererCode) => {
        try {
            await postJson('/dispatch-assignments', {
                order_code:     orderCode,
                deliverer_code: delivererCode,
            });
            showToast(`Order ${orderCode} dispatched to ${delivererCode}!`);
            setQueue(q => q.filter(o => o.id !== orderCode));
            return true;
        } catch (e) {
            showToast(getApiErrorMessage(e, 'Unable to dispatch order'), 'error');
            return false;
        }
    };

    const attemptDispatch = async () => {
        if (!orderId)     return showToast('Please select a prepared order first', 'error');
        if (!delivererId) return showToast('Please assign a deliverer', 'error');
        const ok = await handleDispatch(orderId, extractCode(delivererId));
        if (ok) { setOrderId(''); setDelivererId(''); }
    };

    const lovColumns = lovTarget === 'order'
        ? [{ key: 'id', label: 'Order Code' }, { key: 'store', label: 'Store' }, { key: 'customer', label: 'Customer' }]
        : [{ key: 'id', label: 'Code' }, { key: 'name', label: 'Name' }, { key: 'type', label: 'Vehicle' }, { key: 'status', label: 'Status' }];
    const lovData = lovTarget === 'order' ? queue : deliverers;

    return (
        <div className="fade-in space-y-5">
            <LovModal
                isOpen={!!lovTarget}
                onClose={() => setLovTarget(null)}
                title={lovTarget === 'order' ? 'Prepared Order' : 'Deliverer'}
                columns={lovColumns}
                data={lovData}
                onSelect={r => {
                    if (lovTarget === 'order') setOrderId(r.id);
                    else setDelivererId(`${r.id} – ${r.name}`);
                    setLovTarget(null);
                }}
            />

            <PageHeader
                title="Dispatching"
                subtitle="Assign deliverers to prepared customer orders"
                action={
                    <Btn variant="secondary" onClick={refresh} disabled={loadingQ}>
                        <RefreshCw className={`w-4 h-4 ${loadingQ ? 'animate-spin' : ''}`} /> Refresh
                    </Btn>
                }
            />

            {/* ── Assign Form ─────────────────────────────────────────────── */}
            <Card className="p-5">
                <h3 className="font-bold text-slate-900 mb-4">Assign Deliverer</h3>
                <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 min-w-0">
                        <FormField label="Prepared Order" required>
                            <LovInput
                                value={orderId}
                                onLov={() => setLovTarget('order')}
                                placeholder="Select prepared order…"
                            />
                        </FormField>
                    </div>
                    <div className="flex-1 min-w-0">
                        <FormField label="Deliverer" required>
                            <LovInput
                                value={delivererId}
                                onLov={() => setLovTarget('deliverer')}
                                placeholder="Select deliverer…"
                            />
                        </FormField>
                    </div>
                    <Btn onClick={attemptDispatch} className="shrink-0 mb-0.5">
                        <Zap className="w-4 h-4" /> Dispatch
                    </Btn>
                </div>
            </Card>

            {/* ── Queue ───────────────────────────────────────────────────── */}
            <Card className="overflow-hidden">
                <CardHeader
                    title={`Prepared Orders Queue (${queue.length})`}
                    action={
                        loadingQ ? (
                            <span className="text-xs text-slate-400">Loading…</span>
                        ) : (
                            <span className="text-xs text-slate-400">{queue.length} order(s) awaiting dispatch</span>
                        )
                    }
                />
                <Table headers={[
                    { label: 'Order Code' },
                    { label: 'Store' },
                    { label: 'Customer' },
                    { label: 'Total', right: true },
                    { label: '', right: true },
                ]}>
                    {queue.length === 0 ? (
                        <tr>
                            <td colSpan={5} className="py-10 text-center text-slate-400 text-sm">
                                {loadingQ ? 'Loading prepared orders…' : 'No prepared orders — all caught up!'}
                            </td>
                        </tr>
                    ) : queue.map(o => (
                        <Tr key={o.id}>
                            <Td mono className="text-xs font-bold text-red-600">{o.id}</Td>
                            <Td>{o.store}</Td>
                            <Td bold>{o.customer}</Td>
                            <Td right mono className="text-sm">฿{o.total.toLocaleString()}</Td>
                            <td className="px-4 py-3 text-right">
                                <Btn size="sm" onClick={() => setOrderId(o.id)}>
                                    <Truck className="w-3.5 h-3.5" /> Select
                                </Btn>
                            </td>
                        </Tr>
                    ))}
                </Table>
            </Card>
        </div>
    );
}
