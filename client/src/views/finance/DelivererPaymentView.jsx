import { useState, useEffect } from 'react';
import { ArrowLeft, Save, CreditCard, RefreshCw } from 'lucide-react';
import { PageHeader, Btn, Card, CardHeader, Table, Tr, Td, Badge, FormField, Input, LovInput, LovModal } from '../../components/ui';
import { getJson, postJson, getApiErrorMessage } from '../../api/http';

function extractCode(value) {
    return String(value || '').split(' – ')[0].trim();
}

export default function DelivererPaymentView({ showToast, onNavigateBack }) {
    const onBack = onNavigateBack || (() => {});

    const [deliverers,   setDeliverers]   = useState([]);
    const [deliverer,    setDeliverer]    = useState('');
    const [isLovOpen,    setIsLovOpen]    = useState(false);
    const [paymentDate,  setPaymentDate]  = useState(() => new Date().toISOString().slice(0, 10));
    const [startDate,    setStartDate]    = useState('');
    const [endDate,      setEndDate]      = useState('');

    // Loaded delivery rows for the selected deliverer
    const [deliveryRows, setDeliveryRows] = useState([]); // [{deliveryId, orderCode, date, fee, bonus, adjustment}]
    const [loadingRows,  setLoadingRows]  = useState(false);
    const [selected,     setSelected]     = useState([]); // array of deliveryId
    const [saving,       setSaving]       = useState(false);

    // Load deliverers LoV on mount
    useEffect(() => {
        Promise.all([
            getJson('/deliverers').catch(() => []),
            getJson('/profiles').catch(() => []),
        ]).then(([delivererList, profiles]) => {
            const profileMap = new Map(profiles.map(p => [p.profile_id, p]));
            setDeliverers(delivererList.map(d => {
                const prof = profileMap.get(d.profile_id) || {};
                return { id: d.deliverer_code, name: prof.full_name || d.deliverer_code, type: d.vehicle_type || '-' };
            }));
        }).catch(() => {});
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Load deliveries for the selected deliverer
    const loadDeliveries = async () => {
        const delivererCode = extractCode(deliverer);
        if (!delivererCode) return showToast('Please select a deliverer first', 'error');
        setLoadingRows(true);
        setSelected([]);
        try {
            const [deliveries, orders] = await Promise.all([
                getJson('/deliveries', { deliverer_code: delivererCode }),
                getJson('/orders').catch(() => []),
            ]);
            const orderMap = new Map((orders || []).map(o => [o.order_id, o]));
            setDeliveryRows((deliveries || []).map(d => {
                const order = orderMap.get(d.order_id) || {};
                return {
                    deliveryId: d.delivery_id,
                    orderCode:  order.order_code || `Order#${d.order_id}`,
                    date:       String(d.delivery_time || d.pickup_time || '').slice(0, 10),
                    fee:        Number(d.delivery_fee || 0),
                    bonus:      0,
                    adjustment: 0,
                };
            }));
        } catch (e) {
            showToast(getApiErrorMessage(e, 'Failed to load deliveries'), 'error');
        } finally {
            setLoadingRows(false);
        }
    };

    const updateRow = (deliveryId, field, value) => {
        setDeliveryRows(prev => prev.map(r => r.deliveryId === deliveryId ? { ...r, [field]: Number(value) } : r));
    };

    const toggleSelect = (deliveryId) => {
        setSelected(prev => prev.includes(deliveryId) ? prev.filter(x => x !== deliveryId) : [...prev, deliveryId]);
    };

    const selectedRows  = deliveryRows.filter(r => selected.includes(r.deliveryId));
    const total         = selectedRows.reduce((s, r) => s + r.fee + r.bonus + r.adjustment, 0);

    const handleSave = async () => {
        if (!deliverer)         return showToast('Please select a deliverer', 'error');
        if (!paymentDate)       return showToast('Please specify a payment date', 'error');
        if (selected.length === 0) return showToast('Please select at least one delivery', 'error');
        if (startDate && endDate && new Date(endDate) < new Date(startDate))
            return showToast('Period end cannot be before period start', 'error');
        setSaving(true);
        try {
            await postJson('/payments', {
                delivery_id:          selectedRows[0].deliveryId,
                payment_period_start: startDate || undefined,
                payment_period_end:   endDate   || undefined,
                payment_datetime:     paymentDate ? `${paymentDate}T00:00:00.000Z` : undefined,
                total_payment:        total,
                payment_items: selectedRows.map(r => ({
                    order_code:        r.orderCode,
                    delivery_fee:      r.fee,
                    bonus:             r.bonus,
                    adjustment_amount: r.adjustment,
                })),
            });
            showToast('Payment confirmed successfully!');
            onBack();
        } catch (e) {
            showToast(getApiErrorMessage(e, 'Unable to create payment'), 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fade-in space-y-5">
            <LovModal
                isOpen={isLovOpen}
                onClose={() => setIsLovOpen(false)}
                title="Deliverer"
                columns={[{ key: 'id', label: 'Code' }, { key: 'name', label: 'Name' }, { key: 'type', label: 'Vehicle' }]}
                data={deliverers}
                onSelect={r => { setDeliverer(`${r.id} – ${r.name}`); setIsLovOpen(false); setDeliveryRows([]); setSelected([]); }}
            />

            <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-slate-700 hover:text-slate-900 font-medium">
                <ArrowLeft className="w-4 h-4" /> Back to Payments
            </button>
            <PageHeader title="Deliverer Payment" subtitle="Process payments for completed deliverer trips" />

            {/* ── Payment Header ──────────────────────────────────────────── */}
            <Card className="p-5">
                <h3 className="font-bold text-slate-900 mb-4">Payment Header</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <FormField label="Deliverer" required>
                        <LovInput value={deliverer} onLov={() => setIsLovOpen(true)} placeholder="Select deliverer…" />
                    </FormField>
                    <FormField label="Payment Date" required>
                        <Input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} />
                    </FormField>
                    <FormField label="Period Start">
                        <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                    </FormField>
                    <FormField label="Period End">
                        <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                    </FormField>
                </div>
            </Card>

            {/* ── Delivery Selection ──────────────────────────────────────── */}
            <Card className="overflow-hidden">
                <CardHeader
                    title="Deliveries"
                    action={
                        <Btn size="sm" variant="secondary" onClick={loadDeliveries} disabled={!deliverer || loadingRows}>
                            <RefreshCw className={`w-3.5 h-3.5 ${loadingRows ? 'animate-spin' : ''}`} />
                            {loadingRows ? 'Loading…' : 'Load Deliveries'}
                        </Btn>
                    }
                />
                <Table
                    headers={[
                        { label: '', center: true },
                        { label: 'Order Code' },
                        { label: 'Date' },
                        { label: 'Delivery Fee', right: true },
                        { label: 'Bonus', right: true },
                        { label: 'Adjustment', right: true },
                        { label: 'Extended', right: true },
                    ]}
                    minWidth="750px"
                >
                    {deliveryRows.length === 0 ? (
                        <tr>
                            <td colSpan={7} className="py-10 text-center text-slate-400 text-sm">
                                {loadingRows ? 'Loading deliveries…' : 'Select a deliverer and click "Load Deliveries"'}
                            </td>
                        </tr>
                    ) : deliveryRows.map(r => (
                        <Tr key={r.deliveryId}>
                            <Td center>
                                <input
                                    type="checkbox"
                                    className="rounded accent-red-600"
                                    checked={selected.includes(r.deliveryId)}
                                    onChange={() => toggleSelect(r.deliveryId)}
                                />
                            </Td>
                            <Td bold mono className="text-xs">{r.orderCode}</Td>
                            <Td className="text-xs text-slate-500">{r.date || '—'}</Td>
                            <Td right className="mono text-sm">฿{r.fee.toLocaleString()}</Td>
                            <td className="px-4 py-3 text-right">
                                <input
                                    type="number" min="0" value={r.bonus}
                                    onChange={e => updateRow(r.deliveryId, 'bonus', e.target.value)}
                                    className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm text-right outline-none focus:border-red-400 w-24"
                                />
                            </td>
                            <td className="px-4 py-3 text-right">
                                <input
                                    type="number" value={r.adjustment}
                                    onChange={e => updateRow(r.deliveryId, 'adjustment', e.target.value)}
                                    className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm text-right outline-none focus:border-red-400 w-24"
                                />
                            </td>
                            <Td right bold className="mono text-sm">
                                ฿{(r.fee + r.bonus + r.adjustment).toLocaleString()}
                            </Td>
                        </Tr>
                    ))}
                </Table>
                <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <p className="text-sm text-slate-500">{selected.length} delivery(s) selected</p>
                    <div className="flex items-center gap-6">
                        <div className="text-right">
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">Total Payment</p>
                            <p className="text-3xl font-black text-slate-900 mono">฿{total.toLocaleString()}</p>
                        </div>
                        <Btn onClick={handleSave} size="lg" disabled={saving}>
                            <CreditCard className="w-4 h-4" /> {saving ? 'Saving…' : 'Confirm Payment'}
                        </Btn>
                    </div>
                </div>
            </Card>
        </div>
    );
}
