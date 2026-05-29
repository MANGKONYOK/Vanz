import { useState, useEffect } from 'react';
import { ArrowLeft, Save, RefreshCw, Search } from 'lucide-react';
import { PageHeader, Btn, Card, CardHeader, Table, Tr, Td, Badge, FormField, Input, Select, LovInput, LovModal } from '../../components/ui';
import { getJson, postJson, putJson, getApiErrorMessage } from '../../api/http';

const ORDER_STATUS_COLOR = { pending: 'amber', confirmed: 'blue', preparing: 'blue', picked_up: 'blue', delivering: 'blue', delivered: 'green', cancelled: 'red' };

export default function DelivererPaymentView({ data = {}, onBack, onSaved, showToast }) {
    const isNew = !data.id;

    // ── Header state ──────────────────────────────────────────────────────────
    const [deliverer,     setDeliverer]     = useState('');           // "DLV-0001 – Name"
    const [delivererObj,  setDelivererObj]  = useState(null);         // raw deliverer row
    const [paymentDate,   setPaymentDate]   = useState(() =>
        isNew ? new Date().toISOString().slice(0, 10)
              : (data.paymentDate ? new Date(data.paymentDate).toISOString().slice(0, 10) : '')
    );
    const [startDate,  setStartDate]  = useState(data.periodStart || '');
    const [endDate,    setEndDate]    = useState(data.periodEnd   || '');
    const [editStatus, setEditStatus] = useState(data.status      || 'pending');

    // ── Delivery rows (create mode) ───────────────────────────────────────────
    const [deliveryRows, setDeliveryRows] = useState([]);
    const [loadingRows,  setLoadingRows]  = useState(false);
    const [selected,     setSelected]     = useState([]);
    const [rowSearch,    setRowSearch]    = useState('');

    // ── LoV ───────────────────────────────────────────────────────────────────
    const [deliverers,  setDeliverers]  = useState([]);
    const [lovOpen,     setLovOpen]     = useState(false);
    const [saving,      setSaving]      = useState(false);

    // Load deliverers list once
    useEffect(() => {
        Promise.all([getJson('/deliverers'), getJson('/profiles')])
            .then(([dels, profs]) => {
                const profMap = new Map(profs.map(p => [p.profile_id, p]));
                setDeliverers(dels.map(d => ({
                    ...d,
                    full_name: profMap.get(d.profile_id)?.full_name || '—',
                })));
            }).catch(() => {});
    }, []);

    // ── Load deliveries for selected deliverer ────────────────────────────────
    const loadDeliveries = async () => {
        if (!delivererObj) return;
        setLoadingRows(true);
        try {
            const [deliveries, orders, stores] = await Promise.all([
                getJson('/deliveries'),
                getJson('/orders'),
                getJson('/stores'),
            ]);
            const storeMap = new Map(stores.map(s => [s.store_id, s]));
            const orderMap = new Map(orders.map(o => [o.order_id, o]));

            // Filter deliveries for this deliverer
            const myDeliveries = deliveries.filter(d => d.deliverer_id === delivererObj.deliverer_id);

            setDeliveryRows(myDeliveries.map(d => {
                const order = orderMap.get(d.order_id) || {};
                const store = storeMap.get(order.store_id) || {};
                return {
                    deliveryId: d.delivery_id,
                    orderId:    d.order_id,
                    orderCode:  order.order_code || `#${d.order_id}`,
                    storeName:  store.name || '—',
                    orderDate:  order.order_date ? new Date(order.order_date).toLocaleDateString() : '—',
                    status:     order.status || '—',
                    fee:        Number(d.delivery_fee || 0),
                    bonus:      0,
                    adjustment: 0,
                };
            }));
            setSelected([]);
        } catch (e) {
            showToast(getApiErrorMessage(e, 'Failed to load deliveries'), 'error');
        } finally {
            setLoadingRows(false);
        }
    };

    const toggleSelect = (deliveryId) => {
        setSelected(prev => prev.includes(deliveryId) ? prev.filter(x => x !== deliveryId) : [...prev, deliveryId]);
    };

    const updateRow = (deliveryId, field, value) => {
        setDeliveryRows(rows => rows.map(r => r.deliveryId === deliveryId ? { ...r, [field]: value } : r));
    };

    const selectedRows = deliveryRows.filter(r => selected.includes(r.deliveryId));
    const total        = selectedRows.reduce((s, r) => s + r.fee + r.bonus + r.adjustment, 0);

    const filteredRows = deliveryRows.filter(r =>
        r.orderCode.toLowerCase().includes(rowSearch.toLowerCase()) ||
        r.storeName.toLowerCase().includes(rowSearch.toLowerCase())
    );

    // ── Save ──────────────────────────────────────────────────────────────────
    const handleSave = async () => {
        if (!isNew) {
            // Edit mode — update status/dates only
            if (!paymentDate) return showToast('Payment Date is required', 'error');
            if (!startDate)   return showToast('Period Start is required', 'error');
            if (!endDate)     return showToast('Period End is required', 'error');
            if (new Date(endDate) < new Date(startDate))
                return showToast('Period end cannot be before period start', 'error');
            setSaving(true);
            try {
                await putJson(`/payments/${data.paymentCode}`, {
                    status:               editStatus,
                    payment_period_start: startDate,
                    payment_period_end:   endDate,
                    payment_datetime:     `${paymentDate}T00:00:00.000Z`,
                });
                showToast('Payment updated successfully!');
                (onSaved || onBack)();
            } catch (e) {
                showToast(getApiErrorMessage(e, 'Update failed'), 'error');
            } finally {
                setSaving(false);
            }
            return;
        }

        // Create mode validation
        if (!deliverer)            return showToast('Please select a deliverer', 'error');
        if (!paymentDate)          return showToast('Payment Date is required', 'error');
        if (!startDate)            return showToast('Period Start is required', 'error');
        if (!endDate)              return showToast('Period End is required', 'error');
        if (selected.length === 0) return showToast('Please select at least one delivery', 'error');
        if (new Date(endDate) < new Date(startDate))
            return showToast('Period end cannot be before period start', 'error');

        setSaving(true);
        try {
            await postJson('/payments', {
                delivery_id:          selectedRows[0].deliveryId,
                payment_period_start: startDate,
                payment_period_end:   endDate,
                payment_datetime:     `${paymentDate}T00:00:00.000Z`,
                total_payment:        total,
                payment_items:        selectedRows.map(r => ({
                    order_code:        r.orderCode,
                    delivery_fee:      r.fee,
                    bonus:             r.bonus,
                    adjustment_amount: r.adjustment,
                })),
            });
            showToast('Payment confirmed successfully!');
            onBack();
        } catch (e) {
            showToast(getApiErrorMessage(e, 'Create failed'), 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fade-in space-y-5">
            <LovModal isOpen={lovOpen} onClose={() => setLovOpen(false)} title="Deliverer"
                columns={[{ key: 'deliverer_code', label: 'Code' }, { key: 'full_name', label: 'Name' }, { key: 'vehicle_type', label: 'Vehicle' }]}
                data={deliverers}
                onSelect={r => {
                    setDeliverer(`${r.deliverer_code} – ${r.full_name}`);
                    setDelivererObj(r);
                    setDeliveryRows([]);
                    setSelected([]);
                    setLovOpen(false);
                }} />

            <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-current/75 hover:text-current font-bold transition-colors mb-2">
                <ArrowLeft className="w-4 h-4" /> Back to Payments
            </button>

            <PageHeader
                title={isNew ? 'Deliverer Payment' : `Payment: ${data.paymentCode}`}
                subtitle={isNew ? 'Process payments for completed deliverer trips' : `Deliverer: ${data.delivererName}`}
            />

            {/* ── Payment Header ──────────────────────────────────────────── */}
            <Card className="p-5">
                <h3 className="font-bold text-current mb-4">Payment Header</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {isNew ? (
                        <FormField label="Deliverer" required>
                            <LovInput value={deliverer} onLov={() => setLovOpen(true)} placeholder="Select deliverer…" />
                        </FormField>
                    ) : (
                        <>
                            <FormField label="Payment Code">
                                <Input value={data.paymentCode} readOnly
                                    className="bg-slate-50 dark:bg-slate-800/50 font-mono text-xs font-bold text-current/60" />
                            </FormField>
                            <FormField label="Status">
                                <Select value={editStatus} onChange={e => setEditStatus(e.target.value)}>
                                    <option value="pending">pending</option>
                                    <option value="paid">paid</option>
                                    <option value="cancelled">cancelled</option>
                                </Select>
                            </FormField>
                        </>
                    )}

                    <FormField label="Payment Date" required>
                        <Input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} />
                    </FormField>

                    <FormField label="Period Start" required>
                        <Input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setSelected([]); }} />
                    </FormField>

                    <FormField label="Period End" required>
                        <Input type="date" value={endDate} onChange={e => { setEndDate(e.target.value); setSelected([]); }} />
                    </FormField>
                </div>
            </Card>

            {/* ── Delivery Selection (create mode only) ──────────────────── */}
            {isNew && (
                <Card className="overflow-hidden">
                    <CardHeader
                        search={<Input icon={Search} placeholder="Search Order ID, Store…" value={rowSearch} onChange={e => setRowSearch(e.target.value)} className="h-10 shadow-sm" />}
                        action={
                            <Btn size="sm" variant="secondary" onClick={loadDeliveries} disabled={!deliverer || loadingRows}>
                                <RefreshCw className={`w-3.5 h-3.5 ${loadingRows ? 'animate-spin' : ''}`} />
                                {loadingRows ? 'Loading…' : 'Load Deliveries'}
                            </Btn>
                        }
                    />
                    <Table
                        headers={[
                            { label: '', center: true, width: '5%' },
                            { label: 'Order ID',   width: '18%' },
                            { label: 'Date',       width: '12%' },
                            { label: 'Store',      width: '16%' },
                            { label: 'Status', center: true, width: '12%' },
                            { label: 'Fee',    right: true, width: '10%' },
                            { label: 'Bonus',  right: true, width: '10%' },
                            { label: 'Adj.',   right: true, width: '10%' },
                            { label: 'Total',  right: true, width: '12%' },
                        ]}
                        minWidth="760px"
                    >
                        {filteredRows.length === 0 ? (
                            <Tr><Td colSpan={9} className="text-center text-current/40 py-8">
                                {deliverer ? 'Click "Load Deliveries" to fetch deliveries' : 'Select a deliverer first'}
                            </Td></Tr>
                        ) : filteredRows.map(r => (
                            <Tr key={r.deliveryId}>
                                <Td center>
                                    <input type="checkbox" className="rounded accent-red-500 cursor-pointer"
                                        checked={selected.includes(r.deliveryId)}
                                        onChange={() => toggleSelect(r.deliveryId)} />
                                </Td>
                                <Td mono bold className="text-xs whitespace-nowrap">{r.orderCode}</Td>
                                <Td className="text-xs whitespace-nowrap">{r.orderDate}</Td>
                                <Td className="text-xs whitespace-nowrap">{r.storeName}</Td>
                                <Td center className="whitespace-nowrap">
                                    <Badge color={ORDER_STATUS_COLOR[r.status] || 'gray'}>{r.status}</Badge>
                                </Td>
                                <Td right className="text-sm whitespace-nowrap">฿{r.fee}</Td>
                                <Td right>
                                    <input type="number" min="0" value={r.bonus}
                                        onChange={e => updateRow(r.deliveryId, 'bonus', Number(e.target.value))}
                                        className="w-16 text-right border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded px-1 py-0.5 text-sm outline-none focus:border-red-400 dark:focus:border-red-500" />
                                </Td>
                                <Td right>
                                    <input type="number" value={r.adjustment}
                                        onChange={e => updateRow(r.deliveryId, 'adjustment', Number(e.target.value))}
                                        className="w-16 text-right border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded px-1 py-0.5 text-sm outline-none focus:border-red-400 dark:focus:border-red-500" />
                                </Td>
                                <Td right bold className="whitespace-nowrap">
                                    ฿{(r.fee + r.bonus + r.adjustment).toLocaleString()}
                                </Td>
                            </Tr>
                        ))}
                    </Table>

                    {/* Total + Save */}
                    <div className="px-5 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-current/10 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <p className="text-sm text-current/60 font-medium">
                            {selected.length} of {deliveryRows.length} deliveries selected
                        </p>
                        <div className="flex items-center gap-6">
                            <div className="text-right">
                                <p className="text-xs text-current/60 font-bold uppercase tracking-wide">Total Payment</p>
                                <p className="text-3xl font-black text-current mono">฿{total.toLocaleString()}</p>
                            </div>
                            <Btn onClick={handleSave} disabled={saving} size="lg">
                                <Save className="w-4 h-4" />
                                {saving ? 'Saving…' : 'Confirm Payment'}
                            </Btn>
                        </div>
                    </div>
                </Card>
            )}

            {/* Edit mode save footer */}
            {!isNew && (
                <div className="flex justify-end gap-3">
                    <Btn variant="secondary" onClick={onBack} disabled={saving}>Cancel</Btn>
                    <Btn onClick={handleSave} disabled={saving}>
                        <Save className="w-4 h-4" />
                        {saving ? 'Saving…' : 'Save Payment'}
                    </Btn>
                </div>
            )}
        </div>
    );
}
