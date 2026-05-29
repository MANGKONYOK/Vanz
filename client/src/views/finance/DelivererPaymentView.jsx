import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Save, CreditCard, RefreshCw, Search, Check } from 'lucide-react';
import { PageHeader, Btn, Card, CardHeader, Table, Tr, Td, Badge, FormField, Input, Select, LovInput, LovModal } from '../../components/ui';
import { MOCK_DELIVERERS, INITIAL_ORDERS } from '../../data/mockData';
import { paymentHeaderSchema } from '../../schemas/finance';

export default function DelivererPaymentView({ showToast, onNavigateBack }) {
    const onBack = onNavigateBack || (() => {});
    const [selected, setSelected] = useState([]);
    const [isLovOpen, setIsLovOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [paymentId, setPaymentId] = useState('');
    const [autoId, setAutoId] = useState(true);

    const { control, register, handleSubmit, watch, reset, setValue, formState: { errors } } = useForm({
        resolver: zodResolver(paymentHeaderSchema),
        defaultValues: { deliverer: '', paymentDate: '2026-03-23', startDate: '2026-03-01', endDate: '2026-03-31', status: 'PENDING' },
    });

    const displayPaymentId = autoId ? (paymentId || 'PAY-AUTO') : paymentId;

    const watchedDeliverer = watch('deliverer');
    const watchedStartDate = watch('startDate');
    const watchedEndDate = watch('endDate');

    const onSubmit = (headerData) => {
        if (!autoId && !paymentId.trim()) return showToast('Please enter a Payment ID', 'error');
        if (headerData.startDate && headerData.endDate && new Date(headerData.endDate) < new Date(headerData.startDate)) return showToast('Period end cannot be before period start', 'error');
        if (selected.length === 0) return showToast('Please select at least one unpaid order', 'error');
        showToast('Payment confirmed successfully!'); setSelected([]); reset(); onBack();
    };

    const handleLoadOrders = () => {
        showToast('Orders reloaded successfully!');
    };

    // Extract deliverer ID (e.g. 'D-001' from 'D-001 – Somchai J.')
    const delivererId = watchedDeliverer ? watchedDeliverer.split(' – ')[0] : '';

    const filteredOrders = INITIAL_ORDERS.filter(o => {
        const matchesSearch = o.id.toLowerCase().includes(search.toLowerCase()) || o.date.includes(search);
        const matchesDeliverer = !delivererId || o.deliverer === delivererId;
        const matchesStartDate = !watchedStartDate || o.date >= watchedStartDate;
        const matchesEndDate = !watchedEndDate || o.date <= watchedEndDate;
        return matchesSearch && matchesDeliverer && matchesStartDate && matchesEndDate;
    });

    const selectedOrders = INITIAL_ORDERS.filter(o => selected.includes(o.id));
    const total = selectedOrders.reduce((s, o) => s + o.fee + o.bonus + o.adjustment, 0);

    return (
        <div className="fade-in space-y-5">
            <Controller
                name="deliverer"
                control={control}
                render={({ field }) => (
                    <LovModal isOpen={isLovOpen} onClose={() => setIsLovOpen(false)} title="Deliverer"
                        columns={[{ key: 'id', label: 'ID' }, { key: 'name', label: 'Name' }, { key: 'type', label: 'Vehicle' }]}
                        data={MOCK_DELIVERERS} onSelect={r => { field.onChange(`${r.id} – ${r.name}`); setSelected([]); setIsLovOpen(false); }} />
                )}
            />
                   <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-current/75 hover:text-current font-bold transition-colors mb-2">
                <ArrowLeft className="w-4 h-4" /> Back to Payments
            </button>
            
            <PageHeader title="Deliverer Payment" subtitle="Process payments for completed deliverer trips" />
            
            <Card className="p-5">
                <h3 className="font-bold text-current mb-4">Payment Header</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-end gap-3">
                        <div className="flex-1">
                            <FormField label="Payment ID" required>
                                <Input 
                                    value={displayPaymentId} 
                                    onChange={e => setPaymentId(e.target.value.toUpperCase())} 
                                    placeholder="PAY-001" 
                                    readOnly={autoId}
                                    className={autoId ? 'bg-slate-50 dark:bg-slate-800/50 text-current/60 font-mono' : 'font-mono'}
                                />
                            </FormField>
                        </div>
                        <label className="flex items-center gap-2 mb-2.5 cursor-pointer select-none">
                            <div className="relative">
                                <input 
                                    type="checkbox" 
                                    checked={autoId} 
                                    onChange={e => setAutoId(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-5 h-5 border-2 border-slate-300 dark:border-white bg-transparent rounded-md peer-checked:bg-red-500 peer-checked:border-red-500 transition-all flex items-center justify-center text-white">
                                    <Check size={12} strokeWidth={4} color="white" className={autoId ? 'scale-100' : 'scale-0'} />
                                </div>
                            </div>
                            <span className="text-sm font-bold text-current/75 font-sans">Auto</span>
                        </label>
                    </div>
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
                        <Input type="date" {...register('startDate', { onChange: () => setSelected([]) })} />
                    </FormField>
                    <FormField label="Period End" required error={errors.endDate?.message}>
                        <Input type="date" {...register('endDate', { onChange: () => setSelected([]) })} />
                    </FormField>
                    <FormField label="Status" error={errors.status?.message}>
                        <Controller
                            name="status"
                            control={control}
                            render={({ field }) => (
                                <Select value={field.value} onChange={e => field.onChange(e.target.value)}>
                                    <option value="PENDING">PENDING</option>
                                    <option value="PAID">PAID</option>
                                    <option value="CANCELLED">CANCELLED</option>
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
                    {filteredOrders.length === 0 ? (
                        <tr>
                            <td colSpan={8} className="px-4 py-8 text-center text-sm text-current/50 font-medium bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
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
                                <Td right>฿{o.fee}</Td>
                                <Td right>฿{o.bonus}</Td>
                                <Td right>฿{o.adjustment}</Td>
                                <Td right bold>฿{o.fee + o.bonus + o.adjustment}</Td>
                            </Tr>
                        ))
                    )}
                </Table>
                <div className="px-5 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-current/10 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <p className="text-sm text-current/60 font-medium">{selected.length} order(s) selected</p>
                    <div className="flex items-center gap-6">
                        <div className="text-right">
                            <p className="text-xs text-current/60 font-bold uppercase tracking-wide">Total Payment</p>
                            <p className="text-3xl font-black text-current font-bold mono">฿{total}</p>
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
