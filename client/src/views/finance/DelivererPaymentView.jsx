import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Save, CreditCard, RefreshCw, Search } from 'lucide-react';
import { PageHeader, Btn, Card, CardHeader, Table, Tr, Td, Badge, FormField, Input, Select, LovInput, LovModal } from '../../components/ui';
import { getJson, postJson, getApiErrorMessage } from '../../api/http';
import { paymentHeaderSchema } from '../../schemas/finance';
import { nextCode } from '../../api/codeGen';

export default function DelivererPaymentView({ showToast, onNavigateBack }) {
    const onBack = onNavigateBack || (() => {});
    const [selected, setSelected] = useState([]);
    const [isLovOpen, setIsLovOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [deliverersList, setDeliverersList] = useState([]);
    const [unpaidOrders, setUnpaidOrders] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(false);

    const [previewCode, setPreviewCode] = useState('…');
    const [isAuto, setIsAuto] = useState(true);
    const [customCode, setCustomCode] = useState('');

    const { control, register, handleSubmit, watch, formState: { errors } } = useForm({
        resolver: zodResolver(paymentHeaderSchema),
        defaultValues: { deliverer: '', paymentDate: new Date().toISOString().split('T')[0], startDate: '2026-03-01', endDate: '2026-03-31', status: 'PENDING' },
    });

    const watchedDeliverer = watch('deliverer');
    const watchedStartDate = watch('startDate');
    const watchedEndDate = watch('endDate');

    useEffect(() => {
        // Fetch deliverers, profiles and existing payments to compute next payment code
        Promise.all([
            getJson('/deliverers'),
            getJson('/profiles'),
            getJson('/payments').catch(() => [])
        ]).then(([dlvs, profs, pymts]) => {
            const profileMap = new Map(profs.map(p => [p.profile_id, p]));
            setDeliverersList(dlvs.map(d => {
                const prof = profileMap.get(d.profile_id) || {};
                return {
                    id: d.deliverer_code,
                    name: prof.full_name || '—',
                    type: d.vehicle_type || '—'
                };
            }));

            const codes = pymts.map(p => p.payment_code);
            setPreviewCode(nextCode(codes, 'PAY-', 6));
        }).catch(err => {
            console.error('Failed to load deliverers for payment LoV:', err);
            showToast('Failed to load deliverers', 'error');
        });
    }, [showToast]);

    const handleLoadOrders = () => {
        if (!watchedDeliverer) return showToast('Please select a deliverer first', 'error');

        setLoadingOrders(true);
        Promise.all([
            getJson('/deliveries'),
            getJson('/orders'),
            getJson('/payments'),
            getJson('/stores'),
            getJson('/deliverers')
        ]).then(([delivs, ords, pymts, strs, dlvs]) => {
            const delivererCode = watchedDeliverer.split(' – ')[0];
            const dlv = dlvs.find(d => d.deliverer_code === delivererCode);
            if (!dlv) return setUnpaidOrders([]);

            // Filter deliveries for this deliverer
            const myDelivs = delivs.filter(d => d.deliverer_id === dlv.deliverer_id);
            const myDelivsMap = new Map(myDelivs.map(d => [d.order_id, d]));

            // Filter paid delivery IDs
            const paidDeliveryIds = new Set(pymts.map(p => p.delivery_id));

            // Map stores
            const storeMap = new Map(strs.map(s => [s.store_id, s]));

            // Filter completed unpaid orders for this deliverer
            const unpaid = ords.filter(o => {
                const deliv = myDelivsMap.get(o.order_id);
                if (!deliv) return false;
                if (paidDeliveryIds.has(deliv.delivery_id)) return false;
                const oDate = o.order_date ? o.order_date.split('T')[0] : '';
                if (watchedStartDate && oDate < watchedStartDate) return false;
                if (watchedEndDate && oDate > watchedEndDate) return false;
                return true;
            }).map(o => {
                const deliv = myDelivsMap.get(o.order_id) || {};
                const store = storeMap.get(o.store_id) || {};
                return {
                    id: o.order_code,
                    date: o.order_date ? o.order_date.split('T')[0] : '—',
                    deliveryId: deliv.delivery_id,
                    fee: parseFloat(deliv.delivery_fee || 40),
                    bonus: 0,
                    adjustment: 0,
                    status: 'PENDING',
                    store: store.name || '—'
                };
            });
            setUnpaidOrders(unpaid);
            showToast('Unpaid orders loaded successfully!');
        }).catch(err => {
            console.error('Failed to load unpaid orders:', err);
            showToast('Failed to load completed orders', 'error');
        }).finally(() => {
            setLoadingOrders(false);
        });
    };

    const onSubmit = async (headerData) => {
        if (!isAuto && !customCode.trim()) return showToast('Custom Payment ID is required when Auto is unchecked', 'error');
        if (headerData.startDate && headerData.endDate && new Date(headerData.endDate) < new Date(headerData.startDate)) return showToast('Period end cannot be before period start', 'error');
        if (selected.length === 0) return showToast('Please select at least one unpaid order', 'error');

        const selectedOrderObjects = unpaidOrders.filter(o => selected.includes(o.id));
        const deliveryId = selectedOrderObjects[0].deliveryId;

        const payload = {
            code: isAuto ? previewCode : customCode.trim(),
            delivery_id: deliveryId,
            payment_period_start: headerData.startDate,
            payment_period_end: headerData.endDate,
            total_payment: Math.round((total + Number.EPSILON) * 100) / 100,
            payment_items: selectedOrderObjects.map(o => ({
                order_code: o.id,
                delivery_fee: Math.round((o.fee + Number.EPSILON) * 100) / 100,
                bonus: Math.round((o.bonus + Number.EPSILON) * 100) / 100,
                adjustment_amount: Math.round((o.adjustment + Number.EPSILON) * 100) / 100
            }))
        };

        try {
            await postJson('/payments', payload);
            showToast('Payment processed successfully!');
            setSelected([]);
            onBack();
        } catch (err) {
            showToast(getApiErrorMessage(err, 'Failed to process payment'), 'error');
        }
    };

    const filteredOrders = unpaidOrders.filter(o => {
        return o.id.toLowerCase().includes(search.toLowerCase()) || o.date.includes(search);
    });

    const selectedOrders = unpaidOrders.filter(o => selected.includes(o.id));
    const total = selectedOrders.reduce((s, o) => s + o.fee + o.bonus + o.adjustment, 0);

    return (
        <div className="fade-in space-y-5">
            <Controller
                name="deliverer"
                control={control}
                render={({ field }) => (
                    <LovModal isOpen={isLovOpen} onClose={() => setIsLovOpen(false)} title="Deliverer"
                        columns={[{ key: 'id', label: 'ID' }, { key: 'name', label: 'Name' }, { key: 'type', label: 'Vehicle' }]}
                        data={deliverersList} onSelect={r => { field.onChange(`${r.id} – ${r.name}`); setSelected([]); setUnpaidOrders([]); setIsLovOpen(false); }} />
                )}
            />
            <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white font-bold transition-colors mb-2">
                <ArrowLeft className="w-4 h-4" /> Back to Payments
            </button>
            
            <PageHeader title="Deliverer Payment" subtitle="Process payments for completed deliverer trips" />
            
            <Card className="p-5">
                <h3 className="font-bold text-current mb-4">Payment Header</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField label="Payment ID">
                        <div className="flex items-center gap-2 mt-1">
                            <Input
                                value={isAuto ? previewCode : customCode}
                                onChange={e => setCustomCode(e.target.value)}
                                readOnly={isAuto}
                                className={`font-mono flex-1 ${isAuto ? 'bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-gray-300' : ''}`}
                                placeholder="PAY-000001"
                            />
                            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-gray-300 select-none cursor-pointer shrink-0 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/55 transition-colors h-9">
                                <input
                                    type="checkbox"
                                    checked={isAuto}
                                    onChange={e => setIsAuto(e.target.checked)}
                                    className="rounded accent-red-650 cursor-pointer"
                                />
                                <span>Auto</span>
                            </label>
                        </div>
                    </FormField>
                    <FormField label="Deliverer" required error={errors.deliverer?.message}>
                        <Controller
                            name="deliverer"
                            control={control}
                            render={({ field }) => (
                                <LovInput value={field.value} onLov={() => setIsLovOpen(true)} placeholder="Select deliverer..." />
                            )}
                        />
                    </FormField>
                    <FormField label="Date" required error={errors.paymentDate?.message}>
                        <Input type="date" {...register('paymentDate')} />
                    </FormField>
                    <FormField label="Period Start" required error={errors.startDate?.message}>
                        <Input type="date" {...register('startDate', { onChange: () => { setSelected([]); setUnpaidOrders([]); } })} />
                    </FormField>
                    <FormField label="Period End" required error={errors.endDate?.message}>
                        <Input type="date" {...register('endDate', { onChange: () => { setSelected([]); setUnpaidOrders([]); } })} />
                    </FormField>
                    <FormField label="Status" error={errors.status?.message}>
                        <Controller
                            name="status"
                            control={control}
                            render={({ field }) => (
                                <Select value={field.value} onChange={e => field.onChange(e.target.value)}>
                                    <option value="PENDING">Pending</option>
                                    <option value="PAID">Paid</option>
                                    <option value="CANCELLED">Cancelled</option>
                                </Select>
                            )}
                        />
                    </FormField>
                </div>
            </Card>
            
            <Card className="overflow-hidden">
                <CardHeader 
                    search={<Input icon={Search} placeholder="Search Order ID..." value={search} onChange={e => setSearch(e.target.value)} className="h-10 shadow-sm" />}
                    action={<Btn size="sm" variant="secondary" onClick={handleLoadOrders}><RefreshCw className="w-3.5 h-3.5" /> Load Orders</Btn>} 
                />
                <Table 
                    headers={[
                        { label: '', center: true, width: '6%' }, 
                        { label: 'Order ID', width: '16%' }, 
                        { label: 'Date', width: '14%' }, 
                        { label: 'Status', center: true, width: '12%' }, 
                        { label: 'Fee', right: true, width: '12%' }, 
                        { label: 'Bonus', right: true, width: '12%' }, 
                        { label: 'Adjustment', right: true, width: '12%' }, 
                        { label: 'Extended Price', right: true, width: '16%' }
                    ]} 
                    minWidth="700px"
                >
                    {loadingOrders ? (
                        <tr>
                            <td colSpan={8} className="px-4 py-8 text-center text-sm text-slate-400 font-medium bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                                Loading orders…
                            </td>
                        </tr>
                    ) : filteredOrders.length === 0 ? (
                        <tr>
                            <td colSpan={8} className="px-4 py-8 text-center text-sm text-slate-500 dark:text-gray-300 font-medium bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                                No unpaid orders found for the selected criteria.
                            </td>
                        </tr>
                    ) : (
                        filteredOrders.map(o => (
                            <Tr key={o.id}>
                                <Td center>
                                    <input 
                                        type="checkbox" 
                                        className="rounded accent-red-650 cursor-pointer" 
                                        checked={selected.includes(o.id)} 
                                        onChange={() => setSelected(p => p.includes(o.id) ? p.filter(x => x !== o.id) : [...p, o.id])} 
                                    />
                                </Td>
                                <Td bold mono>{o.id}</Td>
                                <Td>{o.date}</Td>
                                <Td center><Badge color="amber">{o.status}</Badge></Td>
                                <Td right>฿{parseFloat(o.fee || 0).toFixed(2)}</Td>
                                <Td right>฿{parseFloat(o.bonus || 0).toFixed(2)}</Td>
                                <Td right>฿{parseFloat(o.adjustment || 0).toFixed(2)}</Td>
                                <Td right bold>฿{parseFloat((o.fee + o.bonus + o.adjustment) || 0).toFixed(2)}</Td>
                            </Tr>
                        ))
                    )}
                </Table>
                <div className="px-5 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-current/10 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <p className="text-sm text-slate-500 dark:text-gray-300 font-medium">{selected.length} order(s) selected</p>
                    <div className="flex items-center gap-6">
                        <div className="text-right">
                            <p className="text-xs text-slate-500 dark:text-gray-300 font-bold uppercase tracking-wide">Total Payment</p>
                            <p className="text-3xl font-black text-current font-bold mono">฿{total.toFixed(2)}</p>
                        </div>
                        <Btn onClick={handleSubmit(onSubmit)} size="lg">
                            <CreditCard className="w-4 h-4" /> Confirm Payment
                        </Btn>
                    </div>
                </div>
            </Card>
        </div>
    );
}
