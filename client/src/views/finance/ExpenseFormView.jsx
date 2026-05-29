import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Save, Plus, Trash2, Search, Check } from 'lucide-react';
import { Btn, Card, CardHeader, Table, Td, FormField, Input, Select, LovInput, LovModal } from '../../components/ui';
import { MOCK_DELIVERERS } from '../../data/mockData';
import { expenseHeaderSchema } from '../../schemas/finance';

export default function ExpenseFormView({ onNavigateBack, showToast }) {
    const [items, setItems] = useState([{ id: 1, type: 'Toll', desc: 'Expressway', amount: 50, receipt: 'RC-9901' }]);
    const [isLovOpen, setIsLovOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [voucherId, setVoucherId] = useState('');
    const [autoId, setAutoId] = useState(true);

    const { control, register, handleSubmit, reset, formState: { errors } } = useForm({
        resolver: zodResolver(expenseHeaderSchema),
        defaultValues: { delivererId: '', voucherDate: '2026-03-23', status: 'DRAFT', approvedBy: '' },
    });

    const displayVoucherId = autoId ? (voucherId || 'EXP-AUTO') : voucherId;
    const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

    const onSubmit = (headerData) => {
        if (!autoId && !voucherId.trim()) return showToast('Please enter a Voucher ID', 'error');
        if (items.length === 0) return showToast('Voucher must contain at least one expense item', 'error');
        if (items.some(i => i.amount <= 0)) return showToast('All expense amounts must be greater than zero', 'error');
        if (items.some(i => !i.desc.trim())) return showToast('Please provide descriptions for all expense items', 'error');
        showToast('Voucher saved successfully!'); onNavigateBack();
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
                    <LovModal isOpen={isLovOpen} onClose={() => setIsLovOpen(false)} title="Deliverer"
                        columns={[{ key: 'id', label: 'ID' }, { key: 'name', label: 'Name' }, { key: 'type', label: 'Vehicle' }]}
                        data={MOCK_DELIVERERS} onSelect={r => { field.onChange(`${r.id} – ${r.name}`); setIsLovOpen(false); }} />
                )}
            />
            
            <button onClick={onNavigateBack} className="inline-flex items-center gap-1.5 text-sm text-current/75 hover:text-current font-bold transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back to Vouchers
            </button>
            
            <Card className="p-5">
                <h3 className="font-bold text-current mb-4">Voucher Header</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-end gap-3">
                        <div className="flex-1">
                            <FormField label="Voucher ID" required>
                                <Input 
                                    value={displayVoucherId} 
                                    onChange={e => setVoucherId(e.target.value.toUpperCase())} 
                                    placeholder="EXP-001" 
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
                                <div className="w-5 h-5 border-2 border-slate-200 dark:border-slate-700 rounded-md peer-checked:bg-red-500 peer-checked:border-red-500 transition-all flex items-center justify-center text-white">
                                    <Check size={12} strokeWidth={4} className={autoId ? 'scale-100' : 'scale-0'} />
                                </div>
                            </div>
                            <span className="text-sm font-bold text-current/75 font-sans">Auto</span>
                        </label>
                    </div>
                    <FormField label="Deliverer" required error={errors.delivererId?.message}>
                        <Controller
                            name="delivererId"
                            control={control}
                            render={({ field }) => (
                                <LovInput value={field.value} onLov={() => setIsLovOpen(true)} placeholder="Select deliverer..." />
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
                                    <option value="DRAFT">DRAFT</option>
                                    <option value="SUBMITTED">SUBMITTED</option>
                                    <option value="APPROVED">APPROVED</option>
                                    <option value="REJECTED">REJECTED</option>
                                </Select>
                            )}
                        />
                    </FormField>
                    <FormField label="Approved By" required error={errors.approvedBy?.message}>
                        <Input placeholder="e.g. Anutin Ch." {...register('approvedBy')} />
                    </FormField>
                </div>
            </Card>
            
            <Card className="overflow-hidden">
                <CardHeader 
                    search={<Input icon={Search} placeholder="Search description, receipt..." value={search} onChange={e => setSearch(e.target.value)} className="h-10 shadow-sm" />}
                    action={
                        <Btn size="sm" variant="secondary" onClick={() => setItems([...items, { id: Date.now(), type: 'Fuel', desc: '', amount: 0, receipt: '' }])}>
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
                                    <option>Toll</option>
                                    <option>Fuel</option>
                                    <option>Parking</option>
                                    <option>MAINTENANCE</option>
                                    <option>OTHER</option>
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
                        <p className="text-xs text-current/60 font-bold uppercase tracking-wide">Total Expense</p>
                        <p className="text-3xl font-black text-current font-bold mono">฿{totalAmount}</p>
                    </div>
                    <Btn onClick={handleSubmit(onSubmit)} size="lg"><Save className="w-4 h-4" /> Save Voucher</Btn>
                </div>
            </Card>
        </div>
    );
}
