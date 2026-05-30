import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Save, Plus, Trash2, Search } from 'lucide-react';
import { PageHeader, Btn, Card, CardHeader, Table, Td, FormField, Input, Select, LovInput, LovModal } from '../../components/ui';
import { getJson, postJson, putJson, getApiErrorMessage } from '../../api/http';
import { expenseHeaderSchema } from '../../schemas/finance';
import { nextCode } from '../../api/codeGen';

const safeIsoDate = (dateVal) => {
    if (!dateVal || dateVal === '—') return new Date().toISOString().split('T')[0];
    try {
        const parsed = new Date(dateVal);
        if (!isNaN(parsed.getTime())) {
            return parsed.toISOString().split('T')[0];
        }
    } catch (e) {
        console.error(e);
    }
    return new Date().toISOString().split('T')[0];
};

export default function ExpenseFormView({ data, onNavigateBack, showToast }) {
    const isNew = !data;

    const [items, setItems] = useState(data && data.rawItems ? data.rawItems.map((it, idx) => ({
        id: it.expense_item_id || idx,
        type: it.expense_type,
        desc: it.description,
        amount: parseFloat(it.amount || 0),
        receipt: it.receipt_reference_code || ''
    })) : [{ id: 1, type: 'FUEL', desc: '', amount: '', receipt: '' }]);
    const [isLovOpen, setIsLovOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [deliveriesList, setDeliveriesList] = useState([]);

    const [previewCode, setPreviewCode] = useState(data ? data.id : '…');
    const [isAuto, setIsAuto] = useState(isNew);
    const [customCode, setCustomCode] = useState('');

    const { control, register, handleSubmit, watch, getValues, reset, formState: { errors } } = useForm({
        resolver: zodResolver(expenseHeaderSchema),
        defaultValues: { 
            delivererId: data ? `${data.delivery_id} – ${data.delivererName}` : '', 
            voucherDate: data ? safeIsoDate(data.rawDate || data.date) : new Date().toISOString().split('T')[0], 
            status: data ? data.status.toUpperCase() : 'DRAFT', 
            approvedBy: '' 
        },
    });

    const watchedStatus = watch('status');
    const isEditable = isNew || (watchedStatus || 'DRAFT').toUpperCase() === 'DRAFT';

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

            if (data) {
                setPreviewCode(data.id);
                setIsAuto(false);

                // Find matching delivery detail for header resetting
                const matchingDeliv = delivs.map(d => {
                    const dlv = delivererMap.get(d.deliverer_id) || {};
                    const prof = profileMap.get(dlv.profile_id) || {};
                    return { id: d.delivery_id, name: prof.full_name || '—' };
                }).find(d => d.id === data.delivery_id);
                
                const delivVal = matchingDeliv ? `${matchingDeliv.id} – ${matchingDeliv.name}` : `${data.delivery_id} – ${data.delivererName}`;

                reset({
                    delivererId: delivVal,
                    voucherDate: safeIsoDate(data.rawDate || data.date),
                    status: (data.status || 'DRAFT').toUpperCase(),
                    approvedBy: data.approvedBy || ''
                });
            } else {
                const codes = vouchers.map(v => v.voucher_code);
                setPreviewCode(nextCode(codes, 'EXP-', 6));
            }
        }).catch(err => {
            console.error('Failed to load deliveries for LoV:', err);
            showToast('Failed to load deliveries list', 'error');
        });
    }, [data, showToast, reset]);

    const totalAmount = items.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);

    const onSubmit = async () => {
        const formValues = getValues();
        if (!isAuto) {
            const trimmed = customCode.trim();
            if (!trimmed) return showToast('Custom Voucher ID is required when Auto is unchecked', 'error');
            if (!/^EXP-\d{6}$/.test(trimmed)) return showToast('Voucher ID must be in the format EXP-000000 (EXP- followed by 6 digits)', 'error');
        }
        if (items.length === 0) return showToast('Voucher must contain at least one expense item', 'error');
        if (items.some(i => parseFloat(i.amount || 0) <= 0)) return showToast('All expense amounts must be greater than zero', 'error');
        if (items.some(i => !i.desc.trim())) return showToast('Please provide descriptions for all expense items', 'error');

        const delivererIdVal = formValues.delivererId || '';
        const deliveryId = delivererIdVal
            ? parseInt(delivererIdVal.split(' – ')[0], 10)
            : data.delivery_id;

        const payload = {
            code: isAuto ? previewCode : customCode.trim(),
            delivery_id: deliveryId,
            voucher_date: formValues.voucherDate,
            total_amount: Math.round((totalAmount + Number.EPSILON) * 100) / 100,
            status: formValues.status || 'DRAFT',
            approvedBy: formValues.approvedBy || '',
            expense_items: items.map(i => ({
                expense_type: i.type.toUpperCase(),
                description: i.desc.trim(),
                amount: Math.round((parseFloat(i.amount || 0) + Number.EPSILON) * 100) / 100,
                receipt_reference_code: i.receipt || ''
            }))
        };

        try {
            if (isNew) {
                await postJson('/expense-vouchers', payload);
                showToast('Voucher saved successfully!');
            } else {
                await putJson(`/expense-vouchers/${data.id}`, payload);
                showToast('Voucher updated successfully!');
            }
            onNavigateBack();
        } catch (err) {
            showToast(getApiErrorMessage(err, isNew ? 'Failed to save voucher' : 'Failed to update voucher'), 'error');
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
            
            <button onClick={onNavigateBack} className="inline-flex items-center gap-1.5 text-sm text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 font-bold transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back to Vouchers
            </button>
            
            <PageHeader 
                title={isNew ? "Expense Voucher" : `Edit Voucher: ${data.id}`} 
                subtitle={isNew ? "Create a new expense voucher for a delivery assignment" : "Modify details of an existing expense voucher"} 
            />

            <Card className="p-5">
                <h3 className="font-bold text-current mb-4">Voucher Header</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField label="Voucher ID" required>
                        <div className="flex items-center gap-2 mt-1">
                            <Input
                                value={isNew ? (isAuto ? previewCode : customCode) : previewCode}
                                onChange={e => setCustomCode(e.target.value)}
                                readOnly={!isNew || isAuto}
                                className={`font-mono flex-1 ${(!isNew || isAuto) ? 'bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-gray-300' : ''}`}
                                placeholder="EXP-000001"
                            />
                            {isNew && (
                                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-gray-300 select-none cursor-pointer shrink-0 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/55 transition-colors h-9">
                                    <input
                                        type="checkbox"
                                        checked={isAuto}
                                        onChange={e => setIsAuto(e.target.checked)}
                                        className="rounded accent-red-650 cursor-pointer"
                                    />
                                    <span>Auto</span>
                                </label>
                            )}
                        </div>
                    </FormField>
                    <FormField label="Delivery & Deliverer" required error={errors.delivererId?.message}>
                        <Controller
                            name="delivererId"
                            control={control}
                            render={({ field }) => (
                                <LovInput value={field.value} onLov={() => isEditable && setIsLovOpen(true)} placeholder="Select delivery assignment..." disabled={!isEditable} />
                            )}
                        />
                    </FormField>
                    <FormField label="Date" required error={errors.voucherDate?.message}>
                        <Input type="date" {...register('voucherDate')} disabled={!isEditable} className={!isEditable ? 'bg-slate-50 dark:bg-slate-800/50 text-slate-400 cursor-not-allowed' : ''} />
                    </FormField>
                    <FormField label="Status" error={errors.status?.message}>
                        {isNew ? (
                            <Input readOnly value="Draft" className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-gray-300 cursor-not-allowed font-medium" />
                        ) : (
                            <Controller
                                name="status"
                                control={control}
                                render={({ field }) => (
                                    <Select value={field.value} onChange={e => field.onChange(e.target.value)}>
                                        <option value="DRAFT">Draft</option>
                                        <option value="PENDING">Pending</option>
                                        <option value="APPROVED">Approved</option>
                                        <option value="REJECTED">Rejected</option>
                                        <option value="FAILED">Failed</option>
                                    </Select>
                                )}
                            />
                        )}
                    </FormField>
                    <FormField label="Approved By" error={errors.approvedBy?.message}>
                        <Input placeholder="e.g. System Admin" {...register('approvedBy')} disabled={!isEditable} className={!isEditable ? 'bg-slate-50 dark:bg-slate-800/50 text-slate-400 cursor-not-allowed' : ''} />
                    </FormField>
                </div>
            </Card>
            
            <Card className="overflow-hidden">
                <CardHeader 
                    search={<Input icon={Search} placeholder="Search description, receipt..." value={search} onChange={e => setSearch(e.target.value)} className="h-10 shadow-sm" />}
                    action={
                        isEditable && (
                            <Btn size="sm" variant="secondary" onClick={() => setItems([...items, { id: Date.now(), type: 'FUEL', desc: '', amount: '', receipt: '' }])}>
                                <Plus className="w-3.5 h-3.5" /> Add Row
                            </Btn>
                        )
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
                                    disabled={!isEditable}
                                    className={`border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-2 py-1.5 text-sm outline-none w-full mono ${!isEditable ? 'bg-slate-50 dark:bg-slate-800/50 text-slate-400 cursor-not-allowed' : 'focus:border-red-400 dark:focus:border-red-500'}`} 
                                />
                            </Td>
                            <Td>
                                <select 
                                    value={item.type} 
                                    onChange={e => { const n = [...items]; const idx = items.indexOf(item); n[idx].type = e.target.value; setItems(n); }} 
                                    disabled={!isEditable}
                                    className={`border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-sm outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 w-full ${!isEditable ? 'bg-slate-50 dark:bg-slate-800/50 text-slate-400 cursor-not-allowed' : 'focus:border-red-400'}`}
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
                                    disabled={!isEditable}
                                    className={`border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-2 py-1.5 text-sm outline-none w-full min-w-[120px] ${!isEditable ? 'bg-slate-50 dark:bg-slate-800/50 text-slate-400 cursor-not-allowed' : 'focus:border-red-400 dark:focus:border-red-500'}`} 
                                />
                            </Td>
                            <Td right>
                                <input 
                                    type="number" 
                                    placeholder="0.00"
                                    value={item.amount || ''} 
                                    onChange={e => { const n = [...items]; const idx = items.indexOf(item); n[idx].amount = e.target.value === '' ? '' : Number(e.target.value); setItems(n); }} 
                                    disabled={!isEditable}
                                    className={`border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-2 py-1.5 text-sm outline-none text-right w-full min-w-[80px] ${!isEditable ? 'bg-slate-50 dark:bg-slate-800/50 text-slate-400 cursor-not-allowed' : 'focus:border-red-400 dark:focus:border-red-500'}`} 
                                />
                            </Td>
                            <Td center>
                                {isEditable && (
                                    <button 
                                        onClick={() => setItems(items.filter(x => x.id !== item.id))} 
                                        className="p-1.5 text-slate-300 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
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
