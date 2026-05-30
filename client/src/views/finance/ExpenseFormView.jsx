import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Save, Plus, Trash2, Search } from 'lucide-react';
import { Btn, Card, CardHeader, Table, Td, FormField, Input, Select, LovInput, LovModal } from '../../components/ui';
import { getJson, postJson, getApiErrorMessage } from '../../api/http';
import { expenseHeaderSchema } from '../../schemas/finance';
import { nextCode } from '../../api/codeGen';

export default function ExpenseFormView({ onNavigateBack, showToast }) {
    const [items, setItems] = useState([{ id: 1, type: 'TOLL', desc: 'Expressway', amount: 50, receipt: 'RC-9901' }]);
    const [isLovOpen, setIsLovOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [deliveriesList, setDeliveriesList] = useState([]);

    const [previewCode, setPreviewCode] = useState('…');
    const [isAuto, setIsAuto] = useState(true);
    const [customCode, setCustomCode] = useState('');

    const { control, register, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(expenseHeaderSchema),
        defaultValues: { delivererId: '', voucherDate: new Date().toISOString().split('T')[0], status: 'DRAFT', approvedBy: 'System Admin' },
    });

    useEffect(() => {
        // Fetch deliveries, deliverers, profiles, orders, and vouchers to populate LoV and generate preview
        Promise.all([
            getJson('/deliveries'),
            getJson('/deliverers'),
            getJson('/profiles'),
            getJson('/orders'),
            getJson('/expense-vouchers').catch(() => [])
        ]).then(([delivs, dlvs, profs, ords, vouchers]) => {
            const delivererMap = new Map(dlvs.map(d => [d.deliverer_id, d]));
            const profileMap = new Map(profs.map(p => [p.profile_id, p]));
            const orderMap = new Map(ords.map(o => [o.order_id, o]));

            setDeliveriesList(delivs.map(d => {
                const dlv = delivererMap.get(d.deliverer_id) || {};
                const prof = profileMap.get(dlv.profile_id) || {};
                const ord = orderMap.get(d.order_id) || {};
                return {
                    id: d.delivery_id,
                    name: prof.full_name || '—',
                    type: `${d.delivery_type} (Order: ${ord.order_code || '—'})`
                };
            }));

            const codes = vouchers.map(v => v.voucher_code);
            setPreviewCode(nextCode(codes, 'EXP-', 6));
        }).catch(err => {
            console.error('Failed to load deliveries for LoV:', err);
            showToast('Failed to load deliveries list', 'error');
        });
    }, [showToast]);

    const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

    const onSubmit = async (headerData) => {
        if (!isAuto && !customCode.trim()) return showToast('Custom Voucher ID is required when Auto is unchecked', 'error');
        if (items.length === 0) return showToast('Voucher must contain at least one expense item', 'error');
        if (items.some(i => i.amount <= 0)) return showToast('All expense amounts must be greater than zero', 'error');
        if (items.some(i => !i.desc.trim())) return showToast('Please provide descriptions for all expense items', 'error');

        const deliveryId = parseInt(headerData.delivererId.split(' – ')[0], 10);

        const payload = {
            code: isAuto ? previewCode : customCode.trim(),
            delivery_id: deliveryId,
            voucher_date: headerData.voucherDate,
            total_amount: Math.round((totalAmount + Number.EPSILON) * 100) / 100,
            expense_items: items.map(i => ({
                expense_type: i.type.toUpperCase(),
                description: i.desc.trim(),
                amount: Math.round((parseFloat(i.amount) + Number.EPSILON) * 100) / 100,
                receipt_reference_code: i.receipt || ''
            }))
        };

        try {
            await postJson('/expense-vouchers', payload);
            showToast('Voucher saved successfully!');
            onNavigateBack();
        } catch (err) {
            showToast(getApiErrorMessage(err, 'Failed to save voucher'), 'error');
        }
    };

    const filteredItems = items.filter(i => 
        i.desc.toLowerCase().includes(search.toLowerCase()) ||
        i.type.toLowerCase().includes(search.toLowerCase()) ||
        i.receipt.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="fade-in space-y-5">
            <Controller
                name="delivererId"
                control={control}
                render={({ field }) => (
                    <LovModal isOpen={isLovOpen} onClose={() => setIsLovOpen(false)} title="Delivery Assignment"
                        columns={[{ key: 'id', label: 'Delivery ID' }, { key: 'name', label: 'Deliverer Name' }, { key: 'type', label: 'Details' }]}
                        data={deliveriesList} onSelect={r => { field.onChange(`${r.id} – ${r.name}`); setIsLovOpen(false); }} />
                )}
            />
            
            <button onClick={onNavigateBack} className="inline-flex items-center gap-1.5 text-sm text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white font-bold transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back to Vouchers
            </button>
            
            <Card className="p-5">
                <h3 className="font-bold text-current mb-4">Voucher Header</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField label="Voucher ID">
                        <div className="flex items-center gap-2 mt-1">
                            <Input
                                value={isAuto ? previewCode : customCode}
                                onChange={e => setCustomCode(e.target.value)}
                                readOnly={isAuto}
                                className={`font-mono flex-1 ${isAuto ? 'bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-gray-300' : ''}`}
                                placeholder="EXP-000001"
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
                    <FormField label="Delivery & Deliverer" required error={errors.delivererId?.message}>
                        <Controller
                            name="delivererId"
                            control={control}
                            render={({ field }) => (
                                <LovInput value={field.value} onLov={() => setIsLovOpen(true)} placeholder="Select delivery assignment..." />
                            )}
                        />
                    </FormField>
                    <FormField label="Date" required error={errors.voucherDate?.message}>
                        <Input type="date" {...register('voucherDate')} />
                    </FormField>
                    <FormField label="Status" error={errors.status?.message}>
                        <Controller
                            name="status"
                            control={control}
                            render={({ field }) => (
                                <Select value={field.value} onChange={e => field.onChange(e.target.value)}>
                                    <option value="DRAFT">Draft</option>
                                    <option value="SUBMITTED">Submitted</option>
                                </Select>
                            )}
                        />
                    </FormField>
                    <FormField label="Approved By" required error={errors.approvedBy?.message}>
                        <Input placeholder="e.g. System Admin" {...register('approvedBy')} />
                    </FormField>
                </div>
            </Card>
            
            <Card className="overflow-hidden">
                <CardHeader 
                    search={<Input icon={Search} placeholder="Search description, receipt..." value={search} onChange={e => setSearch(e.target.value)} className="h-10 shadow-sm" />}
                    action={
                        <Btn size="sm" variant="secondary" onClick={() => setItems([...items, { id: Date.now(), type: 'FUEL', desc: '', amount: 0, receipt: '' }])}>
                            <Plus className="w-3.5 h-3.5" /> Add Row
                        </Btn>
                    } 
                />
                <Table 
                    headers={[
                        { label: 'Receipt', width: '22%' }, 
                        { label: 'Type', width: '20%' }, 
                        { label: 'Description', width: '38%' }, 
                        { label: 'Expense', right: true, width: '14%' }, 
                        { label: '', center: true, width: '6%' }
                    ]} 
                    minWidth="650px"
                >
                    {filteredItems.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                            <Td>
                                <input 
                                    value={item.receipt} 
                                    onChange={e => { const n = [...items]; const idx = items.indexOf(item); n[idx].receipt = e.target.value; setItems(n); }} 
                                    placeholder="e.g. RC-1234"
                                    className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-red-400 dark:focus:border-red-500 w-full mono" 
                                />
                            </Td>
                            <Td>
                                <select 
                                    value={item.type} 
                                    onChange={e => { const n = [...items]; const idx = items.indexOf(item); n[idx].type = e.target.value; setItems(n); }} 
                                    className="border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-red-400 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 w-full"
                                >
                                    <option value="TOLL">TOLL</option>
                                    <option value="FUEL">FUEL</option>
                                    <option value="MAINTENANCE">MAINTENANCE</option>
                                    <option value="OTHER">OTHER</option>
                                </select>
                            </Td>
                            <Td>
                                <input 
                                    value={item.desc} 
                                    onChange={e => { const n = [...items]; const idx = items.indexOf(item); n[idx].desc = e.target.value; setItems(n); }} 
                                    placeholder="e.g. Expressway Toll"
                                    className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-red-400 dark:focus:border-red-500 w-full min-w-[120px]" 
                                />
                            </Td>
                            <Td right>
                                <input 
                                    type="number" 
                                    value={item.amount} 
                                    onChange={e => { const n = [...items]; const idx = items.indexOf(item); n[idx].amount = Number(e.target.value); setItems(n); }} 
                                    className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-red-400 dark:focus:border-red-500 text-right w-full min-w-[80px]" 
                                />
                            </Td>
                            <Td center>
                                <button 
                                    onClick={() => setItems(items.filter(x => x.id !== item.id))} 
                                    className="p-1.5 text-slate-300 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </Td>
                        </tr>
                    ))}
                </Table>
                <div className="px-5 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-current/10 flex flex-col sm:flex-row justify-end items-center gap-4">
                    <div className="text-right">
                        <p className="text-xs text-slate-500 dark:text-gray-300 font-bold uppercase tracking-wide">Total Expense</p>
                        <p className="text-3xl font-black text-current font-bold mono">฿{totalAmount.toFixed(2)}</p>
                    </div>
                    <Btn onClick={handleSubmit(onSubmit)} size="lg"><Save className="w-4 h-4" /> Save Voucher</Btn>
                </div>
            </Card>
        </div>
    );
}
